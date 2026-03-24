"""
Database session management for GeoSentinel OS
"""

import os
from collections.abc import Generator
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker

# Database URL from environment or default
DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql://geosentinel:password@localhost/geosentinel_db"
)

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
