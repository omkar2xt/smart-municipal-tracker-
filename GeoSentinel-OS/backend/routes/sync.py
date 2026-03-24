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
        import uuid
        db.rollback()
        correlation_id = str(uuid.uuid4())
        logger.error(
            f"Sync error (correlation_id={correlation_id})",
            exc_info=True,
        )
        write_audit_log(
            db,
            action="sync.bulk",
            status="failure",
            user_id=current_user.id,
            detail=f"sync_error (correlation_id={correlation_id}, type={exc.__class__.__name__})",
        )
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Bulk sync failed",
        ) from exc
