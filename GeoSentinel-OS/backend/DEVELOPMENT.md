# Development Guide - GeoSentinel OS Backend

Complete guide for local development, testing, and debugging.

## 📖 Table of Contents

1. [Initial Setup](#initial-setup)
2. [Database Configuration](#database-configuration)
3. [Running the Server](#running-the-server)
4. [Testing](#testing)
5. [Debugging](#debugging)
6. [Common Issues](#common-issues)
7. [Project Structure](#project-structure)
8. [Code Patterns](#code-patterns)

---

## 🚀 Initial Setup

### Step 1: Clone & Navigate
```bash
cd GeoSentinel-OS/backend
```

### Step 2: Create Virtual Environment
```bash
# Windows
python -m venv venv
venv\Scripts\activate

# Linux/Mac
python3 -m venv venv
source venv/bin/activate
```

### Step 3: Install Dependencies
```bash
pip install -r requirements.txt
```

### Step 4: Create .env File
```bash
cp .env.example .env
```

Edit `.env` and configure:
- `DATABASE_URL=postgresql://user:password@localhost/geosentinel_db`
- `SECRET_KEY=your-super-secret-key-here` (min 32 chars)

### Step 5: Initialize Database
```bash
# Create database
createdb geosentinel_db

# Run initialization
python -m database.init_db
```

This will:
- Create all tables
- Seed 4 default users
- Create indexes
- Log initialization status

### Step 6: Start Server
```bash
uvicorn main:app --reload
```

Server runs at: `http://localhost:8000`
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

---

## 🗄️ Database Configuration

### PostgreSQL Installation

#### Windows
```bash
# Download from https://www.postgresql.org/download/windows/
# During installation, set password for postgres user
# PostgreSQL will be available via psql command
```

#### Linux (Ubuntu/Debian)
```bash
sudo apt-get update
sudo apt-get install postgresql postgresql-contrib
sudo service postgresql start
```

#### Mac (using Homebrew)
```bash
brew install postgresql
brew services start postgresql
```

### Database Setup

```bash
# Connect as postgres user
psql -U postgres

# Create database
CREATE DATABASE geosentinel_db;

# Create user (optional, for security)
CREATE USER geosentinel_user WITH PASSWORD 'secure_password';
GRANT ALL PRIVILEGES ON DATABASE geosentinel_db TO geosentinel_user;

# Exit psql
\q
```

### Connection String Formats

```bash
# Local PostgreSQL (default)
postgresql://postgres:password@localhost/geosentinel_db

# With custom user
postgresql://geosentinel_user:secure_password@localhost/geosentinel_db

# Remote server
postgresql://user:password@remote.server.com:5432/geosentinel_db
```

### Verify Connection

```bash
# Test connection
python -c "
from database.session import engine
try:
    with engine.connect() as conn:
        print('✓ Database connection successful')
except Exception as e:
    print(f'✗ Connection failed: {e}')
"
```

---

## 🏃 Running the Server

### Development Mode (with reload)
```bash
uvicorn main:app --reload
# Restarts on file changes
# Slower startup but convenient for development
```

### Production Mode (no reload)
```bash
uvicorn main:app
# Single startup, no auto-reload
# Better for consistent behavior
```

### Custom Port
```bash
uvicorn main:app --reload --port 8001
# Runs on http://localhost:8001
```

### With Specific Host
```bash
uvicorn main:app --reload --host 0.0.0.0
# Accessible from other machines on network
```

---

## 🧪 Testing

### Run Unit Tests
```bash
# Run all tests
pytest

# Run specific test file
pytest tests/test_models.py

# Run with verbose output
pytest -v

# Run with coverage
pip install pytest-cov
pytest --cov=. --cov-report=html
```

### Manual API Testing with cURL

#### Login
```bash
curl -X POST http://localhost:8000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"worker@geosentinel.gov","password":"worker123"}'
```

#### Mark Attendance
```bash
curl -X POST http://localhost:8000/attendance \
  -H "Authorization: Bearer ACCESS_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "latitude": 18.5204,
    "longitude": 73.8567,
    "accuracy": 10
  }'
```

#### Check Spoof Detection
```bash
# Teleport 100km in 1 second - should be flagged as danger
curl -X POST http://localhost:8000/tracking/location \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "latitude": 28.6139,
    "longitude": 77.2090,
    "accuracy": 10,
    "accel_x": 0.1,
    "accel_y": 0.1,
    "accel_z": 9.8
  }'
```

### Using Postman

1. **Import Collection** (if available)
2. **Set Environment Variables**:
   - `base_url`: http://localhost:8000
   - `token`: (auto-populated after login)
3. **Test Workflow**:
   - Login → Get token
   - Mark attendance → Verify geofence validation
   - Log location → Check spoof detection
   - Create task → Verify admin auth

---

## 🐛 Debugging

### Enable Debug Logging
```python
# In main.py, uncomment:
import logging
logging.basicConfig(level=logging.DEBUG)
```

### Database Query Logging
```python
# In config/settings.py, add:
echo=True  # to engine creation
```

### Print SQL Queries
```bash
# Set environment variable
export SQLALCHEMY_ECHO=1
uvicorn main:app --reload
```

### Check Token Contents
```python
import jwt
import json

token = "YOUR_TOKEN_HERE"
decoded = jwt.decode(token, options={"verify_signature": False})
print(json.dumps(decoded, indent=2))
```

### Database Inspection
```bash
# Connect to database
psql -U postgres -d geosentinel_db

# List tables
\dt

# View users
SELECT id, name, email, role FROM "user";

# View recent attendance
SELECT * FROM attendance ORDER BY created_at DESC LIMIT 10;

# View spoof detections
SELECT * FROM location_log WHERE spoof_detection_flag = true LIMIT 10;

# Exit
\q
```

### Check API Health
```bash
curl http://localhost:8000/health
# Should return: {"status":"healthy","service":"GeoSentinel OS Backend"}
```

---

## ❌ Common Issues & Solutions

### 1. "Database Connection Refused"
```
Error: psycopg2.OperationalError: could not connect to server
```
**Solution:**
```bash
# Check PostgreSQL is running
sudo service postgresql status   # Linux
brew services list               # Mac
Services app                      # Windows

# Verify DATABASE_URL in .env
# Test connection
psql -U postgres -d geosentinel_db
```

### 2. "ModuleNotFoundError: No module named 'fastapi'"
**Solution:**
```bash
# Ensure venv is activated
source venv/bin/activate  # Linux/Mac
venv\Scripts\activate     # Windows

# Reinstall dependencies
pip install -r requirements.txt
```

### 3. "JWT could not be validated"
**Solution:**
```bash
# Check SECRET_KEY is set in .env
# Verify token is sent correctly in Authorization header
# Bearer {token}

# Check token hasn't expired (24 hour expiration)
```

### 4. "403 Forbidden - User lacks required role"
**Solution:**
```bash
# Verify user has correct role in database
psql -U postgres -d geosentinel_db
SELECT id, name, role FROM "user";

# Use admin account if endpoint requires admin
# Login as: admin@geosentinel.gov / admin123
```

### 5. "Port 8000 already in use"
**Solution:**
```bash
# Use different port
uvicorn main:app --reload --port 8001

# Or kill existing process
# Windows
netstat -ano | findstr :8000
taskkill /PID <PID> /F

# Linux/Mac
lsof -ti:8000 | xargs kill -9
```

### 6. "Geofence validation always fails"
**Solution:**
```python
# Check coordinates are valid
# Latitude: -90 to 90
# Longitude: -180 to 180

# Check geofence_id exists in GeofenceService.DEFAULT_GEOFENCES
# Current options: "pune_taluka", "baner_balewadi", "aundh_market"

# Test with known valid coordinates:
# Pune city: 18.5204, 73.8567
```

### 7. "Spoof detection not working"
**Solution:**
```python
# Check accelerometer data is provided (optional but needed for detection)
# POST /tracking/location with:
{
  "latitude": 18.5204,
  "longitude": 73.8567,
  "accel_x": 0.5,
  "accel_y": 0.3,
  "accel_z": 9.8
}

# Check spoof thresholds in services/spoof_service.py:
# MAX_SPEED_KMH = 120.0
# JUMP_THRESHOLD_M = 50000.0
```

---

## 📂 Project Structure

```
backend/
├── main.py                          # FastAPI app entry point
│   ├── FastAPI() instantiation
│   ├── CORS middleware
│   ├── Router registration
│   ├── Startup event (DB init)
│   └── Exception handlers
│
├── config/
│   └── settings.py                  # Configuration (env vars, thresholds)
│       ├── DATABASE_URL
│       ├── SECRET_KEY
│       ├── JWT settings
│       └── Geofence thresholds
│
├── database/
│   ├── base.py                      # SQLAlchemy declarative base
│   ├── session.py                   # Engine, SessionLocal, get_db()
│   └── init_db.py                   # Table creation, seed users
│
├── models/
│   ├── user_model.py                # User table (roles, hierarchy)
│   ├── attendance_model.py          # Attendance check-in records
│   ├── task_model.py                # Task assignments
│   ├── location_log_model.py        # GPS tracking with sensors
│   ├── audit_log_model.py           # Action audit trail
│   └── enums.py                     # Role, TaskStatus enums
│
├── schemas/
│   └── schemas.py                   # Pydantic models (validation)
│       ├── UserCreate, UserLogin
│       ├── AttendanceCreate, AttendanceResponse
│       ├── TaskCreate, TaskUpdate, TaskResponse
│       ├── LocationLogCreate, LocationLogResponse
│       └── etc.
│
├── services/
│   ├── geofence_service.py          # Polygon & circular geofence logic
│   │   ├── point_in_polygon() - ray-casting
│   │   ├── point_in_circle()
│   │   └── GeofenceService class
│   │
│   ├── spoof_service.py             # GPS spoof detection (5 methods)
│   │   ├── detect_gps_jump()
│   │   ├── detect_speed_violation()
│   │   ├── detect_sensor_movement_mismatch()
│   │   ├── detect_stationary_movement_mismatch()
│   │   ├── detect_location_replay()
│   │   └── analyze_spoof_risk() - comprehensive analysis
│   │
│   ├── audit_service.py             # Audit logging
│   │   └── log_action()
│   │
│   └── auth_service.py              # Token & password utilities
│       ├── hash_password()
│       ├── verify_password()
│       └── token operations
│
├── routes/
│   ├── auth.py                      # POST /auth/login
│   ├── attendance.py                # POST/GET /attendance
│   ├── tasks.py                     # POST/GET /tasks, complete
│   ├── tracking.py                  # POST/GET /tracking/location
│   ├── users.py                     # GET /users/me, /users/{id}
│   └── admin.py                     # GET /admin/users, reports, stats
│
├── utils/
│   ├── security.py                  # Password hashing, JWT, RBAC
│   │   ├── hash_password()
│   │   ├── verify_password()
│   │   ├── create_access_token()
│   │   ├── decode_access_token()
│   │   ├── get_current_user() - dependency
│   │   └── require_role() - decorator
│   │
│   └── helpers.py                   # Utility functions
│       ├── calculate_distance() - haversine
│       ├── calculate_speed()
│       ├── point_in_polygon()
│       └── timestamp utils
│
├── tests/
│   ├── test_models.py               # Model tests
│   └── test_services.py             # Service tests
│
├── uploads/                         # Task image storage
│
├── requirements.txt                 # Dependencies
├── .env.example                     # Configuration template
├── README.md                        # Project overview
├── API_REFERENCE.md                 # API endpoints guide
└── DEVELOPMENT.md                   # This file
```

---

## 💡 Code Patterns

### 1. Adding a New API Endpoint

**Step 1: Create Schema (schemas.py)**
```python
class MyRequestModel(BaseModel):
    field1: str
    field2: int = 10  # optional with default

    @field_validator('field1')
    def validate_field1(cls, v):
        if len(v) < 3:
            raise ValueError('Must be at least 3 chars')
        return v
```

**Step 2: Create Route (routes/myroute.py)**
```python
from fastapi import APIRouter, Depends
from database.session import get_db
from utils.security import get_current_user

router = APIRouter(prefix="/myendpoint", tags=["MyEndpoint"])

@router.post("/")
def my_endpoint(
    request: MyRequestModel,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Logic here
    return {"result": "success"}
```

**Step 3: Register Router (main.py)**
```python
from routes.myroute import router as myroute_router

app.include_router(myroute_router)
```

### 2. Adding Role-Based Protection

```python
from fastapi import APIRouter, Depends
from utils.security import get_current_user, require_role

@router.get("/admin-only")
def admin_endpoint(
    current_user: User = Depends(get_current_user),
    _: None = Depends(require_role("state_admin"))
):
    return {"message": "Admin only"}
```

### 3. Database Query Pattern

```python
from sqlalchemy import select

@router.get("/items")
def get_items(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Filter by current user's role
    stmt = select(Attendance).where(
        Attendance.user_id == current_user.id
    ).order_by(Attendance.created_at.desc())
    
    results = db.execute(stmt).scalars().all()
    return {"total": len(results), "records": results}
```

### 4. Audit Logging Pattern

```python
from services.audit_service import log_action

log_action(
    db=db,
    user_id=current_user.id,
    action="ATTENDANCE_MARKED",
    resource_type="attendance",
    resource_id=attendance.id,
    status="success",
    details={"latitude": 18.5204, "longitude": 73.8567},
    ip_address=request.client.host
)
```

### 5. Error Handling Pattern

```python
from fastapi import HTTPException, status

@router.post("/")
def my_endpoint(request: MyRequest):
    # Validation error
    if condition:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid input"
        )
    
    # Not found error
    user = db.query(User).get(user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Permission error
    if user.district != current_user.district:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Insufficient permissions"
        )
```

---

## 📚 Additional Resources

- **FastAPI Docs**: https://fastapi.tiangolo.com
- **SQLAlchemy Docs**: https://docs.sqlalchemy.org
- **Pydantic Docs**: https://docs.pydantic.dev
- **PostgreSQL Docs**: https://www.postgresql.org/docs

---

## 🔄 Development Workflow

1. **Create feature branch**
   ```bash
   git checkout -b feature/my-feature
   ```

2. **Make changes**
   - Write code
   - Create tests
   - Test locally

3. **Run tests**
   ```bash
   pytest
   ```

4. **Check code quality**
   ```bash
   pip install pylint
   pylint models/
   ```

5. **Commit & Push**
   ```bash
   git commit -m "feat: add new feature"
   git push origin feature/my-feature
   ```

6. **Create Pull Request**
   - Link to issue
   - Describe changes
   - Request review

---

## 📞 Getting Help

- Check `/docs` endpoint in running server
- Review `API_REFERENCE.md` for endpoint details
- Check `README.md` for quick start
- Review logs in console output
- Check database directly with psql

---

**Last Updated**: 2024  
**Python Version**: 3.10+  
**FastAPI Version**: 0.104.1+
