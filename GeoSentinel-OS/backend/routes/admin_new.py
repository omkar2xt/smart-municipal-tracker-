"""State-level admin routes for governance, analytics, and reporting."""

from __future__ import annotations

import csv
import io
from collections import defaultdict
from datetime import datetime, timedelta, timezone
from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException, Query, status
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
    AdminCreateUserRequest,
    AdminFlagDistrictRequest,
    AdminFundAllocateRequest,
    AdminTransferWorkerRequest,
    AdminUpdateUserRequest,
)
from services.auth_service import require_role
from services.audit_service import write_audit_log
from utils.security import hash_password

router = APIRouter(prefix="/admin", tags=["admin"])


def _safe_ratio(numerator: float, denominator: float) -> float:
    if denominator <= 0:
        return 0.0
    return round((numerator / denominator) * 100, 2)


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


def _build_region_summary(
    workers: list[User],
    tasks: list[Task],
    attendance: list[Attendance],
    spoof_cases: list[LocationLog],
    level: str,
) -> list[dict]:
    region_key = "district" if level == "district" else "taluka"

    grouped: dict[str, dict] = defaultdict(lambda: {
        "workers_count": 0,
        "tasks_total": 0,
        "tasks_completed": 0,
        "attendance_days": defaultdict(set),
        "spoof_detection_count": 0,
    })

    worker_map = {worker.id: worker for worker in workers}
    for worker in workers:
        key = getattr(worker, region_key) or "Unknown"
        grouped[key]["workers_count"] += 1

    for task in tasks:
        worker = worker_map.get(task.assigned_to)
        if not worker:
            continue
        key = getattr(worker, region_key) or "Unknown"
        grouped[key]["tasks_total"] += 1
        if task.status == TaskStatus.COMPLETED:
            grouped[key]["tasks_completed"] += 1

    for record in attendance:
        worker = worker_map.get(record.user_id)
        if not worker:
            continue
        key = getattr(worker, region_key) or "Unknown"
        grouped[key]["attendance_days"][record.user_id].add(record.timestamp.date().isoformat())

    for case in spoof_cases:
        worker = worker_map.get(case.user_id)
        if not worker:
            continue
        key = getattr(worker, region_key) or "Unknown"
        grouped[key]["spoof_detection_count"] += 1

    rows = []
    for key, value in grouped.items():
        attendance_total = sum(len(days) for days in value["attendance_days"].values())
        attendance_rate = _safe_ratio(attendance_total, max(value["workers_count"] * 30, 1))
        completion_rate = _safe_ratio(value["tasks_completed"], max(value["tasks_total"], 1))
        region_status = "Good"
        if attendance_rate < 60 or completion_rate < 50 or value["spoof_detection_count"] >= 10:
            region_status = "Needs Improvement"

        row = {
            f"{region_key}_name": key,
            "workers_count": value["workers_count"],
            "task_completion_rate": completion_rate,
            "attendance_rate": attendance_rate,
            "spoof_detection_count": value["spoof_detection_count"],
            "status": region_status,
        }
        rows.append(row)

    rows.sort(key=lambda item: item[f"{region_key}_name"])
    return rows


@router.post("/create-user")
def create_user(
    payload: AdminCreateUserRequest,
    current_user: User = Depends(require_role(Role.ADMIN)),
    db: Session = Depends(get_db),
):
    if payload.role not in {Role.SUB_ADMIN, Role.TALUKA_ADMIN, Role.WORKER, Role.FIELD_WORKER}:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Unsupported role for admin-created user")

    existing = db.query(User).filter(User.email == payload.email).first()
    if existing:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email already exists")

    user = User(
        name=payload.name,
        email=payload.email,
        password_hash=hash_password(payload.password),
        role=payload.role,
        state=payload.state,
        district=payload.district,
        taluka=payload.taluka,
        is_active=payload.is_active,
    )
    db.add(user)

    write_audit_log(
        db,
        action="admin.create_user",
        status="success",
        user_id=current_user.id,
        resource_type="user",
        details=f"created_email={payload.email};role={payload.role.value}",
    )
    db.commit()
    db.refresh(user)

    return {
        "success": True,
        "user": {
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "role": user.role.value,
            "district": user.district,
            "taluka": user.taluka,
            "is_active": user.is_active,
        },
    }


