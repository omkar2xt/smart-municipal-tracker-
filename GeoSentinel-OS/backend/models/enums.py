"""Shared enum types for role and task state validation."""

from enum import Enum


class Role(str, Enum):
    """Allowed roles across governance and assignment workflows."""

    # Canonical hierarchy for GeoSentinel OS
    ADMIN = "admin"
    SUB_ADMIN = "sub_admin"
    TALUKA_ADMIN = "taluka_admin"
    WORKER = "worker"

    # Backward-compatible aliases
    SUPER_SUB_ADMIN = "taluka_admin"
    USER = "worker"

    # Legacy compatibility values used by older routes/data.
    # Only FIELD_WORKER is an alias of WORKER; the others are distinct legacy values.
    STATE_ADMIN = "state_admin"
    DISTRICT_ADMIN = "district_admin"
    FIELD_WORKER = "worker"
    SUPERVISOR = "supervisor"


class TaskStatus(str, Enum):
    """Allowed task lifecycle states."""

    PENDING = "PENDING"
    IN_PROGRESS = "IN_PROGRESS"
    COMPLETED = "COMPLETED"
    CANCELLED = "CANCELLED"
