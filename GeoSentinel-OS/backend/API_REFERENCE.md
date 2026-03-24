# GeoSentinel OS Backend - API Quick Reference

## 🔑 Authentication Headers

All requests (except login) require:
```
Authorization: Bearer <access_token>
Content-Type: application/json
```

## 📚 API Endpoints Reference

### 1️⃣ AUTH - `/auth`

#### Login
```
POST /auth/login
Body: {
  "email": "string",
  "password": "string"
}
Response: {
  "access_token": "string",
  "token_type": "bearer",
  "user": { user_object }
}
```

#### Refresh Token
```
POST /auth/refresh
Response: {
  "access_token": "string",
  "token_type": "bearer"
}
```

---

### 2️⃣ ATTENDANCE - `/attendance`

#### Mark Attendance
```
POST /attendance
Body: {
  "latitude": 18.5204,        // Required: -90 to 90
  "longitude": 73.8567,       // Required: -180 to 180
  "accuracy": 10,             // Optional: GPS accuracy in meters
  "geofence_validated": true, // Optional: override validation
  "spoof_check": "safe",      // Optional: validated by backend
  "notes": "string"           // Optional: admin notes
}
Response: {
  "id": 1,
  "user_id": 4,
  "latitude": 18.5204,
  "longitude": 73.8567,
  "timestamp": "2024-01-15T10:30:45Z",
  "geofence_validated": true,
  "spoof_check": "safe",
  "accuracy": 10,
  "notes": "string"
}
```

#### Get Attendance Records
```
GET /attendance
Query Params:
  - user_id?: number (admin only)
  - days?: number (default 7)
Response: {
  "total": 10,
  "records": [ attendance_objects ]
}
```

**Access Control**:
- **Worker**: Can only see own records
- **Taluka Admin**: Can see records in their taluka
- **District Admin**: Can see records in their district
- **State Admin**: Can see all records

---

### 3️⃣ TASKS - `/tasks`

#### Create Task
```
POST /tasks
Body: {
  "title": "Survey the Market Area",
  "description": "string",
  "assigned_to": 4,                    // Required: worker ID
  "expected_latitude": 18.5200,        // Optional: expected GPS
  "expected_longitude": 73.8570,
  "geofence_id": "pune_taluka",        // Optional
  "due_date": "2024-01-20T17:00:00Z"  // Optional
}
Response: {
  "id": 1,
  "title": "Survey the Market Area",
  "status": "PENDING",
  "assigned_to": 4,
  "assigned_by": 1,
  "created_at": "2024-01-15T10:00:00Z",
  ...
}
```

#### Get Tasks
```
GET /tasks
Query Params:
  - status?: "PENDING" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED"
Response: {
  "total": 5,
  "records": [ task_objects ]
}
```

#### Complete Task
```
POST /tasks/{task_id}/complete
Body: {
  "before_image_path": "/uploads/task_1_before.jpg",  // Optional
  "after_image_path": "/uploads/task_1_after.jpg"      // Optional
}
Response: { updated_task_object }
```

**Access Control**:
- **Worker**: Can only see assigned tasks; can only complete own tasks
- **Admin**: Can create, view, and filter by district/taluka

---

### 4️⃣ TRACKING - `/tracking`

#### Log Location
```
POST /tracking/location
Body: {
  "latitude": 18.5204,              // Required
  "longitude": 73.8567,             // Required
  "accuracy": 10,                   // Optional
  "accel_x": 0.5,                   // Optional: X acceleration (m/s²)
  "accel_y": 0.3,                   // Optional: Y acceleration
  "accel_z": 0.2,                   // Optional: Z acceleration
  "spoof_flag": false,              // Optional: auto-calculated
  "spoof_reason": null              // Optional: auto-calculated
}
Response: {
  "id": 100,
  "user_id": 4,
  "latitude": 18.5204,
  "longitude": 73.8567,
  "timestamp": "2024-01-15T10:30:45Z",
  "accuracy": 10,
  "accelerometer_x": 0.5,
  "accelerometer_y": 0.3,
  "accelerometer_z": 0.2,
  "accelerometer_magnitude": 0.62,  // Auto-calculated: sqrt(x²+y²+z²)
  "spoof_detection_flag": false,
  "spoof_reason": null,
  "is_synced": false                // For offline queue
}
```

#### Get Location History
```
GET /tracking/locations
Query Params:
  - user_id?: number (admin checking specific user)
  - limit?: number (default 100, max 1000)
Response: {
  "total": 50,
  "records": [ location_objects ]
}
```

**Spoof Detection** (Auto-calculated):
- `spoof_detection_flag`: true if risk_level = "danger"
- `spoof_reason`: String explaining which detection(s) triggered
- Risk levels: "safe" (0-24) | "warning" (25-49) | "danger" (50+)

---

### 5️⃣ USERS - `/users`

#### Get Current User
```
GET /users/me
Response: { current_user_object }
```

#### Get User by ID
```
GET /users/{user_id}
Response: { user_object }
```

**Access Control**: Only state admin or the user themselves can view

---

