"""
Backend API tests for Smart Municipal Tracker.
Run from the backend directory:
    python -m pytest tests/ -v
"""
import json
import os
import sys
import tempfile
import pytest

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))
os.chdir(os.path.dirname(os.path.dirname(__file__)))

import config as cfg

# ── Fixtures ───────────────────────────────────────────────────────────────────

@pytest.fixture(scope="session")
def app():
    """Create a test Flask app backed by a temporary SQLite DB."""
    tmp = tempfile.NamedTemporaryFile(suffix=".db", delete=False)
    tmp.close()

    cfg.DATABASE = tmp.name
    cfg.UPLOAD_FOLDER = tempfile.mkdtemp()

    import database as db_module
    db_module.DATABASE = tmp.name

    import app as app_mod
    flask_app = app_mod.create_app()
    flask_app.config["TESTING"] = True

    # Init schema in temp DB
    import sqlite3
    # __file__ is backend/tests/test_api.py → go up 3 levels to project root
    project_root = os.path.dirname(os.path.dirname(os.path.dirname(__file__)))
    schema_path = os.path.join(project_root, "database", "schema.sql")
    conn = sqlite3.connect(tmp.name)
    with open(schema_path) as f:
        conn.executescript(f.read())
    conn.commit()
    conn.close()

    yield flask_app

    os.unlink(tmp.name)


@pytest.fixture(scope="session")
def client(app):
    return app.test_client()


@pytest.fixture(scope="session")
def admin_token(client):
    client.post(
        "/api/auth/register",
        json={"username": "admin", "password": "pass", "name": "Admin", "role": "admin"},
    )
    res = client.post(
        "/api/auth/login", json={"username": "admin", "password": "pass"}
    )
    return res.json["token"]


