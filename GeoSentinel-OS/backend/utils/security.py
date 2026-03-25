"""JWT and password security helpers for GeoSentinel OS."""

import hashlib
import logging
import os
from datetime import datetime, timedelta, timezone
from typing import Any

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import ExpiredSignatureError, JWTError, jwt
from passlib.context import CryptContext
from sqlalchemy.orm import Session

from database.session import get_db
from models.user_model import User

logger = logging.getLogger(__name__)

# bcrypt password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# OAuth2 bearer token extraction from Authorization: Bearer <token>
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")

ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60


def _jwt_secret() -> str:
    """Read JWT secret from environment and fail fast if missing."""
    secret = os.getenv("JWT_SECRET")
    if not secret:
        raise RuntimeError("JWT_SECRET environment variable is required")
    return secret


def hash_password(password: str) -> str:
    """Hash a plain password with deterministic SHA-256 pre-hash then bcrypt.

    Note: Existing hashes produced before this change require migration/reset.
    """
    prehashed = hashlib.sha256(password.encode("utf-8")).hexdigest()
    return pwd_context.hash(prehashed)


def hash_identifier(value: str) -> str:
    """Hash an identifier for audit logging without storing raw PII."""
    return hashlib.sha256((value or "").strip().lower().encode("utf-8")).hexdigest()


def verify_password(plain: str, hashed: str, user: User | None = None, db: Session | None = None) -> bool:
    """Verify password with dual compatibility and migrate legacy hashes when possible."""
    prehashed = hashlib.sha256(plain.encode("utf-8")).hexdigest()
    try:
        if pwd_context.verify(prehashed, hashed):
            return True
    except ValueError:
        pass

    try:
        if pwd_context.verify(plain, hashed):
            if user is not None and db is not None:
                user.password_hash = hash_password(plain)
                db.flush()
            return True
    except ValueError:
        return False

    return False


def create_access_token(data: dict[str, Any]) -> str:
    """Create JWT access token with 60-minute expiry using HS256."""
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, _jwt_secret(), algorithm=ALGORITHM)


def decode_token(token: str) -> dict[str, Any]:
    """Decode JWT token and raise 401 for invalid/expired tokens."""
    try:
        return jwt.decode(token, _jwt_secret(), algorithms=[ALGORITHM])
    except ExpiredSignatureError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has expired",
            headers={"WWW-Authenticate": "Bearer"},
        ) from exc
    except JWTError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token",
            headers={"WWW-Authenticate": "Bearer"},
        ) from exc


def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
) -> User:
    """Resolve authenticated user from bearer token payload."""
    payload = decode_token(token)
    user_id = payload.get("user_id")

    if user_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token payload",
            headers={"WWW-Authenticate": "Bearer"},
        )

    try:
        resolved_user_id = int(user_id)
    except (TypeError, ValueError):
        logger.warning("Token payload user_id is not numeric: %r", user_id)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token payload",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user = db.get(User, resolved_user_id)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return user
