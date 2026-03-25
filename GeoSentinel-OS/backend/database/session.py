"""
Database session management for GeoSentinel OS
"""

import os
from collections.abc import Generator
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker

from config.settings import get_settings

settings = get_settings()

# Database URL from environment or default
DATABASE_URL = os.getenv("DATABASE_URL", settings.database_url)

if DATABASE_URL.startswith("postgresql://"):
    DATABASE_URL = DATABASE_URL.replace("postgresql://", "postgresql+psycopg://", 1)
if DATABASE_URL.startswith("postgresql+psycopg2://"):
    DATABASE_URL = DATABASE_URL.replace("postgresql+psycopg2://", "postgresql+psycopg://", 1)

# Connection arguments
connect_args = {}
if DATABASE_URL.startswith("sqlite"):
    connect_args = {"check_same_thread": False}

# Create engine with connection pooling
engine = create_engine(
    DATABASE_URL,
    future=True,
    pool_pre_ping=True,  # Test connections before using
    pool_size=10,
    max_overflow=20,
    connect_args=connect_args
)

# Session factory
SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
    class_=Session
)


def get_db() -> Generator[Session, None, None]:
    """
    Dependency for database session
    Yields a SQLAlchemy session for use in FastAPI endpoints
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
