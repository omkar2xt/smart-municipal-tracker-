"""
Database initialization script
Creates all tables and initializes default data
"""

import logging
import os
from datetime import datetime, timezone

from sqlalchemy import inspect, text

from database.base import Base
from database.session import engine, SessionLocal
from models.user_model import User
from models.attendance_model import Attendance
from models.task_model import Task
from models.location_log_model import LocationLog
from models.audit_log_model import AuditLog
from models.enums import TaskStatus
from utils.security import hash_password

logger = logging.getLogger(__name__)


def ensure_runtime_schema_columns() -> None:
    """Add newly required columns for worker verification/proof on existing databases."""
    inspector = inspect(engine)
    with engine.begin() as connection:
        if inspector.has_table("tasks"):
            task_columns = {col["name"] for col in inspector.get_columns("tasks")}
            if "before_image" not in task_columns:
                connection.execute(text("ALTER TABLE tasks ADD COLUMN before_image VARCHAR(300)"))
            if "after_image" not in task_columns:
                connection.execute(text("ALTER TABLE tasks ADD COLUMN after_image VARCHAR(300)"))

        if inspector.has_table("users"):
            user_columns = {col["name"] for col in inspector.get_columns("users")}
            if "face_image" not in user_columns:
                connection.execute(text("ALTER TABLE users ADD COLUMN face_image VARCHAR(400)"))
            if "face_image_hash" not in user_columns:
                connection.execute(text("ALTER TABLE users ADD COLUMN face_image_hash VARCHAR(64)"))


def init_db() -> None:
    """Create all database tables"""
    Base.metadata.create_all(bind=engine)
    ensure_runtime_schema_columns()
    print("✓ Database tables created successfully")


def seed_default_users():
    """Seed database with default admin users"""
    db = SessionLocal()
    
    try:
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

        user_specs = [
            {
                "name": "Admin",
                "email": "admin@geosentinel.gov",
                "role": "admin",
                "state": "Maharashtra",
                "district": None,
                "taluka": None,
                "password": admin_password,
            },
            {
                "name": "Sub-Admin",
                "email": "subadmin@geosentinel.gov",
                "role": "sub_admin",
                "state": "Maharashtra",
                "district": "Pune",
                "taluka": None,
                "password": sub_admin_password,
            },
            {
                "name": "Ward Officer",
                "email": "taluka@geosentinel.gov",
                "role": "taluka_admin",
                "state": "Maharashtra",
                "district": "Pune",
                "taluka": "Hadapsar",
                "password": taluka_admin_password,
            },
            {
                "name": "Ground Worker",
                "email": "worker@geosentinel.gov",
                "role": "worker",
                "state": "Maharashtra",
                "district": "Pune",
                "taluka": "Hadapsar",
                "password": worker_password,
            },
        ]

        created_count = 0
        for spec in user_specs:
            existing = db.query(User).filter(User.email == spec["email"]).first()
            if existing:
                continue
            db.add(
                User(
                    name=spec["name"],
                    email=spec["email"],
                    role=spec["role"],
                    state=spec["state"],
                    district=spec["district"],
                    taluka=spec["taluka"],
                    password_hash=hash_password(spec["password"]),
                    is_active=True,
                    created_at=datetime.now(timezone.utc),
                )
            )
            created_count += 1

        db.flush()

        admin_user = db.query(User).filter(User.email == "admin@geosentinel.gov").first()
        worker_user = db.query(User).filter(User.email == "worker@geosentinel.gov").first()
        demo_task = db.query(Task).filter(Task.title == "Demo Sanitation Sweep", Task.assigned_to == (worker_user.id if worker_user else -1)).first() if worker_user else None
        if admin_user and worker_user and not demo_task:
            db.add(
                Task(
                    title="Demo Sanitation Sweep",
                    description="Sample task for production readiness checks and fund governance demo",
                    fund_allocated=0,
                    status=TaskStatus.PENDING,
                    assigned_to=worker_user.id,
                    assigned_by=admin_user.id,
                    expected_latitude=18.5204,
                    expected_longitude=73.8567,
                    geofence_id="demo-pune-zone",
                    created_at=datetime.now(timezone.utc),
                )
            )
            created_count += 1
        
        db.commit()
        if created_count == 0:
            print("✓ Database already has required seed users/tasks")
        else:
            print(f"✓ Seeded {created_count} default record(s)")
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
