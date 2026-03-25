"""Fund usage records linked to task execution."""

from decimal import Decimal
from datetime import datetime, timezone
from sqlalchemy import DateTime, ForeignKey, Integer, Numeric, String
from sqlalchemy.orm import Mapped, mapped_column

from database.base import Base


class FundUsage(Base):
    """Tracks task-level fund consumption for financial monitoring."""

    __tablename__ = "fund_usage"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    task_id: Mapped[int] = mapped_column(ForeignKey("tasks.id"), nullable=False, index=True)
    user_id: Mapped[int | None] = mapped_column(ForeignKey("users.id"), nullable=True, index=True)
    amount: Mapped[Decimal] = mapped_column(Numeric(18, 2), nullable=False)
    description: Mapped[str | None] = mapped_column(String(500), nullable=True)
    spent_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, index=True, default=lambda: datetime.now(timezone.utc))
