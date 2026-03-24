from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
from database import get_db

tasks_bp = Blueprint("tasks", __name__)


def _admin_required(claims):
    return claims.get("role") == "admin"


@tasks_bp.route("", methods=["GET"])
@jwt_required()
def list_tasks():
    claims = get_jwt()
    user_id = int(get_jwt_identity())
    role = claims.get("role")

    db = get_db()
    if role == "admin":
        tasks = db.execute(
            "SELECT t.*, u.name AS worker_name FROM tasks t "
            "LEFT JOIN users u ON t.assigned_to = u.id ORDER BY t.created_at DESC"
        ).fetchall()
    else:
        tasks = db.execute(
            "SELECT t.*, u.name AS worker_name FROM tasks t "
            "LEFT JOIN users u ON t.assigned_to = u.id "
            "WHERE t.assigned_to = ? ORDER BY t.created_at DESC",
            (user_id,),
        ).fetchall()
    db.close()
    return jsonify([dict(t) for t in tasks])


@tasks_bp.route("", methods=["POST"])
@jwt_required()
def create_task():
    claims = get_jwt()
    if not _admin_required(claims):
        return jsonify({"error": "Admin access required"}), 403

    data = request.get_json()
    if not data or not data.get("title"):
        return jsonify({"error": "title is required"}), 400

    db = get_db()
    cursor = db.execute(
        "INSERT INTO tasks (title, description, assigned_to, zone_id, priority, due_date) "
        "VALUES (?, ?, ?, ?, ?, ?)",
        (
            data["title"],
            data.get("description"),
            data.get("assigned_to"),
            data.get("zone_id"),
            data.get("priority", "medium"),
            data.get("due_date"),
        ),
    )
    db.commit()
    task = db.execute("SELECT * FROM tasks WHERE id = ?", (cursor.lastrowid,)).fetchone()
    db.close()
    return jsonify(dict(task)), 201


@tasks_bp.route("/<int:task_id>", methods=["GET"])
@jwt_required()
def get_task(task_id):
    claims = get_jwt()
    user_id = int(get_jwt_identity())
    role = claims.get("role")

    db = get_db()
    task = db.execute(
        "SELECT t.*, u.name AS worker_name FROM tasks t "
        "LEFT JOIN users u ON t.assigned_to = u.id WHERE t.id = ?",
        (task_id,),
    ).fetchone()
    db.close()

    if not task:
        return jsonify({"error": "Task not found"}), 404
    if role != "admin" and task["assigned_to"] != user_id:
        return jsonify({"error": "Access denied"}), 403
    return jsonify(dict(task))


@tasks_bp.route("/<int:task_id>", methods=["PUT"])
@jwt_required()
def update_task(task_id):
    claims = get_jwt()
    user_id = int(get_jwt_identity())
    role = claims.get("role")
    data = request.get_json() or {}

    db = get_db()
    task = db.execute("SELECT * FROM tasks WHERE id = ?", (task_id,)).fetchone()
    if not task:
        db.close()
        return jsonify({"error": "Task not found"}), 404

    if role == "admin":
        db.execute(
            "UPDATE tasks SET title = ?, description = ?, assigned_to = ?, "
            "zone_id = ?, priority = ?, due_date = ?, status = ? WHERE id = ?",
            (
                data.get("title", task["title"]),
                data.get("description", task["description"]),
                data.get("assigned_to", task["assigned_to"]),
                data.get("zone_id", task["zone_id"]),
                data.get("priority", task["priority"]),
                data.get("due_date", task["due_date"]),
                data.get("status", task["status"]),
                task_id,
            ),
        )
    elif task["assigned_to"] == user_id:
        # Workers can only update status
        allowed_statuses = ("pending", "in_progress", "completed")
        new_status = data.get("status", task["status"])
        if new_status not in allowed_statuses:
            db.close()
            return jsonify({"error": f"status must be one of {allowed_statuses}"}), 400
        db.execute(
            "UPDATE tasks SET status = ? WHERE id = ?", (new_status, task_id)
        )
    else:
        db.close()
        return jsonify({"error": "Access denied"}), 403

    db.commit()
    updated = db.execute("SELECT * FROM tasks WHERE id = ?", (task_id,)).fetchone()
    db.close()
    return jsonify(dict(updated))


@tasks_bp.route("/<int:task_id>", methods=["DELETE"])
@jwt_required()
def delete_task(task_id):
    claims = get_jwt()
    if not _admin_required(claims):
        return jsonify({"error": "Admin access required"}), 403

    db = get_db()
    task = db.execute("SELECT id FROM tasks WHERE id = ?", (task_id,)).fetchone()
    if not task:
        db.close()
        return jsonify({"error": "Task not found"}), 404

    db.execute("DELETE FROM tasks WHERE id = ?", (task_id,))
    db.commit()
    db.close()
    return jsonify({"message": "Task deleted"})
