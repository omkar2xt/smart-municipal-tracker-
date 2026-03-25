"""District-level sub-admin analytics, decision, and reporting routes."""

from __future__ import annotations

import csv
import io
from collections import defaultdict
from datetime import datetime, timedelta, timezone
from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import Response
from sqlalchemy.orm import Session

from database.session import get_db
from models.attendance_model import Attendance
from models.enums import Role, TaskStatus
from models.fund_usage_model import FundUsage
from models.location_log_model import LocationLog
from models.task_model import Task
from models.user_model import User
from schemas.schemas import (
    SubAdminBudgetAdjustRequest,
    SubAdminPlanDecisionRequest,
    SubAdminReassignTaskRequest,
    SubAdminTalukaFlagRequest,
)
from services.audit_service import write_audit_log
from services.auth_service import require_role

router = APIRouter(prefix="/subadmin", tags=["sub-admin"])


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


def _safe_ratio(numerator: float, denominator: float) -> float:
    if denominator <= 0:
        return 0.0
    return round((numerator / denominator) * 100, 2)


def _district_workers_query(db: Session, current_user: User):
    return db.query(User).filter(
        User.role.in_([Role.WORKER, Role.FIELD_WORKER]),
        User.state == current_user.state,
        User.district == current_user.district,
    )


def _district_tasks_query(db: Session, worker_ids: list[int]):
    return db.query(Task).filter(Task.assigned_to.in_(worker_ids)) if worker_ids else db.query(Task).filter(Task.id == -1)


def _district_scope_guard(current_user: User) -> None:
    if not current_user.state or not current_user.district:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Sub-admin account is missing state/district scope",
        )


def _taluka_summary(
    workers: list[User],
    tasks: list[Task],
    attendance: list[Attendance],
    spoof_cases: list[LocationLog],
) -> list[dict]:
    by_taluka: dict[str, dict] = defaultdict(lambda: {
        "workers": 0,
        "active_workers": 0,
        "inactive_workers": 0,
        "tasks_total": 0,
        "tasks_completed": 0,
        "attendance_days": defaultdict(set),
        "spoof_count": 0,
        "fund_allocated": 0.0,
        "fund_spent": 0.0,
        "latest_latitude": None,
        "latest_longitude": None,
    })

    worker_map = {w.id: w for w in workers}
    for worker in workers:
        taluka = worker.taluka or "Unknown"
        bucket = by_taluka[taluka]
        bucket["workers"] += 1
        if worker.is_active:
            bucket["active_workers"] += 1
        else:
            bucket["inactive_workers"] += 1

    for task in tasks:
        worker = worker_map.get(task.assigned_to)
        taluka = (worker.taluka if worker else None) or "Unknown"
        bucket = by_taluka[taluka]
        bucket["tasks_total"] += 1
        if task.status == TaskStatus.COMPLETED:
            bucket["tasks_completed"] += 1
        bucket["fund_allocated"] += float(task.fund_allocated or 0)

    for item in attendance:
        worker = worker_map.get(item.user_id)
        taluka = (worker.taluka if worker else None) or "Unknown"
        by_taluka[taluka]["attendance_days"][item.user_id].add(item.timestamp.date().isoformat())

    for spoof in spoof_cases:
        worker = worker_map.get(spoof.user_id)
        taluka = (worker.taluka if worker else None) or "Unknown"
        by_taluka[taluka]["spoof_count"] += 1

    rows = []
    for taluka, bucket in by_taluka.items():
        total_possible_days = max(bucket["workers"] * 30, 1)
        present_days = sum(len(days) for days in bucket["attendance_days"].values())
        attendance_rate = _safe_ratio(present_days, total_possible_days)
        completion_rate = _safe_ratio(bucket["tasks_completed"], max(bucket["tasks_total"], 1))
        status_value = "Good"
        if attendance_rate < 60 or completion_rate < 50 or bucket["spoof_count"] >= 5:
            status_value = "Needs Attention"

        rows.append(
            {
                "taluka": taluka,
                "workers_count": bucket["workers"],
                "active_workers": bucket["active_workers"],
                "inactive_workers": bucket["inactive_workers"],
                "task_completion_rate": completion_rate,
                "attendance_rate": attendance_rate,
                "spoof_detection_count": bucket["spoof_count"],
                "status": status_value,
                "fund_allocated": round(bucket["fund_allocated"], 2),
                "fund_spent": round(bucket["fund_spent"], 2),
            }
        )

    rows.sort(key=lambda row: row["taluka"])
    return rows


