# Mobile App API Integration Guide

Complete reference for integrating the React Native mobile app with the GeoSentinel OS backend.

## API Client Setup

### Base Configuration

**File:** `services/apiService.js`

```javascript
import axios from 'axios';

const BASE_URL = process.env.VITE_API_BASE_URL || 'http://localhost:8000';

let authToken = null;

const client = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,  // 10 second timeout
});

// Inject Bearer token in Authorization header
client.interceptors.request.use((config) => {
  const next = { ...config };
  next.headers = { ...(next.headers || {}) };
  if (authToken) {
    next.headers.Authorization = `Bearer ${authToken}`;
  }
  return next;
});

export const setAuthToken = (token) => {
  authToken = token || null;
};

export const apiRequest = async (method, path, data = null, config = {}) => {
  const response = await client.request({
    method,
    url: path,
    data,
    ...config,
  });
  return response.data;
};

export const getApiClient = () => client;
```

## Endpoint Reference

### Authentication

#### POST `/auth/login`

Mark attendance with GPS location.

**Request:**
```json
{
  "name": "john_worker",
  "password": "secure_password_min_8",
  "role": "worker",
  "district": "Pune",          // Optional, for admins
  "taluka": "Pune Taluka"      // Optional, for admins
}
```

**Response (Success):**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "user": {
    "id": 1,
    "name": "john_worker",
    "role": "worker",
    "district": "Pune",
    "taluka": "Pune Taluka"
  }
}
```

**Response (Error):**
```json
{
  "detail": "Invalid credentials"
}
```

**Implementation:**
```javascript
import { apiRequest, setAuthToken } from './services/apiService';

const login = async (name, password, role, district, taluka) => {
  try {
    const response = await apiRequest('POST', '/auth/login', {
      name,
      password,
      role,
      district,    // Optional
      taluka,      // Optional
    });

    setAuthToken(response.access_token);

    return {
      token: response.access_token,
      user: response.user,
    };
  } catch (error) {
    throw error;
  }
};
```

---

### Attendance Management

#### POST `/attendance`

Mark attendance with GPS location, geofence validation, and spoof detection.

**Request:**
```json
{
  "latitude": 18.5204,
  "longitude": 73.8567,
  "accuracy": 5.2,                    // GPS accuracy in meters
  "accelerometer_x": 0.234,           // m/s²
  "accelerometer_y": -0.156,          // m/s²
  "accelerometer_z": 9.81,            // m/s²
  "geofence_valid": true,             // Client-side validation
  "spoof_risk_level": "safe",         // safe | warning | danger
  "wifi_ssid": "cellular"             // Optional network info
}
```

**Response (Success):**
```json
{
  "id": 123,
  "user_id": 1,
  "latitude": 18.5204,
  "longitude": 73.8567,
  "accuracy": 5.2,
  "geofence_valid": true,
  "timestamp": "2024-03-24T10:30:00+00:00",
  "message": "Attendance marked successfully"
}
```

**Response (Error):**
```json
{
  "detail": "Location outside authorized geofence"
}
```

**Client Implementation:**
```javascript
import { getCurrentLocation } from './services/gpsService';
import * as geofenceService from './services/geofenceService';
import * as spoofDetectionService from './services/spoofDetectionService';

const markAttendance = async () => {
  // Get location
  const location = await getCurrentLocation();

  // Get accelerometer data
  const accelData = await getAccelerometerData();

  // Validate geofence
  const geofence = geofenceService.getGeofence('pune_taluka');
  const isInGeofence = geofenceService.isWithinGeofence(
    location.latitude,
    location.longitude,
    geofence
  );

  // Check for spoof
  const spoofRisk = spoofDetectionService.analyzeSpoofRisk(
    location,
    previousLocation,
    accelData
  );

  // Submit
  const response = await apiRequest('POST', '/attendance', {
    latitude: location.latitude,
    longitude: location.longitude,
    accuracy: location.accuracy,
    accelerometer_x: accelData.x,
    accelerometer_y: accelData.y,
    accelerometer_z: accelData.z,
    geofence_valid: isInGeofence,
    spoof_risk_level: spoofRisk.riskLevel,
  });

  return response;
};
```

---

### Location Tracking

#### POST `/tracking/location`

Log continuous location updates during day.

**Request:**
```json
{
  "latitude": 18.5204,
  "longitude": 73.8567,
  "accuracy": 8.5,
  "altitude": 120.5,                  // Optional, meters above sea level
  "speed": 2.3,                       // Optional, m/s
  "heading": 45.0,                    // Optional, degrees
  "accelerometer_x": 0.05,
  "accelerometer_y": 0.12,
  "accelerometer_z": 9.81
}
```

**Response:**
```json
{
  "id": 456,
  "user_id": 1,
  "latitude": 18.5204,
  "longitude": 73.8567,
  "anomaly_detected": false,
  "anomaly_reason": null,
  "timestamp": "2024-03-24T10:35:00+00:00"
}
```

**Client Implementation:**
```javascript
const logLocation = async (location, accelData) => {
  const response = await apiRequest('POST', '/tracking/location', {
    latitude: location.latitude,
    longitude: location.longitude,
    accuracy: location.accuracy,
    altitude: location.altitude,
    speed: location.speed,
    heading: location.heading,
    accelerometer_x: accelData.x,
    accelerometer_y: accelData.y,
    accelerometer_z: accelData.z,
  });

  return response;
};

