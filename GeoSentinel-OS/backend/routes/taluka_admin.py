"""Taluka admin analytics and report routes."""

from __future__ import annotations

import csv
import io
from collections import defaultdict
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends
from fastapi.responses import Response
from sqlalchemy.orm import Session

from database.session import get_db
from models.attendance_model import Attendance
from models.enums import Role, TaskStatus
from models.location_log_model import LocationLog
from models.task_model import Task
from models.user_model import User
from services.auth_service import require_role

router = APIRouter(prefix="/taluka", tags=["taluka-admin"])


def _simple_pdf_bytes(lines: list[str]) -> bytes:
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


def _taluka_workers_query(db: Session, current_user: User):
    return db.query(User).filter(
        User.role.in_([Role.WORKER, Role.FIELD_WORKER]),
        User.state == current_user.state,
        User.district == current_user.district,
        User.taluka == current_user.taluka,
    )


def _safe_ratio(numerator: float, denominator: float) -> float:
    if denominator <= 0:
        return 0.0
    return round((numerator / denominator) * 100, 2)


@router.get("/stats")
def taluka_stats(
    current_user: User = Depends(require_role(Role.TALUKA_ADMIN)),
    db: Session = Depends(get_db),
):
    workers = _taluka_workers_query(db, current_user).all()
    worker_ids = [w.id for w in workers]

    if not worker_ids:
        return {
            "total_workers": 0,
            "tasks_completed": 0,
            "tasks_pending": 0,
            "attendance_rate": 0.0,
            "spoof_detection_count": 0,
            "top_performer": None,
            "low_performers": [],
            "attendance_trend": [],
            "task_completion_trend": [],
            "performance_ranking": [],
        }

    tasks = db.query(Task).filter(Task.assigned_to.in_(worker_ids)).all()
    attendance_records = db.query(Attendance).filter(Attendance.user_id.in_(worker_ids)).all()
    spoof_cases = db.query(LocationLog).filter(
        LocationLog.user_id.in_(worker_ids),
        LocationLog.spoof_detection_flag.is_(True),
    ).all()

    now = datetime.now(timezone.utc)
    start_day = (now - timedelta(days=6)).date()
    attendance_by_day: dict[str, int] = defaultdict(int)
    completed_by_day: dict[str, int] = defaultdict(int)

    for record in attendance_records:
        day_key = record.timestamp.date().isoformat()
        if record.timestamp.date() >= start_day:
            attendance_by_day[day_key] += 1

    for task in tasks:
        if task.completed_at and task.completed_at.date() >= start_day:
            completed_by_day[task.completed_at.date().isoformat()] += 1

    attendance_trend = []
    completion_trend = []
    for offset in range(7):
        day = start_day + timedelta(days=offset)
        key = day.isoformat()
        attendance_trend.append({"date": key, "count": attendance_by_day.get(key, 0)})
        completion_trend.append({"date": key, "count": completed_by_day.get(key, 0)})

    total_tasks = len(tasks)
    completed_tasks = sum(1 for t in tasks if t.status == TaskStatus.COMPLETED)
    pending_tasks = sum(1 for t in tasks if t.status != TaskStatus.COMPLETED)

    total_days_observed = 30
    active_days = {r.user_id: set() for r in attendance_records}
    for record in attendance_records:
        active_days.setdefault(record.user_id, set()).add(record.timestamp.date().isoformat())

    performance = []
    for worker in workers:
        assigned = [t for t in tasks if t.assigned_to == worker.id]
        assigned_count = len(assigned)
        completed_count = sum(1 for t in assigned if t.status == TaskStatus.COMPLETED)
        efficiency = round(completed_count / assigned_count, 2) if assigned_count else 0.0

        present_days = len(active_days.get(worker.id, set()))
        attendance_rate = _safe_ratio(present_days, total_days_observed)

        spoof_count = sum(1 for s in spoof_cases if s.user_id == worker.id)
        performance.append(
            {
                "user_id": worker.id,
                "name": worker.name,
                "attendance_rate": attendance_rate,
                "efficiency": efficiency,
                "completed_tasks": completed_count,
                "assigned_tasks": assigned_count,
                "spoof_count": spoof_count,
                "low_performer": attendance_rate < 50.0,
            }
        )

    performance.sort(key=lambda item: (item["efficiency"], item["attendance_rate"]), reverse=True)

    total_present_days = sum(len(days) for days in active_days.values())
    attendance_rate = _safe_ratio(total_present_days, len(workers) * total_days_observed)

    return {
        "total_workers": len(workers),
        "tasks_completed": completed_tasks,
        "tasks_pending": pending_tasks,
        "attendance_rate": attendance_rate,
        "spoof_detection_count": len(spoof_cases),
        "top_performer": performance[0] if performance else None,
        "low_performers": [p for p in performance if p["low_performer"]],
        "attendance_trend": attendance_trend,
        "task_completion_trend": completion_trend,
        "performance_ranking": performance,
    }


