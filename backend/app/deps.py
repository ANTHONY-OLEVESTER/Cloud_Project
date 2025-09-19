from __future__ import annotations

from collections.abc import Generator

from sqlalchemy.orm import Session

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
