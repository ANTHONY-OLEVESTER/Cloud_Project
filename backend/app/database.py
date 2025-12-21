from __future__ import annotations

from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker

from app.config import settings


class Base(DeclarativeBase):
    """Base declarative model."""


# 1. Get the URL from settings
database_url = settings.database_url

# 2. VERCEL FIX: SQLAlchemy requires 'postgresql://', but Vercel provides 'postgres://'
if database_url and database_url.startswith("postgres://"):
    database_url = database_url.replace("postgres://", "postgresql://", 1)

# 3. Configure engine arguments (keep SQLite logic for local dev safety)
_engine_kwargs: dict[str, object] = {}

if database_url and database_url.startswith("sqlite"):
    _engine_kwargs["connect_args"] = {"check_same_thread": False}

# 4. Create the engine with the FIXED url
# We use 'pool_pre_ping=True' to handle dropped connections in cloud environments gracefully
engine = create_engine(database_url, pool_pre_ping=True, **_engine_kwargs)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def get_db_session():
    return SessionLocal()