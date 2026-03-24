from datetime import datetime, timezone

from models.task_model import Task
from services.spoof_service import distance_meters


def validate_task_assignment_scope(admin_role: str, assignee_role: str) -> tuple[bool, str | None]:
    if assignee_role != "worker":
        return False, "Tasks can only be assigned to workers"

    if admin_role not in {"state_admin", "district_admin", "taluka_admin"}:
        return False, "Only admins can assign tasks"

    return True, None


def validate_task_proof_consistency(
    task: Task,
    captured_latitude: float | None,
    captured_longitude: float | None,
    captured_at: datetime,
    max_distance_m: float = 300.0,
    max_delay_hours: float = 168.0,
) -> tuple[bool, str | None]:
    if captured_at.tzinfo is None:
        captured_at = captured_at.replace(tzinfo=timezone.utc)

    due_at = getattr(task, "due_date", None) or getattr(task, "due_at", None)
    if due_at and due_at.tzinfo is None:
        due_at = due_at.replace(tzinfo=timezone.utc)

    if due_at and captured_at > due_at:
        return False, "Capture time exceeds task due time"

    now_utc = datetime.now(timezone.utc)
    if captured_at > now_utc:
        return False, "Capture time cannot be in the future"

    if (now_utc - captured_at).total_seconds() > max_delay_hours * 3600:
        return False, "Capture time too old"

    if (
        task.expected_latitude is not None
        and task.expected_longitude is not None
        and captured_latitude is not None
        and captured_longitude is not None
    ):
        dist = distance_meters(
            {"latitude": task.expected_latitude, "longitude": task.expected_longitude},
            {"latitude": captured_latitude, "longitude": captured_longitude},
        )
        if dist > max_distance_m:
            return False, "Captured location is outside allowed task area"

    return True, None
