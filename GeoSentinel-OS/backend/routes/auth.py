import hmac
import os

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from database.session import get_db
from models.schemas import LoginRequest, TokenResponse
from models.user_model import User
from services.auth_service import create_access_token, get_current_user

router = APIRouter()
AUTH_PASSWORD = os.getenv("AUTH_PASSWORD")


def get_current_admin_user(current_user: User = Depends(get_current_user)) -> User:
    if current_user.role.value not in {"state_admin", "district_admin", "taluka_admin"}:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin authentication required")
    return current_user


@router.post("/login")
def login(payload: LoginRequest, db: Session = Depends(get_db)) -> TokenResponse:
    if not AUTH_PASSWORD:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="AUTH_PASSWORD is not configured",
        )

    if not hmac.compare_digest(payload.password, AUTH_PASSWORD):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")

    stmt = select(User).where(User.name == payload.name, User.role == payload.role)
    user = db.scalar(stmt)

    if user is None:
        user = User(
            name=payload.name,
            role=payload.role,
            district=payload.district,
            taluka=payload.taluka,
        )
        db.add(user)
        db.commit()
        db.refresh(user)

    token = create_access_token({"sub": user.id, "role": user.role.value, "name": user.name})
    return TokenResponse(access_token=token, token_type="bearer", user_id=user.id, role=user.role)