@router.get("/users")
def get_all_users(
    current_user: User = Depends(require_role(Role.ADMIN)),
    db: Session = Depends(get_db),
):
    users = db.query(User).order_by(User.created_at.desc()).all()
    return {
        "total": len(users),
        "users": [
            {
                "id": user.id,
                "name": user.name,
                "email": user.email,
                "role": user.role.value,
                "state": user.state,
                "district": user.district,
                "taluka": user.taluka,
                "is_active": user.is_active,
            }
            for user in users
        ],
    }


@router.put("/update-user")
def update_user(
    payload: AdminUpdateUserRequest,
    current_user: User = Depends(require_role(Role.ADMIN)),
    db: Session = Depends(get_db),
):
    user = db.query(User).filter(User.id == payload.user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    if payload.name is not None:
        user.name = payload.name
    if payload.role is not None:
        if payload.role not in {Role.SUB_ADMIN, Role.TALUKA_ADMIN, Role.WORKER, Role.FIELD_WORKER}:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Unsupported role update")
        user.role = payload.role
    if payload.state is not None:
        user.state = payload.state
    if payload.district is not None:
        user.district = payload.district
    if payload.taluka is not None:
        user.taluka = payload.taluka
    if payload.is_active is not None:
        user.is_active = payload.is_active
    if payload.password is not None and payload.password.strip():
        user.password_hash = hash_password(payload.password)

    db.add(user)
    write_audit_log(
        db,
        action="admin.update_user",
        status="success",
        user_id=current_user.id,
        resource_type="user",
        resource_id=user.id,
    )
    db.commit()

    return {"success": True, "message": "User updated"}


@router.delete("/delete-user")
def delete_user(
    user_id: int = Query(..., ge=1),
    current_user: User = Depends(require_role(Role.ADMIN)),
    db: Session = Depends(get_db),
):
    if user_id == current_user.id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cannot delete currently logged in admin")

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    db.delete(user)
    write_audit_log(
        db,
        action="admin.delete_user",
        status="success",
        user_id=current_user.id,
        resource_type="user",
        resource_id=user_id,
    )
    db.commit()
    return {"success": True, "message": "User deleted"}


@router.get("/stats")
def get_state_stats(
    current_user: User = Depends(require_role(Role.ADMIN)),
    db: Session = Depends(get_db),
):
    workers = db.query(User).filter(User.role.in_([Role.WORKER, Role.FIELD_WORKER])).all()
    worker_ids = [worker.id for worker in workers]

    tasks = db.query(Task).all()
    attendance = db.query(Attendance).all()
    spoof_cases = db.query(LocationLog).filter(LocationLog.spoof_detection_flag.is_(True)).all()

    districts = sorted({worker.district for worker in workers if worker.district})
    talukas = sorted({worker.taluka for worker in workers if worker.taluka})

    total_tasks = len(tasks)
    completed_tasks = sum(1 for task in tasks if task.status == TaskStatus.COMPLETED)
    pending_tasks = total_tasks - completed_tasks
    completion_rate = _safe_ratio(completed_tasks, max(total_tasks, 1))

    unique_attendance_days = len({(item.user_id, item.timestamp.date().isoformat()) for item in attendance})
    attendance_rate = _safe_ratio(unique_attendance_days, max(len(workers) * 30, 1))

    district_rows = _build_region_summary(workers, tasks, attendance, spoof_cases, level="district")
    taluka_rows = _build_region_summary(workers, tasks, attendance, spoof_cases, level="taluka")

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

    worker_efficiency_distribution = []
    for worker in workers:
        assigned = [task for task in tasks if task.assigned_to == worker.id]
        completed = sum(1 for task in assigned if task.status == TaskStatus.COMPLETED)
        efficiency = round(completed / len(assigned), 2) if assigned else 0.0
        worker_efficiency_distribution.append(
            {
                "user_id": worker.id,
                "name": worker.name,
                "district": worker.district,
                "taluka": worker.taluka,
                "efficiency": efficiency,
            }
        )
    worker_efficiency_distribution.sort(key=lambda row: row["efficiency"], reverse=True)

    best_district = district_rows[0] if district_rows else None
    worst_district = district_rows[-1] if district_rows else None

    delayed_tasks = [
        task for task in tasks
        if task.due_date and task.status != TaskStatus.COMPLETED and task.due_date < now
    ]

    alerts = []
    low_attendance_regions = [row for row in district_rows if row["attendance_rate"] < 60]
    if low_attendance_regions:
        alerts.append({"type": "low_attendance", "message": f"{len(low_attendance_regions)} district(s) have attendance below 60%"})
    high_spoof_regions = [row for row in district_rows if row["spoof_detection_count"] >= 10]
    if high_spoof_regions:
        alerts.append({"type": "high_spoof_detection", "message": f"{len(high_spoof_regions)} district(s) have high spoof detections"})
    if delayed_tasks:
        alerts.append({"type": "delayed_tasks", "message": f"{len(delayed_tasks)} delayed tasks detected statewide"})

    return {
        "total_districts": len(districts),
        "total_talukas": len(talukas),
        "total_workers": len(workers),
        "total_tasks": total_tasks,
        "completed_tasks": completed_tasks,
        "pending_tasks": pending_tasks,
        "completed_tasks_percent": completion_rate,
        "state_attendance_rate": attendance_rate,
        "spoof_detection_count": len(spoof_cases),
        "district_performance": district_rows,
        "taluka_performance": taluka_rows,
        "worker_efficiency_distribution": worker_efficiency_distribution,
        "attendance_trend": attendance_trend,
        "task_status_pie": {
            "completed": completed_tasks,
            "pending": pending_tasks,
        },
        "best_district": best_district,
        "worst_district": worst_district,
        "alerts": alerts,
        # Backward compatibility keys
        "total_users": db.query(User).count(),
        "total_attendance_records": len(attendance),
        "total_location_logs": db.query(LocationLog).count(),
        "spoof_detections": len(spoof_cases),
        "total_location_logs": db.query(LocationLog).count(),
    }


@router.get("/districts")
def get_districts(
    current_user: User = Depends(require_role(Role.ADMIN)),
    db: Session = Depends(get_db),
):
    workers = db.query(User).filter(User.role.in_([Role.WORKER, Role.FIELD_WORKER])).all()
    tasks = db.query(Task).all()
    attendance = db.query(Attendance).all()
    spoof_cases = db.query(LocationLog).filter(LocationLog.spoof_detection_flag.is_(True)).all()
    rows = _build_region_summary(workers, tasks, attendance, spoof_cases, level="district")
    return {"total": len(rows), "records": rows}


@router.get("/talukas")
def get_talukas(
    current_user: User = Depends(require_role(Role.ADMIN)),
    db: Session = Depends(get_db),
):
    workers = db.query(User).filter(User.role.in_([Role.WORKER, Role.FIELD_WORKER])).all()
    tasks = db.query(Task).all()
    attendance = db.query(Attendance).all()
    spoof_cases = db.query(LocationLog).filter(LocationLog.spoof_detection_flag.is_(True)).all()

    taluka_rows = _build_region_summary(workers, tasks, attendance, spoof_cases, level="taluka")

    district_lookup = {}
    for worker in workers:
        if worker.taluka and worker.district and worker.taluka not in district_lookup:
            district_lookup[worker.taluka] = worker.district

    for row in taluka_rows:
        row["district"] = district_lookup.get(row["taluka_name"], "Unknown")

    return {"total": len(taluka_rows), "records": taluka_rows}


@router.get("/workers")
def get_workers(
    current_user: User = Depends(require_role(Role.ADMIN)),
    db: Session = Depends(get_db),
):
    workers = db.query(User).filter(User.role.in_([Role.WORKER, Role.FIELD_WORKER])).all()
    tasks = db.query(Task).all()
    attendance = db.query(Attendance).all()

    attendance_days: dict[int, set[str]] = defaultdict(set)
    for item in attendance:
        attendance_days[item.user_id].add(item.timestamp.date().isoformat())

    rows = []
    for worker in workers:
        assigned = [task for task in tasks if task.assigned_to == worker.id]
        completed = sum(1 for task in assigned if task.status == TaskStatus.COMPLETED)
        rows.append(
            {
                "id": worker.id,
                "name": worker.name,
                "email": worker.email,
                "district": worker.district,
                "taluka": worker.taluka,
                "status": "active" if worker.is_active else "inactive",
                "assigned_tasks": len(assigned),
                "completed_tasks": completed,
                "efficiency": round(completed / len(assigned), 2) if assigned else 0.0,
                "attendance_rate": _safe_ratio(len(attendance_days.get(worker.id, set())), 30),
            }
        )

    return {"total": len(rows), "records": rows}


@router.get("/tasks")
def get_tasks(
    current_user: User = Depends(require_role(Role.ADMIN)),
    db: Session = Depends(get_db),
):
    workers = db.query(User).all()
    worker_map = {worker.id: worker for worker in workers}

    tasks = db.query(Task).order_by(Task.created_at.desc()).all()
    rows = []
    for task in tasks:
        worker = worker_map.get(task.assigned_to)
        rows.append(
            {
                "id": task.id,
                "task_name": task.title,
                "assigned_worker": worker.name if worker else f"Worker #{task.assigned_to}",
                "district": worker.district if worker else None,
                "taluka": worker.taluka if worker else None,
                "status": task.status.value if task.status else "",
                "fund_allocated": float(task.fund_allocated or 0),
                "completion_time": task.completed_at.isoformat() if task.completed_at else None,
            }
        )

    return {"total": len(rows), "records": rows}


@router.get("/spoof-cases")
def get_spoof_cases(
    current_user: User = Depends(require_role(Role.ADMIN)),
    db: Session = Depends(get_db),
):
    workers = db.query(User).all()
    worker_map = {worker.id: worker for worker in workers}

    cases = db.query(LocationLog).filter(LocationLog.spoof_detection_flag.is_(True)).order_by(LocationLog.timestamp.desc()).limit(2000).all()
    return {
        "total": len(cases),
        "records": [
            {
                "id": case.id,
                "user_id": case.user_id,
                "worker_name": worker.name if worker else f"Worker #{case.user_id}",
                "district": worker.district if worker else None,
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


@router.get("/report/state-summary.csv")
def report_state_summary_csv(
    current_user: User = Depends(require_role(Role.ADMIN)),
    db: Session = Depends(get_db),
):
    stats = get_state_stats(current_user=current_user, db=db)

    row = {
        "total_workers": stats["total_workers"],
        "total_tasks": stats["total_tasks"],
        "completed_tasks": stats["completed_tasks"],
        "pending_tasks": stats["pending_tasks"],
        "completed_tasks_percent": stats["completed_tasks_percent"],
        "state_attendance_rate": stats["state_attendance_rate"],
        "spoof_detection_count": stats["spoof_detection_count"],
    }

    write_audit_log(
        db,
        action="admin.report.state_summary",
        status="success",
        user_id=current_user.id,
    )
    db.commit()

    return _csv_response(
        "state_summary.csv",
        [row],
        [
            "total_workers",
            "total_tasks",
            "completed_tasks",
            "pending_tasks",
            "completed_tasks_percent",
            "state_attendance_rate",
            "spoof_detection_count",
        ],
    )


@router.get("/report/district-performance.csv")
def report_district_performance_csv(
    current_user: User = Depends(require_role(Role.ADMIN)),
    db: Session = Depends(get_db),
):
    districts = get_districts(current_user=current_user, db=db)

    write_audit_log(
        db,
        action="admin.report.district_performance",
        status="success",
        user_id=current_user.id,
    )
    db.commit()

    return _csv_response(
        "district_performance.csv",
        districts["records"],
        ["district_name", "workers_count", "task_completion_rate", "attendance_rate", "spoof_detection_count", "status"],
    )


@router.get("/report/efficiency.pdf")
def report_efficiency_pdf(
    current_user: User = Depends(require_role(Role.ADMIN)),
    db: Session = Depends(get_db),
):
    stats = get_state_stats(current_user=current_user, db=db)
    ranking = stats.get("worker_efficiency_distribution", [])

    lines = [
        "GeoSentinel OS - State Efficiency Report",
        f"Generated at: {datetime.now(timezone.utc).isoformat()}",
        f"Total workers: {stats.get('total_workers', 0)}",
        f"Completed tasks: {stats.get('completed_tasks', 0)}",
        f"Attendance rate: {stats.get('state_attendance_rate', 0)}%",
        "",
        "Top workers:",
    ]

    for row in ranking[:8]:
        lines.append(
            f"{row.get('name')} | district={row.get('district')} | taluka={row.get('taluka')} | efficiency={row.get('efficiency')}"
        )

    low_performers = [row for row in ranking if row.get("efficiency", 0) < 0.5]
    lines.append("")
    lines.append("Low performers:")
    if low_performers:
        for row in low_performers[:8]:
            lines.append(
                f"{row.get('name')} | district={row.get('district')} | taluka={row.get('taluka')} | efficiency={row.get('efficiency')}"
            )
    else:
        lines.append("None")

    write_audit_log(
        db,
        action="admin.report.efficiency",
        status="success",
        user_id=current_user.id,
    )
    db.commit()

    pdf = _simple_pdf_bytes(lines)
    return Response(
        content=pdf,
        media_type="application/pdf",
        headers={"Content-Disposition": 'attachment; filename="state_efficiency_report.pdf"'},
    )


@router.post("/funds/allocate-district")
def allocate_funds_to_district(
    payload: AdminFundAllocateRequest,
    current_user: User = Depends(require_role(Role.ADMIN)),
    db: Session = Depends(get_db),
):
    district_workers = db.query(User).filter(
        User.role.in_([Role.WORKER, Role.FIELD_WORKER]),
        User.district == payload.district,
    ).all()
    if not district_workers:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No workers found for district")

    district_worker_ids = [worker.id for worker in district_workers]
    district_tasks = db.query(Task).filter(Task.assigned_to.in_(district_worker_ids)).order_by(Task.created_at.desc()).all()
    if not district_tasks:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No tasks found for district")

    per_task_increment = Decimal(str(payload.amount / len(district_tasks)))
    for task in district_tasks:
        task.fund_allocated = Decimal(str(task.fund_allocated or 0)) + per_task_increment
        db.add(task)

    write_audit_log(
        db,
        action="admin.allocate_funds",
        status="success",
        user_id=current_user.id,
        resource_type="district",
        details=f"district={payload.district};amount={payload.amount};reason={payload.reason}",
    )
    db.commit()

    return {"success": True, "message": f"Funds allocated across {len(district_tasks)} district tasks"}


@router.get("/funds/summary")
def fund_summary(
    current_user: User = Depends(require_role(Role.ADMIN)),
    db: Session = Depends(get_db),
):
    users = db.query(User).all()
    user_map = {user.id: user for user in users}

    tasks = db.query(Task).all()
    usage_rows = db.query(FundUsage).all()

    district_allocated: dict[str, float] = defaultdict(float)
    district_spent: dict[str, float] = defaultdict(float)

    for task in tasks:
        worker = user_map.get(task.assigned_to)
        district = worker.district if worker and worker.district else "Unknown"
        district_allocated[district] += float(task.fund_allocated or 0)

    for usage in usage_rows:
        worker = user_map.get(usage.user_id) if usage.user_id else None
        district = worker.district if worker and worker.district else "Unknown"
        district_spent[district] += float(usage.amount or 0)

    rows = []
    for district, allocated in district_allocated.items():
        spent = district_spent.get(district, 0.0)
        utilization = _safe_ratio(spent, max(allocated, 1))
        status_value = "balanced"
        if utilization > 100:
            status_value = "overspending"
        elif utilization < 50:
            status_value = "under_utilized"

        rows.append(
            {
                "district": district,
                "allocated": round(allocated, 2),
                "spent": round(spent, 2),
                "utilization_percent": utilization,
                "status": status_value,
            }
        )

    rows.sort(key=lambda row: row["district"])
    return {"total": len(rows), "records": rows}


@router.post("/decisions/transfer-worker")
def transfer_worker(
    payload: AdminTransferWorkerRequest,
    current_user: User = Depends(require_role(Role.ADMIN)),
    db: Session = Depends(get_db),
):
    worker = db.query(User).filter(User.id == payload.worker_id).first()
    if not worker:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Worker not found")
    if worker.role not in {Role.WORKER, Role.FIELD_WORKER}:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Only workers can be transferred")

    worker.district = payload.new_district
    worker.taluka = payload.new_taluka
    db.add(worker)

    write_audit_log(
        db,
        action="admin.transfer_worker",
        status="success",
        user_id=current_user.id,
        resource_type="user",
        resource_id=worker.id,
        details=f"new_district={payload.new_district};new_taluka={payload.new_taluka};reason={payload.reason}",
    )
    db.commit()
    return {"success": True, "message": "Worker transferred"}


@router.post("/decisions/flag-district")
def flag_district(
    payload: AdminFlagDistrictRequest,
    current_user: User = Depends(require_role(Role.ADMIN)),
    db: Session = Depends(get_db),
):
    district_exists = db.query(User).filter(User.district == payload.district).first()
    if not district_exists:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="District not found")

    write_audit_log(
        db,
        action="admin.flag_district",
        status="success",
        user_id=current_user.id,
        resource_type="district",
        details=f"district={payload.district};severity={payload.severity};reason={payload.reason}",
    )
    db.commit()
    return {"success": True, "message": f"District '{payload.district}' flagged for review"}
