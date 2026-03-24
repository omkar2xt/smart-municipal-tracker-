from fastapi import FastAPI

from routes import attendance, auth, tasks, tracking

app = FastAPI(title="GeoSentinel OS API", version="0.1.0")

app.include_router(auth.router, prefix="/auth", tags=["auth"])
app.include_router(attendance.router, prefix="/attendance", tags=["attendance"])
app.include_router(tasks.router, prefix="/tasks", tags=["tasks"])
app.include_router(tracking.router, prefix="/tracking", tags=["tracking"])


@app.get("/health")
def health_check() -> dict:
    return {"status": "ok"}
