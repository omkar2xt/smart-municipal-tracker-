"""Storage utilities for task and face images."""

from __future__ import annotations

import logging
import secrets
from datetime import datetime, timezone
from pathlib import Path

from config.settings import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()
UPLOADS_ROOT = Path(settings.upload_dir).resolve()

try:
    import cloudinary
    import cloudinary.uploader

    _CLOUDINARY_AVAILABLE = True
except Exception:  # noqa: BLE001
    cloudinary = None
    _CLOUDINARY_AVAILABLE = False


def _save_local(raw: bytes, folder: str, prefix: str, ext: str) -> str:
    target_dir = (UPLOADS_ROOT / folder).resolve()
    target_dir.mkdir(parents=True, exist_ok=True)
    filename = f"{prefix}_{datetime.now(timezone.utc).strftime('%Y%m%d%H%M%S')}_{secrets.token_hex(4)}.{ext}"
    full_path = (target_dir / filename).resolve()
    full_path.write_bytes(raw)
    return str(full_path.relative_to(UPLOADS_ROOT).as_posix())


def save_image(raw: bytes, folder: str, prefix: str, ext: str) -> str:
    """Persist image to Cloudinary when configured, else save to local uploads dir."""
    cloudinary_url = (settings.cloudinary_url or "").strip()

    if cloudinary_url and _CLOUDINARY_AVAILABLE:
        try:
            cloudinary.config(cloudinary_url=cloudinary_url, secure=True)
            public_id = f"{prefix}_{datetime.now(timezone.utc).strftime('%Y%m%d%H%M%S')}_{secrets.token_hex(4)}"
            result = cloudinary.uploader.upload(
                raw,
                folder=folder,
                public_id=public_id,
                resource_type="image",
                overwrite=False,
            )
            secure_url = result.get("secure_url")
            if secure_url:
                return str(secure_url)
            logger.warning("Cloudinary upload succeeded without secure_url, falling back to local storage")
        except Exception:  # noqa: BLE001
            logger.exception("Cloudinary upload failed, falling back to local storage")

    return _save_local(raw, folder, prefix, ext)
