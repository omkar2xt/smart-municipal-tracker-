from fastapi import FastAPI

from database.init_db import init_db
from routes import admin, attendance, auth, tasks, tracking, upload
from services.spoof_detection import assert_spoof_detection_enabled_for_production

app = FastAPI(title="GeoSentinel OS API", version="0.1.0")

app.include_router(auth.router, tags=["auth"])
app.include_router(attendance.router, tags=["attendance"])
app.include_router(tasks.router, tags=["tasks"])
app.include_router(tracking.router, tags=["tracking"])
app.include_router(upload.router, tags=["upload"])
app.include_router(admin.router)


@app.on_event("startup")
def startup_event() -> None:
    """Run startup-only checks and initialization once per process."""
    assert_spoof_detection_enabled_for_production()
    init_db()


@app.get("/health")
def health_check() -> dict:
    return {"status": "ok"}
