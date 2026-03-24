"""Admin routes for hierarchical role management and governance operations."""

from fastapi import APIRouter, Depends

from models.enums import Role
from routes.auth import get_current_admin_user

router = APIRouter(prefix="/admin", tags=["admin"])


@router.get("/roles", dependencies=[Depends(get_current_admin_user)])
def list_roles() -> dict:
    """Return supported role hierarchy for RBAC checks."""
    return {
        "roles": [
            Role.STATE_ADMIN.value,
            Role.DISTRICT_ADMIN.value,
            Role.TALUKA_ADMIN.value,
            Role.FIELD_WORKER.value,
        ]
    }
