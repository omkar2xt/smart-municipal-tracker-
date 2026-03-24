from datetime import datetime, timezone
from typing import Literal

from pydantic import BaseModel, Field, field_validator

from models.enums import Role, TaskStatus


class LoginRequest(BaseModel):
    name: str
    password: str = Field(min_length=8)
    role: Role
    district: str | None = None
    taluka: str | None = None


class TokenResponse(BaseModel):
    access_token: str
    token_type: Literal["bearer"]
    user_id: int
    role: Role


class AttendanceCreate(BaseModel):
    latitude: float
    longitude: float
    accelerometer_magnitude: float | None = None
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    @field_validator("latitude")
    @classmethod
    def validate_latitude(cls, value: float) -> float:
        if not -90 <= value <= 90:
            raise ValueError("latitude must be between -90 and 90")
        return value

    @field_validator("longitude")
    @classmethod
    def validate_longitude(cls, value: float) -> float:
        if not -180 <= value <= 180:
            raise ValueError("longitude must be between -180 and 180")
        return value


class AttendanceResponse(BaseModel):
    id: int
    user_id: int
    latitude: float
    longitude: float
    timestamp: datetime
    geofence_valid: bool = True


class TaskCreate(BaseModel):
    title: str
    assigned_to: int
    status: TaskStatus = TaskStatus.PENDING
    expected_latitude: float | None = None
    expected_longitude: float | None = None
    due_at: datetime | None = None


class TaskUpdate(BaseModel):
    status: TaskStatus


class TaskResponse(BaseModel):
    id: int
    title: str
    status: TaskStatus
    assigned_to: int
    assigned_by: int
    image_proof: str | None = None
    before_image_proof: str | None = None
    after_image_proof: str | None = None
    expected_latitude: float | None = None
    expected_longitude: float | None = None
    due_at: datetime | None = None


class LocationCreate(BaseModel):
    latitude: float
    longitude: float
    accelerometer_magnitude: float | None = None
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class LocationResponse(BaseModel):
    id: int
    user_id: int
    latitude: float
    longitude: float
    timestamp: datetime
    anomaly_detected: bool = False
    anomaly_reason: str | None = None


class UploadResponse(BaseModel):
    file_path: str


class UploadCreate(BaseModel):
    task_id: int
    file_path: str
    stage: Literal["before", "after"] = "after"
    captured_latitude: float | None = None
    captured_longitude: float | None = None
    captured_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class SyncLocationRecord(BaseModel):
    latitude: float
    longitude: float
    timestamp: datetime
    accelerometer_magnitude: float | None = None


class SyncAttendanceRecord(BaseModel):
    latitude: float
    longitude: float
    timestamp: datetime
    accelerometer_magnitude: float | None = None


class BulkSyncRequest(BaseModel):
    attendance: list[SyncAttendanceRecord] = Field(default_factory=list)
    locations: list[SyncLocationRecord] = Field(default_factory=list)


class BulkSyncResponse(BaseModel):
    attendance_inserted: int
    attendance_duplicates: int
    locations_inserted: int
    locations_duplicates: int
    anomaly_count: int
