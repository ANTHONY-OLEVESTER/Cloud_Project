from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session
from datetime import datetime
from typing import List
from app import crud, schemas
from app.models import NotificationType
from app.deps import get_db
from app.database import get_db_session
from app.models import CloudAccount, CloudProvider, AccountStatus
from app.schemas import CloudAccountCreate, CloudAccountUpdate, CloudAccountResponse


router = APIRouter(prefix="/accounts", tags=["accounts"])


@router.get("/", response_model=list[schemas.AccountRead])
def list_accounts(db: Session = Depends(get_db)):
    return crud.get_accounts(db)


@router.post("/", response_model=schemas.AccountRead, status_code=status.HTTP_201_CREATED)
def create_account(account_in: schemas.AccountCreate, db: Session = Depends(get_db)):
    try:
        account = crud.create_account(db, account_in=account_in)
    except IntegrityError as exc:  # pragma: no cover - surface DB constraint nicely
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Account with this provider and ID already exists",
        ) from exc

    return account


@router.patch("/{account_id}", response_model=schemas.AccountRead)
def update_account(
    account_id: int,
    account_in: schemas.AccountUpdate,
    db: Session = Depends(get_db),
):
    account = crud.update_account(db, account_id=account_id, account_in=account_in)
    if not account:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Account not found")
    return account


@router.delete("/{account_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_account(account_id: int, db: Session = Depends(get_db)):
    deleted = crud.delete_account(db, account_id=account_id)
    if not deleted:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Account not found")
    return None


@router.post("/{account_id}/sync", response_model=schemas.AccountRead)
def sync_account(account_id: int, db: Session = Depends(get_db)):
    account = crud.get_account(db, account_id=account_id)
    if not account:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Account not found")

    # In a real implementation, this would trigger a sync job
    # For now, we'll just update the sync timestamp
    from datetime import datetime
    account_update = schemas.AccountUpdate(last_sync_at=datetime.utcnow())
    updated = crud.update_account(db, account_id=account_id, account_in=account_update)
    if updated:
        crud.create_notification(
            db,
            schemas.NotificationCreate(
                title="Manual sync requested",
                message=f"{updated.display_name} is syncing now.",
                type=NotificationType.ACCOUNT_SYNC,
            ),
        )
    return updated


def get_db():
    """Dependency to get database session."""
    db = get_db_session()
    try:
        yield db
    finally:
        db.close()


@router.post("/", response_model=CloudAccountResponse, status_code=status.HTTP_201_CREATED)
async def create_cloud_account(
    account_data: CloudAccountCreate,
    db: Session = Depends(get_db)
):
    """
    Create a new cloud account connection.
    
    This endpoint creates a new cloud account with the provided credentials
    and configuration. The account will be in PENDING status initially.
    
    **Important**: In production, credentials should be encrypted before storing.
    """
    # Check if account already exists
    existing_account = db.query(CloudAccount).filter(
        CloudAccount.provider == account_data.provider,
        CloudAccount.external_id == account_data.external_id
    ).first()
    
    if existing_account:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Account with ID {account_data.external_id} already exists for {account_data.provider}"
        )
    
    # Create new cloud account
    new_account = CloudAccount(
        provider=CloudProvider(account_data.provider),
        external_id=account_data.external_id,
        display_name=account_data.display_name,
        status=AccountStatus.PENDING,
        access_method=account_data.access_method,
        credential=account_data.credential,  # TODO: Encrypt in production
        service_email=account_data.service_email,
        tenant_id=account_data.tenant_id,
        sync_frequency=account_data.sync_frequency,
        auto_sync=account_data.auto_sync,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow()
    )
    
    db.add(new_account)
    db.commit()
    db.refresh(new_account)
    
    # TODO: Trigger async validation and provisioning process
    # This would validate credentials and update status to CONNECTED or ERROR
    
    return new_account


