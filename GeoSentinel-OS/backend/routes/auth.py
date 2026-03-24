from fastapi import APIRouter, Header, HTTPException, status

router = APIRouter()


def get_current_admin_user(authorization: str | None = Header(default=None)) -> dict:
    """Minimal auth guard for admin endpoints.

    Expects a bearer token equal to "admin-token" in this scaffold.
    """
    if authorization != "Bearer admin-token":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Admin authentication required",
        )

    return {"role": "admin"}


@router.post("/login")
def login() -> dict:
    return {"message": "Auth route placeholder"}
