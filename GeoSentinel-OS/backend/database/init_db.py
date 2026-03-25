"""
Database initialization script
Creates all tables and initializes default data
"""

import logging
import os
from datetime import datetime, timezone

from database.base import Base
from database.session import engine, SessionLocal
from models.user_model import User
from models.attendance_model import Attendance
from models.task_model import Task
from models.location_log_model import LocationLog
from models.audit_log_model import AuditLog
from utils.security import hash_password

logger = logging.getLogger(__name__)


def init_db() -> None:
    """Create all database tables"""
    Base.metadata.create_all(bind=engine)
    print("✓ Database tables created successfully")


def seed_default_users():
    """Seed database with default admin users"""
    db = SessionLocal()
    
    try:
        # Check if admin already exists
        existing_admin = db.query(User).filter(User.email == "admin@geosentinel.gov").first()
        if existing_admin:
            print("✓ Database already seeded with default users")
            return
        
        # Create Tier-1 to Tier-4 hierarchy users
        seed_defaults = {
            "SEED_ADMIN_PASSWORD": "change-me-admin",
            "SEED_SUB_ADMIN_PASSWORD": "change-me-sub-admin",
            "SEED_TALUKA_ADMIN_PASSWORD": "change-me-taluka-admin",
            "SEED_WORKER_PASSWORD": "change-me-worker",
        }
        seed_values = {}
        for key in seed_defaults:
            raw_value = os.getenv(key)
            normalized = raw_value.strip() if raw_value is not None else None
            seed_values[key] = normalized if normalized else None

        missing_seed_vars = [key for key, value in seed_values.items() if value is None]

        env_name = (os.getenv("ENV") or os.getenv("APP_ENV") or "").strip().lower()
        is_production = env_name in {"prod", "production"}
        if missing_seed_vars and is_production:
            raise RuntimeError(
                "Missing required seed password environment variables in production: "
                f"{', '.join(missing_seed_vars)}"
            )

        if missing_seed_vars:
            logger.warning(
                "Using default seed passwords for: %s. Set SEED_* environment variables.",
                ", ".join(missing_seed_vars),
            )

        admin_password = seed_values["SEED_ADMIN_PASSWORD"] or seed_defaults["SEED_ADMIN_PASSWORD"]
        sub_admin_password = seed_values["SEED_SUB_ADMIN_PASSWORD"] or seed_defaults["SEED_SUB_ADMIN_PASSWORD"]
        taluka_admin_password = seed_values["SEED_TALUKA_ADMIN_PASSWORD"] or seed_defaults["SEED_TALUKA_ADMIN_PASSWORD"]
        worker_password = seed_values["SEED_WORKER_PASSWORD"] or seed_defaults["SEED_WORKER_PASSWORD"]

        tier1_admin = User(
            name="Admin",
            email="admin@geosentinel.gov",
            role="admin",
            state="Maharashtra",
            password_hash=hash_password(admin_password),
            is_active=True,
            created_at=datetime.now(timezone.utc)
        )
        db.add(tier1_admin)
        
        # Create Tier-2 Sub-Admin user
        tier2_sub_admin = User(
            name="Sub-Admin",
            email="subadmin@geosentinel.gov",
            role="sub_admin",
            state="Maharashtra",
            district="Pune",
            password_hash=hash_password(sub_admin_password),
            is_active=True,
            created_at=datetime.now(timezone.utc)
        )
        db.add(tier2_sub_admin)
        
        # Create Tier-3 Taluka Admin user
        tier3_taluka_admin = User(
            name="Ward Officer",
            email="taluka@geosentinel.gov",
            role="taluka_admin",
            state="Maharashtra",
            district="Pune",
            taluka="Hadapsar",
            password_hash=hash_password(taluka_admin_password),
            is_active=True,
            created_at=datetime.now(timezone.utc)
        )
        db.add(tier3_taluka_admin)
        
        # Create Tier-4 Worker
        tier4_user = User(
            name="Ground Worker",
            email="worker@geosentinel.gov",
            role="worker",
            state="Maharashtra",
            district="Pune",
            taluka="Hadapsar",
            password_hash=hash_password(worker_password),
            is_active=True,
            created_at=datetime.now(timezone.utc)
        )
        db.add(tier4_user)
        
        db.commit()
        print("✓ Default users created successfully")
        if missing_seed_vars:
            print("  Some seed passwords used defaults because SEED_* variables were missing")
        else:
            print("  Passwords loaded from SEED_* environment variables")
        
    except Exception as e:
        db.rollback()
        print(f"✗ Error seeding database: {e}")
        if isinstance(e, RuntimeError):
            raise
    finally:
        db.close()


if __name__ == "__main__":
    init_db()
    seed_default_users()