@router.get("/workers")
def taluka_workers(
    current_user: User = Depends(require_role(Role.TALUKA_ADMIN)),
    db: Session = Depends(get_db),
):
    workers = _taluka_workers_query(db, current_user).all()
    worker_ids = [w.id for w in workers]

    tasks = db.query(Task).filter(Task.assigned_to.in_(worker_ids)).all() if worker_ids else []
    attendance_records = db.query(Attendance).filter(Attendance.user_id.in_(worker_ids)).all() if worker_ids else []

    latest_locations_by_worker: dict[int, LocationLog] = {}
    if worker_ids:
        latest_locations = db.query(LocationLog).filter(LocationLog.user_id.in_(worker_ids)).order_by(LocationLog.timestamp.desc()).all()
        for loc in latest_locations:
            if loc.user_id not in latest_locations_by_worker:
                latest_locations_by_worker[loc.user_id] = loc

    attendance_days: dict[int, set[str]] = defaultdict(set)
    for rec in attendance_records:
        attendance_days[rec.user_id].add(rec.timestamp.date().isoformat())

    rows = []
    for worker in workers:
        assigned = [t for t in tasks if t.assigned_to == worker.id]
        completed = sum(1 for t in assigned if t.status == TaskStatus.COMPLETED)
        attendance_rate = _safe_ratio(len(attendance_days.get(worker.id, set())), 30)
        latest_loc = latest_locations_by_worker.get(worker.id)

        rows.append(
            {
                "id": worker.id,
                "name": worker.name,
                "email": worker.email,
                "status": "active" if worker.is_active else "inactive",
                "attendance_rate": attendance_rate,
                "tasks_completed": completed,
                "tasks_assigned": len(assigned),
                "latest_latitude": latest_loc.latitude if latest_loc else None,
                "latest_longitude": latest_loc.longitude if latest_loc else None,
                "suspicious": bool(latest_loc and latest_loc.spoof_detection_flag),
            }
        )

    return {"total": len(rows), "records": rows}


@router.get("/tasks")
def taluka_tasks(
    current_user: User = Depends(require_role(Role.TALUKA_ADMIN)),
    db: Session = Depends(get_db),
):
    workers = _taluka_workers_query(db, current_user).all()
    worker_map = {w.id: w for w in workers}
    worker_ids = list(worker_map.keys())

    tasks = db.query(Task).filter(Task.assigned_to.in_(worker_ids)).order_by(Task.created_at.desc()).all() if worker_ids else []

    rows = []
    for task in tasks:
        worker = worker_map.get(task.assigned_to)
        rows.append(
            {
                "id": task.id,
                "task_name": task.title,
                "assigned_worker": worker.name if worker else f"Worker #{task.assigned_to}",
                "status": task.status.value if task.status else "",
                "completion_time": task.completed_at.isoformat() if task.completed_at else None,
                "before_image": task.before_image or task.before_image_path,
                "after_image": task.after_image or task.after_image_path,
                "fund_allocated": float(task.fund_allocated) if task.fund_allocated is not None else 0,
            }
        )

    return {"total": len(rows), "records": rows}


