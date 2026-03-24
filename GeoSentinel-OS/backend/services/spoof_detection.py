def detect_spoofing(sensor_payload: dict) -> dict:
    # TODO: Detect emulator patterns, impossible travel, and mock location signatures.
    return {"is_suspected": False, "reason": None, "payload": sensor_payload}
