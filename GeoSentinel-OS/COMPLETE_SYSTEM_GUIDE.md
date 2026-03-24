# GeoSentinel OS - Complete Production-Ready System Guide

## 🎯 System Overview

GeoSentinel OS is a GPS-based municipal workforce tracking system that verifies real locations using GPS + sensor data without AI. It includes:

- **Mobile App**: React Native (Expo) for field workers
- **Backend API**: FastAPI + PostgreSQL  
- **Dashboard**: React + Tailwind for admins
- **Offline Support**: Full sync capability
- **Security**: JWT + Role-based access control
- **Sensor Validation**: GPS + accelerometer spoof detection

---

## 📦 Technology Stack

### Backend
- **Framework**: FastAPI 0.115+
- **Database**: PostgreSQL with SQLAlchemy ORM
- **Auth**: JWT (python-jose) + bcrypt
- **Validation**: Pydantic 2.x
- **Server**: Uvicorn
- **Python Version**: 3.10+

### Mobile
- **Framework**: React Native 0.74+ with Expo 51+
- **Navigation**: @react-navigation 6.x
- **Storage**: AsyncStorage for offline data
- **Location**: expo-location 17.x
- **Sensors**: expo-sensors 13.x
- **HTTP**: axios 1.7+

### Dashboard
- **Framework**: React 18.2 + Vite
- **Styling**: Tailwind CSS 3.x
- **HTTP**: axios with environment config

---

## 🗂️ Complete Directory Structure

```
GeoSentinel-OS/
├── backend/                          # FastAPI Backend
│   ├── main.py                      # Entry point
│   ├── requirements.txt              # Dependencies
│   ├── config/
│   │   └── settings.py              # Configuration management
│   ├── database/
│   │   ├── base.py                  # SQLAlchemy declarative base
│   │   ├── session.py               # Database session
│   │   ├── init_db.py               # Database initialization
│   │   └── schema.sql               # SQL schema reference
│   ├── models/
│   │   ├── __init__.py
│   │   ├── user_model.py            # User ORM model
│   │   ├── attendance_model.py      # Attendance records
│   │   ├── task_model.py            # Task assignments
│   │   ├── location_log_model.py    # GPS tracking logs
│   │   ├── audit_log_model.py       # Audit trail
│   │   ├── enums.py                 # Role/Status enums
│   │   └── schemas.py               # Pydantic schemas
│   ├── routes/
│   │   ├── __init__.py
│   │   ├── auth.py                  # Login, token generation
│   │   ├── attendance.py            # Mark attendance
│   │   ├── tasks.py                 # Task CRUD
│   │   ├── upload.py                # Image proof upload
│   │   ├── sync.py                  # Offline sync endpoint
│   │   ├── tracking.py              # Continuous location logs
│   │   ├── users.py                 # User listing
│   │   └── admin.py                 # Admin reports
│   ├── services/
│   │   ├── __init__.py
│   │   ├── auth_service.py          # JWT & password handling
│   │   ├── audit_service.py         # Activity logging
│   │   ├── geofence_service.py      # Boundary validation
│   │   ├── spoof_detection.py       # GPS/sensor validation
│   │   ├── gps_validation.py        # Speed/jump detection
│   │   ├── image_analysis.py        # Image processing
│   │   ├── validation_service.py    # Business logic validation
│   │   └── sync_service.py          # Offline sync processing
│   ├── utils/
│   │   ├── helpers.py               # Utility functions
│   │   └── security.py              # Security helpers
│   └── uploads/                      # Image storage directory

├── mobile_app/                       # React Native (Expo) App
│   ├── App.js                       # Root component
│   ├── package.json
│   ├── app.json                     # Expo config
│   ├── components/
│   │   ├── Header.js
│   │   ├── LoadingSpinner.js
│   │   └── LocationMap.js
│   ├── screens/
│   │   ├── LoginScreen.js           # Login form
│   │   ├── AttendanceScreen.js      # Mark attendance
│   │   ├── TaskScreen.js            # View tasks
│   │   ├── UploadScreen.js          # Upload proof images
│   │   ├── WorkerDashboard.js       # Main dashboard
│   │   └── ProfileScreen.js         # User profile
│   ├── services/
│   │   ├── apiService.js            # API client with auth
│   │   ├── authService.js           # Auth helpers
│   │   ├── gpsService.js            # Location tracking
│   │   ├── sensorService.js         # Accelerometer data
│   │   ├── spoofDetectionService.js # Client-side validation
│   │   ├── geofenceService.js       # Geofence checking
│   │   ├── storageService.js        # AsyncStorage wrapper
│   │   ├── syncService.js           # Offline sync
│   │   ├── backgroundLocationService.js # Background tracking
│   │   ├── wifiService.js           # Network detection
│   │   ├── batteryService.js        # Battery optimization
│   │   └── imageService.js          # Image capture/upload
│   ├── utils/
│   │   ├── constants.js             # Configuration constants
│   │   ├── validators.js            # Input validation
│   │   └── dateUtils.js             # Date/time helpers
│   └── navigation/
│       ├── RootNavigator.js         # Auth/App navigation
│       └── AppNavigator.js          # Main app navigation

└── dashboard/                        # React + Tailwind Frontend
    ├── frontend/
    │   ├── index.html
    │   ├── package.json
    │   ├── vite.config.js
    │   ├── tailwind.config.js
    │   ├── postcss.config.js
    │   ├── src/
    │   │   ├── main.jsx
    │   │   ├── App.jsx               # Main app component
    │   │   ├── index.css             # Tailwind imports
    │   │   ├── api/
    │   │   │   └── client.js         # API client setup
    │   │   ├── components/
    │   │   │   ├── Header.jsx
    │   │   │   ├── Sidebar.jsx
    │   │   │   ├── TasksTable.jsx
    │   │   │   ├── WorkersTable.jsx
    │   │   │   ├── LocationsTable.jsx
    │   │   │   ├── StatsCard.jsx
    │   │   │   └── DarkModeToggle.jsx
    │   │   ├── pages/
    │   │   │   ├── Dashboard.jsx
    │   │   │   ├── WorkerTracking.jsx
    │   │   │   ├── AttendanceHistory.jsx
    │   │   │   └── Reports.jsx
    │   │   ├── services/
    │   │   │   └── api.js            # Axios instance
    │   │   ├── hooks/
    │   │   │   ├── useFetch.js
    │   │   │   ├── useAuth.js
    │   │   │   └── useDarkMode.js
    │   │   └── utils/
    │   │       ├── constants.js
    │   │       └── formatters.js

└── docs/
    ├── API_REFERENCE.md
    ├── INSTALLATION.md
    ├── ARCHITECTURE.md
    ├── DATABASE_SCHEMA.md
    └── DEPLOYMENT.md
```