@router.get("/spoof-cases")
def taluka_spoof_cases(
    current_user: User = Depends(require_role(Role.TALUKA_ADMIN)),
    db: Session = Depends(get_db),
):
    workers = _taluka_workers_query(db, current_user).all()
    worker_ids = [w.id for w in workers]

    cases = db.query(LocationLog).filter(
        LocationLog.user_id.in_(worker_ids),
        LocationLog.spoof_detection_flag.is_(True),
    ).order_by(LocationLog.timestamp.desc()).limit(500).all() if worker_ids else []

    return {
        "total": len(cases),
        "records": [
            {
                "id": c.id,
                "user_id": c.user_id,
                "latitude": c.latitude,
                "longitude": c.longitude,
                "timestamp": c.timestamp.isoformat() if c.timestamp else None,
                "spoof_reason": c.spoof_reason,
            }
            for c in cases
        ],
    }


@router.get("/report/attendance.csv")
def taluka_attendance_report_csv(
    current_user: User = Depends(require_role(Role.TALUKA_ADMIN)),
    db: Session = Depends(get_db),
):
    workers = _taluka_workers_query(db, current_user).all()
    worker_map = {w.id: w for w in workers}
    worker_ids = list(worker_map.keys())

    attendance = db.query(Attendance).filter(Attendance.user_id.in_(worker_ids)).order_by(Attendance.timestamp.desc()).all() if worker_ids else []

    rows = []
    for a in attendance:
        worker = worker_map.get(a.user_id)
        rows.append(
            {
                "worker_name": worker.name if worker else f"Worker #{a.user_id}",
                "date": a.timestamp.date().isoformat() if a.timestamp else "",
                "status": "present" if a.geofence_validated else "absent",
                "location": f"{a.latitude:.6f},{a.longitude:.6f}",
            }
        )

    return _csv_response(
        "taluka_attendance_report.csv",
        rows,
        ["worker_name", "date", "status", "location"],
    )


@router.get("/report/tasks.csv")
def taluka_tasks_report_csv(
    current_user: User = Depends(require_role(Role.TALUKA_ADMIN)),
    db: Session = Depends(get_db),
):
    workers = _taluka_workers_query(db, current_user).all()
    worker_map = {w.id: w for w in workers}
    worker_ids = list(worker_map.keys())

    tasks = db.query(Task).filter(Task.assigned_to.in_(worker_ids)).order_by(Task.created_at.desc()).all() if worker_ids else []

    rows = []
    for t in tasks:
        worker = worker_map.get(t.assigned_to)
        rows.append(
            {
                "task_name": t.title,
                "assigned_worker": worker.name if worker else f"Worker #{t.assigned_to}",
                "before_image": t.before_image or t.before_image_path or "",
                "after_image": t.after_image or t.after_image_path or "",
                "status": t.status.value if t.status else "",
                "fund_allocated": float(t.fund_allocated) if t.fund_allocated is not None else 0,
            }
        )

    return _csv_response(
        "taluka_task_report.csv",
        rows,
        ["task_name", "assigned_worker", "before_image", "after_image", "status", "fund_allocated"],
    )


@router.get("/report/performance.pdf")
def taluka_performance_report_pdf(
    current_user: User = Depends(require_role(Role.TALUKA_ADMIN)),
    db: Session = Depends(get_db),
):
    stats = taluka_stats(current_user=current_user, db=db)
    top = stats.get("top_performer")

    lines = [
        "GeoSentinel OS - Taluka Performance Report",
        f"Generated at: {datetime.now(timezone.utc).isoformat()}",
        f"Taluka: {current_user.taluka}",
        "",
        f"Total workers: {stats.get('total_workers', 0)}",
        f"Tasks completed: {stats.get('tasks_completed', 0)}",
        f"Tasks pending: {stats.get('tasks_pending', 0)}",
        f"Attendance rate: {stats.get('attendance_rate', 0)}%",
        f"Spoof detections: {stats.get('spoof_detection_count', 0)}",
        f"Low performers: {len(stats.get('low_performers', []))}",
    ]

    if top:
        lines.extend([
            "",
            "Top Performer",
            f"Name: {top.get('name')}",
            f"Efficiency: {top.get('efficiency')}",
            f"Attendance: {top.get('attendance_rate')}%",
        ])

    pdf = _simple_pdf_bytes(lines)
    return Response(
        content=pdf,
        media_type="application/pdf",
        headers={"Content-Disposition": 'attachment; filename="taluka_performance_report.pdf"'},
    )
