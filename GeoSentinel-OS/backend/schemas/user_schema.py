"""Schemas used by JWT authentication endpoints."""

from pydantic import BaseModel, Field


class LoginRequest(BaseModel):
    """Login payload using username/password."""

    username: str = Field(..., min_length=1)
    password: str = Field(..., min_length=1)


class LoginResponse(BaseModel):
    """Standard JWT login response."""

    access_token: str
    token_type: str = "bearer"
    user_id: int
    email: str
    role: str


class CurrentUserResponse(BaseModel):
    """Authenticated user context from JWT."""

    user_id: int
    role: str
    email: str
