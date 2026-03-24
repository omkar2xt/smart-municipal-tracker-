"""Task model for downward command flow from admins to field workers."""

from pydantic import BaseModel

from models.enums import Role, TaskStatus


class TaskModel(BaseModel):
    id: int
    title: str
    assigned_by_role: Role
    assigned_to_role: Role
    status: TaskStatus
