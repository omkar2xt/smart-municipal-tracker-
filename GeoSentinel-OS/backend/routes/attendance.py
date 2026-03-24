from datetime import datetime, timezone

from fastapi import APIRouter
from fastapi import Depends, HTTPException, status
from sqlalchemy.orm import Session

from database.session import get_db
from models.attendance_model import Attendance
from models.schemas import AttendanceCreate, AttendanceResponse
from models.user_model import User
from services.auth_service import get_current_user
from services.gps_validation import validate_location

router = APIRouter()


@router.post("/attendance", response_model=AttendanceResponse)
def mark_attendance(
    payload: AttendanceCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> AttendanceResponse:
    if not validate_location(payload.latitude, payload.longitude):
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Invalid GPS coordinates")

    server_now = datetime.now(timezone.utc)

    record = Attendance(
        user_id=current_user.id,
        latitude=payload.latitude,
        longitude=payload.longitude,
        timestamp=server_now,
    )
    db.add(record)
    db.commit()
    db.refresh(record)

    return AttendanceResponse(
        id=record.id,
        user_id=record.user_id,
        latitude=record.latitude,
        longitude=record.longitude,
        timestamp=record.timestamp,
    )
