"""
Task model for tracking work assignments with completion proof
"""

from decimal import Decimal
from datetime import datetime, timezone
from sqlalchemy import DateTime, Enum, Float, ForeignKey, Integer, Numeric, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from database.base import Base
from models.enums import TaskStatus


class Task(Base):
    """Task assignments with location expectations and image proof"""
    __tablename__ = "tasks"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[str | None] = mapped_column(String(1000), nullable=True)
    fund_allocated: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False, default=Decimal("0.00"))
    status: Mapped[TaskStatus] = mapped_column(Enum(TaskStatus), nullable=False, default=TaskStatus.PENDING, index=True)
    assigned_to: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False, index=True)
    assigned_by: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False, index=True)
    before_image_path: Mapped[str | None] = mapped_column(String(300), nullable=True)
    after_image_path: Mapped[str | None] = mapped_column(String(300), nullable=True)
    expected_latitude: Mapped[float | None] = mapped_column(Float, nullable=True)
    expected_longitude: Mapped[float | None] = mapped_column(Float, nullable=True)
    geofence_id: Mapped[str | None] = mapped_column(String(100), nullable=True)  # Reference to geofence
    due_date: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True, index=True)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, index=True, default=lambda: datetime.now(timezone.utc))

    # Relationships
    assignee = relationship("User", foreign_keys=[assigned_to], back_populates="assigned_tasks")
    assigner = relationship("User", foreign_keys=[assigned_by], back_populates="created_tasks")
