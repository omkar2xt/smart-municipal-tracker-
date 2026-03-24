import os
from math import asin, cos, radians, sin, sqrt


def _env_bool(name: str, default: bool = False) -> bool:
    raw = os.getenv(name)
    if raw is None:
        return default
    return raw.strip().lower() in {"1", "true", "yes", "on"}


SPOOF_DETECTION_ENABLED = _env_bool("SPOOF_DETECTION_ENABLED", default=False)
ENVIRONMENT = os.getenv("ENVIRONMENT", "development").strip().lower()


def _distance_meters(prev_loc: dict, curr_loc: dict) -> float:
    """Compute Haversine distance in meters between two {latitude, longitude} points."""
    lat1 = float(prev_loc["latitude"])
    lon1 = float(prev_loc["longitude"])
    lat2 = float(curr_loc["latitude"])
    lon2 = float(curr_loc["longitude"])

    earth_radius_m = 6371000.0
    d_lat = radians(lat2 - lat1)
    d_lon = radians(lon2 - lon1)
    a = (
        sin(d_lat / 2) ** 2
        + cos(radians(lat1)) * cos(radians(lat2)) * sin(d_lon / 2) ** 2
    )
    c = 2 * asin(sqrt(a))
    return earth_radius_m * c


def detect_spoof(prev_loc: dict, curr_loc: dict, sensor_data: dict) -> bool:
    """Return True when movement pattern looks spoofed.

    Rules:
    1. GPS moved beyond threshold while accelerometer movement is low.
    2. GPS shows a sudden large jump.
    """
    if not prev_loc or not curr_loc:
        return False

    distance_m = _distance_meters(prev_loc, curr_loc)

    movement = float(sensor_data.get("movement", 0.0) or 0.0) if sensor_data else 0.0

    distance_threshold_m = 30.0
    low_movement_threshold = 0.1
    sudden_jump_threshold_m = 500.0

    low_movement_spoof = distance_m > distance_threshold_m and movement <= low_movement_threshold
    sudden_jump_spoof = distance_m > sudden_jump_threshold_m

    return low_movement_spoof or sudden_jump_spoof


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
