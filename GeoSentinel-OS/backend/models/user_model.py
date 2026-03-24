from sqlalchemy import Enum, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from database.base import Base
from models.enums import Role
from models.redaction import redact_value


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    role: Mapped[Role] = mapped_column(Enum(Role), nullable=False, index=True)
    district: Mapped[str | None] = mapped_column(String(120), nullable=True, index=True)
    taluka: Mapped[str | None] = mapped_column(String(120), nullable=True, index=True)

    attendance_records = relationship("Attendance", back_populates="user")
    assigned_tasks = relationship("Task", foreign_keys="Task.assigned_to", back_populates="assignee")
    created_tasks = relationship("Task", foreign_keys="Task.assigned_by", back_populates="assigner")
    location_logs = relationship("LocationLog", back_populates="user")

    def to_log_dict(self) -> dict:
        return {
            "id": self.id,
            "name": redact_value(self.name),
            "role": self.role.value,
            "district": redact_value(self.district),
            "taluka": redact_value(self.taluka),
        }

    def __repr__(self) -> str:
        return f"User({self.to_log_dict()})"
