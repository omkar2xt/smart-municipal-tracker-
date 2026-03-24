"""User domain model with hierarchical role mapping."""

from pydantic import BaseModel


class UserModel(BaseModel):
    id: int
    name: str
    role: str
    district: str | None = None
    taluka: str | None = None
