from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
from werkzeug.security import generate_password_hash
from database import get_db

workers_bp = Blueprint("workers", __name__)


@workers_bp.route("", methods=["GET"])
@jwt_required()
def list_workers():
    claims = get_jwt()
    if claims.get("role") != "admin":
        return jsonify({"error": "Admin access required"}), 403

    db = get_db()
    workers = db.execute(
        "SELECT u.id, u.username, u.name, u.role, u.phone, u.zone_id, "
        "z.name AS zone_name, u.created_at "
        "FROM users u LEFT JOIN work_zones z ON u.zone_id = z.id "
        "WHERE u.role = 'worker' ORDER BY u.name"
    ).fetchall()
    db.close()
    return jsonify([dict(w) for w in workers])


@workers_bp.route("/<int:worker_id>", methods=["GET"])
@jwt_required()
def get_worker(worker_id):
    claims = get_jwt()
    user_id = int(get_jwt_identity())

    if claims.get("role") != "admin" and user_id != worker_id:
        return jsonify({"error": "Access denied"}), 403

    db = get_db()
    worker = db.execute(
        "SELECT u.id, u.username, u.name, u.role, u.phone, u.zone_id, "
        "z.name AS zone_name, z.lat AS zone_lat, z.lon AS zone_lon, "
        "z.radius_metres, u.created_at "
        "FROM users u LEFT JOIN work_zones z ON u.zone_id = z.id "
        "WHERE u.id = ?",
        (worker_id,),
    ).fetchone()
    db.close()
    if not worker:
        return jsonify({"error": "Worker not found"}), 404
    return jsonify(dict(worker))


@workers_bp.route("/<int:worker_id>", methods=["PUT"])
@jwt_required()
def update_worker(worker_id):
    claims = get_jwt()
    user_id = int(get_jwt_identity())
    is_admin = claims.get("role") == "admin"

    if not is_admin and user_id != worker_id:
        return jsonify({"error": "Access denied"}), 403

    data = request.get_json() or {}
    db = get_db()
    user = db.execute("SELECT * FROM users WHERE id = ?", (worker_id,)).fetchone()
    if not user:
        db.close()
        return jsonify({"error": "User not found"}), 404

    new_hash = user["password_hash"]
    if data.get("password"):
        new_hash = generate_password_hash(data["password"])

    db.execute(
        "UPDATE users SET name = ?, phone = ?, password_hash = ?, zone_id = ? WHERE id = ?",
        (
            data.get("name", user["name"]),
            data.get("phone", user["phone"]),
            new_hash,
            data.get("zone_id", user["zone_id"]) if is_admin else user["zone_id"],
            worker_id,
        ),
    )
    db.commit()
    db.close()
    return jsonify({"message": "Updated successfully"})


@workers_bp.route("/locations", methods=["GET"])
@jwt_required()
def worker_locations():
    """Return the most recent check-in location for each worker (admin only)."""
    claims = get_jwt()
    if claims.get("role") != "admin":
        return jsonify({"error": "Admin access required"}), 403

    db = get_db()
    rows = db.execute(
        "SELECT u.id, u.name, u.username, a.latitude, a.longitude, "
        "a.check_in_time, a.check_out_time, a.zone_status "
        "FROM users u "
        "JOIN attendance a ON a.id = ("
        "  SELECT id FROM attendance WHERE user_id = u.id ORDER BY check_in_time DESC LIMIT 1"
        ") WHERE u.role = 'worker'"
    ).fetchall()
    db.close()
    return jsonify([dict(r) for r in rows])


@workers_bp.route("/zones", methods=["GET"])
@jwt_required()
def list_zones():
    db = get_db()
    zones = db.execute("SELECT * FROM work_zones ORDER BY name").fetchall()
    db.close()
    return jsonify([dict(z) for z in zones])


@workers_bp.route("/zones", methods=["POST"])
@jwt_required()
def create_zone():
    claims = get_jwt()
    if claims.get("role") != "admin":
        return jsonify({"error": "Admin access required"}), 403

    data = request.get_json()
    if not data or not data.get("name") or data.get("lat") is None or data.get("lon") is None:
        return jsonify({"error": "name, lat, and lon are required"}), 400

    db = get_db()
    cursor = db.execute(
        "INSERT INTO work_zones (name, lat, lon, radius_metres) VALUES (?, ?, ?, ?)",
        (data["name"], data["lat"], data["lon"], data.get("radius_metres", 200)),
    )
    db.commit()
    zone = db.execute("SELECT * FROM work_zones WHERE id = ?", (cursor.lastrowid,)).fetchone()
    db.close()
    return jsonify(dict(zone)), 201
