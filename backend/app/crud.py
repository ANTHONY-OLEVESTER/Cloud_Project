from __future__ import annotations

from typing import Iterable, Optional

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


def get_accounts(db: Session) -> list[models.CloudAccount]:
    stmt = select(models.CloudAccount).order_by(models.CloudAccount.created_at.desc())
    return list(db.execute(stmt).scalars())


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
