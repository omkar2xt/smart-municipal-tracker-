"""Authentication routes for GeoSentinel OS."""

from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from database.session import get_db
from models.user_model import User
from schemas.user_schema import CurrentUserResponse, LoginRequest, LoginResponse
from services.audit_service import write_audit_log
from utils.security import create_access_token, get_current_user, hash_identifier, hash_password, verify_password

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/login", response_model=LoginResponse, summary="User login")
def login(
    credentials: LoginRequest,
    db: Session = Depends(get_db)
) -> LoginResponse:
    """
    Authenticate user and return JWT token.

    Token payload includes:
    - user_id
    - role
    """
    # Using email as username for this project.
    username_hash = hash_identifier(credentials.username)
    stmt = select(User).where(User.email == credentials.username)
    user = db.scalar(stmt)

    if not user:
        write_audit_log(
            db,
            action="auth.login",
            status="failure",
            details=(
                f"timestamp={datetime.now(timezone.utc).isoformat()} "
                f"username_hash={username_hash} reason=invalid_credentials"
            ),
        )
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )

    verification = verify_password(credentials.password, user.password_hash, user=user, db=db)
    if not verification.valid:
        write_audit_log(
            db,
            action="auth.login",
            status="failure",
            user_id=user.id,
            details=(
                f"timestamp={datetime.now(timezone.utc).isoformat()} "
                f"username_hash={username_hash} reason=invalid_credentials"
            ),
        )
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if verification.needs_migration:
        user.password_hash = hash_password(credentials.password)
        try:
            db.flush()
        except Exception as exc:
            db.rollback()
            write_audit_log(
                db,
                action="auth.password_migration",
                status="failure",
                user_id=user.id,
                details=(
                    f"timestamp={datetime.now(timezone.utc).isoformat()} "
                    f"username_hash={username_hash} reason=migration_flush_failed"
                ),
            )
            db.commit()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Unable to complete login migration",
            ) from exc

    if not user.is_active:
        write_audit_log(
            db,
            action="auth.login",
            status="failure",
            user_id=user.id,
            details=(
                f"timestamp={datetime.now(timezone.utc).isoformat()} "
                f"username_hash={username_hash} reason=inactive_account"
            ),
        )
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is inactive"
        )

    token = create_access_token({
        "sub": str(user.id),
        "user_id": user.id,
        "role": user.role.value
    })

    return LoginResponse(
        access_token=token,
        token_type="bearer",
        user_id=user.id,
        email=user.email,
        role=user.role.value,
    )


@router.get("/me", response_model=CurrentUserResponse, summary="Get current user")
def me(current_user: User = Depends(get_current_user)) -> CurrentUserResponse:
    """
    Protected endpoint that returns authenticated user info.
    """
    return CurrentUserResponse(
        user_id=current_user.id,
        role=current_user.role.value,
        email=current_user.email,
    )
