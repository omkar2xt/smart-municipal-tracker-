"""
User management routes
Get user information and manage user accounts
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from database.session import get_db
from models.user_model import User
from schemas.schemas import UserResponse
from services.auth_service import require_role
from models.enums import Role

router = APIRouter(prefix="/users", tags=["users"])


@router.get("/me", response_model=UserResponse, summary="Get current user")
def get_current_user_info(
    current_user: User = Depends(require_role(
        Role.ADMIN, Role.SUB_ADMIN,
        Role.STATE_ADMIN, Role.DISTRICT_ADMIN, Role.TALUKA_ADMIN,
        Role.FIELD_WORKER, Role.WORKER,
    )),
    db: Session = Depends(get_db)
) -> UserResponse:
    """Get current authenticated user information"""
    user = db.query(User).filter(User.id == current_user.id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    
    return UserResponse(
        id=user.id, name=user.name, email=user.email, role=user.role,
        state=user.state, district=user.district, taluka=user.taluka,
        is_active=user.is_active, created_at=user.created_at
    )


@router.get("/{user_id}", response_model=UserResponse, summary="Get user by ID")
def get_user(
    user_id: int,
    current_user: User = Depends(require_role(
        Role.STATE_ADMIN, Role.DISTRICT_ADMIN, Role.TALUKA_ADMIN,
    )),
    db: Session = Depends(get_db)
) -> UserResponse:
    """Get user information by ID (admin only)"""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    
    return UserResponse(
        id=user.id, name=user.name, email=user.email, role=user.role,
        state=user.state, district=user.district, taluka=user.taluka,
        is_active=user.is_active, created_at=user.created_at
    )
