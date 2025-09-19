from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app import crud, schemas
from app.models import NotificationType
from app.deps import get_db

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
