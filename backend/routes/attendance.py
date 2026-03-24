from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
from database import get_db
from utils.geofence import is_within_zone
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

attendance_bp = Blueprint("attendance", __name__)


@attendance_bp.route("/checkin", methods=["POST"])
@jwt_required()
def checkin():
    user_id = int(get_jwt_identity())
    data = request.get_json()

    lat = data.get("latitude")
    lon = data.get("longitude")
    if lat is None or lon is None:
        return jsonify({"error": "latitude and longitude are required"}), 400

    db = get_db()

    # Check if already checked in today
    existing = db.execute(
        "SELECT id FROM attendance "
        "WHERE user_id = ? AND date(check_in_time) = date('now') AND check_out_time IS NULL",
        (user_id,),
    ).fetchone()
    if existing:
        db.close()
        return jsonify({"error": "Already checked in today"}), 409

    # Geo-fence validation
    user = db.execute(
        "SELECT u.zone_id, z.lat AS zone_lat, z.lon AS zone_lon, z.radius_metres "
        "FROM users u LEFT JOIN work_zones z ON u.zone_id = z.id WHERE u.id = ?",
        (user_id,),
    ).fetchone()

    zone_status = "no_zone"
    distance = None
    if user and user["zone_id"] is not None:
        within, distance = is_within_zone(
            lat, lon, user["zone_lat"], user["zone_lon"], user["radius_metres"]
        )
        zone_status = "within" if within else "outside"
        if not within:
            db.close()
            return jsonify(
                {
                    "error": "You are outside your assigned work zone",
                    "distance_metres": round(distance, 1),
                    "allowed_radius": user["radius_metres"],
                }
            ), 403

    cursor = db.execute(
        "INSERT INTO attendance (user_id, latitude, longitude, zone_status) VALUES (?, ?, ?, ?)",
        (user_id, lat, lon, zone_status),
    )
    db.commit()
    record_id = cursor.lastrowid
    record = db.execute(
        "SELECT * FROM attendance WHERE id = ?", (record_id,)
    ).fetchone()
    db.close()
    return jsonify(dict(record)), 201


@attendance_bp.route("/checkout", methods=["POST"])
@jwt_required()
def checkout():
    user_id = int(get_jwt_identity())
    data = request.get_json() or {}

    lat = data.get("latitude")
    lon = data.get("longitude")

    db = get_db()
    record = db.execute(
        "SELECT id FROM attendance "
        "WHERE user_id = ? AND date(check_in_time) = date('now') AND check_out_time IS NULL",
        (user_id,),
    ).fetchone()

    if not record:
        db.close()
        return jsonify({"error": "No active check-in found for today"}), 404

    db.execute(
        "UPDATE attendance SET check_out_time = CURRENT_TIMESTAMP, "
        "checkout_latitude = ?, checkout_longitude = ? WHERE id = ?",
        (lat, lon, record["id"]),
    )
    db.commit()
    updated = db.execute(
        "SELECT * FROM attendance WHERE id = ?", (record["id"],)
    ).fetchone()
    db.close()
    return jsonify(dict(updated))


@attendance_bp.route("/history", methods=["GET"])
@jwt_required()
def history():
    claims = get_jwt()
    user_id = int(get_jwt_identity())
    role = claims.get("role")

    db = get_db()
    if role == "admin":
        records = db.execute(
            "SELECT a.*, u.name, u.username FROM attendance a "
            "JOIN users u ON a.user_id = u.id ORDER BY a.check_in_time DESC LIMIT 100"
        ).fetchall()
    else:
        records = db.execute(
            "SELECT * FROM attendance WHERE user_id = ? ORDER BY check_in_time DESC LIMIT 50",
            (user_id,),
        ).fetchall()
    db.close()
    return jsonify([dict(r) for r in records])


@attendance_bp.route("/today", methods=["GET"])
@jwt_required()
def today():
    claims = get_jwt()
    role = claims.get("role")
    user_id = int(get_jwt_identity())

    db = get_db()
    if role == "admin":
        records = db.execute(
            "SELECT a.*, u.name, u.username FROM attendance a "
            "JOIN users u ON a.user_id = u.id "
            "WHERE date(a.check_in_time) = date('now') ORDER BY a.check_in_time DESC"
        ).fetchall()
    else:
        records = db.execute(
            "SELECT * FROM attendance WHERE user_id = ? AND date(check_in_time) = date('now')",
            (user_id,),
        ).fetchall()
    db.close()
    return jsonify([dict(r) for r in records])
