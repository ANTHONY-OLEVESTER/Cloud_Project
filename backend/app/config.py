from __future__ import annotations

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings


def _default_cors() -> list[str]:
    return [
        "http://localhost:5173",
        "https://anthony-olevester.github.io",
        "https://anthony-olevester.github.io/Cloud_Project"
    ]


class Settings(BaseSettings):
    app_name: str = Field(default="Cloud Guard Platform", alias="APP_NAME")
    database_url: str = Field(default="sqlite:///./cloud_guard.db", alias="DATABASE_URL")
    port: int = Field(default=8000, alias="PORT")
    demo_seed: bool = Field(default=True, alias="DEMO_SEED")
    cors_origins: str | list[str] = Field(default_factory=_default_cors, alias="CORS_ORIGINS")
    jwt_secret: str = Field(default="change-me", alias="JWT_SECRET")
    jwt_algorithm: str = Field(default="HS256", alias="JWT_ALGORITHM")
    access_token_expire_minutes: int = Field(default=60, alias="ACCESS_TOKEN_EXPIRE_MINUTES")

    model_config = {
        "env_file": ".env",
        "env_file_encoding": "utf-8",
        "extra": "ignore",
    }

    @field_validator("cors_origins", mode="after")
    @classmethod
    def parse_cors(cls, value: str | list[str]) -> list[str]:
        if value is None or value == "":
            return _default_cors()
        if isinstance(value, str):
            # Handle comma-separated string format (Railway environment variables)
            return [origin.strip() for origin in value.split(",") if origin.strip()]
        if isinstance(value, list):
            return value
        # Fallback to default if we can't parse it
        return _default_cors()


settings = Settings()
