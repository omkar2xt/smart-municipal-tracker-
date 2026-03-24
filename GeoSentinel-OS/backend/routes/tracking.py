from fastapi import APIRouter
from fastapi import Depends, HTTPException, status
from sqlalchemy.orm import Session

from database.session import get_db
from models.location_log_model import LocationLog
from models.schemas import LocationCreate, LocationResponse
from models.user_model import User
from services.auth_service import get_current_user
from services.gps_validation import validate_location

router = APIRouter()


@router.post("/location", response_model=LocationResponse)
def post_location(
    payload: LocationCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> LocationResponse:
    if not validate_location(payload.latitude, payload.longitude):
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Invalid GPS coordinates")

    log = LocationLog(
        user_id=current_user.id,
        latitude=payload.latitude,
        longitude=payload.longitude,
        timestamp=payload.timestamp,
    )
    db.add(log)
    db.commit()
    db.refresh(log)

    return LocationResponse(
        id=log.id,
        user_id=log.user_id,
        latitude=log.latitude,
        longitude=log.longitude,
        timestamp=log.timestamp,
    )
