from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from database.session import get_db
from models.schemas import TokenResponse
from models.user_model import User
from routes.auth import get_current_admin_user

router = APIRouter()


@router.get("/users")
def list_users(
    _: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db),
) -> list[dict]:
    records = db.scalars(select(User).order_by(User.id.asc())).all()
    return [
        {
            "id": row.id,
            "name": row.name,
            "role": row.role.value,
            "district": row.district,
            "taluka": row.taluka,
        }
        for row in records
    ]
