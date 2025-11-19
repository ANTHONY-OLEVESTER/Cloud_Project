from __future__ import annotations

from typing import Iterable, Optional

from datetime import datetime, timedelta

from sqlalchemy import case, func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session, selectinload

from app import models, schemas


# -- User helpers -------------------------------------------------------------
def get_user_by_email(db: Session, *, email: str) -> Optional[models.User]:
    stmt = select(models.User).where(models.User.email == email)
    return db.execute(stmt).scalar_one_or_none()


def create_user(db: Session, user_in: schemas.UserCreate, password_hasher) -> models.User:
    hashed_password = password_hasher(user_in.password)
    user = models.User(
        email=user_in.email,
        full_name=user_in.full_name,
        hashed_password=hashed_password,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def authenticate_user(db: Session, *, email: str, password: str, password_verifier) -> Optional[models.User]:
    user = get_user_by_email(db, email=email)
    if user and password_verifier(password, user.hashed_password):
        return user
    return None


# -- Account helpers ---------------------------------------------------------
def create_account(db: Session, account_in: schemas.AccountCreate) -> models.CloudAccount:
    account = models.CloudAccount(**account_in.model_dump())
    db.add(account)
    db.commit()
    db.refresh(account)
    return account


def log_account_provisioning(db: Session, account: models.CloudAccount) -> None:
    """Create a cascade of provisioning notifications for a new account."""

    steps = [
        (
            "Initializing secure workspace",
            f"Preparing guardrails for {account.display_name} ({account.provider.value.upper()})",
        ),
        (
            "Building connectors",
            "Linking IAM roles, service principals, and API integrations",
        ),
        (
            "Deploying baseline policies",
            "Activating 25 critical controls and monitoring rules",
        ),
        (
            "Provisioning complete",
            "{name} is ready to ingest findings".format(name=account.display_name),
        ),
    ]

    now = datetime.utcnow()
    for index, (title, message) in enumerate(steps):
        notification = models.Notification(
            title=title,
            message=message,
            type=models.NotificationType.PROVISIONING,
            created_at=now + timedelta(seconds=index * 2),
        )
        db.add(notification)

    db.commit()


def get_accounts(db: Session) -> list[models.CloudAccount]:
    stmt = select(models.CloudAccount).order_by(models.CloudAccount.created_at.desc())
    return list(db.execute(stmt).scalars())


def get_account(db: Session, account_id: int) -> Optional[models.CloudAccount]:
    stmt = select(models.CloudAccount).where(models.CloudAccount.id == account_id)
    return db.execute(stmt).scalar_one_or_none()


def update_account(db: Session, account_id: int, account_in: schemas.AccountUpdate) -> Optional[models.CloudAccount]:
    stmt = select(models.CloudAccount).where(models.CloudAccount.id == account_id)
    account = db.execute(stmt).scalar_one_or_none()
    if not account:
        return None

    for field, value in account_in.model_dump(exclude_unset=True).items():
        setattr(account, field, value)
    db.commit()
    db.refresh(account)
    return account


def delete_account(db: Session, account_id: int) -> bool:
    stmt = select(models.CloudAccount).where(models.CloudAccount.id == account_id)
    account = db.execute(stmt).scalar_one_or_none()
    if not account:
        return False
    db.delete(account)
    db.commit()
    return True


# -- Policy helpers ----------------------------------------------------------
def create_policy(db: Session, policy_in: schemas.PolicyCreate) -> models.Policy:
    policy = models.Policy(**policy_in.model_dump())
    db.add(policy)
    db.commit()
    db.refresh(policy)
    return policy


def get_policies(db: Session) -> list[models.Policy]:
    stmt = select(models.Policy).order_by(models.Policy.provider, models.Policy.control_id)
    return list(db.execute(stmt).scalars())


def update_policy(db: Session, policy_id: int, policy_in: schemas.PolicyUpdate) -> Optional[models.Policy]:
    stmt = select(models.Policy).where(models.Policy.id == policy_id)
    policy = db.execute(stmt).scalar_one_or_none()
    if not policy:
        return None
    
    for field, value in policy_in.model_dump(exclude_unset=True).items():
        setattr(policy, field, value)
    db.commit()
    db.refresh(policy)
    return policy


def delete_policy(db: Session, policy_id: int) -> bool:
    stmt = select(models.Policy).where(models.Policy.id == policy_id)
    policy = db.execute(stmt).scalar_one_or_none()
    if not policy:
        return False
    db.delete(policy)
    db.commit()
    return True


def get_evaluations(db: Session) -> list[models.PolicyEvaluation]:
    stmt = (
        select(models.PolicyEvaluation)
        .options(
            selectinload(models.PolicyEvaluation.policy),
            selectinload(models.PolicyEvaluation.account),
        )
        .order_by(models.PolicyEvaluation.last_checked_at.desc())
    )
    return list(db.execute(stmt).scalars())


def create_evaluation(db: Session, evaluation_in: schemas.EvaluationCreate) -> models.PolicyEvaluation:
    evaluation = models.PolicyEvaluation(**evaluation_in.model_dump())
    db.add(evaluation)
    db.commit()
    db.refresh(evaluation)
    db.refresh(evaluation, attribute_names=["policy", "account"])
    return evaluation


def update_evaluation(
    db: Session, evaluation_id: int, evaluation_in: schemas.EvaluationUpdate
) -> Optional[models.PolicyEvaluation]:
    stmt = select(models.PolicyEvaluation).where(models.PolicyEvaluation.id == evaluation_id)
    evaluation = db.execute(stmt).scalar_one_or_none()
    if not evaluation:
        return None
    for field, value in evaluation_in.model_dump(exclude_unset=True).items():
        setattr(evaluation, field, value)
    db.commit()
    db.refresh(evaluation)
    db.refresh(evaluation, attribute_names=["policy", "account"])
    return evaluation


# -- Dashboard helpers -------------------------------------------------------
def build_dashboard_snapshot(db: Session) -> schemas.DashboardSnapshot:
    total_stmt = select(
        func.count(models.PolicyEvaluation.id),
        func.sum(
            case((models.PolicyEvaluation.status == models.ComplianceStatus.COMPLIANT, 1), else_=0)
        ),
        func.sum(
            case((models.PolicyEvaluation.status == models.ComplianceStatus.NON_COMPLIANT, 1), else_=0)
        ),
        func.sum(
            case((models.PolicyEvaluation.status == models.ComplianceStatus.UNKNOWN, 1), else_=0)
        ),
    )
    total_result = db.execute(total_stmt).first()

    total_policies = total_result[0] or 0
    compliant = total_result[1] or 0
    non_compliant = total_result[2] or 0
    unknown = total_result[3] or 0

    summary = schemas.ComplianceSummary(
        total_policies=total_policies,
        compliant=compliant,
        non_compliant=non_compliant,
        unknown=unknown,
    )

    provider_stmt = (
        select(
            models.CloudAccount.provider,
            func.count(func.distinct(models.CloudAccount.id)),
            func.sum(
                case((models.PolicyEvaluation.status == models.ComplianceStatus.COMPLIANT, 1), else_=0)
            ),
            func.sum(
                case((models.PolicyEvaluation.status == models.ComplianceStatus.NON_COMPLIANT, 1), else_=0)
            ),
            func.sum(
                case((models.PolicyEvaluation.status == models.ComplianceStatus.UNKNOWN, 1), else_=0)
            ),
        )
        .select_from(models.PolicyEvaluation)
        .join(models.PolicyEvaluation.account)
        .group_by(models.CloudAccount.provider)
    )

    providers: list[schemas.ProviderBreakdown] = []
    for provider, accounts, ok, issues, pending in db.execute(provider_stmt).all():
        providers.append(
            schemas.ProviderBreakdown(
                provider=provider,
                accounts=accounts or 0,
                compliant=ok or 0,
                non_compliant=issues or 0,
                unknown=pending or 0,
            )
        )

    return schemas.DashboardSnapshot(summary=summary, providers=providers)


# -- Notification helpers ----------------------------------------------------
def create_notification(db: Session, notification_in: schemas.NotificationCreate) -> models.Notification:
    notification = models.Notification(**notification_in.model_dump())
    db.add(notification)
    db.commit()
    db.refresh(notification)
    return notification


def get_notifications(db: Session) -> list[models.Notification]:
    stmt = select(models.Notification).order_by(models.Notification.created_at.desc())
    return list(db.execute(stmt).scalars())


def mark_notification_read(db: Session, notification_id: int) -> Optional[models.Notification]:
    stmt = select(models.Notification).where(models.Notification.id == notification_id)
    notification = db.execute(stmt).scalar_one_or_none()
    if not notification:
        return None
    if not notification.is_read:
        notification.is_read = True
        db.commit()
        db.refresh(notification)
    return notification


def mark_all_notifications_read(db: Session) -> int:
    stmt = select(models.Notification).where(models.Notification.is_read.is_(False))
    unread = list(db.execute(stmt).scalars())
    for notification in unread:
        notification.is_read = True
    if unread:
        db.commit()
    return len(unread)


# -- Utility helpers ---------------------------------------------------------
def seed_demo_data(db: Session, *, dataset: Iterable[dict]) -> None:
    for record in dataset:
        model = record["model"]
        payload = record["data"]
        try:
            instance = model(**payload)
            db.add(instance)
            db.commit()
        except IntegrityError:
            db.rollback()


# ===========================
# Policy CRUD Operations
# ===========================

def get_policies(db: Session, skip: int = 0, limit: int = 100) -> list[models.Policy]:
    """Get all policies with optional pagination."""
    return db.query(models.Policy).offset(skip).limit(limit).all()


def get_policy(db: Session, policy_id: int) -> Optional[models.Policy]:
    """Get a specific policy by ID."""
    return db.query(models.Policy).filter(models.Policy.id == policy_id).first()


def get_policy_by_control_id(db: Session, control_id: str, provider: str) -> Optional[models.Policy]:
    """Get a policy by control ID and provider."""
    return db.query(models.Policy).filter(
        models.Policy.control_id == control_id,
        models.Policy.provider == provider
    ).first()


def create_policy(db: Session, policy_in: schemas.PolicyCreate) -> models.Policy:
    """Create a new policy."""
    # Check if policy with same control_id and provider already exists
    existing_policy = get_policy_by_control_id(db, policy_in.control_id, policy_in.provider)
    if existing_policy:
        raise ValueError(f"Policy with control_id {policy_in.control_id} already exists for {policy_in.provider}")
    
    policy_data = policy_in.model_dump()
    
    # Convert date string to date object if needed
    if policy_data.get("last_reviewed") and isinstance(policy_data["last_reviewed"], str):
        from datetime import date
        policy_data["last_reviewed"] = date.fromisoformat(policy_data["last_reviewed"])
    
    db_policy = models.Policy(**policy_data)
    db.add(db_policy)
    db.commit()
    db.refresh(db_policy)
    return db_policy


def update_policy(
    db: Session,
    policy_id: int,
    policy_in: schemas.PolicyUpdate
) -> Optional[models.Policy]:
    """Update an existing policy."""
    db_policy = get_policy(db, policy_id)
    if not db_policy:
        return None
    
    update_data = policy_in.model_dump(exclude_unset=True)
    
    # Convert date string to date object if needed
    if "last_reviewed" in update_data and update_data["last_reviewed"]:
        if isinstance(update_data["last_reviewed"], str):
            from datetime import date
            update_data["last_reviewed"] = date.fromisoformat(update_data["last_reviewed"])
    
    for field, value in update_data.items():
        setattr(db_policy, field, value)
    
    db_policy.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(db_policy)
    return db_policy


def delete_policy(db: Session, policy_id: int) -> bool:
    """Delete a policy."""
    db_policy = get_policy(db, policy_id)
    if not db_policy:
        return False
    
    db.delete(db_policy)
    db.commit()
    return True


# ===========================
# Policy Evaluation CRUD Operations
# ===========================

def get_evaluations(db: Session, skip: int = 0, limit: int = 1000) -> list[models.PolicyEvaluation]:
    """Get all policy evaluations with optional pagination."""
    return db.query(models.PolicyEvaluation).offset(skip).limit(limit).all()


def get_evaluation(db: Session, evaluation_id: int) -> Optional[models.PolicyEvaluation]:
    """Get a specific evaluation by ID."""
    return db.query(models.PolicyEvaluation).filter(
        models.PolicyEvaluation.id == evaluation_id
    ).first()


def get_evaluation_by_policy_account(
    db: Session,
    policy_id: int,
    account_id: int
) -> Optional[models.PolicyEvaluation]:
    """Get an evaluation by policy and account."""
    return db.query(models.PolicyEvaluation).filter(
        models.PolicyEvaluation.policy_id == policy_id,
        models.PolicyEvaluation.account_id == account_id
    ).first()


def create_evaluation(
    db: Session,
    evaluation_in: schemas.EvaluationCreate
) -> models.PolicyEvaluation:
    """Create a new policy evaluation."""
    # Check if evaluation already exists
    existing_evaluation = get_evaluation_by_policy_account(
        db, evaluation_in.policy_id, evaluation_in.account_id
    )
    if existing_evaluation:
        raise ValueError(
            f"Evaluation already exists for policy {evaluation_in.policy_id} "
            f"and account {evaluation_in.account_id}"
        )
    
    db_evaluation = models.PolicyEvaluation(**evaluation_in.model_dump())
    db.add(db_evaluation)
    db.commit()
    db.refresh(db_evaluation)
    return db_evaluation


def update_evaluation(
    db: Session,
    evaluation_id: int,
    evaluation_in: schemas.EvaluationUpdate
) -> Optional[models.PolicyEvaluation]:
    """Update an existing evaluation."""
    db_evaluation = get_evaluation(db, evaluation_id)
    if not db_evaluation:
        return None
    
    update_data = evaluation_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_evaluation, field, value)
    
    db_evaluation.last_checked_at = datetime.utcnow()
    db.commit()
    db.refresh(db_evaluation)
    return db_evaluation


