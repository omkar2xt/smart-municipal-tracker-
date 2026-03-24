# Smart Municipal Tracker – Setup Guide

## Prerequisites

- Python 3.9+
- A modern web browser (Chrome, Firefox, Edge)

---

## Quick Start

### 1. Clone the repository
```bash
git clone <repo-url>
cd smart-municipal-tracker
```

### 2. Set up the backend
```bash
cd backend
pip install -r requirements.txt
python app.py
```

The server starts at **http://localhost:5000**.

On first start, `app.py` automatically:
1. Creates `database/tracker.db` (SQLite) using `database/schema.sql`.
2. Seeds two demo work zones, one admin account, and two worker accounts.

### 3. Open the frontend

Open `frontend/index.html` in your browser (or serve it with any static web server).

**Option A – Open directly**
Just double-click `frontend/index.html`.

**Option B – Serve with Python**
```bash
cd frontend
python -m http.server 8080
# Open http://localhost:8080
```

---

## Demo Accounts

| Role   | Username | Password   |
|--------|----------|------------|
| Admin  | admin    | admin123   |
| Worker | worker1  | worker123  |
| Worker | worker2  | worker123  |

---

## Configuration

Edit `backend/config.py` or set environment variables:

| Variable          | Default                              | Description                |
|-------------------|--------------------------------------|----------------------------|
| `SECRET_KEY`      | `dev-secret-key-change-in-production`| Flask secret key           |
| `JWT_SECRET_KEY`  | `jwt-secret-key-change-in-production`| JWT signing key            |

For production, **always set these to long random strings**.

---

## Project Structure

```
smart-municipal-tracker-/
├── backend/
│   ├── app.py              # Flask entry point & app factory
│   ├── config.py           # Configuration variables
│   ├── database.py         # SQLite connection helpers
│   ├── requirements.txt    # Python dependencies
│   ├── routes/
│   │   ├── auth.py         # /api/auth/*
│   │   ├── attendance.py   # /api/attendance/*
│   │   ├── tasks.py        # /api/tasks/*
│   │   ├── images.py       # /api/images/*
│   │   └── workers.py      # /api/workers/*
│   ├── utils/
│   │   ├── geofence.py     # Haversine geo-fence validation
│   │   └── helpers.py      # File upload helpers
│   └── uploads/            # Stored work images
│
├── frontend/
│   ├── index.html          # Login page
│   ├── worker.html         # Worker dashboard
│   ├── admin.html          # Admin dashboard
│   ├── css/
│   │   └── style.css       # Global styles
│   └── js/
│       ├── auth.js         # Auth helpers & API client
│       ├── worker.js       # Worker dashboard logic
│       └── admin.js        # Admin dashboard logic
│
├── database/
│   └── schema.sql          # Database schema
│
└── docs/
    ├── API.md              # REST API documentation
    └── SETUP.md            # This file
```

---

## Features Overview

### User Authentication
- JWT-based login for both workers and admins.
- Role-based access control on every API endpoint.

### GPS Attendance & Geo-Fencing
- Workers check in/out with their device GPS.
- If a worker has an assigned zone, the API validates they are within the allowed radius (Haversine formula).
- Out-of-zone check-ins are rejected with the distance reported.

### Task Management
- Admins create and assign tasks with priority, due date, and zone.
- Workers can view their tasks and update status (pending → in_progress → completed).

### Before/After Photo Upload
- Workers upload tagged photos linked to a task.
- Photos include optional GPS coordinates and notes.

### Admin Dashboard
- Live map showing worker locations (Leaflet + OpenStreetMap).
- Geo-zone circles overlaid on the map.
- Stats cards for present workers, open/completed tasks.
- Manage tasks, workers, and zones from the UI.

---

## API Documentation

See [docs/API.md](API.md) for full REST API reference.
