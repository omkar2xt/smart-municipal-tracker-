"""Report generation and download routes (CSV/PDF)."""

from __future__ import annotations

import csv
import io
from datetime import datetime, timezone

from fastapi import APIRouter, Depends
from fastapi.responses import Response
from sqlalchemy.orm import Session

from database.session import get_db
from models.attendance_model import Attendance
from models.enums import Role, TaskStatus
from models.task_model import Task
from models.user_model import User
from services.auth_service import require_role

router = APIRouter(prefix="/reports", tags=["reports"])


def _simple_pdf_bytes(lines: list[str]) -> bytes:
    """Generate a tiny valid single-page PDF from plain text lines."""
    safe_lines = [line.replace("(", "[").replace(")", "]") for line in lines]
    if safe_lines:
        text_stream = f"({safe_lines[0]}) Tj"
        if len(safe_lines) > 1:
            tail = "\n".join(f"0 -16 Td ({line}) Tj" for line in safe_lines[1:])
            text_stream = f"{text_stream}\n{tail}"
    else:
        text_stream = ""
    content = f"BT /F1 11 Tf 40 780 Td {text_stream} ET".encode("latin-1", errors="ignore")

    objects = []
    objects.append(b"1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj\n")
    objects.append(b"2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj\n")
    objects.append(
        b"3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >> endobj\n"
    )
    objects.append(b"4 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj\n")
    objects.append(f"5 0 obj << /Length {len(content)} >> stream\n".encode("latin-1") + content + b"\nendstream endobj\n")

    header = b"%PDF-1.4\n"
    body = b""
    offsets = [0]
    cursor = len(header)

    for obj in objects:
        offsets.append(cursor)
        body += obj
        cursor += len(obj)

    xref_start = len(header) + len(body)
    xref = f"xref\n0 {len(offsets)}\n0000000000 65535 f \n".encode("latin-1")
    for off in offsets[1:]:
        xref += f"{off:010d} 00000 n \n".encode("latin-1")

    trailer = f"trailer\n<< /Size {len(offsets)} /Root 1 0 R >>\nstartxref\n{xref_start}\n%%EOF".encode("latin-1")
    return header + body + xref + trailer


def _csv_response(filename: str, rows: list[dict], headers: list[str]) -> Response:
    output = io.StringIO()
    writer = csv.DictWriter(output, fieldnames=headers)
    writer.writeheader()
    for row in rows:
        writer.writerow(row)

    return Response(
        content=output.getvalue(),
        media_type="text/csv",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


@router.get("/attendance.csv", summary="Download attendance report as CSV")
def attendance_report_csv(
    current_user: User = Depends(require_role(Role.ADMIN, Role.SUB_ADMIN, Role.TALUKA_ADMIN, Role.STATE_ADMIN, Role.DISTRICT_ADMIN)),
    db: Session = Depends(get_db),
) -> Response:
    query = db.query(Attendance)

    if current_user.role in (Role.ADMIN, Role.SUB_ADMIN):
        pass
    else:
        scoped_users = db.query(User.id)
        if current_user.role == Role.STATE_ADMIN:
            scoped_users = scoped_users.filter(User.state == current_user.state)
        elif current_user.role == Role.DISTRICT_ADMIN:
            scoped_users = scoped_users.filter(
                User.state == current_user.state,
                User.district == current_user.district,
            )
        elif current_user.role == Role.TALUKA_ADMIN:
            scoped_users = scoped_users.filter(
                User.state == current_user.state,
                User.district == current_user.district,
                User.taluka == current_user.taluka,
            )
        query = query.filter(Attendance.user_id.in_(scoped_users))

    records = query.order_by(Attendance.timestamp.desc()).limit(5000).all()
    rows = [
        {
            "id": r.id,
            "user_id": r.user_id,
            "latitude": r.latitude,
            "longitude": r.longitude,
            "timestamp": r.timestamp.isoformat() if r.timestamp else "",
            "status": getattr(r, "status", None) or ("present" if r.geofence_validated else "absent"),
        }
        for r in records
    ]
    return _csv_response("attendance_report.csv", rows, ["id", "user_id", "latitude", "longitude", "timestamp", "status"])


@router.get("/tasks.csv", summary="Download task report as CSV")
def task_report_csv(
    current_user: User = Depends(require_role(Role.ADMIN, Role.SUB_ADMIN, Role.TALUKA_ADMIN, Role.STATE_ADMIN, Role.DISTRICT_ADMIN)),
    db: Session = Depends(get_db),
) -> Response:
    query = db.query(Task)

    if current_user.role in (Role.ADMIN, Role.SUB_ADMIN):
        pass
    else:
        scoped_users = db.query(User.id)
        if current_user.role == Role.STATE_ADMIN:
            scoped_users = scoped_users.filter(User.state == current_user.state)
        elif current_user.role == Role.DISTRICT_ADMIN:
            scoped_users = scoped_users.filter(
                User.state == current_user.state,
                User.district == current_user.district,
            )
        elif current_user.role == Role.TALUKA_ADMIN:
            scoped_users = scoped_users.filter(
                User.state == current_user.state,
                User.district == current_user.district,
                User.taluka == current_user.taluka,
            )
        query = query.filter(Task.assigned_to.in_(scoped_users))

    records = query.order_by(Task.created_at.desc()).limit(5000).all()
    rows = [
        {
            "id": t.id,
            "title": t.title,
            "assigned_to": t.assigned_to,
            "assigned_by": t.assigned_by,
            "status": t.status.value if t.status else "",
            "created_at": t.created_at.isoformat() if t.created_at else "",
            "completed_at": t.completed_at.isoformat() if t.completed_at else "",
        }
        for t in records
    ]
    return _csv_response(
        "task_report.csv",
        rows,
        ["id", "title", "assigned_to", "assigned_by", "status", "created_at", "completed_at"],
    )


@router.get("/performance.pdf", summary="Download performance report as PDF")
def performance_report_pdf(
    current_user: User = Depends(require_role(Role.ADMIN, Role.SUB_ADMIN, Role.TALUKA_ADMIN, Role.STATE_ADMIN, Role.DISTRICT_ADMIN)),
    db: Session = Depends(get_db),
) -> Response:
    total_users = db.query(User).count()
    total_tasks = db.query(Task).count()
    completed_tasks = db.query(Task).filter(Task.status == TaskStatus.COMPLETED).count()
    completion_rate = 0 if total_tasks == 0 else round((completed_tasks / total_tasks) * 100, 2)

    lines = [
        "GeoSentinel OS - Performance Report",
        f"Generated at: {datetime.now(timezone.utc).isoformat()}",
        "",
        f"Total users: {total_users}",
        f"Total tasks: {total_tasks}",
        f"Completed tasks: {completed_tasks}",
        f"Completion rate: {completion_rate}%",
    ]

    pdf = _simple_pdf_bytes(lines)
    return Response(
        content=pdf,
        media_type="application/pdf",
        headers={"Content-Disposition": 'attachment; filename="performance_report.pdf"'},
    )
