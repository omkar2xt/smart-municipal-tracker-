import math


def validate_location(lat: float | None, lng: float | None) -> bool:
    """Validate that a coordinate pair exists, is numeric/finite, and in bounds."""
    # TODO: Add geofence, drift checks, and signal confidence scoring.
    if lat is None or lng is None:
        return False

    if isinstance(lat, bool) or isinstance(lng, bool):
        return False

    if not isinstance(lat, (int, float)) or not isinstance(lng, (int, float)):
        return False

    lat_f = float(lat)
    lng_f = float(lng)
    if not math.isfinite(lat_f) or not math.isfinite(lng_f):
        return False

    if not (-90.0 <= lat_f <= 90.0):
        return False

    if not (-180.0 <= lng_f <= 180.0):
        return False

    return True
