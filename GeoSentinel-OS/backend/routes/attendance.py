"""Attendance tracking routes."""

from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from database.session import get_db
from models.attendance_model import Attendance
from models.user_model import User
from models.location_log_model import LocationLog
from schemas.schemas import AttendanceCreate, AttendanceResponse, AttendanceListResponse
from services.auth_service import require_role
from services.audit_service import write_audit_log
from services.geofence_service import GeofenceService
from services.spoof_service import SpoofDetectionService
from models.enums import Role

router = APIRouter(prefix="/attendance", tags=["attendance"])
geofence_service = GeofenceService()
spoof_service = SpoofDetectionService()


def _taluka_geofence_id(taluka: str | None) -> str | None:
    if not taluka:
        return None
    return f"{taluka.strip().lower().replace(' ', '_')}_taluka"


@router.post("", response_model=AttendanceResponse, summary="Mark attendance")
def mark_attendance(
    payload: AttendanceCreate,
    current_user: User = Depends(require_role(Role.FIELD_WORKER, Role.WORKER)),
    db: Session = Depends(get_db)
) -> AttendanceResponse:
    """
    Mark attendance with GPS coordinates
    
    Validates:
    1. GPS coordinates are valid
    2. User is within geofence
    3. No GPS spoof detected
    4. Network connectivity
    """
    
    # Validate GPS coordinates
    if not (-90 <= payload.latitude <= 90):
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Invalid latitude")
    if not (-180 <= payload.longitude <= 180):
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Invalid longitude")
    
    # Get previous location for spoof detection
    prev_location = None
    stmt = select(Attendance).where(Attendance.user_id == current_user.id).order_by(Attendance.timestamp.desc())
    prev_attendance = db.scalars(stmt).first()
    
    if prev_attendance:
        prev_location = {
            "latitude": prev_attendance.latitude,
            "longitude": prev_attendance.longitude
        }
    
    # Spoof detection
    spoof_flag = "safe"
    current_location = {
        "latitude": payload.latitude,
        "longitude": payload.longitude
    }
    
    try:
        if prev_location:
            # Get time difference
            prev_ts = prev_attendance.timestamp
            if prev_ts.tzinfo is None:
                logger.warning(
                    f"Naive timestamp detected for attendance {prev_attendance.id}: {prev_ts}. "
                    "Assuming UTC timezone for legacy data."
                )
                prev_ts = prev_ts.replace(tzinfo=timezone.utc)
            time_delta = (datetime.now(timezone.utc) - prev_ts).total_seconds()
            
            # Analyze spoof risk
            spoof_analysis = spoof_service.analyze_spoof_risk(
                prev_location=prev_location,
                curr_location=current_location,
                accelerometer_magnitude=None,  # Not available for attendance
                time_delta_seconds=time_delta
            )
            
            if spoof_analysis["risk_level"] == "danger":
                spoof_flag = "danger"
            elif spoof_analysis["risk_level"] == "warning":
                spoof_flag = "warning"
    except Exception as e:
        write_audit_log(
            db,
            action="attendance.mark",
            status="failure",
            user_id=current_user.id,
            resource_type="attendance",
            details=f"Spoof detection error: {str(e)}"
        )
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Unable to validate spoof detection at this time"
        )
    
    # Geofence validation
    geofence_id = _taluka_geofence_id(current_user.taluka)
    if geofence_id is None or geofence_id not in geofence_service.geofences:
        logger.warning(
            f"Geofence validation skipped for user {current_user.id} in taluka {current_user.taluka}: "
            f"geofence_id={geofence_id}"
        )
        geofence_validated = False
    else:
        geofence_validated = geofence_service.is_inside(
            geofence_id,
            payload.latitude,
            payload.longitude,
        )
    
    if not geofence_validated:
        write_audit_log(
            db,
            action="attendance.mark",
            status="failure",
            user_id=current_user.id,
            resource_type="attendance",
            details="Geofence validation failed"
        )
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User location is outside allowed geofence"
        )
    
    # Create attendance record
    now = datetime.now(timezone.utc)
    record = Attendance(
        user_id=current_user.id,
        latitude=payload.latitude,
        longitude=payload.longitude,
        timestamp=now,
        geofence_validated=geofence_validated,
        spoof_check=spoof_flag,
        accuracy=payload.accuracy,
        notes=payload.notes
    )
    
    # Log success
    write_audit_log(
        db,
        action="attendance.mark",
        status="success",
        user_id=current_user.id,
        resource_type="attendance",
        resource_id=record.id,
        details=f"Coordinates: ({payload.latitude:.3f}, {payload.longitude:.3f})"
    )
    db.commit()
    db.refresh(record)
    
    return AttendanceResponse(
        id=record.id,
        user_id=record.user_id,
        latitude=record.latitude,
        longitude=record.longitude,
        timestamp=record.timestamp,
        geofence_validated=record.geofence_validated,
        spoof_check=record.spoof_check,
        accuracy=record.accuracy,
        notes=record.notes
    )


@router.get("", response_model=AttendanceListResponse, summary="Get attendance records")
def get_attendance(
    user_id: int = None,
    days: int = 7,
    current_user: User = Depends(require_role(
        Role.STATE_ADMIN,
        Role.DISTRICT_ADMIN,
        Role.TALUKA_ADMIN,
    )),
    db: Session = Depends(get_db)
) -> AttendanceListResponse:
    """
    Get attendance records for a user or district/taluka
    Only admins can view records
    """
    
    # If specific user_id provided, admin must have authority
    if user_id:
        target_user = db.query(User).filter(User.id == user_id).first()
        if not target_user:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
        
        # Check authority
        if current_user.role == Role.DISTRICT_ADMIN and target_user.district != current_user.district:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="No authority")
        if current_user.role == Role.TALUKA_ADMIN and (
            target_user.district != current_user.district or 
            target_user.taluka != current_user.taluka
        ):
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="No authority")
    else:
        # Filter by admin's scope
        if current_user.role == Role.DISTRICT_ADMIN:
            user_id = None  # Will filter by district below
        elif current_user.role == Role.TALUKA_ADMIN:
            user_id = None  # Will filter by taluka below
    
    # Build query
    stmt = select(Attendance)
    if days > 0:
        cutoff = datetime.now(timezone.utc) - timedelta(days=days)
        stmt = stmt.where(Attendance.timestamp >= cutoff)

    if user_id:
        stmt = stmt.where(Attendance.user_id == user_id)
    elif current_user.role == Role.DISTRICT_ADMIN:
        # Get all users in this district
        district_users = db.query(User).filter(User.district == current_user.district).with_entities(User.id)
        stmt = stmt.where(Attendance.user_id.in_(district_users))
    elif current_user.role == Role.TALUKA_ADMIN:
        # Get all users in this taluka
        taluka_users = db.query(User).filter(
            User.district == current_user.district,
            User.taluka == current_user.taluka
        ).with_entities(User.id)
        stmt = stmt.where(Attendance.user_id.in_(taluka_users))
    
    # Order by timestamp descending and limit to days
    stmt = stmt.order_by(Attendance.timestamp.desc()).limit(1000)
    
    records = db.scalars(stmt).all()
    
    return AttendanceListResponse(
        total=len(records),
        records=[
            AttendanceResponse(
                id=r.id,
                user_id=r.user_id,
                latitude=r.latitude,
                longitude=r.longitude,
                timestamp=r.timestamp,
                geofence_validated=r.geofence_validated,
                spoof_check=r.spoof_check,
                accuracy=r.accuracy,
                notes=r.notes
            )
            for r in records
        ]
    )