def delete_evaluation(db: Session, evaluation_id: int) -> bool:
    """Delete an evaluation."""
    db_evaluation = get_evaluation(db, evaluation_id)
    if not db_evaluation:
        return False
    
    db.delete(db_evaluation)
    db.commit()
    return True


# ===========================
# Cloud Account CRUD Operations
# ===========================

def get_accounts(db: Session, skip: int = 0, limit: int = 100) -> list[models.CloudAccount]:
    """Get all cloud accounts."""
    return db.query(models.CloudAccount).offset(skip).limit(limit).all()


def get_account(db: Session, account_id: int) -> Optional[models.CloudAccount]:
    """Get a specific account by ID."""
    return db.query(models.CloudAccount).filter(models.CloudAccount.id == account_id).first()


def create_account(
    db: Session,
    account_in: schemas.CloudAccountCreate
) -> models.CloudAccount:
    """Create a new cloud account."""
    # Check if account already exists
    existing = db.query(models.CloudAccount).filter(
        models.CloudAccount.provider == account_in.provider,
        models.CloudAccount.external_id == account_in.external_id
    ).first()
    
    if existing:
        raise ValueError(
            f"Account with external_id {account_in.external_id} "
            f"already exists for {account_in.provider}"
        )
    
    db_account = models.CloudAccount(**account_in.model_dump())
    db.add(db_account)
    db.commit()
    db.refresh(db_account)
    return db_account


