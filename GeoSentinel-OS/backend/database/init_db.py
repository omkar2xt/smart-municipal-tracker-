"""
Database initialization script
Creates all tables and initializes default data
"""

from database.base import Base
from database.session import engine, SessionLocal
from models.user_model import User
from models.attendance_model import Attendance
from models.task_model import Task
from models.location_log_model import LocationLog
from models.audit_log_model import AuditLog
from utils.security import hash_password
from datetime import datetime, timezone
import os


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
        
        # Create state admin user
        state_admin_password = os.getenv("SEED_STATE_ADMIN_PASSWORD", "change-me-state-admin")
        district_admin_password = os.getenv("SEED_DISTRICT_ADMIN_PASSWORD", "change-me-district-admin")
        taluka_admin_password = os.getenv("SEED_TALUKA_ADMIN_PASSWORD", "change-me-taluka-admin")
        worker_password = os.getenv("SEED_WORKER_PASSWORD", "change-me-worker")

        state_admin = User(
            name="State Administrator",
            email="admin@geosentinel.gov",
            role="state_admin",
            state="Maharashtra",
            password_hash=hash_password(state_admin_password),
            is_active=True,
            created_at=datetime.now(timezone.utc)
        )
        db.add(state_admin)
        
        # Create district admin user
        district_admin = User(
            name="District Administrator",
            email="district@geosentinel.gov",
            role="district_admin",
            state="Maharashtra",
            district="Pune",
            password_hash=hash_password(district_admin_password),
            is_active=True,
            created_at=datetime.now(timezone.utc)
        )
        db.add(district_admin)
        
        # Create taluka admin user
        taluka_admin = User(
            name="Taluka Administrator",
            email="taluka@geosentinel.gov",
            role="taluka_admin",
            state="Maharashtra",
            district="Pune",
            taluka="Hadapsar",
            password_hash=hash_password(taluka_admin_password),
            is_active=True,
            created_at=datetime.now(timezone.utc)
        )
        db.add(taluka_admin)
        
        # Create sample worker
        worker = User(
            name="Sample Worker",
            email="worker@geosentinel.gov",
            role="worker",
            state="Maharashtra",
            district="Pune",
            taluka="Hadapsar",
            password_hash=hash_password(worker_password),
            is_active=True,
            created_at=datetime.now(timezone.utc)
        )
        db.add(worker)
        
        db.commit()
        print("✓ Default users created successfully")
        print("  Passwords loaded from SEED_* environment variables")
        
    except Exception as e:
        db.rollback()
        print(f"✗ Error seeding database: {e}")
    finally:
        db.close()


if __name__ == "__main__":
    init_db()
    seed_default_users()
