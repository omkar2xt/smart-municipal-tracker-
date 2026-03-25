"""Location tracking routes for continuous GPS and sensor data."""

import math
from datetime import datetime, timezone
from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, status
from sqlalchemy.orm import Session

from database.session import get_db
from models.location_log_model import LocationLog
from models.user_model import User
from schemas.schemas import LocationLogCreate, LocationLogResponse, LocationLogListResponse
from services.auth_service import require_role
from services.audit_service import write_audit_log
from services.maintenance_service import cleanup_old_tracking_data, log_activity
from services.spoof_service import SpoofDetectionService
from models.enums import Role

router = APIRouter(prefix="/tracking", tags=["tracking"])
spoof_service = SpoofDetectionService()
LOW_MOVEMENT_THRESHOLD = 0.12
GPS_JUMP_WITHOUT_MOVEMENT_METERS = 15.0
IMPOSSIBLE_SPEED_DISTANCE_METERS = 1000.0
IMPOSSIBLE_SPEED_WINDOW_SECONDS = 60.0
STATIC_DEVICE_CHANGE_METERS = 20.0
STATIC_DEVICE_WINDOW_SECONDS = 180.0
SPEED_MIN_TIME_DELTA_SECONDS = 0.1


def haversine_meters(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    earth_radius = 6371000.0
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    d_phi = math.radians(lat2 - lat1)
    d_lambda = math.radians(lon2 - lon1)
    a = (
        math.sin(d_phi / 2) ** 2
        + math.cos(phi1) * math.cos(phi2) * math.sin(d_lambda / 2) ** 2
    )
    return 2 * earth_radius * math.atan2(math.sqrt(a), math.sqrt(1 - a))


@router.post("/location", response_model=LocationLogResponse, summary="Log location")
def log_location(
    payload: LocationLogCreate,
    background_tasks: BackgroundTasks,
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
    
    spoof_flag = bool(payload.spoof_detection_flag)
    spoof_reasons: list[str] = []
    if payload.spoof_reason:
        spoof_reasons.append(payload.spoof_reason)
    
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
            accel_magnitude = math.sqrt(
                payload.accelerometer_x**2 + 
                payload.accelerometer_y**2 + 
                payload.accelerometer_z**2
            )

        if accel_magnitude is not None:
            effective_magnitude = accel_magnitude
        elif payload.accelerometer_magnitude is not None:
            effective_magnitude = payload.accelerometer_magnitude
        else:
            effective_magnitude = 0.0

        distance_m = haversine_meters(
            prev_location_record.latitude,
            prev_location_record.longitude,
            payload.latitude,
            payload.longitude,
        )
        speed_mps = distance_m / max(time_delta, SPEED_MIN_TIME_DELTA_SECONDS)

        # Required rule: GPS changed while movement is low.
        if distance_m > GPS_JUMP_WITHOUT_MOVEMENT_METERS and effective_magnitude < LOW_MOVEMENT_THRESHOLD:
            spoof_flag = True
            spoof_reasons.append("GPS changed without movement")

        # Required rule: impossible speed (distance > 1km within 1 minute).
        if distance_m > IMPOSSIBLE_SPEED_DISTANCE_METERS and time_delta <= IMPOSSIBLE_SPEED_WINDOW_SECONDS:
            spoof_flag = True
            spoof_reasons.append("Impossible speed")

        # Required rule: static device for long period while location still changes.
        if (
            time_delta >= STATIC_DEVICE_WINDOW_SECONDS
            and effective_magnitude < LOW_MOVEMENT_THRESHOLD
            and distance_m > STATIC_DEVICE_CHANGE_METERS
        ):
            spoof_flag = True
            spoof_reasons.append("Static device with location drift")
        
        # Perform spoof analysis
        spoof_analysis = spoof_service.analyze_spoof_risk(
            prev_location=prev_location,
            curr_location={
                "latitude": payload.latitude,
                "longitude": payload.longitude
            },
            accelerometer_magnitude=effective_magnitude,
            time_delta_seconds=time_delta
        )
        
        if spoof_analysis["risk_level"] in ["warning", "danger"]:
            spoof_flag = True
            spoof_reasons.extend(spoof_analysis["detections"])

    spoof_reason = ", ".join(dict.fromkeys(spoof_reasons)) if spoof_reasons else None
    
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
        direction=payload.direction,
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

    background_tasks.add_task(cleanup_old_tracking_data, 60)
    background_tasks.add_task(
        log_activity,
        action="tracking.location.ingested",
        user_id=current_user.id,
        details=f"speed_mps={round(speed_mps, 2) if prev_location_record else 0.0}",
    )
    
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
        direction=payload.direction,
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
                direction=r.direction,
                spoof_detection_flag=r.spoof_detection_flag,
                spoof_reason=r.spoof_reason,
                is_synced=r.is_synced
            )
            for r in records
        ]
    )