def update_account(
    db: Session,
    account_id: int,
    account_in: schemas.CloudAccountUpdate
) -> Optional[models.CloudAccount]:
    """Update an existing cloud account."""
    db_account = get_account(db, account_id)
    if not db_account:
        return None
    
    update_data = account_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_account, field, value)
    
    db_account.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(db_account)
    return db_account


def delete_account(db: Session, account_id: int) -> bool:
    """Delete a cloud account."""
    db_account = get_account(db, account_id)
    if not db_account:
        return False
    
    db.delete(db_account)
    db.commit()
    return True


# ===========================
# Notification CRUD Operations
# ===========================

def get_notifications(db: Session, skip: int = 0, limit: int = 100) -> list[models.Notification]:
    """Get all notifications."""
    return db.query(models.Notification).order_by(
        models.Notification.created_at.desc()
    ).offset(skip).limit(limit).all()


def create_notification(
    db: Session,
    notification_in: schemas.NotificationCreate
) -> models.Notification:
    """Create a new notification."""
    db_notification = models.Notification(**notification_in.model_dump())
    db.add(db_notification)
    db.commit()
    db.refresh(db_notification)
    return db_notification


def mark_notification_read(db: Session, notification_id: int) -> Optional[models.Notification]:
    """Mark a notification as read."""
    db_notification = db.query(models.Notification).filter(
        models.Notification.id == notification_id
    ).first()
    
    if not db_notification:
        return None
    
    db_notification.is_read = True
    db.commit()
    db.refresh(db_notification)
    return db_notification