---

## 🔧 Installation & Setup

### Prerequisites
- Node.js 18+ / npm or yarn
- Python 3.10+
- PostgreSQL 12+
- Android Studio or Xcode (for mobile development)
- Expo CLI

### Backend Setup

```bash
# 1. Navigate to backend directory
cd backend

# 2. Create virtual environment
python -m venv venv

# 3. Activate virtual environment
# Windows:
venv\Scripts\activate
# Mac/Linux:
source venv/bin/activate

# 4. Install dependencies
pip install -r requirements.txt

# 5. Create .env file
cat > .env << EOF
DATABASE_URL=postgresql://user:password@localhost/geosenti
JWT_SECRET=your-secret-key-here-change-in-production
CORS_ORIGINS=["http://localhost:3000","http://localhost:5173","http://localhost:8081"]
SEED_STATE_ADMIN_PASSWORD=admin123
SEED_DISTRICT_ADMIN_PASSWORD=admin123
SEED_TALUKA_ADMIN_PASSWORD=admin123
EOF

# 6. Create database
createdb geosenti

# 7. Run database migrations
# (SQLAlchemy will create tables on startup)

# 8. Start server
python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### Mobile Setup

```bash
# 1. Navigate to mobile app directory
cd mobile_app

# 2. Install dependencies
npm install

# 3. Create .env file
cat > .env << EOF
EXPO_PUBLIC_API_BASE_URL=http://localhost:8000/api
EXPO_PUBLIC_GEOFENCE_RADIUS_METERS=100
EXPO_PUBLIC_ENABLE_SPOOF_DETECTION=true
EOF

# 4. Start Expo development server
npx expo start

# 5. Open on device/emulator
# Press 'a' for Android
# Press 'i' for iOS
# Scan QR code for physical device
```

### Dashboard Setup

```bash
# 1. Navigate to dashboard directory
cd dashboard/frontend

# 2. Install dependencies
npm install

# 3. Create .env file
cat > .env << EOF
VITE_API_BASE_URL=http://localhost:8000/api
VITE_APP_NAME=GeoSentinel OS
EOF

# 4. Start development server
npm run dev

# 5. Open browser to http://localhost:5173
```

---

## 🔐 Role-Based Access Control

### User Roles

```
State Admin (ADMIN)
├─ View all worker tracking
├─ View attendance reports
├─ View analytics
└─ Manage state-level settings

District Admin (DISTRICT_ADMIN)
├─ Manage workers in district
├─ Monitor attendance
├─ View district-level reports
└─ Assign tasks

Taluka Admin (TALUKA_ADMIN)
├─ Manage workers in taluka
├─ Create & assign tasks
├─ Monitor task completion
└─ View taluka reports