@router.get("/stats")
def subadmin_stats(
    current_user: User = Depends(require_role(Role.SUB_ADMIN, Role.DISTRICT_ADMIN)),
    db: Session = Depends(get_db),
):
    _district_scope_guard(current_user)

    workers = _district_workers_query(db, current_user).all()
    worker_ids = [w.id for w in workers]
    tasks = _district_tasks_query(db, worker_ids).all()
    attendance = db.query(Attendance).filter(Attendance.user_id.in_(worker_ids)).all() if worker_ids else []
    spoof_cases = db.query(LocationLog).filter(
        LocationLog.user_id.in_(worker_ids),
        LocationLog.spoof_detection_flag.is_(True),
    ).all() if worker_ids else []

    taluka_rows = _taluka_summary(workers, tasks, attendance, spoof_cases)
    taluka_count = len({w.taluka for w in workers if w.taluka})

    total_tasks = len(tasks)
    completed_tasks = sum(1 for task in tasks if task.status == TaskStatus.COMPLETED)
    pending_tasks = total_tasks - completed_tasks

    total_present_days = len({(a.user_id, a.timestamp.date().isoformat()) for a in attendance})
    attendance_rate = _safe_ratio(total_present_days, max(len(workers) * 30, 1))

    now = datetime.now(timezone.utc)
    start_day = (now - timedelta(days=6)).date()
    attendance_by_day: dict[str, int] = defaultdict(int)

    for item in attendance:
        day = item.timestamp.date()
        if day >= start_day:
            attendance_by_day[day.isoformat()] += 1

    attendance_trend = []
    for offset in range(7):
        day = (start_day + timedelta(days=offset)).isoformat()
        attendance_trend.append({"date": day, "count": attendance_by_day.get(day, 0)})

    top_taluka = None
    worst_taluka = None
    if taluka_rows:
        ranked = sorted(taluka_rows, key=lambda row: (row["task_completion_rate"], row["attendance_rate"]), reverse=True)
        top_taluka = ranked[0]
        worst_taluka = ranked[-1]

    worker_efficiency = []
    for worker in workers:
        worker_tasks = [t for t in tasks if t.assigned_to == worker.id]
        completed = sum(1 for t in worker_tasks if t.status == TaskStatus.COMPLETED)
        efficiency = round(completed / len(worker_tasks), 2) if worker_tasks else 0.0
        worker_efficiency.append(
            {
                "user_id": worker.id,
                "name": worker.name,
                "taluka": worker.taluka,
                "efficiency": efficiency,
                "assigned_tasks": len(worker_tasks),
                "completed_tasks": completed,
            }
        )
    worker_efficiency.sort(key=lambda row: row["efficiency"], reverse=True)

    delayed_tasks = [
        t for t in tasks
        if t.due_date and t.status != TaskStatus.COMPLETED and t.due_date < now
    ]

    alerts = []
    if attendance_rate < 60:
        alerts.append({"type": "low_attendance", "message": "District attendance is below 60%"})
    if len(spoof_cases) >= 10:
        alerts.append({"type": "high_spoof_detection", "message": "High spoof detection count in district"})
    if delayed_tasks:
        alerts.append({"type": "delayed_tasks", "message": f"{len(delayed_tasks)} delayed tasks detected"})

    return {
        "total_talukas": taluka_count,
        "total_workers": len(workers),
        "total_tasks": total_tasks,
        "completed_tasks": completed_tasks,
        "pending_tasks": pending_tasks,
        "district_attendance_rate": attendance_rate,
        "spoof_detection_count": len(spoof_cases),
        "taluka_performance": taluka_rows,
        "worker_efficiency_ranking": worker_efficiency,
        "attendance_trend": attendance_trend,
        "task_status_pie": {
            "completed": completed_tasks,
            "pending": pending_tasks,
        },
        "top_taluka": top_taluka,
        "worst_taluka": worst_taluka,
        "alerts": alerts,
    }


