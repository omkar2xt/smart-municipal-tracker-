"""Worker verification and proof upload routes."""

from __future__ import annotations

import base64
import hashlib
import hmac
import re
import secrets
from datetime import datetime, timezone
from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from config.settings import get_settings
from database.session import get_db
from models.enums import Role, TaskStatus
from models.task_model import Task
from models.user_model import User
from schemas.schemas import (
    FaceVerificationRequest,
    FaceVerificationResponse,
    TaskProofUploadRequest,
    TaskProofUploadResponse,
)
from services.audit_service import write_audit_log
from services.auth_service import require_role

router = APIRouter(tags=["worker-verification"])
settings = get_settings()
UPLOADS_ROOT = Path(settings.upload_dir).resolve()
MAX_IMAGE_SIZE_BYTES = 8 * 1024 * 1024


def _decode_base64_image(value: str) -> tuple[bytes, str]:
    raw = (value or "").strip()
    if not raw:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Image payload is required")

    mime = "image/png"
    payload = raw
    if raw.startswith("data:") and "," in raw:
        header, payload = raw.split(",", 1)
        match = re.search(r"data:(image/[a-zA-Z0-9.+-]+);base64", header)
        if not match:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Unsupported image format")
        mime = match.group(1).lower()

    try:
        decoded = base64.b64decode(payload, validate=True)
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid base64 image") from exc

    if len(decoded) == 0:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Image is empty")
    if len(decoded) > MAX_IMAGE_SIZE_BYTES:
        raise HTTPException(status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE, detail="Image exceeds 8MB limit")

    if "jpeg" in mime or "jpg" in mime:
        ext = "jpg"
    elif "webp" in mime:
        ext = "webp"
    else:
        ext = "png"

    return decoded, ext


def _save_image(raw: bytes, folder: str, prefix: str, ext: str) -> str:
    target_dir = (UPLOADS_ROOT / folder).resolve()
    target_dir.mkdir(parents=True, exist_ok=True)
    filename = f"{prefix}_{datetime.now(timezone.utc).strftime('%Y%m%d%H%M%S')}_{secrets.token_hex(4)}.{ext}"
    full_path = (target_dir / filename).resolve()
    full_path.write_bytes(raw)
    return str(full_path.relative_to(UPLOADS_ROOT).as_posix())


@router.post("/verify-face", response_model=FaceVerificationResponse, summary="Verify worker face")
def verify_face(
    payload: FaceVerificationRequest,
    current_user: User = Depends(require_role(Role.FIELD_WORKER, Role.WORKER)),
    db: Session = Depends(get_db),
) -> FaceVerificationResponse:
    if payload.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Can only verify your own face")

    image_bytes, ext = _decode_base64_image(payload.image)
    incoming_hash = hashlib.sha256(image_bytes).hexdigest()

    if current_user.face_image_hash:
        verified = hmac.compare_digest(current_user.face_image_hash, incoming_hash)
        message = "Face matched baseline" if verified else "Face did not match baseline"
    else:
        verified = True
        message = "Face enrolled and verified"

    stored_rel_path = None
    if verified:
        stored_rel_path = _save_image(image_bytes, "faces", f"user_{current_user.id}", ext)
        current_user.face_image = stored_rel_path
        current_user.face_image_hash = incoming_hash
        db.add(current_user)

    write_audit_log(
        db,
        action="worker.face_verify",
        status="success" if verified else "failure",
        user_id=current_user.id,
        resource_type="user",
        resource_id=current_user.id,
        details=f"verified={verified}",
    )
    db.commit()

    return FaceVerificationResponse(
        verified=verified,
        message=message,
        face_image=stored_rel_path if verified else None,
    )


@router.post("/task/upload-proof", response_model=TaskProofUploadResponse, summary="Upload task proof images")
def upload_task_proof(
    payload: TaskProofUploadRequest,
    current_user: User = Depends(require_role(Role.FIELD_WORKER, Role.WORKER)),
    db: Session = Depends(get_db),
) -> TaskProofUploadResponse:
    if not current_user.face_image:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Face verification required before uploading task proof",
        )

    task = db.query(Task).filter(Task.id == payload.task_id).first()
    if not task:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")
    if task.assigned_to != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Task is not assigned to you")

    if payload.before_image:
        before_bytes, before_ext = _decode_base64_image(payload.before_image)
        before_rel = _save_image(before_bytes, "task_proofs", f"task_{task.id}_before", before_ext)
        task.before_image = before_rel
        task.before_image_path = before_rel

    if payload.after_image:
        after_bytes, after_ext = _decode_base64_image(payload.after_image)
        after_rel = _save_image(after_bytes, "task_proofs", f"task_{task.id}_after", after_ext)
        task.after_image = after_rel
        task.after_image_path = after_rel

    if task.before_image and task.after_image:
        task.status = TaskStatus.COMPLETED
        if not task.completed_at:
            task.completed_at = datetime.now(timezone.utc)

    db.add(task)
    write_audit_log(
        db,
        action="task.upload_proof",
        status="success",
        user_id=current_user.id,
        resource_type="task",
        resource_id=task.id,
        details="before_after_upload",
    )
    db.commit()
    db.refresh(task)

    return TaskProofUploadResponse(
        task_id=task.id,
        before_image=task.before_image or task.before_image_path,
        after_image=task.after_image or task.after_image_path,
        status=task.status,
    )