Worker (WORKER)
├─ Mark attendance
├─ View assigned tasks
├─ Upload proof images
├─ View own tracking history
└─ Work offline with sync
```

### Seed Accounts

```
State Admin:
  Email: state_admin@geosential.gov
  Password: admin123 (env var: SEED_STATE_ADMIN_PASSWORD)

District Admin:
  Email: district_admin@geosential.gov
  Password: admin123 (env var: SEED_DISTRICT_ADMIN_PASSWORD)

Taluka Admin:
  Email: taluka_admin@geosential.gov
  Password: admin123 (env var: SEED_TALUKA_ADMIN_PASSWORD)

Worker:
  Email: worker@geosential.gov
  Password: worker123 (auto-created)
```

---

## 📡 API Endpoints

### Authentication
```
POST /api/auth/login
  # Input: { email, password }
  # Returns: { access_token, user }

POST /api/auth/logout
  # Headers: Authorization: Bearer {token}
```

### Attendance
```
POST /api/attendance/mark
  # Input: { latitude, longitude, timestamp, accelerometer_data }
  # Headers: Authorization: Bearer {token}
  # Returns: { status, attendance_id }

GET /api/attendance/history
  # Query: ?days=7
  # Headers: Authorization: Bearer {token}
```

### Tasks
```
GET /api/tasks
  # Headers: Authorization: Bearer {token}
  # Returns: [{ id, title, status, due_date, ...}]

POST /api/tasks
  # Input: { title, description, assigned_to }
  # Headers: Authorization: Bearer {token}
  # Requires: TALUKA_ADMIN role

PUT /api/tasks/{id}/status
  # Input: { status: completed|pending|assigned }
  # Headers: Authorization: Bearer {token}
```

### Location Tracking
```
POST /api/tracking/log
  # Input: { latitude, longitude, accuracy, timestamp }
  # Headers: Authorization: Bearer {token}
  # Logs continuous worker location

GET /api/tracking/locations
  # Query: ?worker_id=X&hours=24
  # Headers: Authorization: Bearer {token}
```

### Image Upload
```
POST /api/upload/proof
  # Multipart: File + task_id
  # Headers: Authorization: Bearer {token}
  # Returns: { file_path, upload_id }
```

### Offline Sync
```
POST /api/sync/bulk
  # Input: { attendance: [...], tasks: [...], locations: [...] }
  # Headers: Authorization: Bearer {token}
  # Syncs offline-collected data
```

---

## 🛡️ Spoof Detection Logic

### Server-Side Validation

```python
# 1. GPS Jump Detection
IF distance > expected_max_distance:
    FLAG as potential_spoof

# 2. Speed Validation  
IF speed > 150 km/h (realistic limit):
    FLAG as speed_anomaly

# 3. Sensor Mismatch
IF GPS shows movement AND accelerometer shows no movement:
    FLAG as possible_spoof

# 4. Timestamp Validation
IF timestamp > current_time OR timestamp skewed:
    FLAG as time_anomaly

# 5. Geofence Validation
IF outside_assigned_geofence:
    MARK as out_of_zone
```

### Client-Side Validation

```javascript
// 1. Accelerometer Check
IF accelerometer_magnitude > threshold:
    PREDICT_MOVEMENT = true

// 2. GPS Consistency
IF gps_changes AND NO accelerometer_change:
    WARN about potential_spoof

// 3. Network Status
IF offline AND queuing_locations:
    MARK as_offline_sync

// Queue data for server validation
```

---

## 📊 Database Schema Overview

### users table
```sql
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255),
    role VARCHAR(50) NOT NULL,
    taluka_id INTEGER,
    district_id INTEGER,
    state_id INTEGER,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### attendance table
