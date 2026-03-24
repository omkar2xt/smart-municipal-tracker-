from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.orm import Session

from models.attendance_model import Attendance
from models.location_log_model import LocationLog
from models.schemas import BulkSyncRequest, BulkSyncResponse
from models.user_model import User
from services.spoof_service import analyze_location_anomaly


def _attendance_duplicate_exists(
    db: Session,
    user_id: int,
    latitude: float,
    longitude: float,
    timestamp: datetime,
) -> bool:
    stmt = select(Attendance.id).where(
        Attendance.user_id == user_id,
        Attendance.latitude == latitude,
        Attendance.longitude == longitude,
        Attendance.timestamp == timestamp,
    )
    return db.scalar(stmt) is not None


def _location_duplicate_exists(
    db: Session,
    user_id: int,
    latitude: float,
    longitude: float,
    timestamp: datetime,
) -> bool:
    stmt = select(LocationLog.id).where(
        LocationLog.user_id == user_id,
        LocationLog.latitude == latitude,
        LocationLog.longitude == longitude,
        LocationLog.timestamp == timestamp,
    )
    return db.scalar(stmt) is not None


def process_bulk_sync(db: Session, current_user: User, payload: BulkSyncRequest) -> BulkSyncResponse:
    attendance_inserted = 0
    attendance_duplicates = 0
    locations_inserted = 0
    locations_duplicates = 0
    anomaly_count = 0

    for item in payload.attendance:
        if _attendance_duplicate_exists(db, current_user.id, item.latitude, item.longitude, item.timestamp):
            attendance_duplicates += 1
            continue

        db.add(
            Attendance(
                user_id=current_user.id,
                latitude=item.latitude,
                longitude=item.longitude,
                timestamp=item.timestamp,
            )
        )
        attendance_inserted += 1

    prev_log = db.scalar(
        select(LocationLog)
        .where(LocationLog.user_id == current_user.id)
        .order_by(LocationLog.timestamp.desc())
    )

    for item in payload.locations:
        if _location_duplicate_exists(db, current_user.id, item.latitude, item.longitude, item.timestamp):
            locations_duplicates += 1
            continue

        delta_seconds = 0.0
        if prev_log is not None:
            delta_seconds = max((item.timestamp - prev_log.timestamp).total_seconds(), 0.0)

        anomaly = analyze_location_anomaly(
            {
                "latitude": prev_log.latitude,
                "longitude": prev_log.longitude,
            }
            if prev_log
            else None,
            {"latitude": item.latitude, "longitude": item.longitude},
            delta_seconds,
            accelerometer_magnitude=item.accelerometer_magnitude,
        )

        if anomaly["anomaly_detected"]:
            anomaly_count += 1

        new_log = LocationLog(
            user_id=current_user.id,
            latitude=item.latitude,
            longitude=item.longitude,
            timestamp=item.timestamp,
            accelerometer_magnitude=item.accelerometer_magnitude,
            spoof_detection_flag=anomaly["anomaly_detected"],
            spoof_reason=anomaly["reason"],
            is_synced=True,
        )
        db.add(new_log)
        prev_log = new_log
        locations_inserted += 1

    return BulkSyncResponse(
        attendance_inserted=attendance_inserted,
        attendance_duplicates=attendance_duplicates,
        locations_inserted=locations_inserted,
        locations_duplicates=locations_duplicates,
        anomaly_count=anomaly_count,
    )