@router.get("/talukas")
def subadmin_talukas(
    current_user: User = Depends(require_role(Role.SUB_ADMIN, Role.DISTRICT_ADMIN)),
    db: Session = Depends(get_db),
):
    _district_scope_guard(current_user)

    workers = _district_workers_query(db, current_user).all()
    worker_ids = [w.id for w in workers]
    tasks = _district_tasks_query(db, worker_ids).all()
    attendance = db.query(Attendance).filter(Attendance.user_id.in_(worker_ids)).all() if worker_ids else []
    spoof_cases = db.query(LocationLog).filter(
        LocationLog.user_id.in_(worker_ids),
        LocationLog.spoof_detection_flag.is_(True),
    ).all() if worker_ids else []

    rows = _taluka_summary(workers, tasks, attendance, spoof_cases)

    worker_map = {worker.id: worker for worker in workers}
    latest_locations_by_worker: dict[int, LocationLog] = {}
    if worker_ids:
        latest_locations = (
            db.query(LocationLog)
            .filter(LocationLog.user_id.in_(worker_ids))
            .order_by(LocationLog.timestamp.desc())
            .all()
        )
        for location in latest_locations:
            if location.user_id not in latest_locations_by_worker:
                latest_locations_by_worker[location.user_id] = location

    taluka_coordinates: dict[str, list[tuple[float, float]]] = defaultdict(list)
    for worker_id, location in latest_locations_by_worker.items():
        worker = worker_map.get(worker_id)
        taluka = (worker.taluka if worker else None) or "Unknown"
        latitude = float(location.latitude)
        longitude = float(location.longitude)
        if -90 <= latitude <= 90 and -180 <= longitude <= 180:
            taluka_coordinates[taluka].append((latitude, longitude))

    for row in rows:
        points = taluka_coordinates.get(row["taluka"], [])
        if points:
            avg_lat = sum(point[0] for point in points) / len(points)
            avg_lng = sum(point[1] for point in points) / len(points)
            row["latest_latitude"] = round(avg_lat, 6)
            row["latest_longitude"] = round(avg_lng, 6)
        else:
            row["latest_latitude"] = None
            row["latest_longitude"] = None

    return {"total": len(rows), "records": rows}


@router.get("/workers")
def subadmin_workers(
    current_user: User = Depends(require_role(Role.SUB_ADMIN, Role.DISTRICT_ADMIN)),
    db: Session = Depends(get_db),
):
    _district_scope_guard(current_user)

    workers = _district_workers_query(db, current_user).all()
    worker_ids = [w.id for w in workers]

    tasks = _district_tasks_query(db, worker_ids).all()
    attendance = db.query(Attendance).filter(Attendance.user_id.in_(worker_ids)).all() if worker_ids else []

    attendance_days: dict[int, set[str]] = defaultdict(set)
    for item in attendance:
        attendance_days[item.user_id].add(item.timestamp.date().isoformat())

    rows = []
    for worker in workers:
        assigned = [task for task in tasks if task.assigned_to == worker.id]
        completed = sum(1 for task in assigned if task.status == TaskStatus.COMPLETED)
        attendance_rate = _safe_ratio(len(attendance_days.get(worker.id, set())), 30)

        rows.append(
            {
                "id": worker.id,
                "name": worker.name,
                "email": worker.email,
                "taluka": worker.taluka,
                "status": "active" if worker.is_active else "inactive",
                "assigned_tasks": len(assigned),
                "completed_tasks": completed,
                "efficiency": round(completed / len(assigned), 2) if assigned else 0.0,
                "attendance_rate": attendance_rate,
            }
        )

    return {"total": len(rows), "records": rows}


@router.get("/tasks")
def subadmin_tasks(
    current_user: User = Depends(require_role(Role.SUB_ADMIN, Role.DISTRICT_ADMIN)),
    db: Session = Depends(get_db),
):
    _district_scope_guard(current_user)

    workers = _district_workers_query(db, current_user).all()
    worker_map = {w.id: w for w in workers}
    worker_ids = list(worker_map.keys())

    tasks = _district_tasks_query(db, worker_ids).order_by(Task.created_at.desc()).all()

    rows = []
    for task in tasks:
        worker = worker_map.get(task.assigned_to)
        rows.append(
            {
                "id": task.id,
                "task_name": task.title,
                "assigned_to": task.assigned_to,
                "assigned_worker": worker.name if worker else f"Worker #{task.assigned_to}",
                "taluka": worker.taluka if worker else None,
                "status": task.status.value if task.status else "",
                "completion_time": task.completed_at.isoformat() if task.completed_at else None,
                "due_date": task.due_date.isoformat() if task.due_date else None,
                "fund_allocated": float(task.fund_allocated or 0),
                "before_image": task.before_image or task.before_image_path,
                "after_image": task.after_image or task.after_image_path,
            }
        )

    return {"total": len(rows), "records": rows}