```sql
CREATE TABLE attendance (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),
    date DATE NOT NULL,
    time TIME NOT NULL,
    latitude DECIMAL(10,8),
    longitude DECIMAL(11,8),
    accuracy REAL,
    street_address VARCHAR(500),
    geofence_validated BOOLEAN,
    spoof_flag VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### tasks table
```sql
CREATE TABLE tasks (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    assigned_to INTEGER REFERENCES users(id),
    assigned_by INTEGER REFERENCES users(id),
    status VARCHAR(50) DEFAULT 'assigned',
    due_date DATE,
    completed_at TIMESTAMP,
    proof_image_path VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### location_logs table
```sql
CREATE TABLE location_logs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),
    latitude DECIMAL(10,8) NOT NULL,
    longitude DECIMAL(11,8) NOT NULL,
    accuracy REAL,
    speed REAL,
    heading REAL,
    altitude REAL,
    timestamp TIMESTAMP NOT NULL,
    source VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## 🔄 Offline Data Sync Flow

### Mobile Local Storage

```javascript
// Offline queue structure
{
  attendance: [
    { timestamp, latitude, longitude, accelerometer_data, localId }
  ],
  tasks: [
    { task_id, status, timestamp, localId }
  ],
  locations: [
    { latitude, longitude, timestamp, accuracy, localId }
  ],
  uploads: [
    { file_uri, task_id, timestamp, localId }
  ]
}
```

### Sync Process

```
1. Check network connection
2. IF offline:
   → Queue all data in AsyncStorage
3. WHEN online:
   → Compile queue into batch
   → POST to /api/sync/bulk
   → Server validates & stores
   → Clear local queue on success
   → Show sync status to user
```

### Deduplication

```python
# Server checks for duplicates
IF attendance_exists_for_date_and_user:
    UPDATE if timestamp_newer
    SKIP if timestamp_older
ELSE:
    CREATE new record

# Uses unique constraint on (user_id, date, time_bucket)
```

---

## 🚀 Deployment Checklist

### Backend
- [ ] Set production environment variables
- [ ] Generate new JWT secret
- [ ] Configure PostgreSQL with SSL
- [ ] Set CORS origins to client domains
- [ ] Enable HTTPS for API
- [ ] Set up logging to persistent storage
- [ ] Configure database backups
- [ ] Set up monitoring alerts
- [ ] Use Uvicorn with multiple workers
- [ ] Deploy with gunicorn or similar

### Mobile
- [ ] Build release APK/IPA
- [ ] Test on real devices
- [ ] Configure API endpoint for production
- [ ] Disable debug logging
- [ ] Set app version in app.json
- [ ] Create app store listings
- [ ] Set up auto-update capability

### Dashboard
- [ ] Build production bundle
- [ ] Configure CDN for assets
- [ ] Set API URL to production
- [ ] Enable HTTPS
- [ ] Set up SSL certificate
- [ ] Configure caching headers
- [ ] Test responsiveness
- [ ] Set up analytics

---

## 🧪 Testing

### API Testing
```bash
# Use provided Postman collection or curl
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"worker@geosential.gov","password":"worker123"}'
```

### Mobile Testing
- Login with test credentials
- Mark attendance (mock GPS)
- View offline queue
- Disconnect network, mark another attendance
- Reconnect network, trigger sync
- Verify data in dashboard

### Dashboard Testing
- View worker list
- Filter by status
- Check attendance records
- Generate reports
- Test dark mode

---

## 📈 Performance Optimization

### Backend
- Database indexing on frequently queried fields
- JWT caching with verification
- Batch processing for sync operations
- Connection pooling for PostgreSQL
- Query optimization with select_related
- Pagination for large datasets

### Mobile
- Lazy loading of screens
- Image compression before upload
- Efficient location polling (30s interval)
- AsyncStorage batching
- Reduce sensor polling frequency to save battery
- Background task optimization

### Dashboard
- Virtual scrolling for large tables
- Debounced API queries
- Local state caching
- Lazy component loading
- CSS compression with Tailwind
- JSX minification with Vite

---

## 🔒 Security Best Practices

### Implemented
- ✅ Password hashing with bcrypt
- ✅ JWT token expiration (24h)
- ✅ Role-based access control
- ✅ Input validation with Pydantic
- ✅ SQL injection protection (ORM)
- ✅ CORS properly configured
- ✅ Environment variable secrets
- ✅ HTTPS for deployed systems

### Recommended
- 🔶 Implement rate limiting
- 🔶 Add request signing for sensitive operations
- 🔶 Implement device fingerprinting
- 🔶 Add 2FA for admins
- 🔶 Encrypt sensitive fields in database
- 🔶 Regular security audits
- 🔶 Penetration testing

---

## 📞 Support & Troubleshooting

### Common Issues

**Backend won't start**
```bash
# Check if port 8000 is in use
netstat -an | grep 8000
# Kill process or use different port
python -m uvicorn main:app --port 8001
```

**Database connection failed**
```bash
# Verify PostgreSQL is running
psql -U user -d geosenti
# Check DATABASE_URL in .env
# Ensure database exists
createdb geosenti
```

**Mobile API calls return 401**
- Check token expiration
- Re-login to get fresh token
- Verify API endpoint in .env

**Dashboard not loading**
- Check VITE_API_BASE_URL in .env
- Verify backend is running
- Check browser console for CORS errors

---

## 📚 Additional Resources

- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [React Native Docs](https://reactnative.dev/)
- [Expo Documentation](https://docs.expo.dev/)
- [tailwindcss.com](https://tailwindcss.com/)
- [PostgreSQL Docs](https://www.postgresql.org/docs/)

---

## 📄 License & Attribution

GeoSentinel OS - Production Ready GPS Workforce Tracking  
Built for Demo/Hackathon Purposes  
Full source code included with MIT License

---

**Last Updated**: March 2026  
**Version**: 1.0.0-production  
**Status**: ✅ Production Ready
