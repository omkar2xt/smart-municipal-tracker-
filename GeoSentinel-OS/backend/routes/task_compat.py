"""Compatibility routes for task APIs expected by legacy/mobile clients."""

from fastapi import APIRouter, BackgroundTasks, Depends
from sqlalchemy.orm import Session

from database.session import get_db
from models.user_model import User
from routes.tasks import complete_task
from schemas.schemas import TaskResponse, TaskUpdate
from services.auth_service import require_role
from models.enums import Role

router = APIRouter(prefix="/task", tags=["tasks"])


@router.post("/complete", response_model=TaskResponse, summary="Complete task")
def complete_task_compat(
    task_id: int,
    payload: TaskUpdate,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(require_role(Role.FIELD_WORKER, Role.WORKER)),
    db: Session = Depends(get_db),
) -> TaskResponse:
    """Compatibility endpoint mapping to /tasks/{task_id}/complete."""
    return complete_task(
        task_id=task_id,
        payload=payload,
        background_tasks=background_tasks,
        current_user=current_user,
        db=db,
    )
