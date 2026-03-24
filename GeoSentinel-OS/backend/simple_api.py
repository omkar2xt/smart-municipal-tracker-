"""Simple mock API server for GeoSentinel OS demo."""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

app = FastAPI(
    title="GeoSentinel OS API - Demo",
    description="Municipal workforce tracking system",
    version="1.0.0",
)

# CORS configuration - use explicit origins instead of wildcard with credentials
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Demo data
workers_demo = [
    {"id": 1, "name": "Raj Kumar", "role": "WORKER", "geo_zone": "Zone A"},
    {"id": 2, "name": "Priya Singh", "role": "WORKER", "geo_zone": "Zone B"},
    {"id": 3, "name": "Amit Patel", "role": "TALUKA_ADMIN", "geo_zone": "Zone A"},
]

attendance_demo = [
    {
        "id": 1,
        "user_id": 1,
        "date": "2026-03-24",
        "clock_in": "09:00:00",
        "location": {"lat": 19.0760, "lon": 72.8777},
        "status": "PRESENT"
    }
]

@app.get("/")
async def root():
    return {"message": "GeoSentinel OS API Demo Running"}

@app.post("/api/auth/login")
async def login_demo():
    return {
        "access_token": "demo_token_12345",
        "token_type": "bearer",
        "user": {
            "id": 1,
            "name": "Raj Kumar",
            "role": "WORKER",
            "org_unit": "Zone A"
        }
    }

@app.get("/api/workers")
async def get_workers():
    return {"workers": workers_demo}

@app.get("/api/attendance/history")
async def get_attendance():
    return {"attendance_records": attendance_demo}

@app.get("/api/tasks")
async def get_tasks():
    return {
        "tasks": [
            {
                "id": 1,
                "title": "Road Inspection",
                "assigned_to": 1,
                "status": "IN_PROGRESS",
                "due_date": "2026-03-24"
            }
        ]
    }

@app.post("/api/attendance/mark")
async def mark_attendance(data: dict = None):
    return {
        "status": "success",
        "message": "Attendance marked successfully",
        "attendance_id": 2
    }

@app.get("/api/tracking/locations")
async def get_locations():
    return {
        "locations": [
            {
                "worker_id": 1,
                "lat": 19.0760,
                "lon": 72.8777,
                "timestamp": "2026-03-24T14:30:00",
                "accuracy": 15
            }
        ]
    }

if __name__ == "__main__":
    uvicorn.run(app, host="127.0.0.1", port=8001)