### 6️⃣ ADMIN - `/admin`

#### List All Users
```
GET /admin/users
Access: state_admin only
Response: {
  "total": 10,
  "users": [ user_objects ]
}
```

#### Attendance Report
```
GET /admin/reports/attendance
Query Params:
  - district?: string
  - taluka?: string
Access: admin only (filtered by jurisdiction)
Response: {
  "total": 50,
  "records": [ attendance_objects ]
}
```

#### Spoof Detection Report
```
GET /admin/reports/spoof-detections
Access: admin only
Response: {
  "total": 15,
  "records": [ locations_with_spoof_reason ]
}
```

#### System Statistics
```
GET /admin/stats
Access: admin only
Response: {
  "total_users": 100,
  "total_attendance_records": 5000,
  "total_location_logs": 50000,
  "spoof_detections": 25,
  "by_role": {
    "state_admin": 2,
    "district_admin": 5,
    "taluka_admin": 10,
    "worker": 83
  }
}
```

---

## 🧪 Example: Complete Attendance Flow

### 1. Login as Worker
```bash
curl -X POST http://localhost:8000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "worker@geosentinel.gov",
    "password": "worker123"
  }'

# Response:
# {
#   "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
#   "token_type": "bearer",
#   "user": { "id": 4, "name": "Sample Worker", ... }
# }
```

### 2. Mark Attendance
```bash
curl -X POST http://localhost:8000/attendance \
  -H "Authorization: Bearer eyJhbGc..." \
  -H "Content-Type: application/json" \
  -d '{
    "latitude": 18.5204,
    "longitude": 73.8567,
    "accuracy": 8
  }'

# Response:
# {
#   "id": 1,
#   "user_id": 4,
#   "latitude": 18.5204,
#   "longitude": 73.8567,
#   "timestamp": "2024-01-15T10:30:45Z",
#   "geofence_validated": true,
#   "spoof_check": "safe",
#   "accuracy": 8,
#   "notes": null
# }
```

### 3. Get Attendance Records (as Worker)
```bash
curl -X GET http://localhost:8000/attendance \
  -H "Authorization: Bearer eyJhbGc..."

# Response:
# {
#   "total": 5,
#   "records": [
#     { "id": 1, "timestamp": "2024-01-15T10:30:45Z", ... },
#     { "id": 2, "timestamp": "2024-01-14T10:25:30Z", ... },
#     ...
#   ]
# }
```

### 4. Get Attendance Report (as Admin)
```bash
curl -X GET "http://localhost:8000/admin/reports/attendance?district=Pune" \
  -H "Authorization: Bearer eyJhbGc..."

# Response:
# {
#   "total": 500,
#   "records": [ { ... }, { ... }, ... ]
# }
```

---

## ⚠️ Error Responses

All errors follow this format:

```json
{
  "detail": "Error message explaining what went wrong"
}
```

Common HTTP Status Codes:
- **200**: Success
- **201**: Created
- **400**: Bad request (invalid input)
- **401**: Unauthorized (missing/invalid token)
- **403**: Forbidden (insufficient permissions)
- **404**: Not found
- **422**: Validation error
- **500**: Server error

### Example Error
```
POST /attendance
Body: { "latitude": 999, "longitude": 73 }

Response (422):
{
  "detail": [
    {
      "type": "value_error",
      "loc": ["body", "latitude"],
      "msg": "Latitude must be between -90 and 90",
      "input": 999
    }
  ]
}
```

---

## 🛡️ Spoof Detection Details

Four detection methods analyzed:

1. **GPS Jump**: Distance > 500km between consecutive points
2. **Speed Violation**: Calculated speed > 120 km/h
3. **Sensor-Movement Mismatch**: GPS moved > 50m but acceleration < 0.5 m/s²
4. **Stationary-Movement Mismatch**: GPS within 10m but acceleration > 15 m/s²
5. **Location Replay**: 5+ submissions within 50m radius

**Risk Scoring**:
- Each detection adds points (jump +40, speed +30, sensor +25, stationary +20, replay +35)
- Risk Level:
  - **safe**: 0-24 points
  - **warning**: 25-49 points  
  - **danger**: 50+ points

---

## 🗺️ Geofence Defaults

Three pre-configured geofences:

1. **pune_taluka** (Polygon)
   - Type: Polygon using ray-casting algorithm
   - Coordinates: 4 corners covering Pune taluka area

2. **baner_balewadi** (Circle)
   - Center: (18.5620, 73.8060)
   - Radius: 2.0 km

3. **aundh_market** (Circle)
   - Center: (18.5589, 73.7987)
   - Radius: 1.5 km

---

## 🔗 Useful Links

- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc
- **Health Check**: http://localhost:8000/health
- **API Info**: http://localhost:8000

---

## 📞 Test Credentials

| Role | Email | Password |
|------|-------|----------|
| State Admin | admin@geosentinel.gov | admin123 |
| District Admin | district@geosentinel.gov | district123 |
| Taluka Admin | taluka@geosentinel.gov | taluka123 |
| Worker | worker@geosentinel.gov | worker123 |
