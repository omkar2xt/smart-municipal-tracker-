"""
Admin routes
Administrative operations, reports, and system management
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from database.session import get_db
from models.user_model import User
from models.attendance_model import Attendance
from models.location_log_model import LocationLog
from schemas.schemas import UserResponse
from services.auth_service import require_role
from models.enums import Role

router = APIRouter(prefix="/admin", tags=["admin"])


@router.get("/users", summary="Get all users")
def get_all_users(
    current_user: User = Depends(require_role(Role.STATE_ADMIN)),
    db: Session = Depends(get_db)
):
    """Get all users (state admin only)"""
    users = db.query(User).all()
    return {
        "total": len(users),
        "users": [
            {
                "id": u.id, "name": u.name, "email": u.email, "role": u.role.value,
                "state": u.state, "district": u.district, "taluka": u.taluka
            }
            for u in users
        ]
    }


@router.get("/reports/attendance", summary="Get attendance report")
def get_attendance_report(
    district: str = None,
    taluka: str = None,
    current_user: User = Depends(require_role(
        Role.STATE_ADMIN, Role.DISTRICT_ADMIN, Role.TALUKA_ADMIN,
    )),
    db: Session = Depends(get_db)
):
    """Get attendance records for reporting"""
    query = db.query(Attendance)
    
    if district:
        # Filter by district
        users_in_district = db.query(User).filter(User.district == district).with_entities(User.id)
        query = query.filter(Attendance.user_id.in_(users_in_district))
    
    if taluka:
        # Filter by taluka
        users_in_taluka = db.query(User).filter(User.taluka == taluka).with_entities(User.id)
        query = query.filter(Attendance.user_id.in_(users_in_taluka))
    
    records = query.order_by(Attendance.timestamp.desc()).limit(1000).all()
    
    return {
        "total": len(records),
        "records": [{
            "id": r.id, "user_id": r.user_id, "latitude": r.latitude, "longitude": r.longitude,
            "timestamp": r.timestamp, "geofence_validated": r.geofence_validated,
            "spoof_check": r.spoof_check
        } for r in records]
    }


@router.get("/reports/spoof-detections", summary="Get spoof detection report")
def get_spoof_detections(
    current_user: User = Depends(require_role(
        Role.STATE_ADMIN, Role.DISTRICT_ADMIN, Role.TALUKA_ADMIN,
    )),
    db: Session = Depends(get_db)
):
    """Get locations flagged for spoof detection"""
    records = db.query(LocationLog).filter(
        LocationLog.spoof_detection_flag == True
    ).order_by(LocationLog.timestamp.desc()).limit(500).all()
    
    return {
        "total": len(records),
        "records": [{
            "id": r.id, "user_id": r.user_id, "latitude": r.latitude, "longitude": r.longitude,
            "timestamp": r.timestamp, "spoof_reason": r.spoof_reason,
            "accelerometer_magnitude": r.accelerometer_magnitude
        } for r in records]
    }


@router.get("/stats", summary="Get system statistics")
def get_system_stats(
    current_user: User = Depends(require_role(Role.STATE_ADMIN)),
    db: Session = Depends(get_db)
):
    """Get system-wide statistics"""
    total_users = db.query(User).count()
    total_attendance = db.query(Attendance).count()
    total_locations = db.query(LocationLog).count()
    spoof_detections = db.query(LocationLog).filter(LocationLog.spoof_detection_flag == True).count()
    
    return {
        "total_users": total_users,
        "total_attendance_records": total_attendance,
        "total_location_logs": total_locations,
        "spoof_detections": spoof_detections,
        "by_role": {
            "state_admin": db.query(User).filter(User.role == Role.STATE_ADMIN).count(),
            "district_admin": db.query(User).filter(User.role == Role.DISTRICT_ADMIN).count(),
            "taluka_admin": db.query(User).filter(User.role == Role.TALUKA_ADMIN).count(),
            "worker": db.query(User).filter(User.role == Role.WORKER).count()
        }
    }
