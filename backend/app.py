import os
import sys

sys.path.insert(0, os.path.dirname(__file__))

from flask import Flask, jsonify
from flask_cors import CORS
from flask_jwt_extended import JWTManager
import config
from database import init_db, get_db
from werkzeug.security import generate_password_hash

from routes.auth import auth_bp
from routes.attendance import attendance_bp
from routes.tasks import tasks_bp
from routes.images import images_bp
from routes.workers import workers_bp


def create_app():
    app = Flask(__name__)
    app.config["SECRET_KEY"] = config.SECRET_KEY
    app.config["JWT_SECRET_KEY"] = config.JWT_SECRET_KEY
    app.config["UPLOAD_FOLDER"] = config.UPLOAD_FOLDER
    app.config["MAX_CONTENT_LENGTH"] = config.MAX_CONTENT_LENGTH

    CORS(app, resources={r"/api/*": {"origins": "*"}})
    JWTManager(app)

    # Blueprints
    app.register_blueprint(auth_bp, url_prefix="/api/auth")
    app.register_blueprint(attendance_bp, url_prefix="/api/attendance")
    app.register_blueprint(tasks_bp, url_prefix="/api/tasks")
    app.register_blueprint(images_bp, url_prefix="/api/images")
    app.register_blueprint(workers_bp, url_prefix="/api/workers")

    @app.route("/api/health")
    def health():
        return jsonify({"status": "ok"})

    return app


def seed_demo_data():
    """Insert demo admin + worker accounts if the DB is empty."""
    db = get_db()
    count = db.execute("SELECT COUNT(*) FROM users").fetchone()[0]
    if count == 0:
        # Demo zone
        db.execute(
            "INSERT INTO work_zones (name, lat, lon, radius_metres) VALUES (?, ?, ?, ?)",
            ("City Centre Zone", 18.5204, 73.8567, 500),
        )
        db.execute(
            "INSERT INTO work_zones (name, lat, lon, radius_metres) VALUES (?, ?, ?, ?)",
            ("North District", 18.5600, 73.8300, 300),
        )
        # Admin
        db.execute(
            "INSERT INTO users (username, password_hash, name, role) VALUES (?, ?, ?, ?)",
            ("admin", generate_password_hash("admin123"), "Admin User", "admin"),
        )
        # Workers
        db.execute(
            "INSERT INTO users (username, password_hash, name, role, phone, zone_id) "
            "VALUES (?, ?, ?, ?, ?, ?)",
            ("worker1", generate_password_hash("worker123"), "Ravi Kumar", "worker", "9876543210", 1),
        )
        db.execute(
            "INSERT INTO users (username, password_hash, name, role, phone, zone_id) "
            "VALUES (?, ?, ?, ?, ?, ?)",
            ("worker2", generate_password_hash("worker123"), "Priya Sharma", "worker", "9876543211", 2),
        )
        # Demo tasks
        db.execute(
            "INSERT INTO tasks (title, description, assigned_to, zone_id, priority, due_date) "
            "VALUES (?, ?, ?, ?, ?, date('now', '+2 days'))",
            ("Fix pothole on MG Road", "Large pothole near signal", 2, 1, "high"),
        )
        db.execute(
            "INSERT INTO tasks (title, description, assigned_to, zone_id, priority) "
            "VALUES (?, ?, ?, ?, ?)",
            ("Clean drainage near park", "Blocked drainage causing waterlogging", 3, 2, "medium"),
        )
        db.commit()
    db.close()


if __name__ == "__main__":
    os.makedirs(config.UPLOAD_FOLDER, exist_ok=True)
    init_db()
    seed_demo_data()
    app = create_app()
    debug_mode = os.environ.get("FLASK_DEBUG", "0") == "1"
    app.run(debug=debug_mode, host="0.0.0.0", port=5000)
