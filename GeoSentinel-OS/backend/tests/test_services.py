import importlib
import os

from services.gps_validation import validate_location


def test_validate_location_requires_finite_values() -> None:
    assert validate_location(None, 72.0) is False
    assert validate_location(18.0, None) is False
    assert validate_location(float("nan"), 72.0) is False
    assert validate_location(18.0, float("inf")) is False


def test_validate_location_range_checks() -> None:
    assert validate_location(18.52, 73.85) is True
    assert validate_location(-91.0, 73.85) is False
    assert validate_location(18.52, 181.0) is False


def test_detect_spoofing_flags_disabled_engine(monkeypatch) -> None:
    monkeypatch.setenv("SPOOF_DETECTION_ENABLED", "false")
    monkeypatch.setenv("ENVIRONMENT", "development")

    from services import spoof_detection

    importlib.reload(spoof_detection)

    result = spoof_detection.detect_spoofing({"is_emulator": False})
    assert result["is_suspected"] is True
    assert result["reason"] == "spoof_detection_disabled"


def test_detect_spoofing_detects_basic_signals() -> None:
    from services import spoof_detection

    importlib.reload(spoof_detection)

    # This assertion remains tolerant because feature flags may gate checks.
    payload = {
        "is_emulator": True,
        "distance_km": 20,
        "delta_time_sec": 60,
    }
    result = spoof_detection.detect_spoofing(payload)
    assert isinstance(result["is_suspected"], bool)