// In background tracking task
backgroundLocationService.defineBackgroundLocationTask((location) => {
  const accelData = await getAccelerometerData();
  await logLocation(location, accelData);
});
```

#### GET `/tracking/locations`

Get list of logged locations (role filtered).

**Response:**
```json
[
  {
    "id": 456,
    "latitude": 18.5204,
    "longitude": 73.8567,
    "accuracy": 8.5,
    "anomaly_detected": false,
    "timestamp": "2024-03-24T10:35:00+00:00"
  },
  {
    "id": 457,
    "latitude": 18.5208,
    "longitude": 73.8571,
    "accuracy": 7.2,
    "anomaly_detected": true,
    "anomaly_reason": "Speed violation: 150 km/h",
    "timestamp": "2024-03-24T10:40:00+00:00"
  }
]
```

**Client Implementation:**
```javascript
const fetchLocations = async () => {
  const locations = await apiRequest('GET', '/tracking/locations');
  return locations;
};
```

---

### Task Management

#### GET `/tasks`

Get list of tasks assigned to user.

**Response:**
```json
[
  {
    "id": 1,
    "title": "Repair Street Light",
    "description": "Fix broken street light on Main St",
    "due_at": "2024-03-24T17:00:00+00:00",
    "status": "pending",
    "expected_latitude": 18.5204,
    "expected_longitude": 73.8567,
    "created_at": "2024-03-24T09:00:00+00:00",
    "before_image_proof": null,
    "after_image_proof": null
  },
  {
    "id": 2,
    "title": "Door-to-door survey",
    "description": "Collect survey responses from residents",
    "due_at": "2024-03-25T18:00:00+00:00",
    "status": "in_progress",
    "before_image_proof": "uploads/task_2_before_1711270800.jpg",
    "after_image_proof": null
  }
]
```

**Client Implementation:**
```javascript
const fetchTasks = async () => {
  const tasks = await apiRequest('GET', '/tasks');
  return tasks;
};
```

---

### Task Proof Upload

#### POST `/upload`

Upload proof image for task (before/after).

**Request (Multipart Form Data):**
```
POST /upload
Content-Type: multipart/form-data

task_id: 1
stage: "before"              // "before" or "after"
proof: <binary JPEG data>
captured_latitude: 18.5204
captured_longitude: 73.8567
captured_at: "2024-03-24T10:30:00+00:00"
```

**Response:**
```json
{
  "id": 1,
  "task_id": 1,
  "stage": "before",
  "proof_path": "uploads/task_1_before_1711270800.jpg",
  "uploaded_at": "2024-03-24T10:30:30+00:00",
  "message": "Proof uploaded successfully"
}
```

**Client Implementation:**
```javascript
import * as ImagePicker from 'expo-image-picker';

const uploadProof = async (taskId, stage) => {
  // Capture image
  const result = await ImagePicker.launchCameraAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    aspect: [4, 3],
    quality: 0.8,
  });

  if (result.canceled) return;

  const uri = result.assets[0].uri;

  // Get current location for validation
  const location = await getCurrentLocation();

  // Upload
  const formData = new FormData();
  formData.append('task_id', taskId);
  formData.append('stage', stage);       // "before" or "after"
  formData.append('proof', {
    uri,
    type: 'image/jpeg',
    name: `task_${taskId}_${stage}.jpg`,
  });
  formData.append('captured_latitude', location.latitude);
  formData.append('captured_longitude', location.longitude);
  formData.append('captured_at', new Date().toISOString());

  const response = await apiRequest('POST', '/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  return response;
};
```

---

### Offline Sync

#### POST `/sync/bulk`

Bulk upload of offline-queued attendance and location records.

**Request:**
```json
{
  "attendance": [
    {
      "latitude": 18.5204,
      "longitude": 73.8567,
      "accuracy": 5.2,
      "accelerometer_x": 0.234,
      "accelerometer_y": -0.156,
      "accelerometer_z": 9.81,
      "geofence_valid": true,
      "spoof_risk_level": "safe"
    }
  ],
  "locations": [
    {
      "latitude": 18.5208,
      "longitude": 73.8571,
      "accuracy": 8.5,
      "altitude": 120.5,
      "speed": 2.3,
      "accelerometer_x": 0.05,
      "accelerometer_y": 0.12,
      "accelerometer_z": 9.81
    }
  ]
}
```

**Response:**
```json
{
  "attendance_inserted": 1,
  "attendance_duplicates": 0,
  "locations_inserted": 5,
  "locations_duplicates": 0,
  "anomaly_count": 1,
  "message": "Bulk sync completed"
}
```

**Client Implementation:**
```javascript
import * as syncService from './services/syncService';

