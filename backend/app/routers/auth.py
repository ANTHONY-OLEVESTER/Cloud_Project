from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app import crud, schemas
from app.deps import get_db, get_password_manager
from datetime import datetime, timedelta
from jose import jwt
from pydantic import BaseModel
from app.config import settings


def create_access_token(user_id: int) -> str:
    payload = {
        "sub": str(user_id),
        "exp": datetime.utcnow() + timedelta(minutes=settings.access_token_expire_minutes),
    }
    return jwt.encode(
        payload,
        settings.jwt_secret,
        algorithm=settings.jwt_algorithm,
    )

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


router = APIRouter(prefix="/auth", tags=["auth"])


def _password_manager():
    return get_password_manager()


@router.post("/register", response_model=Token, status_code=status.HTTP_201_CREATED)
def register_user(
    user_in: schemas.UserCreate,
    db: Session = Depends(get_db),
):
    existing = crud.get_user_by_email(db, email=user_in.email)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered",
        )

    password_manager = _password_manager()

    user = crud.create_user(
        db,
        user_in=user_in,
        password_hasher=password_manager.hash,
    )

    token = create_access_token(user.id)

    return {
        "access_token": token,
        "token_type": "bearer",
    }



@router.post("/login", response_model=Token)
def login_user(
    credentials: schemas.UserLogin,
    db: Session = Depends(get_db),
):
    password_manager = _password_manager()
    user = crud.authenticate_user(
        db,
        email=credentials.email,
        password=credentials.password,
        password_verifier=password_manager.verify,
    )
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )

    token = create_access_token(user.id)

    return {
        "access_token": token,
        "token_type": "bearer",
    }

