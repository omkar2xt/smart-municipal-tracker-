"""Utilities for masking sensitive values before logging or serialization."""

from typing import Any


def redact_value(value: Any) -> str:
    """Mask a sensitive field value for logs and non-privileged serialization."""
    if value is None:
        return "****"

    text = str(value)
    if len(text) <= 2:
        return "****"

    return f"{text[0]}***{text[-1]}"
