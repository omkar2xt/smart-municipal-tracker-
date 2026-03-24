"""User domain model with hierarchical role mapping."""

from pydantic import BaseModel, Field

from models.enums import Role
from models.redaction import redact_value


class UserModel(BaseModel):
    id: int
    name: str = Field(..., repr=False)
    role: Role = Field(..., description="Allowed governance role for RBAC enforcement")
    district: str | None = Field(default=None, repr=False)
    taluka: str | None = Field(default=None, repr=False)

    def model_dump(self, *args, include_sensitive: bool = False, **kwargs) -> dict:
        """Return redacted data by default; allow explicit sensitive export when needed."""
        data = super().model_dump(*args, **kwargs)
        if include_sensitive:
            return data

        data["name"] = redact_value(self.name)
        data["district"] = redact_value(self.district)
        data["taluka"] = redact_value(self.taluka)
        return data

    def to_log_dict(self) -> dict:
        """Return a redacted dict safe for logs and diagnostics."""
        data = self.model_dump(include_sensitive=False)
        data["role"] = self.role.value
        return data

    def __repr__(self) -> str:
        return f"UserModel({self.to_log_dict()})"
