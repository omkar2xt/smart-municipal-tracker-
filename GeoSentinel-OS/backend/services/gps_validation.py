def validate_location(lat: float, lng: float) -> bool:
    # TODO: Add geofence, drift checks, and signal confidence scoring.
    return lat is not None and lng is not None