@pytest.fixture(scope="session")
def worker_token(client, admin_token):
    # Create zone first
    client.post(
        "/api/workers/zones",
        json={"name": "Test Zone", "lat": 18.5204, "lon": 73.8567, "radius_metres": 500},
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    client.post(
        "/api/auth/register",
        json={
            "username": "worker",
            "password": "pass",
            "name": "Worker One",
            "role": "worker",
            "zone_id": 1,
        },
    )
    res = client.post(
        "/api/auth/login", json={"username": "worker", "password": "pass"}
    )
    return res.json["token"]


# ── Auth tests ─────────────────────────────────────────────────────────────────

class TestAuth:
    def test_login_success(self, client, admin_token):
        assert admin_token is not None

    def test_login_bad_credentials(self, client):
        res = client.post(
            "/api/auth/login", json={"username": "admin", "password": "wrong"}
        )
        assert res.status_code == 401

    def test_login_missing_fields(self, client):
        res = client.post("/api/auth/login", json={"username": "admin"})
        assert res.status_code == 400

    def test_register_duplicate(self, client):
        res = client.post(
            "/api/auth/register",
            json={"username": "admin", "password": "x", "name": "N", "role": "admin"},
        )
        assert res.status_code == 409

    def test_register_invalid_role(self, client):
        res = client.post(
            "/api/auth/register",
            json={"username": "u99", "password": "p", "name": "n", "role": "superuser"},
        )
        assert res.status_code == 400


# ── Attendance tests ───────────────────────────────────────────────────────────

class TestAttendance:
    def test_checkin_within_zone(self, client, worker_token):
        res = client.post(
            "/api/attendance/checkin",
            json={"latitude": 18.5204, "longitude": 73.8567},
            headers={"Authorization": f"Bearer {worker_token}"},
        )
        assert res.status_code == 201
        assert res.json["zone_status"] == "within"
        assert res.json["latitude"] == 18.5204

    def test_checkin_duplicate_today(self, client, worker_token):
        res = client.post(
            "/api/attendance/checkin",
            json={"latitude": 18.5204, "longitude": 73.8567},
            headers={"Authorization": f"Bearer {worker_token}"},
        )
        assert res.status_code == 409

    def test_checkin_outside_zone(self, client, admin_token):
        client.post(
            "/api/auth/register",
            json={"username": "farworker", "password": "p", "name": "Far", "role": "worker", "zone_id": 1},
        )
        login = client.post("/api/auth/login", json={"username": "farworker", "password": "p"})
        token = login.json["token"]
        res = client.post(
            "/api/attendance/checkin",
            json={"latitude": 19.0760, "longitude": 72.8777},
            headers={"Authorization": f"Bearer {token}"},
        )
        assert res.status_code == 403
        assert "outside" in res.json["error"].lower()
        assert "distance_metres" in res.json

    def test_checkout(self, client, worker_token):
        res = client.post(
            "/api/attendance/checkout",
            json={"latitude": 18.5210, "longitude": 73.8570},
            headers={"Authorization": f"Bearer {worker_token}"},
        )
        assert res.status_code == 200
        assert res.json["check_out_time"] is not None

    def test_checkout_no_active(self, client, worker_token):
        res = client.post(
            "/api/attendance/checkout",
            json={},
            headers={"Authorization": f"Bearer {worker_token}"},
        )
        assert res.status_code == 404

    def test_today_attendance(self, client, admin_token):
        res = client.get(
            "/api/attendance/today",
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        assert res.status_code == 200
        assert isinstance(res.json, list)

    def test_unauthenticated_blocked(self, client):
        res = client.post(
            "/api/attendance/checkin",
            json={"latitude": 18.5, "longitude": 73.8},
        )
        assert res.status_code == 401


# ── Tasks tests ────────────────────────────────────────────────────────────────

class TestTasks:
    def test_create_task(self, client, admin_token):
        res = client.post(
            "/api/tasks",
            json={"title": "Fix Road", "priority": "high", "assigned_to": 2},
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        assert res.status_code == 201
        assert res.json["title"] == "Fix Road"

    def test_worker_cannot_create_task(self, client, worker_token):
        res = client.post(
            "/api/tasks",
            json={"title": "Hack"},
            headers={"Authorization": f"Bearer {worker_token}"},
        )
        assert res.status_code == 403

    def test_list_tasks_admin(self, client, admin_token):
        res = client.get(
            "/api/tasks",
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        assert res.status_code == 200
        assert len(res.json) >= 1

    def test_worker_update_status(self, client, admin_token, worker_token):
        create = client.post(
            "/api/tasks",
            json={"title": "Worker Task", "assigned_to": 2},
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        task_id = create.json["id"]
        res = client.put(
            f"/api/tasks/{task_id}",
            json={"status": "in_progress"},
            headers={"Authorization": f"Bearer {worker_token}"},
        )
        assert res.status_code == 200
        assert res.json["status"] == "in_progress"

    def test_delete_task(self, client, admin_token):
        create = client.post(
            "/api/tasks",
            json={"title": "Temp Task"},
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        task_id = create.json["id"]
        res = client.delete(
            f"/api/tasks/{task_id}",
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        assert res.status_code == 200


# ── Workers & Zones ────────────────────────────────────────────────────────────

class TestWorkers:
    def test_list_workers(self, client, admin_token):
        res = client.get(
            "/api/workers",
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        assert res.status_code == 200
        assert isinstance(res.json, list)

    def test_worker_cannot_list_others(self, client, worker_token):
        res = client.get(
            "/api/workers",
            headers={"Authorization": f"Bearer {worker_token}"},
        )
        assert res.status_code == 403

    def test_create_zone(self, client, admin_token):
        res = client.post(
            "/api/workers/zones",
            json={"name": "New Zone", "lat": 18.6, "lon": 73.9, "radius_metres": 300},
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        assert res.status_code == 201
        assert res.json["name"] == "New Zone"

    def test_worker_locations(self, client, admin_token):
        res = client.get(
            "/api/workers/locations",
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        assert res.status_code == 200
        assert isinstance(res.json, list)


# ── Geo-fence unit tests ───────────────────────────────────────────────────────

class TestGeofence:
    def test_within_zone(self):
        from utils.geofence import is_within_zone
        within, dist = is_within_zone(18.5204, 73.8567, 18.5204, 73.8567, 100)
        assert within is True
        assert dist == pytest.approx(0, abs=1)

    def test_outside_zone(self):
        from utils.geofence import is_within_zone
        within, dist = is_within_zone(19.0, 73.0, 18.5204, 73.8567, 100)
        assert within is False
        assert dist > 100

    def test_haversine_known_distance(self):
        from utils.geofence import haversine_distance
        # Distance from Mumbai to Pune ≈ 120 km
        d = haversine_distance(19.0760, 72.8777, 18.5204, 73.8567)
        assert 115_000 < d < 135_000
