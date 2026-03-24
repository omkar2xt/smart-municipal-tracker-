"""
Attendance model for tracking worker check-ins with GPS coordinates
"""

from datetime import datetime
from sqlalchemy import DateTime, Float, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from database.base import Base


class Attendance(Base):
    """Records attendance with GPS location and validation data"""
    __tablename__ = "attendance"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False, index=True)
    latitude: Mapped[float] = mapped_column(Float, nullable=False)
    longitude: Mapped[float] = mapped_column(Float, nullable=False)
    timestamp: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, index=True)
    geofence_validated: Mapped[bool] = mapped_column(default=False)
    spoof_check: Mapped[str | None] = mapped_column(String(50), nullable=True)  # 'safe', 'warning', 'danger'
    accuracy: Mapped[float | None] = mapped_column(Float, nullable=True)  # GPS accuracy in meters
    notes: Mapped[str | None] = mapped_column(String(500), nullable=True)

    # Relationships
    user = relationship("User", back_populates="attendance_records")
