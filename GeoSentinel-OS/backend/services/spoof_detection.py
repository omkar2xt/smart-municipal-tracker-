import os


def _env_bool(name: str, default: bool = False) -> bool:
    raw = os.getenv(name)
    if raw is None:
        return default
    return raw.strip().lower() in {"1", "true", "yes", "on"}


SPOOF_DETECTION_ENABLED = _env_bool("SPOOF_DETECTION_ENABLED", default=False)
ENVIRONMENT = os.getenv("ENVIRONMENT", "development").strip().lower()


def assert_spoof_detection_enabled_for_production() -> None:
    """Fail startup if spoof detection is disabled in production."""
    if ENVIRONMENT == "production" and not SPOOF_DETECTION_ENABLED:
        raise RuntimeError(
            "SPOOF_DETECTION_ENABLED must be true when ENVIRONMENT=production"
        )


def detect_spoofing(sensor_payload: dict) -> dict:
    """Detect likely spoofing signals with lightweight heuristics."""
    if not SPOOF_DETECTION_ENABLED:
        return {
            "is_suspected": True,
            "reason": "spoof_detection_disabled",
            "payload": sensor_payload,
        }

    reasons: list[str] = []
    payload = sensor_payload or {}

    device_fingerprint = str(payload.get("device_fingerprint", "")).lower()
    if payload.get("is_emulator") is True or any(
        marker in device_fingerprint
        for marker in ("emulator", "genymotion", "sdk_gphone", "x86")
    ):
        reasons.append("emulator_signature_detected")

    if payload.get("is_mock_location") is True:
        reasons.append("mock_location_detected")

    distance_km = payload.get("distance_km")
    delta_time_sec = payload.get("delta_time_sec")
    speed_kmh = payload.get("speed_kmh")

    if speed_kmh is not None:
        try:
            if float(speed_kmh) > 300:
                reasons.append("impossible_travel_speed")
        except (TypeError, ValueError):
            reasons.append("invalid_speed_signal")

    if distance_km is not None and delta_time_sec is not None:
        try:
            if float(delta_time_sec) > 0:
                inferred_speed = (float(distance_km) / float(delta_time_sec)) * 3600
                if inferred_speed > 300:
                    reasons.append("impossible_travel_inferred")
        except (TypeError, ValueError, ZeroDivisionError):
            reasons.append("invalid_travel_signal")

    return {
        "is_suspected": len(reasons) > 0,
        "reason": ",".join(reasons) if reasons else None,
        "payload": sensor_payload,
    }
