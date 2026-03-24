from datetime import datetime, timezone

from sqlalchemy.orm import Session

from models.audit_log_model import AuditLog


def write_audit_log(
    db: Session,
    action: str,
    status: str,
    user_id: int | None = None,
    resource_type: str | None = None,
    resource_id: int | None = None,
    details: str | None = None,
    ip_address: str | None = None,
    detail: str | None = None,
    commit: bool = False,
) -> None:
    log_detail = details if details is not None else detail
    log = AuditLog(
        user_id=user_id,
        action=action,
        resource_type=resource_type,
        resource_id=resource_id,
        status=status,
        details=log_detail,
        ip_address=ip_address,
        created_at=datetime.now(timezone.utc),
    )
    db.add(log)
    db.flush()
    if commit:
        db.commit()
