"""GeoSentinel OS Backend - Main FastAPI application."""

import logging
import time

from fastapi import FastAPI
from fastapi import Request
from fastapi.middleware.cors import CORSMiddleware

from config.settings import get_settings
from database.base import Base
from database.session import engine
from database.init_db import seed_default_users
import models  # Ensure all SQLAlchemy models are imported for metadata creation.
from routes import admin_new, attendance, auth, reports_new, sync, task_compat, tasks, tracking_new, upload, users_new
from services.spoof_detection import assert_spoof_detection_enabled_for_production

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)
settings = get_settings()

app = FastAPI(
    title="GeoSentinel OS API",
    description="Municipal workforce tracking with GPS validation and spoof detection",
    version=settings.app_version,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_origin_regex=r"^https?://(localhost|127\.0\.0\.1)(:\d+)?$",
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=[
        "Authorization",
        "Content-Type",
        "Accept",
        "X-Request-ID",
        "X-Correlation-ID",
        "Cache-Control",
        "If-None-Match",
        "If-Modified-Since",
    ],
)

app.include_router(auth.router)
app.include_router(attendance.router)
app.include_router(tasks.router)
app.include_router(task_compat.router)
app.include_router(tracking_new.router)
app.include_router(upload.router)
app.include_router(sync.router)
app.include_router(users_new.router)
app.include_router(admin_new.router)
app.include_router(reports_new.router)


@app.middleware("http")
async def log_requests(request: Request, call_next):
    started = time.perf_counter()
    response = await call_next(request)
    elapsed_ms = (time.perf_counter() - started) * 1000
    logger.info(
        "API access method=%s path=%s status=%s duration_ms=%.2f",
        request.method,
        request.url.path,
        response.status_code,
        elapsed_ms,
    )
    return response


@app.on_event("startup")
def startup() -> None:
    """Initialize database and execute startup checks."""
    try:
        assert_spoof_detection_enabled_for_production()
        Base.metadata.create_all(bind=engine)
        seed_default_users()
        logger.info("GeoSentinel OS backend initialized")
    except Exception as exc:
        logger.error(
            f"Failed to initialize application: {exc.__class__.__name__}: {exc}",
            exc_info=True,
        )
        raise SystemExit(1) from exc


@app.get("/health", summary="Health check")
def health_check() -> dict[str, str]:
    return {
        "status": "ok",
        "service": "GeoSentinel OS API",
        "version": settings.app_version,
    }


@app.get("/", summary="API metadata")
def root() -> dict[str, str]:
    return {
        "message": "GeoSentinel OS API",
        "version": settings.app_version,
        "docs": "/docs",
        "redoc": "/redoc",
    }
