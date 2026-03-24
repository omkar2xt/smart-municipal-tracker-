"""Authentication routes for GeoSentinel OS."""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from database.session import get_db
from models.user_model import User
from schemas.schemas import UserLogin, TokenResponse, UserResponse
from services.auth_service import create_access_token, verify_password
from services.audit_service import write_audit_log

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/login", response_model=TokenResponse, summary="User login")
def login(
    credentials: UserLogin,
    db: Session = Depends(get_db)
) -> TokenResponse:
    """
    Login endpoint for all user types
    
    Returns JWT token for authenticated users
    """
    # Find user by email
    stmt = select(User).where(User.email == credentials.email)
    user = db.scalar(stmt)
    
    if not user:
        # Log failed attempt
        write_audit_log(
            db,
            action="auth.login",
            status="failure",
            details="User not found"
        )
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )
    
    # Verify password
    if not verify_password(credentials.password, user.password_hash):
        write_audit_log(
            db,
            action="auth.login",
            status="failure",
            user_id=user.id,
            details="Invalid password"
        )
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )
    
    # Check if user is active
    if not user.is_active:
        write_audit_log(
            db,
            action="auth.login",
            status="failure",
            user_id=user.id,
            details="User is inactive"
        )
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is inactive"
        )
    
    # Create JWT token
    token = create_access_token({
        "sub": str(user.id),
        "email": user.email,
        "role": user.role.value
    })
    
    # Log successful login
    write_audit_log(
        db,
        action="auth.login",
        status="success",
        user_id=user.id,
        details=f"Role: {user.role.value}"
    )
    db.commit()
    
    user_response = UserResponse(
        id=user.id,
        name=user.name,
        email=user.email,
        role=user.role,
        state=user.state,
        district=user.district,
        taluka=user.taluka,
        is_active=user.is_active,
        created_at=user.created_at
    )
    
    return TokenResponse(
        access_token=token,
        token_type="bearer",
        user=user_response
    )


@router.post("/refresh", response_model=TokenResponse, summary="Refresh token")
def refresh_token(
    token: str,
    db: Session = Depends(get_db)
) -> TokenResponse:
    """
    Refresh an existing token
    """
    # For now, just create a new token based on extracting user info
    # In production, verify the old token first
    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail="Token refresh not yet implemented"
    )
