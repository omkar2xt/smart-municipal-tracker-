"""Background maintenance and asynchronous operational tasks."""

from datetime import datetime, timedelta, timezone
import logging

from database.session import SessionLocal
from models.audit_log_model import AuditLog
from models.location_log_model import LocationLog
from models.report_model import Report

logger = logging.getLogger(__name__)


def cleanup_old_tracking_data(days: int = 60) -> bool:
    """Delete tracking rows older than configured retention window."""
    db = SessionLocal()
    try:
        cutoff = datetime.now(timezone.utc) - timedelta(days=days)
        db.query(LocationLog).filter(LocationLog.timestamp < cutoff).delete(synchronize_session=False)
        db.commit()
        return True
    except Exception:
        db.rollback()
        logger.exception("Failed to cleanup old tracking data")
        return False
    finally:
        db.close()


def register_generated_report(report_type: str, generated_by: int | None, scope: str | None = None) -> bool:
    """Persist metadata for generated report files."""
    db = SessionLocal()
    try:
        report = Report(
            report_type=report_type,
            generated_by=generated_by,
            file_name=f"{report_type}_{datetime.now(timezone.utc).date().isoformat()}",
            scope=scope,
        )
        db.add(report)
        db.commit()
        return True
    except Exception:
        db.rollback()
        logger.exception("Failed to register generated report")
        return False
    finally:
        db.close()


def log_activity(action: str, user_id: int | None = None, details: str | None = None) -> None:
    """Log non-critical actions asynchronously to audit logs."""
    db = SessionLocal()
    try:
        db.add(
            AuditLog(
                user_id=user_id,
                action=action,
                status="success",
                details=details,
            )
        )
        db.commit()
    except Exception:
        db.rollback()
        logger.exception("Failed to log async activity")
    finally:
        db.close()