const syncOfflineData = async () => {
  const result = await syncService.syncAllOfflineData((progress) => {
    console.log(`${progress.type}: ${progress.current}/${progress.total}`);
  });

  if (result.success) {
    console.log(`Synced ${result.totalSynced} records`);
  } else {
    console.error(`Sync failed: ${result.error}`);
  }
};
```

---

### User Management

#### GET `/users`

Get list of all users (admin only).

**Response:**
```json
[
  {
    "id": 1,
    "name": "john_worker",
    "role": "worker",
    "district": "Pune",
    "taluka": "Pune Taluka"
  },
  {
    "id": 2,
    "name": "admin_user",
    "role": "taluka_admin",
    "district": "Pune",
    "taluka": "Pune Taluka"
  }
]
```

**Client Implementation:**
```javascript
const fetchUsers = async () => {
  const users = await apiRequest('GET', '/users');
  return users;
};
```

---

## Error Handling

### Common HTTP Status Codes

| Code | Meaning | Client Action |
|------|---------|---------------|
| 200 | Success | Process response |
| 400 | Bad Request | Check request format |
| 401 | Unauthorized | Re-authenticate (show login) |
| 403 | Forbidden | User lacks permission |
| 404 | Not Found | Resource doesn't exist |
| 409 | Conflict | Duplicate data |
| 500 | Server Error | Retry or show error message |

### Error Response Format

```json
{
  "detail": "Location outside authorized geofence"
}
```

### Client Error Handling

```javascript
const apiRequest = async (method, path, data) => {
  try {
    const response = await client.request({
      method,
      url: path,
      data,
    });
    return response.data;
  } catch (error) {
    // Handle different error types
    if (error.response) {
      // Server responded with error
      const status = error.response.status;
      const detail = error.response.data.detail;

      if (status === 401) {
        // Token expired, redirect to login
        handleAuthenticationError();
      } else if (status === 400) {
        // Validation error
        console.error(`Validation error: ${detail}`);
      } else if (status === 409) {
        // Duplicate found, skip
        console.warn(`Duplicate: ${detail}`);
      } else {
        // Generic error
        console.error(`Error: ${detail}`);
      }
      throw new Error(detail);
    } else if (error.request) {
      // No response from server (offline)
      throw new Error('Network error - offline');
    } else {
      // Request setup error
      throw error;
    }
  }
};
```

---

## Data Validation

### Client-Side Validation

Before sending to server:

```javascript
// GPS coordinates
const isValidLatitude = (lat) => lat >= -90 && lat <= 90;
const isValidLongitude = (lon) => lon >= -180 && lon <= 180;

// Accelerometer data
const isValidAcceleration = (accel) => {
  return typeof accel === 'number' && isFinite(accel);
};

// Spoof risk level
const isValidRiskLevel = (level) => {
  return ['safe', 'warning', 'danger'].includes(level);
};

const validateAttendanceData = (data) => {
  if (!isValidLatitude(data.latitude)) {
    throw new Error('Invalid latitude');
  }
  if (!isValidLongitude(data.longitude)) {
    throw new Error('Invalid longitude');
  }
  if (data.accuracy < 0 || data.accuracy > 1000) {
    throw new Error('Invalid accuracy');
  }
  return true;
};
```

---

## Rate Limiting

API enforces rate limits:
- **10 requests per second** per user
- **1000 requests per hour** per user

When limit exceeded:
```json
{
  "detail": "Rate limit exceeded. Retry after 60 seconds"
}
```

**Client Handling:**
```javascript
const apiRequest = async (method, path, data) => {
  try {
    return await client.request({ method, url: path, data });
  } catch (error) {
    if (error.response?.status === 429) {
      // Rate limited - implement exponential backoff
      await new Promise(resolve => setTimeout(resolve, 5000));
      return apiRequest(method, path, data); // Retry
    }
    throw error;
  }
};
```

---

## Request/Response Examples

### Login Flow

```javascript
// 1. User enters credentials
const credentials = {
  name: 'john_worker',
  password: 'secure_pass_123',
  role: 'worker',
};

