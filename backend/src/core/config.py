from __future__ import annotations

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    app_name: str = "HELPSTiR CSR Intelligence Platform"
    debug: bool = False

    # Database
    database_url: str = "sqlite+aiosqlite:///./helpstir.db"

    # Auth
    secret_key: str = "change-me-in-production"
    access_token_expire_minutes: int = 60 * 24  # 24 hours
    algorithm: str = "HS256"

    # AI backends
    default_ai_backend: str = "claude"
    anthropic_api_key: str = ""
    anthropic_model: str = "claude-haiku-4-5-20251001"

    # Future: open-source backends
    ollama_base_url: str = "http://localhost:11434"

    # Platform
    platform_name: str = "HELPSTiR"
    platform_url: str = "https://www.helpstir.in"


settings = Settings()