@router.get("/spoof-cases")
def subadmin_spoof_cases(
    current_user: User = Depends(require_role(Role.SUB_ADMIN, Role.DISTRICT_ADMIN)),
    db: Session = Depends(get_db),
):
    _district_scope_guard(current_user)

    workers = _district_workers_query(db, current_user).all()
    worker_map = {worker.id: worker for worker in workers}
    worker_ids = list(worker_map.keys())

    cases = db.query(LocationLog).filter(
        LocationLog.user_id.in_(worker_ids),
        LocationLog.spoof_detection_flag.is_(True),
    ).order_by(LocationLog.timestamp.desc()).limit(1000).all() if worker_ids else []

    return {
        "total": len(cases),
        "records": [
            {
                "id": case.id,
                "user_id": case.user_id,
                "worker_name": worker.name if worker else f"Worker #{case.user_id}",
                "taluka": worker.taluka if worker else None,
                "latitude": case.latitude,
                "longitude": case.longitude,
                "timestamp": case.timestamp.isoformat() if case.timestamp else None,
                "spoof_reason": case.spoof_reason,
            }
            for case in cases
            for worker in [worker_map.get(case.user_id)]
        ],
    }


@router.get("/report/district-summary.csv")
def subadmin_report_district_summary_csv(
    current_user: User = Depends(require_role(Role.SUB_ADMIN, Role.DISTRICT_ADMIN)),
    db: Session = Depends(get_db),
):
    stats = subadmin_stats(current_user=current_user, db=db)
    row = {
        "district": current_user.district,
        "total_workers": stats["total_workers"],
        "total_tasks": stats["total_tasks"],
        "completed_tasks": stats["completed_tasks"],
        "pending_tasks": stats["pending_tasks"],
        "completion_rate": _safe_ratio(stats["completed_tasks"], max(stats["total_tasks"], 1)),
        "attendance_rate": stats["district_attendance_rate"],
        "spoof_detection_count": stats["spoof_detection_count"],
    }
    return _csv_response(
        "district_summary.csv",
        [row],
        [
            "district",
            "total_workers",
            "total_tasks",
            "completed_tasks",
            "pending_tasks",
            "completion_rate",
            "attendance_rate",
            "spoof_detection_count",
        ],
    )


@router.get("/report/taluka-performance.csv")
def subadmin_report_taluka_performance_csv(
    current_user: User = Depends(require_role(Role.SUB_ADMIN, Role.DISTRICT_ADMIN)),
    db: Session = Depends(get_db),
):
    talukas = subadmin_talukas(current_user=current_user, db=db)
    return _csv_response(
        "taluka_performance.csv",
        talukas["records"],
        [
            "taluka",
            "workers_count",
            "active_workers",
            "inactive_workers",
            "task_completion_rate",
            "attendance_rate",
            "spoof_detection_count",
            "status",
            "fund_allocated",
            "fund_spent",
        ],
    )


@router.get("/report/efficiency.pdf")
def subadmin_report_efficiency_pdf(
    current_user: User = Depends(require_role(Role.SUB_ADMIN, Role.DISTRICT_ADMIN)),
    db: Session = Depends(get_db),
):
    stats = subadmin_stats(current_user=current_user, db=db)
    ranking = stats.get("worker_efficiency_ranking", [])

    lines = [
        "GeoSentinel OS - District Efficiency Report",
        f"Generated at: {datetime.now(timezone.utc).isoformat()}",
        f"District: {current_user.district}",
        "",
        f"Total workers: {stats.get('total_workers', 0)}",
        f"Total tasks: {stats.get('total_tasks', 0)}",
        f"Completed tasks: {stats.get('completed_tasks', 0)}",
        "",
        "Top performers:",
    ]

    for row in ranking[:5]:
        lines.append(f"{row.get('name')} | efficiency={row.get('efficiency')} | taluka={row.get('taluka')}")

    low_performers = [row for row in ranking if row.get("efficiency", 0) < 0.5]
    lines.append("")
    lines.append("Low performers:")
    if low_performers:
        for row in low_performers[:5]:
            lines.append(f"{row.get('name')} | efficiency={row.get('efficiency')} | taluka={row.get('taluka')}")
    else:
        lines.append("None")

    pdf = _simple_pdf_bytes(lines)
    return Response(
        content=pdf,
        media_type="application/pdf",
        headers={"Content-Disposition": 'attachment; filename="district_efficiency_report.pdf"'},
    )


