# GeoSentinel OS Backend

A production-ready FastAPI backend for municipal workforce tracking with GPS validation and spoof detection.

## 🎯 Features

- **Role-Based Access Control (RBAC)** - Hierarchical roles: state_admin → district_admin → taluka_admin → worker
- **JWT Authentication** - Secure token-based authentication with bcrypt password hashing
- **GPS-Based Attendance** - Mark attendance with GPS coordinates and automatic validation
- **Geofence Validation** - Verify worker locations against allowed work areas (polygon & circular)
- **Spoof Detection** - Rule-based detection of spoofed GPS (jumps, speed violations, sensor mismatches)
- **Location Tracking** - Continuous GPS logging with accelerometer data and anomaly detection
- **Task Management** - Assign tasks with location expectations and proof of completion
- **Offline Support** - Queue data locally and sync when online
- **Audit Logging** - Complete action audit trail for compliance
- **PostgreSQL** - Production-grade database with proper indexing

## 📋 Prerequisites

- Python 3.10+
- PostgreSQL 12+
- pip / venv

## ⚡ Quick Start

### 1. Install Dependencies

```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### 2. Configure Database

```bash
# Create PostgreSQL database
createdb geosentinel_db

# Update .env with database URL
cp .env.example .env
# Edit .env and set DATABASE_URL
```

### 3. Initialize Database

```bash
python -m database.init_db
```

This creates all tables and seeds default users:
- **State Admin**: admin@geosentinel.gov / admin123
- **District Admin**: district@geosentinel.gov / district123
- **Taluka Admin**: taluka@geosentinel.gov / taluka123
- **Worker**: worker@geosentinel.gov / worker123

### 4. Run Server

```bash
uvicorn main:app --reload
```

Server will start at `http://localhost:8000`

API docs available at: `http://localhost:8000/docs`

## 🔐 Authentication

All endpoints (except `/auth/login` and `/health`) require JWT Bearer token.

### Login Flow

```bash
# 1. POST /auth/login
curl -X POST http://localhost:8000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "worker@geosentinel.gov",
    "password": "worker123"
  }'

# Response:
{
  "access_token": "eyJhbGci...",
  "token_type": "bearer",
  "user": {
    "id": 4,
    "name": "Sample Worker",
    "email": "worker@geosentinel.gov",  
    "role": "worker",
    "state": "Maharashtra",
    "district": "Pune",
    "taluka": "Hadapsar",
    "is_active": true
  }
}

# 2. Use token in subsequent requests
curl -X POST http://localhost:8000/attendance \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "latitude": 18.5204,
    "longitude": 73.8567,
    "accuracy": 10
  }'
```

## 📍 Core API Endpoints

### Authentication
- `POST /auth/login` - Login and get JWT token
- `POST /auth/refresh` - Refresh token

### Attendance
- `POST /attendance` - Mark attendance with GPS
- `GET /attendance` - Get attendance records (admin only)

### Tasks  
- `POST /tasks` - Create task (admin only)
- `GET /tasks` - Get tasks based on role
- `POST /tasks/{id}/complete` - Complete task with proof

### Location Tracking
- `POST /tracking/location` - Log GPS with sensor data
- `GET /tracking/locations` - Get location history

### User Management
- `GET /users/me` - Get current user info
- `GET /users/{id}` - Get user by ID (admin only)

### Admin Operations
- `GET /admin/users` - List all users (state admin only)
- `GET /admin/reports/attendance` - Attendance report
- `GET /admin/reports/spoof-detections` - Spoof detection report
- `GET /admin/stats` - System statistics

## 🗂️ Project Structure

```
backend/
├── main.py                      # FastAPI application entry point
├── requirements.txt             # Python dependencies
├── .env.example                 # Environment variables template
├── config/
│   └── settings.py             # Configuration management
├── database/
│   ├── base.py                 # SQLAlchemy Base
│   ├── session.py              # Database session management
│   └── init_db.py              # Database initialization
├── models/
│   ├── user_model.py           # User - hierarchical roles
│   ├── attendance_model.py      # Attendance with GPS validation
│   ├── task_model.py           # Task management
│   ├── location_log_model.py    # Location tracking with sensor data
│   ├── audit_log_model.py       # Audit trail
│   └── enums.py                # Role and TaskStatus enums
├── schemas/
│   └── schemas.py              # Pydantic request/response models
├── services/
│   ├── geofence_service.py     # Polygon & circular geofence validation
│   ├── spoof_service.py        # GPS spoof detection (4-layer)
│   ├── audit_service.py        # Audit logging
│   └── auth_service.py         # JWT & password utilities
├── routes/
│   ├── auth.py                 # /auth/* endpoints
│   ├── attendance.py           # /attendance/* endpoints
│   ├── tasks.py                # /tasks/* endpoints
│   ├── tracking.py             # /tracking/* endpoints
│   ├── users.py                # /users/* endpoints
│   └── admin.py                # /admin/* endpoints
└── utils/
    ├── security.py             # Password hashing, JWT, RBAC
    └── helpers.py              # Distance calculation, helpers
```

