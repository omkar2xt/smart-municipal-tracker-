from database.base import Base
from database.session import engine
from models.attendance_model import Attendance  # noqa: F401
from models.location_log_model import LocationLog  # noqa: F401
from models.task_model import Task  # noqa: F401
from models.user_model import User  # noqa: F401


def init_db() -> None:
    Base.metadata.create_all(bind=engine)
