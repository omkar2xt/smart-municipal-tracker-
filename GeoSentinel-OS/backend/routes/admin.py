"""Admin routes for hierarchical role management and governance operations."""

from fastapi import APIRouter

router = APIRouter(prefix="/admin", tags=["admin"])


@router.get("/roles")
def list_roles() -> dict:
    """Return supported role hierarchy for RBAC checks."""
    return {
        "roles": ["state_admin", "district_admin", "taluka_admin", "field_worker"]
    }
