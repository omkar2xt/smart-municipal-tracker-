import os
import uuid
from flask import Blueprint, request, jsonify, send_from_directory
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
from database import get_db
from utils.helpers import allowed_file, ensure_upload_dir
from config import UPLOAD_FOLDER

images_bp = Blueprint("images", __name__)


@images_bp.route("/upload", methods=["POST"])
@jwt_required()
def upload_image():
    user_id = int(get_jwt_identity())

    if "image" not in request.files:
        return jsonify({"error": "image file is required"}), 400

    file = request.files["image"]
    if file.filename == "" or not allowed_file(file.filename):
        return jsonify({"error": "Invalid or missing file. Allowed: png, jpg, jpeg, gif"}), 400

    ensure_upload_dir(UPLOAD_FOLDER)
    ext = file.filename.rsplit(".", 1)[1].lower()
    filename = f"{uuid.uuid4().hex}.{ext}"
    filepath = os.path.join(UPLOAD_FOLDER, filename)
    file.save(filepath)

    task_id = request.form.get("task_id")
    image_type = request.form.get("image_type", "before")  # before | after
    lat = request.form.get("latitude")
    lon = request.form.get("longitude")
    notes = request.form.get("notes")

    db = get_db()
    cursor = db.execute(
        "INSERT INTO work_images (task_id, user_id, filename, image_type, latitude, longitude, notes) "
        "VALUES (?, ?, ?, ?, ?, ?, ?)",
        (task_id, user_id, filename, image_type, lat, lon, notes),
    )
    db.commit()
    image = db.execute(
        "SELECT * FROM work_images WHERE id = ?", (cursor.lastrowid,)
    ).fetchone()
    db.close()
    return jsonify(dict(image)), 201


@images_bp.route("/task/<int:task_id>", methods=["GET"])
@jwt_required()
def task_images(task_id):
    db = get_db()
    images = db.execute(
        "SELECT wi.*, u.name AS uploader_name FROM work_images wi "
        "JOIN users u ON wi.user_id = u.id WHERE wi.task_id = ? ORDER BY wi.uploaded_at DESC",
        (task_id,),
    ).fetchall()
    db.close()
    return jsonify([dict(i) for i in images])


@images_bp.route("/file/<filename>", methods=["GET"])
@jwt_required()
def serve_image(filename):
    return send_from_directory(UPLOAD_FOLDER, filename)
