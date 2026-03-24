"""Shared enum types for role and task state validation."""

from enum import Enum


class Role(str, Enum):
    """Allowed roles across governance and assignment workflows."""

    STATE_ADMIN = "state_admin"
    DISTRICT_ADMIN = "district_admin"
    TALUKA_ADMIN = "taluka_admin"
    FIELD_WORKER = "field_worker"
    ADMIN = "admin"
    SUPERVISOR = "supervisor"


class TaskStatus(str, Enum):
    """Allowed task lifecycle states."""

    PENDING = "PENDING"
    IN_PROGRESS = "IN_PROGRESS"
    COMPLETED = "COMPLETED"
    CANCELLED = "CANCELLED"
