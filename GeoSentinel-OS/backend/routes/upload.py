import os
from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from database.session import get_db
from models.enums import Role
from models.schemas import UploadCreate, UploadResponse
from models.task_model import Task
from models.user_model import User
from services.audit_service import write_audit_log
from services.auth_service import get_current_user
from services.validation_service import validate_task_proof_consistency

router = APIRouter()
UPLOADS_DIR = Path("uploads")
UPLOADS_DIR.mkdir(parents=True, exist_ok=True)


def resolve_image_proof_path(stored_path: str) -> Path:
    """Reconstruct an absolute proof path from a stored relative path."""
    return (UPLOADS_DIR / stored_path).resolve(strict=False)


@router.post("/upload", response_model=UploadResponse)
def upload_task_proof(
    payload: UploadCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> UploadResponse:
    task = db.get(Task, payload.task_id)
    if task is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")

    if task.assigned_to != current_user.id and current_user.role in {Role.FIELD_WORKER, Role.WORKER}:
        write_audit_log(db, action="task.upload", status="rejected", user_id=current_user.id, detail="unauthorized")
        db.commit()
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized for this task")

    is_valid, reason = validate_task_proof_consistency(
        task,
        payload.captured_latitude,
        payload.captured_longitude,
        payload.captured_at,
    )
    if not is_valid:
        write_audit_log(db, action="task.upload", status="rejected", user_id=current_user.id, detail=reason)
        db.commit()
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=reason)

    normalized_raw = os.path.normpath(payload.file_path)
    path_obj = Path(normalized_raw)
    if path_obj.is_absolute():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Absolute paths are not allowed")

    candidate = (UPLOADS_DIR / path_obj).resolve(strict=False)
    uploads_root = UPLOADS_DIR.resolve(strict=False)
    if uploads_root not in candidate.parents and candidate != uploads_root:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Path traversal is not allowed")

    if not candidate.exists() or not candidate.is_file():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="File path does not exist")

    relative_proof_path = os.path.relpath(candidate, uploads_root)
    if payload.stage == "before":
        task.before_image_path = relative_proof_path
    else:
        task.after_image_path = relative_proof_path
    db.add(task)

    write_audit_log(
        db,
        action="task.upload",
        status="success",
        user_id=current_user.id,
        detail=f"task_id={task.id},stage={payload.stage}",
    )
    db.commit()
    return UploadResponse(file_path=relative_proof_path)
