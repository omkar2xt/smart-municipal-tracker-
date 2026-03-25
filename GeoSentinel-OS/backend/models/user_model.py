from datetime import datetime, timezone
from sqlalchemy import Boolean, DateTime, Enum, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from database.base import Base
from models.enums import Role
from models.redaction import redact_value


class User(Base):
    """User model for GeoSentinel OS - supports hierarchical role-based access"""
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[Role] = mapped_column(Enum(Role), nullable=False, index=True)
    state: Mapped[str | None] = mapped_column(String(120), nullable=True, index=True)
    district: Mapped[str | None] = mapped_column(String(120), nullable=True, index=True)
    taluka: Mapped[str | None] = mapped_column(String(120), nullable=True, index=True)
    face_image: Mapped[str | None] = mapped_column(String(400), nullable=True)
    face_image_hash: Mapped[str | None] = mapped_column(String(64), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc))
    updated_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    # Relationships
    attendance_records = relationship("Attendance", back_populates="user")
    assigned_tasks = relationship("Task", foreign_keys="Task.assigned_to", back_populates="assignee")
    created_tasks = relationship("Task", foreign_keys="Task.assigned_by", back_populates="assigner")
    location_logs = relationship("LocationLog", back_populates="user")

    def to_log_dict(self) -> dict:
        """Convert to dictionary for audit logging (excludes sensitive data)"""
        return {
            "id": self.id,
            "name": redact_value(self.name),
            "email": redact_value(self.email),
            "role": self.role.value if self.role else None,
            "state": redact_value(self.state),
            "district": redact_value(self.district),
            "taluka": redact_value(self.taluka),
            "is_active": self.is_active,
        }

    def __repr__(self) -> str:
        return f"User({self.to_log_dict()})"
