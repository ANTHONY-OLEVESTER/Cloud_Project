from __future__ import annotations

from collections.abc import Generator

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer
from jose import JWTError, jwt
from sqlalchemy.orm import Session

from app import crud
from app.config import settings
from app.database import SessionLocal
from app.security import PasswordManager

_password_manager = PasswordManager()


def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def get_password_manager() -> PasswordManager:
    return _password_manager


security = HTTPBearer()


def get_current_user(
    token: str = Depends(security),
    db: Session = Depends(get_db)
):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    try:
        payload = jwt.decode(token.credentials, settings.jwt_secret, algorithms=[settings.jwt_algorithm])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    user = crud.get_user_by_email(db, email=email)
    if user is None:
        raise credentials_exception
    return user
