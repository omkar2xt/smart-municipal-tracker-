"""
Location log model for continuous GPS tracking with anomaly detection
"""

from datetime import datetime
from sqlalchemy import Boolean, DateTime, Float, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from database.base import Base


class LocationLog(Base):
    """Continuous location logs with sensor data and anomaly flags"""
    __tablename__ = "location_logs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False, index=True)
    latitude: Mapped[float] = mapped_column(Float, nullable=False)
    longitude: Mapped[float] = mapped_column(Float, nullable=False)
    timestamp: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, index=True)
    accuracy: Mapped[float | None] = mapped_column(Float, nullable=True)  # GPS accuracy in meters
    accelerometer_x: Mapped[float | None] = mapped_column(Float, nullable=True)
    accelerometer_y: Mapped[float | None] = mapped_column(Float, nullable=True)
    accelerometer_z: Mapped[float | None] = mapped_column(Float, nullable=True)
    accelerometer_magnitude: Mapped[float | None] = mapped_column(Float, nullable=True)
    spoof_detection_flag: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False, index=True)
    spoof_reason: Mapped[str | None] = mapped_column(String(200), nullable=True)
    is_synced: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False, index=True)

    # Relationships
    user = relationship("User", back_populates="location_logs")