@router.post("/tasks/{task_id}/plan-decision")
def subadmin_plan_decision(
    task_id: int,
    payload: SubAdminPlanDecisionRequest,
    current_user: User = Depends(require_role(Role.SUB_ADMIN, Role.DISTRICT_ADMIN)),
    db: Session = Depends(get_db),
):
    _district_scope_guard(current_user)

    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")

    worker = db.query(User).filter(User.id == task.assigned_to).first()
    if not worker or worker.district != current_user.district:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Task is outside your district scope")

    if payload.decision == "approve":
        message = "Task plan approved"
    elif payload.decision == "reject":
        task.status = TaskStatus.CANCELLED
        message = "Task plan rejected and cancelled"
    else:
        if payload.updated_title:
            task.title = payload.updated_title
        if payload.updated_description is not None:
            task.description = payload.updated_description
        if payload.updated_due_date is not None:
            task.due_date = payload.updated_due_date
        message = "Task plan modified"

    db.add(task)
    write_audit_log(
        db,
        action="subadmin.plan_decision",
        status="success",
        user_id=current_user.id,
        resource_type="task",
        resource_id=task.id,
        details=f"decision={payload.decision};reason={payload.reason or ''}",
    )
    db.commit()
    return {"success": True, "message": message}


@router.post("/tasks/{task_id}/budget")
def subadmin_adjust_budget(
    task_id: int,
    payload: SubAdminBudgetAdjustRequest,
    current_user: User = Depends(require_role(Role.SUB_ADMIN, Role.DISTRICT_ADMIN)),
    db: Session = Depends(get_db),
):
    _district_scope_guard(current_user)

    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")

    worker = db.query(User).filter(User.id == task.assigned_to).first()
    if not worker or worker.district != current_user.district:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Task is outside your district scope")

    task.fund_allocated = Decimal(str(payload.new_fund_allocated))
    db.add(task)

    usage = FundUsage(
        task_id=task.id,
        user_id=current_user.id,
        amount=payload.adjustment_amount,
        description=f"budget_adjustment:{payload.reason}",
    )
    db.add(usage)

    write_audit_log(
        db,
        action="subadmin.budget_adjust",
        status="success",
        user_id=current_user.id,
        resource_type="task",
        resource_id=task.id,
        details=f"new_fund={payload.new_fund_allocated};adjustment={payload.adjustment_amount}",
    )
    db.commit()
    return {"success": True, "message": "Budget updated"}


@router.post("/tasks/{task_id}/reassign")
def subadmin_reassign_task(
    task_id: int,
    payload: SubAdminReassignTaskRequest,
    current_user: User = Depends(require_role(Role.SUB_ADMIN, Role.DISTRICT_ADMIN)),
    db: Session = Depends(get_db),
):
    _district_scope_guard(current_user)

    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")

    current_assignee = db.query(User).filter(User.id == task.assigned_to).first()
    if not current_assignee or current_assignee.district != current_user.district:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Task is outside your district scope")

    new_worker = db.query(User).filter(User.id == payload.new_worker_id).first()
    if not new_worker:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="New worker not found")

    if new_worker.role not in {Role.WORKER, Role.FIELD_WORKER}:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Can only reassign to worker role")

    if new_worker.district != current_user.district:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="New worker is outside your district")

    if new_worker.id == task.assigned_to:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Task is already assigned to this worker")

    old_worker_id = task.assigned_to
    task.assigned_to = new_worker.id
    db.add(task)

    write_audit_log(
        db,
        action="subadmin.reassign_task",
        status="success",
        user_id=current_user.id,
        resource_type="task",
        resource_id=task.id,
        details=f"from_worker={old_worker_id};to_worker={new_worker.id};reason={payload.reason}",
    )
    db.commit()
    return {"success": True, "message": "Task reassigned"}


@router.post("/talukas/{taluka_name}/flag")
def subadmin_flag_taluka(
    taluka_name: str,
    payload: SubAdminTalukaFlagRequest,
    current_user: User = Depends(require_role(Role.SUB_ADMIN, Role.DISTRICT_ADMIN)),
    db: Session = Depends(get_db),
):
    _district_scope_guard(current_user)

    taluka_worker_count = _district_workers_query(db, current_user).filter(User.taluka == taluka_name).count()
    if taluka_worker_count == 0:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Taluka not found in your district")

    write_audit_log(
        db,
        action="subadmin.flag_taluka",
        status="success",
        user_id=current_user.id,
        resource_type="taluka",
        details=f"taluka={taluka_name};severity={payload.severity};reason={payload.reason}",
    )
    db.commit()
    return {"success": True, "message": f"Taluka '{taluka_name}' flagged for review"}
