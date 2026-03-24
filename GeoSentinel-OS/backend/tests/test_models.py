from pydantic import ValidationError

from models.enums import Role, TaskStatus
from models.task_model import TaskModel
from models.user_model import UserModel


def test_task_model_accepts_valid_enums() -> None:
    task = TaskModel(
        id=1,
        title="Road inspection",
        assigned_by_role=Role.SUPERVISOR,
        assigned_to_role=Role.FIELD_WORKER,
        status=TaskStatus.PENDING,
    )

    assert task.assigned_by_role == Role.SUPERVISOR
    assert task.status == TaskStatus.PENDING


def test_task_model_rejects_invalid_status() -> None:
    try:
        TaskModel(
            id=2,
            title="Drainage review",
            assigned_by_role="supervisor",
            assigned_to_role="field_worker",
            status="DONE",
        )
        assert False, "Expected validation error for invalid status"
    except ValidationError:
        assert True


def test_user_model_rejects_invalid_role() -> None:
    try:
        UserModel(id=1, name="Alice", role="invalid-role")
        assert False, "Expected validation error for invalid role"
    except ValidationError:
        assert True


def test_user_model_log_redaction_masks_sensitive_fields() -> None:
    user = UserModel(
        id=1,
        name="Asha",
        role=Role.TALUKA_ADMIN,
        district="Pune",
        taluka="Haveli",
    )

    safe = user.to_log_dict()
    assert safe["name"] != "Asha"
    assert safe["district"] != "Pune"
    assert safe["taluka"] != "Haveli"
    assert safe["role"] == "taluka_admin"


def test_user_repr_is_redacted() -> None:
    user = UserModel(id=3, name="Ravi", role=Role.FIELD_WORKER, district="Nashik")

    text = repr(user)
    assert "Ravi" not in text
    assert "Nashik" not in text


def test_user_model_dump_is_redacted_by_default() -> None:
    user = UserModel(
        id=7,
        name="Meera",
        role=Role.DISTRICT_ADMIN,
        district="Nanded",
        taluka="Bhokar",
    )

    dumped = user.model_dump()
    assert dumped["name"] != "Meera"
    assert dumped["district"] != "Nanded"
    assert dumped["taluka"] != "Bhokar"

    raw = user.model_dump(include_sensitive=True)
    assert raw["name"] == "Meera"
