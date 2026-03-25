"""Task management routes - Assign, track, and complete tasks"""

from datetime import datetime, timezone
from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from database.session import get_db
from models.task_model import Task
from models.user_model import User
from schemas.schemas import TaskCreate, TaskUpdate, TaskResponse, TaskListResponse
from services.audit_service import write_audit_log
from services.auth_service import require_role
from services.maintenance_service import log_activity
from models.enums import Role, TaskStatus

router = APIRouter(prefix="/tasks", tags=["tasks"])


@router.post("", response_model=TaskResponse, summary="Create task")
def create_task(
    payload: TaskCreate,
    current_user: User = Depends(require_role(
        Role.STATE_ADMIN, Role.DISTRICT_ADMIN, Role.TALUKA_ADMIN,
    )),
    db: Session = Depends(get_db)
) -> TaskResponse:
    """Create a new task assignment (admins only)"""
    assignee = db.query(User).filter(User.id == payload.assigned_to).first()
    if not assignee:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Assignee not found")
    
    if assignee.role not in [Role.FIELD_WORKER, Role.WORKER]:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Can only assign tasks to workers")
    
    if current_user.role == Role.DISTRICT_ADMIN:
        if assignee.district != current_user.district:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Can only assign within your district")
    elif current_user.role == Role.TALUKA_ADMIN:
        if (assignee.district != current_user.district or assignee.taluka != current_user.taluka):
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Can only assign within your taluka")
    
    task = Task(
        title=payload.title,
        description=payload.description,
        fund_allocated=payload.fund_allocated or 0,
        assigned_to=payload.assigned_to,
        assigned_by=current_user.id,
        expected_latitude=payload.expected_latitude,
        expected_longitude=payload.expected_longitude,
        geofence_id=payload.geofence_id,
        due_date=payload.due_date,
        status=TaskStatus.PENDING,
        created_at=datetime.now(timezone.utc)
    )
    
    db.add(task)
    
    write_audit_log(db, action="task.create", status="success", user_id=current_user.id,
                   resource_type="task", resource_id=task.id, details=f"Title: {payload.title}")
    db.commit()
    db.refresh(task)
    
    return TaskResponse(
        id=task.id, title=task.title, description=task.description, fund_allocated=float(task.fund_allocated), status=task.status,
        assigned_to=task.assigned_to, assigned_by=task.assigned_by,
        before_image_path=task.before_image_path, after_image_path=task.after_image_path,
        expected_latitude=task.expected_latitude, expected_longitude=task.expected_longitude,
        geofence_id=task.geofence_id, due_date=task.due_date,
        completed_at=task.completed_at, created_at=task.created_at
    )


@router.get("", response_model=TaskListResponse, summary="Get tasks")
def get_tasks(
    task_status: str | None = Query(default=None, alias="status"),
    current_user: User = Depends(require_role(
        Role.STATE_ADMIN, Role.DISTRICT_ADMIN, Role.TALUKA_ADMIN,
        Role.FIELD_WORKER, Role.WORKER,
    )),
    db: Session = Depends(get_db)
) -> TaskListResponse:
    """Get tasks based on user role"""
    query = db.query(Task)
    
    if current_user.role in [Role.FIELD_WORKER, Role.WORKER]:
        query = query.filter(Task.assigned_to == current_user.id)
    elif current_user.role == Role.DISTRICT_ADMIN:
        workers = db.query(User).filter(
            User.district == current_user.district,
            User.role.in_([Role.FIELD_WORKER, Role.WORKER])
        ).with_entities(User.id)
        query = query.filter(Task.assigned_to.in_(workers))
    elif current_user.role == Role.TALUKA_ADMIN:
        workers = db.query(User).filter(
            User.district == current_user.district, User.taluka == current_user.taluka,
            User.role.in_([Role.FIELD_WORKER, Role.WORKER])
        ).with_entities(User.id)
        query = query.filter(Task.assigned_to.in_(workers))
    
    if task_status:
        try:
            status_enum = TaskStatus[task_status.upper()]
            query = query.filter(Task.status == status_enum)
        except KeyError:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Invalid status: {task_status}")
    
    tasks = query.order_by(Task.created_at.desc()).all()
    return TaskListResponse(total=len(tasks), records=[
        TaskResponse(
            id=t.id, title=t.title, description=t.description, fund_allocated=float(t.fund_allocated), status=t.status,
            assigned_to=t.assigned_to, assigned_by=t.assigned_by,
            before_image_path=t.before_image_path, after_image_path=t.after_image_path,
            expected_latitude=t.expected_latitude, expected_longitude=t.expected_longitude,
            geofence_id=t.geofence_id, due_date=t.due_date,
            completed_at=t.completed_at, created_at=t.created_at
        ) for t in tasks
    ])


@router.post("/{task_id}/complete", response_model=TaskResponse, summary="Complete task")
def complete_task(
    task_id: int,
    payload: TaskUpdate,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(require_role(Role.FIELD_WORKER, Role.WORKER)),
    db: Session = Depends(get_db)
) -> TaskResponse:
    """Mark task as completed with proof images"""
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")
    
    if task.assigned_to != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not assigned to you")
    
    task.status = TaskStatus.COMPLETED
    task.completed_at = datetime.now(timezone.utc)
    if payload.before_image_path:
        task.before_image_path = payload.before_image_path
    if payload.after_image_path:
        task.after_image_path = payload.after_image_path
    
    write_audit_log(db, action="task.complete", status="success", user_id=current_user.id,
                   resource_type="task", resource_id=task.id)
    db.commit()
    db.refresh(task)
    background_tasks.add_task(
        log_activity,
        action="task.complete",
        user_id=current_user.id,
        details=f"task_id={task.id}",
    )
    
    return TaskResponse(
        id=task.id, title=task.title, description=task.description, fund_allocated=float(task.fund_allocated), status=task.status,
        assigned_to=task.assigned_to, assigned_by=task.assigned_by,
        before_image_path=task.before_image_path, after_image_path=task.after_image_path,
        expected_latitude=task.expected_latitude, expected_longitude=task.expected_longitude,
        geofence_id=task.geofence_id, due_date=task.due_date,
        completed_at=task.completed_at, created_at=task.created_at
    )


@router.post("/complete", response_model=TaskResponse, summary="Complete task (compat)")
def complete_task_compat(
    task_id: int,
    payload: TaskUpdate,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(require_role(Role.FIELD_WORKER, Role.WORKER)),
    db: Session = Depends(get_db),
) -> TaskResponse:
    """Compatibility endpoint that maps to /tasks/{task_id}/complete."""
    return complete_task(
        task_id=task_id,
        payload=payload,
        background_tasks=background_tasks,
        current_user=current_user,
        db=db,
    )
