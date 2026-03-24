"""Attendance model for verified field check-in data."""

from pydantic import BaseModel


class AttendanceModel(BaseModel):
    user_id: int
    timestamp: str
    latitude: float
    longitude: float
    verification_status: str
