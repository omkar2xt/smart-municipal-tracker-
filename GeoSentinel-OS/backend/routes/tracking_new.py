"""Location tracking routes for continuous GPS and sensor data."""

from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from database.session import get_db
from models.location_log_model import LocationLog
from models.user_model import User
from schemas.schemas import LocationLogCreate, LocationLogResponse, LocationLogListResponse
from services.auth_service import require_role
from services.audit_service import write_audit_log
from services.spoof_service import SpoofDetectionService
from models.enums import Role

router = APIRouter(prefix="/tracking", tags=["tracking"])
spoof_service = SpoofDetectionService()


@router.post("/location", response_model=LocationLogResponse, summary="Log location")
def log_location(
    payload: LocationLogCreate,
    current_user: User = Depends(require_role(Role.FIELD_WORKER, Role.WORKER)),
    db: Session = Depends(get_db)
) -> LocationLogResponse:
    """
    Log GPS location with optional sensor data
    
    Used for continuous background tracking
    """
    
    # Validate coordinates
    if not (-90 <= payload.latitude <= 90):
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Invalid latitude")
    if not (-180 <= payload.longitude <= 180):
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Invalid longitude")
    
    # Get previous location for spoof analysis
    prev_location_record = db.query(LocationLog).filter(
        LocationLog.user_id == current_user.id
    ).order_by(LocationLog.timestamp.desc()).first()
    
    spoof_flag = False
    spoof_reason = None
    
    # Spoof detection analysis
    if prev_location_record:
        prev_location = {
            "latitude": prev_location_record.latitude,
            "longitude": prev_location_record.longitude
        }
        
        prev_ts = prev_location_record.timestamp
        if prev_ts.tzinfo is None:
            prev_ts = prev_ts.replace(tzinfo=timezone.utc)
        time_delta = (datetime.now(timezone.utc) - prev_ts).total_seconds()
        
        # Calculate acceleration magnitude if sensor data provided
        accel_magnitude = None
        if payload.accelerometer_x is not None and payload.accelerometer_y is not None and payload.accelerometer_z is not None:
            import math
            accel_magnitude = math.sqrt(
                payload.accelerometer_x**2 + 
                payload.accelerometer_y**2 + 
                payload.accelerometer_z**2
            )
        
        # Perform spoof analysis
        spoof_analysis = spoof_service.analyze_spoof_risk(
            prev_location=prev_location,
            curr_location={
                "latitude": payload.latitude,
                "longitude": payload.longitude
            },
            accelerometer_magnitude=accel_magnitude or payload.accelerometer_magnitude,
            time_delta_seconds=time_delta
        )
        
        if spoof_analysis["risk_level"] in ["warning", "danger"]:
            spoof_flag = True
            spoof_reason = ", ".join(spoof_analysis["detections"])
    
    # Create location log
    now = datetime.now(timezone.utc)
    record = LocationLog(
        user_id=current_user.id,
        latitude=payload.latitude,
        longitude=payload.longitude,
        timestamp=now,
        accuracy=payload.accuracy,
        accelerometer_x=payload.accelerometer_x,
        accelerometer_y=payload.accelerometer_y,
        accelerometer_z=payload.accelerometer_z,
        accelerometer_magnitude=payload.accelerometer_magnitude,
        spoof_detection_flag=spoof_flag,
        spoof_reason=spoof_reason,
        is_synced=False
    )
    
    db.add(record)
    
    # Log action
    write_audit_log(
        db,
        action="tracking.location_log",
        status="success",
        user_id=current_user.id,
        resource_type="location",
        resource_id=record.id
    )
    db.commit()
    db.refresh(record)
    
    return LocationLogResponse(
        id=record.id,
        user_id=record.user_id,
        latitude=record.latitude,
        longitude=record.longitude,
        timestamp=record.timestamp,
        accuracy=record.accuracy,
        accelerometer_x=record.accelerometer_x,
        accelerometer_y=record.accelerometer_y,
        accelerometer_z=record.accelerometer_z,
        accelerometer_magnitude=record.accelerometer_magnitude,
        spoof_detection_flag=record.spoof_detection_flag,
        spoof_reason=record.spoof_reason,
        is_synced=record.is_synced
    )


@router.get("/locations", response_model=LocationLogListResponse, summary="Get location history")
def get_locations(
    user_id: int = None,
    limit: int = 100,
    current_user: User = Depends(require_role(
        Role.STATE_ADMIN,
        Role.DISTRICT_ADMIN,
        Role.TALUKA_ADMIN,
        Role.FIELD_WORKER,
        Role.WORKER,
    )),
    db: Session = Depends(get_db)
) -> LocationLogListResponse:
    """
    Get location history
    Workers can only view their own locations
    Admins can view locations in their jurisdiction
    """
    
    # Determine whose locations to retrieve
    if current_user.role in [Role.FIELD_WORKER, Role.WORKER]:
        # Workers can only view their own locations
        query_user_id = current_user.id
    elif user_id:
        # Admin specified a user
        query_user_id = user_id
        
        # Check authority
        target_user = db.query(User).filter(User.id == user_id).first()
        if not target_user:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
        
        if current_user.role == Role.DISTRICT_ADMIN and target_user.district != current_user.district:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="No authority")
        if current_user.role == Role.TALUKA_ADMIN and (
            target_user.taluka != current_user.taluka
        ):
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="No authority")
    else:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="user_id required")
    
    # Get location logs
    records = db.query(LocationLog).filter(
        LocationLog.user_id == query_user_id
    ).order_by(LocationLog.timestamp.desc()).limit(limit).all()
    
    return LocationLogListResponse(
        total=len(records),
        records=[
            LocationLogResponse(
                id=r.id,
                user_id=r.user_id,
                latitude=r.latitude,
                longitude=r.longitude,
                timestamp=r.timestamp,
                accuracy=r.accuracy,
                accelerometer_x=r.accelerometer_x,
                accelerometer_y=r.accelerometer_y,
                accelerometer_z=r.accelerometer_z,
                accelerometer_magnitude=r.accelerometer_magnitude,
                spoof_detection_flag=r.spoof_detection_flag,
                spoof_reason=r.spoof_reason,
                is_synced=r.is_synced
            )
            for r in records
        ]
    )
