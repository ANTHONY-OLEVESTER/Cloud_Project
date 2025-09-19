from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app import crud, schemas
from app.deps import get_db

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("/summary", response_model=schemas.DashboardSnapshot)
def get_summary(db: Session = Depends(get_db)):
    return crud.build_dashboard_snapshot(db)
