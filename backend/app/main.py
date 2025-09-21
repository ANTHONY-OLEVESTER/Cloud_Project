from __future__ import annotations

from contextlib import contextmanager

from fastapi import APIRouter, FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app import crud
from app.config import settings
from app.database import Base, SessionLocal, engine
from app.routers import accounts, auth, dashboard, notifications, policies
from app.security import PasswordManager
from app.seed import demo_records

app = FastAPI(title=settings.app_name)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

for router in (auth.router, accounts.router, policies.router, dashboard.router, notifications.router):
    app.include_router(router)

api_router = APIRouter(prefix="/api")
for router in (auth.router, accounts.router, policies.router, dashboard.router, notifications.router):
    api_router.include_router(router)
app.include_router(api_router)


@app.get("/health")
def healthcheck() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/debug/cors")
def debug_cors() -> dict[str, object]:
    return {
        "cors_origins": settings.cors_origins,
        "cors_origins_type": type(settings.cors_origins).__name__
    }


@app.on_event("startup")
def on_startup() -> None:
    Base.metadata.create_all(bind=engine)
    if settings.demo_seed:
        password_manager = PasswordManager()
        with session_scope() as db:
            dataset = demo_records(password_hasher=password_manager.hash)
            crud.seed_demo_data(db, dataset=dataset)


@contextmanager
def session_scope():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