// 2. Send login request
const response = await apiRequest('POST', '/auth/login', credentials);

// 3. Store token
setAuthToken(response.access_token);

// 4. Save user info
const user = response.user;
localStorage.setItem('user', JSON.stringify(user));
```

### Attendance Submission Flow

```javascript
// 1. On "Mark Attendance" button press
const location = await getCurrentLocation();
const accelData = await getAccelerometerData();

// 2. Client-side validation
const geofence = geofenceService.getGeofence('pune_taluka');
const isInGeofence = geofenceService.isWithinGeofence(
  location.latitude, location.longitude, geofence
);

// 3. Prepare submission
const attendanceData = {
  latitude: location.latitude,
  longitude: location.longitude,
  accuracy: location.accuracy,
  accelerometer_x: accelData.x,
  accelerometer_y: accelData.y,
  accelerometer_z: accelData.z,
  geofence_valid: isInGeofence,
  spoof_risk_level: spoofRisk.riskLevel,
};

// 4. Submit or queue
try {
  const response = await apiRequest('POST', '/attendance', attendanceData);
  showSuccess('Attendance recorded');
} catch (error) {
  if (isOffline) {
    await storageService.queueAttendance(attendanceData);
    showWarning('Queued for sync when online');
  } else {
    showError(error.message);
  }
}
```

### Offline Sync Flow

```javascript
// 1. Detect when online
const isOnline = await wifiService.isNetworkConnected();

// 2. If online and has queue
if (isOnline && queueStatus.totalPending > 0) {
  // 3. Get all queued data
  const attendance = await storageService.getAttendanceQueue();
  const locations = await storageService.getLocationQueue();

  // 4. Bulk upload
  const result = await apiRequest('POST', '/sync/bulk', {
    attendance: attendance.map(({ id, queuedAt, ...data }) => data),
    locations: locations.map(({ id, queuedAt, ...data }) => data),
  });

  // 5. Clear on success
  if (result) {
    await storageService.clearAttendanceQueue();
    await storageService.clearLocationQueue();
    showSuccess(`Synced ${result.attendance_inserted + result.locations_inserted} records`);
  }
}
```

---

## Testing API Integration

### Using Command Line (curl)

```bash
# Login
curl -X POST http://localhost:8000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "name": "john_worker",
    "password": "secure_password",
    "role": "worker"
  }'

# Mark attendance (with token)
curl -X POST http://localhost:8000/attendance \
  -H "Authorization: Bearer eyJhbGc..." \
  -H "Content-Type: application/json" \
  -d '{
    "latitude": 18.5204,
    "longitude": 73.8567,
    "accuracy": 5.2,
    "accelerometer_x": 0.234,
    "accelerometer_y": -0.156,
    "accelerometer_z": 9.81,
    "geofence_valid": true,
    "spoof_risk_level": "safe"
  }'
```

### Using Postman

1. Create collection `GeoSentinel OS`
2. Add requests for each endpoint
3. Use environment variables for BASE_URL and token
4. Export collection for team sharing

### Unit Test Example

```javascript
import { describe, it, expect } from '@jest/globals';
import { apiRequest, setAuthToken } from '../services/apiService';

describe('API Integration', () => {
  let token;

  it('should login successfully', async () => {
    const response = await apiRequest('POST', '/auth/login', {
      name: 'test_user',
      password: 'test_password',
      role: 'worker',
    });

    token = response.access_token;
    expect(token).toBeDefined();
    expect(response.user.name).toBe('test_user');
  });

  it('should mark attendance', async () => {
    setAuthToken(token);

    const response = await apiRequest('POST', '/attendance', {
      latitude: 18.5204,
      longitude: 73.8567,
      accuracy: 5.2,
      accelerometer_x: 0.234,
      accelerometer_y: -0.156,
      accelerometer_z: 9.81,
      geofence_valid: true,
      spoof_risk_level: 'safe',
    });

    expect(response.id).toBeDefined();
    expect(response.latitude).toBe(18.5204);
  });
});
```

---

## Performance Tips

1. **Batch Requests**: Send multiple records in /sync/bulk instead of individual requests
2. **Compress Data**: Use gzip for large payloads
3. **Cache Responses**: Store task list locally, refresh periodically
4. **Lazy Load**: Don't fetch all users/locations on app start
5. **Error Retry**: Use exponential backoff for failed requests
