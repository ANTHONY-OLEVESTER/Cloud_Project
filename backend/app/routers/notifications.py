"""Notification API endpoints."""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app import crud, schemas
from app.deps import get_db

router = APIRouter(prefix="/notifications", tags=["notifications"])


@router.get("/", response_model=list[schemas.NotificationRead])
def list_notifications(db: Session = Depends(get_db)):
    return crud.get_notifications(db)


@router.post("/", response_model=schemas.NotificationRead, status_code=status.HTTP_201_CREATED)
def create_notification(notification_in: schemas.NotificationCreate, db: Session = Depends(get_db)):
    return crud.create_notification(db, notification_in=notification_in)


@router.patch("/{notification_id}/read", response_model=schemas.NotificationRead)
def mark_read(notification_id: int, db: Session = Depends(get_db)):
    notification = crud.mark_notification_read(db, notification_id=notification_id)
    if not notification:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Notification not found")
    return notification


@router.patch("/mark-all-read", response_model=dict[str, int])
def mark_all_read(db: Session = Depends(get_db)):
    updated = crud.mark_all_notifications_read(db)
    return {"updated": updated}
