from fastapi import APIRouter
from fastapi import Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from database.session import get_db
from models.enums import Role, TaskStatus
from models.schemas import TaskCreate, TaskResponse, TaskUpdate
from models.task_model import Task
from models.user_model import User
from services.auth_service import get_current_user

router = APIRouter()


@router.post("/task", response_model=TaskResponse)
def create_task(
    payload: TaskCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> TaskResponse:
    if current_user.role not in {Role.STATE_ADMIN, Role.DISTRICT_ADMIN, Role.TALUKA_ADMIN}:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only admins can assign tasks")

    assignee = db.get(User, payload.assigned_to)
    if assignee is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Assignee not found")

    task = Task(
        title=payload.title,
        status=payload.status,
        assigned_to=payload.assigned_to,
        assigned_by=current_user.id,
    )
    db.add(task)
    db.commit()
    db.refresh(task)

    return TaskResponse(
        id=task.id,
        title=task.title,
        status=task.status,
        assigned_to=task.assigned_to,
        assigned_by=task.assigned_by,
        image_proof=task.image_proof,
    )


@router.get("/tasks", response_model=list[TaskResponse])
def get_tasks(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[TaskResponse]:
    if current_user.role == Role.FIELD_WORKER:
        stmt = select(Task).where(Task.assigned_to == current_user.id)
    else:
        stmt = select(Task)

    records = db.scalars(stmt).all()
    return [
        TaskResponse(
            id=t.id,
            title=t.title,
            status=t.status,
            assigned_to=t.assigned_to,
            assigned_by=t.assigned_by,
            image_proof=t.image_proof,
        )
        for t in records
    ]


@router.patch("/task/{task_id}", response_model=TaskResponse)
def update_task(
    task_id: int,
    payload: TaskUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> TaskResponse:
    task = db.get(Task, task_id)
    if task is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")

    is_admin = current_user.role in {Role.STATE_ADMIN, Role.DISTRICT_ADMIN, Role.TALUKA_ADMIN}
    if not is_admin and task.assigned_to != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to update this task")

    task.status = payload.status
    db.add(task)
    db.commit()
    db.refresh(task)
    return TaskResponse(
        id=task.id,
        title=task.title,
        status=task.status,
        assigned_to=task.assigned_to,
        assigned_by=task.assigned_by,
        image_proof=task.image_proof,
    )


@router.post("/task/{task_id}/complete", response_model=TaskResponse)
def complete_task(
    task_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> TaskResponse:
    return update_task(task_id, TaskUpdate(status=TaskStatus.COMPLETED), current_user, db)
