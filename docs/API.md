# Smart Municipal Tracker – API Documentation

Base URL: `http://localhost:5000/api`

All protected endpoints require:
```
Authorization: Bearer <JWT_TOKEN>
```

---

## Authentication

### POST /auth/login
Login and receive a JWT.

**Request Body**
```json
{ "username": "admin", "password": "admin123" }
```
**Response**
```json
{
  "token": "<jwt>",
  "role": "admin",
  "name": "Admin User",
  "id": 1
}
```

### POST /auth/register
Register a new user (admin or worker).

**Request Body**
```json
{
  "username": "worker3",
  "password": "secret",
  "name":     "New Worker",
  "role":     "worker",
  "phone":    "9876543212",
  "zone_id":  1
}
```

---

## Attendance

### POST /attendance/checkin *(auth required)*
Record a GPS check-in. Validates geo-fence if worker has an assigned zone.

**Request Body**
```json
{ "latitude": 18.5204, "longitude": 73.8567 }
```

**Response (201)**
```json
{
  "id": 1,
  "user_id": 2,
  "check_in_time": "2026-03-24 10:00:00",
  "latitude": 18.5204,
  "longitude": 73.8567,
  "zone_status": "within"
}
```

**Error (403 – outside zone)**
```json
{
  "error": "You are outside your assigned work zone",
  "distance_metres": 312.5,
  "allowed_radius": 200
}
```

### POST /attendance/checkout *(auth required)*
Record a GPS check-out.

**Request Body** *(optional)*
```json
{ "latitude": 18.5210, "longitude": 73.8570 }
```

### GET /attendance/today *(auth required)*
Returns today's attendance records. Admins see all workers; workers see their own.

### GET /attendance/history *(auth required)*
Returns recent attendance history (last 50 per worker, last 100 for admin).

---

## Tasks

### GET /tasks *(auth required)*
List tasks. Admins see all; workers see only their assigned tasks.

### POST /tasks *(admin only)*
Create a task.

**Request Body**
```json
{
  "title":       "Fix pothole on MG Road",
  "description": "Large pothole near signal",
  "assigned_to": 2,
  "zone_id":     1,
  "priority":    "high",
  "due_date":    "2026-03-28"
}
```

### GET /tasks/:id *(auth required)*

### PUT /tasks/:id *(auth required)*
Admin can update any field. Workers can only update `status`.

**Allowed statuses:** `pending`, `in_progress`, `completed`

### DELETE /tasks/:id *(admin only)*

---

## Workers

### GET /workers *(admin only)*
List all workers with their zone info.

### GET /workers/:id *(auth required)*
Get a specific worker's profile.

### PUT /workers/:id *(auth required)*
Update profile. Admins can also change `zone_id`.

### GET /workers/locations *(admin only)*
Returns the most recent GPS location for every worker.

### GET /workers/zones *(auth required)*
List all work zones.

### POST /workers/zones *(admin only)*
Create a new work zone.

**Request Body**
```json
{
  "name":          "South District",
  "lat":           18.4900,
  "lon":           73.8200,
  "radius_metres": 350
}
```

---

## Images

### POST /images/upload *(auth required)*
Upload a before/after work photo (multipart form).

| Field       | Type   | Required | Notes                          |
|-------------|--------|----------|--------------------------------|
| image       | file   | ✅       | jpg/png/gif, max 16 MB         |
| task_id     | int    | —        | Linked task                    |
| image_type  | string | —        | `before` (default) or `after`  |
| latitude    | float  | —        | GPS latitude                   |
| longitude   | float  | —        | GPS longitude                  |
| notes       | string | —        | Free-text notes                |

### GET /images/task/:task_id *(auth required)*
Get all images for a task.

### GET /images/file/:filename *(auth required)*
Serve a stored image.

---

## Health

### GET /health
```json
{ "status": "ok" }
```
