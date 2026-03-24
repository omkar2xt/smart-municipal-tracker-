"""
Security utilities for authentication and authorization
Includes JWT handling, password hashing, and role-based access control
"""

from datetime import datetime, timedelta
import hashlib
import logging
from typing import Optional, Dict, Any
from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session
from models.user_model import User

# Password hashing configuration
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# JWT configuration
SECRET_KEY = "your-super-secret-key-change-in-production-env"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24  # 24 hours

# HTTP Bearer scheme
security = HTTPBearer()
logger = logging.getLogger(__name__)


def hash_password(password: str) -> str:
    """Hash a password using bcrypt"""
    normalized = password
    if len(password.encode("utf-8")) > 72:
        # bcrypt ignores bytes past 72; normalize to preserve deterministic verification.
        normalized = hashlib.sha256(password.encode("utf-8")).hexdigest()
    return pwd_context.hash(normalized)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against its hash"""
    # First try legacy/raw verification so existing stored hashes continue to work.
    try:
        if pwd_context.verify(plain_password, hashed_password):
            return True
    except ValueError:
        # Passlib+bcrypt can raise for >72-byte inputs; fallback path handles this case.
        pass

    # Fallback for long UTF-8 passwords that require normalization.
    if len(plain_password.encode("utf-8")) > 72:
        normalized = hashlib.sha256(plain_password.encode("utf-8")).hexdigest()
        try:
            if pwd_context.verify(normalized, hashed_password):
                logger.warning(
                    "Long-password fallback verification succeeded. "
                    "User hash should be migrated on next password update."
                )
                return True
        except ValueError:
            return False

    return False


def create_access_token(data: Dict[str, Any], expires_delta: Optional[timedelta] = None) -> str:
    """
    Create JWT access token
    
    Args:
        data: Dictionary with user info to encode
        expires_delta: Token expiration time
        
    Returns:
        Encoded JWT token string
    """
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(hours=24)
    
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


def decode_access_token(token: str) -> Dict[str, Any]:
    """
    Decode and verify JWT token
    
    Args:
        token: JWT token string
        
    Returns:
        Decoded token payload
        
    Raises:
        JWTError if token is invalid or expired
    """
    payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    return payload


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(lambda: None)  # Placeholder, will be injected
) -> Dict[str, Any]:
    """
    Get current authenticated user from JWT token
    
    Args:
        credentials: HTTP Bearer credentials
        db: Database session
        
    Returns:
        Current user dictionary with id, email, role
        
    Raises:
        HTTPException with 401 if token is invalid
    """
    token = credentials.credentials
    
    try:
        payload = decode_access_token(token)
        user_id: int = payload.get("sub")
        user_email: str = payload.get("email")
        user_role: str = payload.get("role")
        
        if user_id is None or user_email is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        return {
            "id": user_id,
            "email": user_email,
            "role": user_role
        }
        
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token",
            headers={"WWW-Authenticate": "Bearer"},
        )


def require_role(*allowed_roles: str):
    """
    Dependency to check if user has required role
    
    Usage:
        @app.get("/admin")
        def admin_endpoint(user = Depends(require_role("state_admin", "district_admin"))):
            ...
    """
    async def role_checker(current_user: Dict[str, Any] = Depends(get_current_user)) -> Dict[str, Any]:
        user_role = current_user.get("role")
        if user_role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Insufficient permissions"
            )
        return current_user
    
    return role_checker
