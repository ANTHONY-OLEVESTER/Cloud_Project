from __future__ import annotations

from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException, status
from jose import jwt
from sqlalchemy.orm import Session

from app import crud, models, schemas
from app.config import settings
from app.deps import get_current_user, get_db, get_password_manager

router = APIRouter(prefix="/auth", tags=["auth"])


def _password_manager():
    return get_password_manager()


@router.post("/register", response_model=schemas.UserRead, status_code=status.HTTP_201_CREATED)
def register_user(
    user_in: schemas.UserCreate,
    db: Session = Depends(get_db),
):
    existing = crud.get_user_by_email(db, email=user_in.email)
    if existing:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email already registered")
    password_manager = _password_manager()
    user = crud.create_user(db, user_in=user_in, password_hasher=password_manager.hash)
    return user


def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=settings.access_token_expire_minutes)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.jwt_secret, algorithm=settings.jwt_algorithm)
    return encoded_jwt


@router.post("/login")
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
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password")

    access_token = create_access_token(data={"sub": user.email})
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user
    }


@router.get("/profile", response_model=schemas.UserRead)
def get_user_profile(
    current_user: models.User = Depends(get_current_user)
):
    return current_user


@router.put("/profile", response_model=schemas.UserRead)
def update_user_profile(
    profile_update: schemas.UserUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    return crud.update_user(db, user=current_user, user_update=profile_update)
