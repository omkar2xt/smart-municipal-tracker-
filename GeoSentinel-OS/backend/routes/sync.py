from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from database.session import get_db
from models.schemas import BulkSyncRequest, BulkSyncResponse
from models.user_model import User
from services.audit_service import write_audit_log
from services.auth_service import get_current_user
from services.sync_service import process_bulk_sync

router = APIRouter()


@router.post("/sync/bulk", response_model=BulkSyncResponse)
def bulk_sync(
    payload: BulkSyncRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> BulkSyncResponse:
    try:
        result = process_bulk_sync(db, current_user, payload)
        write_audit_log(
            db,
            action="sync.bulk",
            status="success",
            user_id=current_user.id,
            details=(
                f"attendance_inserted={result.attendance_inserted},"
                f"locations_inserted={result.locations_inserted},"
                f"anomaly_count={result.anomaly_count}"
            ),
        )
        db.commit()
        return result
    except Exception as exc:
        db.rollback()
        write_audit_log(
            db,
            action="sync.bulk",
            status="failure",
            user_id=current_user.id,
            details=f"sync_error={str(exc)}",
        )
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Bulk sync failed",
        ) from exc
