from __future__ import annotations

import hashlib
import secrets
import warnings
from typing import Callable

try:
    from passlib.context import CryptContext  # type: ignore
except ImportError:  # pragma: no cover - optional dependency fallback
    CryptContext = None  # type: ignore


def _bcrypt_backend_available() -> bool:
    if CryptContext is None:
        return False
    try:
        import bcrypt  # type: ignore
    except Exception:  # pragma: no cover - bcrypt missing or broken
        return False
    about = getattr(bcrypt, "__about__", None)
    version = getattr(about, "__version__", None) if about else None
    if version is None:
        return False
    return True


class PasswordManager:
    """Wrap password hashing so the app can run even without optional deps."""

    def __init__(self) -> None:
        self._ctx = None
        if _bcrypt_backend_available():
            try:
                self._ctx = CryptContext(schemes=["bcrypt"], deprecated="auto")
            except Exception:  # pragma: no cover - fall back when bcrypt backend misbehaves
                warnings.warn(
                    "passlib bcrypt backend unavailable; falling back to built-in SHA256 hashing",
                    RuntimeWarning,
                )
                self._ctx = None
        elif CryptContext is not None:
            warnings.warn(
                "passlib detected but bcrypt backend is incompatible; falling back to built-in SHA256 hashing",
                RuntimeWarning,
            )

    def hash(self, raw_password: str) -> str:
        if self._ctx:
            return self._ctx.hash(raw_password)
        # Simple salted SHA256 fallback for demo purposes only.
        salt = secrets.token_hex(16)
        digest = hashlib.sha256(f"{salt}{raw_password}".encode("utf-8")).hexdigest()
        return f"sha256${salt}${digest}"

    def verify(self, raw_password: str, hashed_password: str) -> bool:
        if self._ctx:
            return self._ctx.verify(raw_password, hashed_password)
        try:
            algorithm, salt, digest = hashed_password.split("$")
        except ValueError:
            return False
        if algorithm != "sha256":
            return False
        candidate = hashlib.sha256(f"{salt}{raw_password}".encode("utf-8")).hexdigest()
        return secrets.compare_digest(candidate, digest)


def get_password_hasher() -> Callable[[str], str]:
    manager = PasswordManager()
    return manager.hash


def get_password_verifier() -> Callable[[str, str], bool]:
    manager = PasswordManager()
    return manager.verify
