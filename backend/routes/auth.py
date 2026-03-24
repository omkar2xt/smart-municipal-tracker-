from flask import Blueprint, request, jsonify
from werkzeug.security import generate_password_hash, check_password_hash
from flask_jwt_extended import create_access_token
from database import get_db

auth_bp = Blueprint("auth", __name__)


@auth_bp.route("/login", methods=["POST"])
def login():
    data = request.get_json()
    if not data or not data.get("username") or not data.get("password"):
        return jsonify({"error": "Username and password required"}), 400

    db = get_db()
    user = db.execute(
        "SELECT * FROM users WHERE username = ?", (data["username"],)
    ).fetchone()
    db.close()

    if not user or not check_password_hash(user["password_hash"], data["password"]):
        return jsonify({"error": "Invalid credentials"}), 401

    token = create_access_token(
        identity=str(user["id"]),
        additional_claims={"role": user["role"], "name": user["name"]},
    )
    return jsonify(
        {
            "token": token,
            "role": user["role"],
            "name": user["name"],
            "id": user["id"],
        }
    )


@auth_bp.route("/register", methods=["POST"])
def register():
    """Admin-only endpoint to register new workers (seeded via init_db in production)."""
    data = request.get_json()
    required = ["username", "password", "name", "role"]
    if not data or not all(data.get(k) for k in required):
        return jsonify({"error": "username, password, name and role are required"}), 400

    if data["role"] not in ("admin", "worker"):
        return jsonify({"error": "role must be admin or worker"}), 400

    password_hash = generate_password_hash(data["password"])
    db = get_db()
    try:
        db.execute(
            "INSERT INTO users (username, password_hash, name, role, phone, zone_id) "
            "VALUES (?, ?, ?, ?, ?, ?)",
            (
                data["username"],
                password_hash,
                data["name"],
                data["role"],
                data.get("phone"),
                data.get("zone_id"),
            ),
        )
        db.commit()
    except Exception as e:
        db.close()
        return jsonify({"error": str(e)}), 409
    db.close()
    return jsonify({"message": "User created successfully"}), 201
