import os
from config import ALLOWED_EXTENSIONS


def allowed_file(filename):
    return (
        "." in filename
        and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS
    )


def ensure_upload_dir(upload_folder):
    os.makedirs(upload_folder, exist_ok=True)
