"""Task model for downward command flow from admins to field workers."""

from pydantic import BaseModel


class TaskModel(BaseModel):
    id: int
    title: str
    assigned_by_role: str
    assigned_to_role: str
    status: str
