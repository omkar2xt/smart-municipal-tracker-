from fastapi import FastAPI

from routes import admin, attendance, auth, tasks, tracking
from services.spoof_detection import assert_spoof_detection_enabled_for_production

assert_spoof_detection_enabled_for_production()

app = FastAPI(title="GeoSentinel OS API", version="0.1.0")

app.include_router(auth.router, prefix="/auth", tags=["auth"])
app.include_router(attendance.router, prefix="/attendance", tags=["attendance"])
app.include_router(tasks.router, prefix="/tasks", tags=["tasks"])
app.include_router(tracking.router, prefix="/tracking", tags=["tracking"])
app.include_router(admin.router)


@app.get("/health")
def health_check() -> dict:
    return {"status": "ok"}