## 🛡️ Security Features

1. **Password Hashing** - bcrypt with configurable rounds
2. **JWT Tokens** - HS256 signed, expiring every 24 hours
3. **Role-Based Access Control** - Hierarchical permission model
4. **Input Validation** - Pydantic schemas validate all inputs
5. **SQL Injection Protection** - SQLAlchemy parameterized queries
6. **CORS Middleware** - Configurable cross-origin policies
7. **Audit Logging** - All actions logged with user ID and timestamp

## 🚀 Spoof Detection

Four-layer detection algorithm:

1. **GPS Jump Detection** - Flags movements >500km (impossible)
2. **Speed Violation** - Flags speed >200 km/h unrealistic
3. **Sensor-Movement Mismatch** - GPS moved 50m+ but <0.5 m/s² acceleration
4. **Stationary-Movement Mismatch** - GPS static <10m but >15 m/s² acceleration

Returns risk level: `safe` (0-24) | `warning` (25-49) | `danger` (50+)

## 🗺️ Geofence Configuration

Three geofences pre-configured:

```python
# Polygon geofence (ray-casting algorithm)
"pune_taluka": {
    "type": "polygon",
    "coordinates": [
        (18.3174, 73.8620),
        (18.3215, 73.8941),
        (18.5495, 73.8941),
        (18.5495, 73.8620),
    ]
}

# Circular geofence (center + radius)
"baner_balewadi": {
    "type": "circle",
    "center": (18.5620, 73.8060),
    "radius_km": 2.0
}
```

## 📊 Database Schema

### User Hierarchy
- **state_admin** - Manages all districts  
- **district_admin** - Manages assigned district workers
- **taluka_admin** - Manages assigned taluka workers
- **worker** - Can mark attendance and complete tasks

### Key Tables
| Table | Purpose |
|-------|---------|
| users | User accounts with hierarchical roles |
| attendance | Check-in records with GPS and validation status |
| tasks | Work assignments with location expectations |
| location_logs | Continuous GPS tracking with sensor data |
| audit_logs | Complete action audit trail |

## 🧪 Testing with Postman

### 1. Import Collection
Environment variables: `base_url=http://localhost:8000`

### 2. Login Flow
```json
POST {{base_url}}/auth/login
{
  "email": "worker@geosentinel.gov",
  "password": "worker123"
}
```

### 3. Save Token
Extract `access_token` from response and set in Authorization header.

### 4. Mark Attendance
```json
POST {{base_url}}/attendance
Authorization: Bearer {{token}}
{
  "latitude": 18.5204,
  "longitude": 73.8567,
  "accuracy": 10,
  "geofence_validated": true,
  "spoof_check": "safe"
}
```

## 📈 Performance Considerations

1. **Database Indexing** - Indexes on: user_id, timestamp, email, role
2. **Query Optimization** - Use `select()` with proper filtering
3. **Connection Pooling** - SQLAlchemy pool_size=10, max_overflow=20
4. **JWT Caching** - Tokens valid for 24 hours
5. **Async Ready** - FastAPI supports async route handlers

## 🚀 Production Deployment

### Pre-Deployment Checklist

- [ ] Change SECRET_KEY to random 32-character string
- [ ] Set DEBUG=False in settings
- [ ] Configure PostgreSQL with production credentials
- [ ] Set CORS_ORIGINS to specific domains
- [ ] Enable HTTPS/SSL
- [ ] Set up log aggregation
- [ ] Configure backup strategy for database
- [ ] Set up monitoring and alerting

### Deploy with Gunicorn

```bash
pip install gunicorn
gunicorn main:app --workers 4 --worker-class uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000
```

## 📝 API Response Format

All responses follow a consistent format:

```json
{
  "access_token": "...",
  "token_type": "bearer",
  "user": {...},
  "total": 10,
  "records": [...],
  "success": true,
  "error": null
}
```

## 🐛 Troubleshooting

**Database Connection Error**
```bash
# Check PostgreSQL is running
psql -U postgres -d geosentinel_db -c "SELECT version();"

# Verify DATABASE_URL in .env
```

**JWT Token Errors**
- Ensure token is sent in Authorization header: `Bearer <token>`
- Check token hasn't expired (24 hour expiration)
- Verify SECRET_KEY matches between token creation and verification

**Import Errors**
```bash
# Reinstall dependencies
pip install --upgrade -r requirements.txt
```

## 📞 Support

For issues or questions:
1. Check API docs at `/docs`
2. Review logs in console output
3. Check database connectivity with `psql`

## 📄 License

Proprietary - GeoSentinel OS

---

**Version**: 1.0.0  
**Last Updated**: 2024  
**API Docs**: http://localhost:8000/docs
