import os
from pathlib import Path
from typing import List, Union
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field, field_validator

BACKEND_DIR = Path(__file__).resolve().parent.parent.parent
DEFAULT_DB_PATH = (BACKEND_DIR / "aperture.db").as_posix()

class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore"
    )

    APP_NAME: str = "Aperture AIoT Control Center"
    APP_VERSION: str = "1.0.0"
    APP_ENV: str = "development"
    DEBUG: bool = True
    DEMO_MODE: bool = False

    # Server settings
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    API_V1_PREFIX: str = "/api/v1"

    # Database
    DATABASE_URL: str = Field(
        default=f"sqlite:///{DEFAULT_DB_PATH}",
        description="PostgreSQL or SQLite database connection URL"
    )
    REDIS_URL: str = "redis://localhost:6379/0"

    # Security
    SECRET_KEY: str = "aperture-super-secret-production-key-change-in-env-32bytes-min!"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 8  # 8 hours
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # CORS
    CORS_ORIGINS: Union[str, List[str]] = ["http://localhost:5173", "http://localhost:3000", "http://127.0.0.1:5173"]

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> List[str]:
        if isinstance(v, str) and not v.startswith("["):
            return [i.strip() for i in v.split(",") if i.strip()]
        elif isinstance(v, list):
            return v
        return ["*"]

    # Storage paths
    MODEL_STORAGE_PATH: str = "./storage/models"
    REPORTS_STORAGE_PATH: str = "./storage/reports"

    # Hardware & Gateway settings
    BLE_ADAPTER_TYPE: str = "simulated"
    BLE_VENDOR_API_URL: str = "http://127.0.0.1:9000/ble"
    BLE_VENDOR_API_KEY: str = ""
    CONTROLLER_ADAPTER_TYPE: str = "simulated"
    
    # Safety Limits & Watchdog
    MAX_ALLOWABLE_RPM: int = 3500
    TELEMETRY_STALE_TIMEOUT_SEC: float = 3.0
    COMMAND_TIMEOUT_SEC: float = 5.0
    COMMAND_RATE_LIMIT_PER_SEC: int = 5

settings = Settings()

os.makedirs(settings.MODEL_STORAGE_PATH, exist_ok=True)
os.makedirs(settings.REPORTS_STORAGE_PATH, exist_ok=True)
