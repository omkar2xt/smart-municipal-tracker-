"""
Pydantic schemas for request/response validation
"""

from pydantic import BaseModel, EmailStr, Field
from datetime import datetime
from typing import Optional, List
from models.enums import Role, TaskStatus


# ============ USER SCHEMAS ============

class UserBase(BaseModel):
    """Base user schema with common fields"""
    name: str = Field(..., min_length=1, max_length=120)
    email: EmailStr
    role: Role
    state: Optional[str] = None
    district: Optional[str] = None
    taluka: Optional[str] = None
    is_active: bool = True


class UserCreate(UserBase):
    """Schema for user creation"""
    password: str = Field(..., min_length=8, max_length=100)


class UserLogin(BaseModel):
    """Schema for login request"""
    email: EmailStr
    password: str


class UserResponse(UserBase):
    """Schema for user response"""
    id: int
    created_at: datetime
    
    class Config:
        from_attributes = True


class UserUpdate(BaseModel):
    """Schema for user update"""
    name: Optional[str] = None
    state: Optional[str] = None
    district: Optional[str] = None
    taluka: Optional[str] = None
    is_active: Optional[bool] = None


# ============ ATTENDANCE SCHEMAS ============

class AttendanceCreate(BaseModel):
    """Schema for creating attendance record"""
    latitude: float = Field(..., ge=-90, le=90)
    longitude: float = Field(..., ge=-180, le=180)
    accuracy: Optional[float] = None
    geofence_validated: Optional[bool] = False
    spoof_check: Optional[str] = None
    notes: Optional[str] = None


class AttendanceResponse(BaseModel):
    """Schema for attendance response"""
    id: int
    user_id: int
    latitude: float
    longitude: float
    timestamp: datetime
    geofence_validated: bool
    spoof_check: Optional[str]
    accuracy: Optional[float]
    notes: Optional[str]
    
    class Config:
        from_attributes = True


class AttendanceListResponse(BaseModel):
    """Schema for attendance list"""
    total: int
    records: List[AttendanceResponse]


# ============ TASK SCHEMAS ============

class TaskCreate(BaseModel):
    """Schema for creating task"""
    title: str = Field(..., min_length=1, max_length=200)
    description: Optional[str] = None
    assigned_to: int
    fund_allocated: Optional[float] = Field(default=0, ge=0)
    expected_latitude: Optional[float] = None
    expected_longitude: Optional[float] = None
    geofence_id: Optional[str] = None
    due_date: Optional[datetime] = None


class TaskUpdate(BaseModel):
    """Schema for updating task"""
    status: Optional[TaskStatus] = None
    before_image_path: Optional[str] = None
    after_image_path: Optional[str] = None


class TaskResponse(BaseModel):
    """Schema for task response"""
    id: int
    title: str
    description: Optional[str]
    fund_allocated: float
    status: TaskStatus
    assigned_to: int
    assigned_by: int
    before_image_path: Optional[str]
    after_image_path: Optional[str]
    expected_latitude: Optional[float]
    expected_longitude: Optional[float]
    geofence_id: Optional[str]
    due_date: Optional[datetime]
    completed_at: Optional[datetime]
    created_at: datetime
    
    class Config:
        from_attributes = True


class TaskListResponse(BaseModel):
    """Schema for task list"""
    total: int
    records: List[TaskResponse]


# ============ LOCATION LOG SCHEMAS ============

class LocationLogCreate(BaseModel):
    """Schema for creating location log"""
    latitude: float = Field(..., ge=-90, le=90)
    longitude: float = Field(..., ge=-180, le=180)
    accuracy: Optional[float] = None
    accelerometer_x: Optional[float] = None
    accelerometer_y: Optional[float] = None
    accelerometer_z: Optional[float] = None
    accelerometer_magnitude: Optional[float] = None
    direction: Optional[float] = Field(default=None, ge=0, le=360)
    spoof_detection_flag: Optional[bool] = False
    spoof_reason: Optional[str] = None


class LocationLogResponse(BaseModel):
    """Schema for location log response"""
    id: int
    user_id: int
    latitude: float
    longitude: float
    timestamp: datetime
    accuracy: Optional[float]
    accelerometer_x: Optional[float]
    accelerometer_y: Optional[float]
    accelerometer_z: Optional[float]
    accelerometer_magnitude: Optional[float]
    direction: Optional[float]
    spoof_detection_flag: bool
    spoof_reason: Optional[str]
    is_synced: bool
    
    class Config:
        from_attributes = True


class LocationLogListResponse(BaseModel):
    """Schema for location log list"""
    total: int
    records: List[LocationLogResponse]


# ============ AUTH SCHEMAS ============

class TokenResponse(BaseModel):
    """Schema for token response"""
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


class TokenData(BaseModel):
    """Schema for token data"""
    user_id: int
    email: str
    role: Role


# ============ AUDIT LOG SCHEMAS ============

class AuditLogResponse(BaseModel):
    """Schema for audit log response"""
    id: int
    user_id: Optional[int]
    action: str
    resource_type: Optional[str]
    resource_id: Optional[int]
    status: str
    details: Optional[str]
    ip_address: Optional[str]
    created_at: datetime
    
    class Config:
        from_attributes = True


# ============ SYNC SCHEMAS ============

class SyncAttendanceRecord(BaseModel):
    """Single attendance record for bulk sync"""
    latitude: float
    longitude: float
    timestamp: datetime
    accuracy: Optional[float] = None
    geofence_validated: Optional[bool] = False
    spoof_check: Optional[str] = None


class SyncLocationRecord(BaseModel):
    """Single location record for bulk sync"""
    latitude: float
    longitude: float
    timestamp: datetime
    accuracy: Optional[float] = None
    accelerometer_x: Optional[float] = None
    accelerometer_y: Optional[float] = None
    accelerometer_z: Optional[float] = None


class BulkSyncRequest(BaseModel):
    """Bulk sync request from mobile"""
    attendance_records: List[SyncAttendanceRecord] = []
    location_records: List[SyncLocationRecord] = []


class BulkSyncResponse(BaseModel):
    """Bulk sync response"""
    success: bool
    attendance_synced: int
    location_synced: int
    errors: Optional[List[str]] = None


# ============ RESPONSE SCHEMAS ============

class SuccessResponse(BaseModel):
    """Generic success response"""
    success: bool
    message: str
    data: Optional[dict] = None


class ErrorResponse(BaseModel):
    """Generic error response"""
    success: bool
    error: str
    detail: Optional[str] = None