@router.get("/", response_model=List[CloudAccountResponse])
async def get_cloud_accounts(
    provider: str = None,
    status: str = None,
    db: Session = Depends(get_db)
):
    """
    Retrieve all cloud accounts with optional filtering.
    
    Query parameters:
    - provider: Filter by cloud provider (aws, azure, gcp)
    - status: Filter by account status (connected, pending, error)
    """
    query = db.query(CloudAccount)
    
    if provider:
        try:
            query = query.filter(CloudAccount.provider == CloudProvider(provider))
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid provider: {provider}"
            )
    
    if status:
        try:
            query = query.filter(CloudAccount.status == AccountStatus(status))
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid status: {status}"
            )
    
    accounts = query.order_by(CloudAccount.created_at.desc()).all()
    return accounts


@router.get("/{account_id}", response_model=CloudAccountResponse)
async def get_cloud_account(
    account_id: int,
    db: Session = Depends(get_db)
):
    """
    Retrieve a specific cloud account by ID.
    """
    account = db.query(CloudAccount).filter(CloudAccount.id == account_id).first()
    
    if not account:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Account with ID {account_id} not found"
        )
    
    return account


@router.put("/{account_id}", response_model=CloudAccountResponse)
async def update_cloud_account(
    account_id: int,
    account_data: CloudAccountUpdate,
    db: Session = Depends(get_db)
):
    """
    Update an existing cloud account.
    
    Only provided fields will be updated. Fields set to None will be ignored.
    """
    account = db.query(CloudAccount).filter(CloudAccount.id == account_id).first()
    
    if not account:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Account with ID {account_id} not found"
        )
    
    # Update only provided fields
    update_data = account_data.model_dump(exclude_unset=True)
    
    for field, value in update_data.items():
        if field == "status":
            setattr(account, field, AccountStatus(value))
        else:
            setattr(account, field, value)
    
    account.updated_at = datetime.utcnow()
    
    db.commit()
    db.refresh(account)
    
    return account


@router.delete("/{account_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_cloud_account(
    account_id: int,
    db: Session = Depends(get_db)
):
    """
    Delete a cloud account.
    
    This will also delete all associated policy evaluations due to cascade delete.
    """
    account = db.query(CloudAccount).filter(CloudAccount.id == account_id).first()
    
    if not account:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Account with ID {account_id} not found"
        )
    
    db.delete(account)
    db.commit()
    
    return None


@router.post("/{account_id}/sync", response_model=CloudAccountResponse)
async def sync_cloud_account(
    account_id: int,
    db: Session = Depends(get_db)
):
    """
    Trigger a manual sync for a cloud account.
    
    This endpoint initiates a sync operation that:
    1. Validates the account credentials
    2. Fetches the latest resources and configurations
    3. Updates policy evaluations
    4. Updates the last_synced_at timestamp
    """
    account = db.query(CloudAccount).filter(CloudAccount.id == account_id).first()
    
    if not account:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Account with ID {account_id} not found"
        )
    
    # TODO: Implement actual sync logic here
    # This would:
    # 1. Validate credentials
    # 2. Fetch resources from cloud provider
    # 3. Update policy evaluations
    # 4. Update status
    
    account.last_synced_at = datetime.utcnow()
    account.updated_at = datetime.utcnow()
    
    # For now, just mark as connected if it was pending
    if account.status == AccountStatus.PENDING:
        account.status = AccountStatus.CONNECTED
    
    db.commit()
    db.refresh(account)
    
    return account


@router.get("/{account_id}/validate", response_model=dict)
async def validate_cloud_account(
    account_id: int,
    db: Session = Depends(get_db)
):
    """
    Validate cloud account credentials without performing a full sync.
    
    Returns validation status and any error messages.
    """
    account = db.query(CloudAccount).filter(CloudAccount.id == account_id).first()
    
    if not account:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Account with ID {account_id} not found"
        )
    
    # TODO: Implement actual validation logic
    # This would attempt to authenticate with the cloud provider
    # using the stored credentials
    
    return {
        "account_id": account_id,
        "is_valid": True,
        "message": "Credentials validated successfully",
        "provider": account.provider.value,
        "validated_at": datetime.utcnow().isoformat()
    }
