"""Settings and configuration for GeoSentinel OS Backend."""

from functools import lru_cache
from pathlib import Path
import json
from typing import Any

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Main application settings"""

    model_config = SettingsConfigDict(
        env_file=str(Path(__file__).resolve().parents[1] / ".env"),
        case_sensitive=False,
        extra="ignore",
    )
    
    # App
    app_name: str = "GeoSentinel OS"
    app_version: str = "1.0.0"
    debug: bool = False
    
    # Database
    database_url: str = "postgresql://geosentinel:password@localhost/geosentinel_db"
    
    # JWT
    secret_key: str = Field(default="change-me-in-production", validation_alias="JWT_SECRET")
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 60 * 24  # 24 hours
    
    # Geofencing
    geofence_radius_meters: float = 500.0  # Default radius if using circular geofence
    
    # Spoof Detection
    gps_jump_threshold_km: float = 50.0  # Flag locations > 50km from previous
    unrealistic_speed_kmh: float = 200.0  # Flag speed > 200 km/h
    
    # File Upload
    upload_dir: str = "./uploads"
    max_file_size_mb: int = 50
    allowed_extensions: list[str] = Field(default_factory=lambda: ["jpg", "jpeg", "png", "gif"])
    cloudinary_url: str | None = Field(default=None, validation_alias="CLOUDINARY_URL")
    
    # CORS
    cors_origins: list[str] = Field(
        default_factory=lambda: [
            "http://localhost:3000",
            "http://localhost:5173",
            "http://127.0.0.1:5173",
        ]
    )

    @field_validator("cors_origins", mode="before")
    @classmethod
    def _normalize_cors_origins(cls, value: Any) -> list[str]:
        if isinstance(value, str):
            trimmed = value.strip()
            if trimmed.startswith("["):
                try:
                    parsed = json.loads(trimmed)
                    if isinstance(parsed, list):
                        return [str(origin).strip() for origin in parsed if str(origin).strip()]
                except json.JSONDecodeError:
                    pass
            # Allow comma separated env var values.
            cleaned = [origin.strip().strip('"').strip("'").strip("[]") for origin in value.split(",")]
            return [origin for origin in cleaned if origin]
        if isinstance(value, list):
            return value
        return ["http://localhost:3000", "http://localhost:5173", "http://127.0.0.1:5173"]
    
@lru_cache()
def get_settings() -> Settings:
    """Get cached settings instance"""
    return Settings()
