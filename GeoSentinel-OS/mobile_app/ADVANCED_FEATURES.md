# GeoSentinel OS - Advanced Mobile App

Production-grade React Native mobile app with advanced sensor-based location tracking, real-time spoof detection, offline data synchronization, and battery-efficient background tracking.

## 🚀 Key Features

### 1. **Advanced Sensor Integration**
- **GPS Tracking** - High-accuracy location capture with background mode support
- **Accelerometer** - Motion detection for spoof identification
- **WiFi Scanning** - Network status monitoring for location validation
- **Bluetooth Detection** - Nearby device detection for environment context
- **Battery Optimization** - Adaptive tracking based on battery level

### 2. **Spoof Detection Engine**
Multi-layer detection system analyzes GPS + sensor data:
- **GPS Jump Detection** - Flags impossible speeds (>200 km/h)
- **Sensor-Movement Mismatch** - Detects GPS spoofing with static sensors
- **Pattern Replay Detection** - Identifies repeated location sequences
- **Stationary Mismatch** - Flags high acceleration with static GPS

### 3. **Geofence Validation**
Client-side polygon-based geofence checking:
- Point-in-polygon ray-casting algorithm for fast validation
- Proximity alerts when near boundary (<100m)
- Multiple geofence support with hierarchical lookup
- Offline-capable geofence database

### 4. **Offline-First Architecture**
Complete offline support with automatic sync:
- Local SQLite-like storage via AsyncStorage (queue-based)
- Automatic queue management for attendance, locations, uploads
- Intelligent retry mechanism with duplicate detection  
- Auto-sync when network reconnects

### 5. **Background Location Tracking**
Continuous tracking even when app is backgrounded:
- Location updates every 10 seconds (battery-aware)
- Works with Screen Off and App Closed
- System foreground service for visibility
- Automatic pause/resume based on battery

### 6. **Battery-Efficient Design**
Smart power management:
- Adaptive accuracy based on battery level
- GPS: High accuracy (normal) → Balanced (medium) → Low (critical)
- Frequency adaptation: 5s → 30s → 60s intervals
- Power consumption estimation
- Automatic sensor disable at critical (<10%) battery

## 📁 Project Structure

```
mobile_app/
├── App.js                          # Main app entry, auth navigation
├── package.json                    # Dependencies (Expo, expo-location, etc.)
│
├── screens/
│   ├── LoginScreen.js              # Authentication with role selection
│   ├── WorkerDashboard.js          # Main dashboard with tracking control
│   ├── AttendanceScreen.js         # GPS + geofence + spoof check
│   ├── TaskScreen.js               # Task list with offline support
│   └── UploadScreen.js             # Camera + proof upload
│
└── services/
    ├── apiService.js               # Axios HTTP client with auth
    ├── authService.js              # Login/logout functions
    ├── gpsService.js               # Basic GPS utilities
    │
    ├── backgroundLocationService.js # Background tracking with task-manager
    ├── geofenceService.js          # Polygon geofence validation
    ├── spoofDetectionService.js    # Advanced spoof analysis
    ├── storageService.js           # Offline queue management
    ├── syncService.js              # Bulk sync with dedup
    │
    ├── wifiService.js              # Network info & SSID scanning
    ├── bluetoothService.js         # Bluetooth device detection
    └── batteryOptimizationService.js # Power management
```

## 🛠 Service Details

### Core Services

#### `backgroundLocationService.js`
Manages background location tracking using Expo TaskManager:
```javascript
// Start background tracking
await backgroundLocationService.startBackgroundTracking({
  accuracy: Location.Accuracy.High,
  timeInterval: 10000,        // 10 seconds
  distanceInterval: 10,       // 10 meters
});

// Subscribe to location updates
backgroundLocationService.defineBackgroundLocationTask((location) => {
  console.log(location); // { latitude, longitude, accuracy, ... }
});

// Check status
const isActive = await backgroundLocationService.isBackgroundTrackingActive();

// Stop when needed
await backgroundLocationService.stopBackgroundTracking();
```

#### `geofenceService.js`
Polygon-based offline geofence validation:
```javascript
import * as geofenceService from './services/geofenceService';

// Check if point is inside geofence
const isInside = geofenceService.isWithinGeofence(
  18.5204, 73.8567,
  geofenceService.getGeofence('pune_taluka')
);

// Get distance to boundary
const distance = geofenceService.getDistanceToGeofenceBoundary(
  18.5204, 73.8567,
  geofenceService.getGeofence('pune_taluka')
);

// Validate against multiple geofences
const results = geofenceService.validateAgainstGeofences(lat, lon, [
  geofenceService.getGeofence('pune_taluka'),
  geofenceService.getGeofence('baner_area'),
]);
```

#### `spoofDetectionService.js`
Multi-layer spoof analysis:
```javascript
import * as spoofDetectionService from './services/spoofDetectionService';

// Comprehensive analysis
const analysis = spoofDetectionService.analyzeSpoofRisk(
  currentLocation,    // { latitude, longitude, timestamp }
  previousLocation,   // Previous reading
  sensorData,         // { accelerometer_x, y, z }
  locationHistory     // Array of recent locations
);

// Returns:
// {
//   isSpoofed: boolean,
//   riskLevel: 'safe' | 'warning' | 'danger',
//   score: 0-100,
//   detections: [{ type, severity, reason }],
//   analysisDetails: {
//     gpsJump: { detected, reason, speedKmh, distanceM },
//     sensorMismatch: { detected, reason },
//     stationaryMismatch: { detected, reason },
//     patternReplay: { detected, reason }
//   }
// }

// Quick check (lightweight)
const quick = spoofDetectionService.quickSpoofCheck(
  currentLocation,
  previousLocation,
  sensorData
);
```

#### `storageService.js`
Offline queue management:
```javascript
import * as storageService from './services/storageService';

// Queue data for offline
await storageService.queueAttendance({
  latitude: 18.5204,
  longitude: 73.8567,
  geofence_valid: true
});

// Get queue status
const status = await storageService.getQueueStatus();
// { attendance: 3, locations: 5, uploads: 1, totalPending: 9 }

// Clear after sync
await storageService.clearAttendanceQueue();

// Manual queue access
const queue = await storageService.getAttendanceQueue();
```

#### `syncService.js`
Intelligent offline-to-online sync:
```javascript
import * as syncService from './services/syncService';

// Bulk sync all queued data
const result = await syncService.syncAllOfflineData((progress) => {
  console.log(`${progress.phase}: ${progress.current}/${progress.total}`);
});

// Returns:
// {
//   success: boolean,
//   method: 'bulk' | 'individual',
//   attendance: { synced, duplicates/failed },
//   locations: { synced, duplicates, anomalies },
//   totalSynced: number,
//   totalDuplicates: number
// }

// Setup automatic sync when online
const cleanup = syncService.setupAutoSync((result) => {
  console.log(`Auto-synced ${result.totalSynced} records`);
});
```

#### `batteryOptimizationService.js`
Power management and diagnostics:
```javascript
import * as batteryOptimizationService from './services/batteryOptimizationService';

// Get battery status
const status = await batteryOptimizationService.getBatteryStatus();
// { level, state, isCharging, isLow, isCritical }

// Get optimized settings based on battery
const accuracy = await batteryOptimizationService.getOptimizedLocationAccuracy();
// {
//   accuracy: Location.Accuracy.High,
//   level: 'medium',
//   timeInterval: 15000,
//   distanceInterval: 10
// }

// Apply all optimizations
const settings = await batteryOptimizationService.applyBatteryOptimization();

// Get recommendations
const recs = await batteryOptimizationService.getBatteryRecommendations();
```

#### `wifiService.js` & `bluetoothService.js`
Network & device detection:
```javascript
import * as wifiService from './services/wifiService';
import * as bluetoothService from './services/bluetoothService';

// WiFi info
const wifi = await wifiService.getWiFiInfo();
// { isConnected, isInternetReachable, type, ipAddress }

// Bluetooth scan
const devices = await bluetoothService.startBluetoothScan(5000);
// [ { id, name, rssi, connectable } ]

// Watch network changes
const cleanup = wifiService.watchNetworkConnectivity((state) => {
  console.log(state.isConnected);
});
```

## 🔐 Authentication & Security

Login with role-based access:
```javascript
// LoginScreen handles:
// - Name field (required)
// - Password field (min 8 chars)
// - Role dropdown (worker/taluka_admin/district_admin/state_admin)
// - District/Taluka selection for admins
// - JWT token generation and storage
```

## 📍 How AttendanceScreen Works

```
1. GPS Lock
   ├─ Request high-accuracy location
   ├─ Validate against bounds (-90/90, -180/180)
   └─ Store GPS + accuracy

2. Sensor Collection
   ├─ Read accelerometer (x, y, z)
   ├─ Calculate magnitude
   └─ Store for spoof analysis

3. Geofence Check
   ├─ Load user's district/taluka geofences
   ├─ Point-in-polygon test
   ├─ Calculate distance to boundary
   └─ Alert if outside or near edge

4. Spoof Detection
   ├─ Compare with previous location
   ├─ Analyze GPS jump/speed
   ├─ Check sensor-GPS consistency
   └─ Risk assessment

5. Network Detection
   ├─ Check WiFi/cellular connectivity
   ├─ Validate optional SSID
   └─ Record connection type

6. Battery Check
   ├─ Get current battery level
   ├─ Warn if low (<20%)
   └─ Adjust accuracy if needed

7. Submit or Queue
   ├─ If online → POST /attendance
   ├─ If offline → Store in AsyncStorage
   └─ Show confirmation with details
```

## 📊 Offline Queue Schema

**AsyncStorage Keys:**
```
- attendance_queue: [
    {
      id: "att_1234_rand",
      latitude, longitude, accuracy,
      accelerometer_x/y/z,
      geofence_valid, spoof_risk_level,
      wifi_ssid,
      queuedAt: ISO timestamp
    }
  ]

- location_queue: [
    { id, latitude, longitude, accuracy, queuedAt }
  ]

- upload_queue: [
    { id, task_id, stage, file_path, captured_at, queuedAt }
  ]

- sync_status: { lastSync: ISO timestamp }

- offline_mode: { isOffline: boolean }
```

## 🔄 Sync Flow

```
┌─ Device Offline ──→ Queue Data ──→ Store in AsyncStorage ──┐
│                                                              │
│                                                              │
└───────────────────────────────────────────────────────────┘
                        (network restored)
                              ↓
          ┌─────────────────────────────────────┐
          │   Detect Online + Auto Trigger Sync  │
          └─────────────────────────────────────┘
                              ↓
          ┌─────────────────────────────────────┐
          │    POST /sync/bulk                   │
          │    {                                 │
          │      attendance: [...],              │
          │      locations: [...]                │
          │    }                                 │
          └─────────────────────────────────────┘
                              ↓
          ┌─────────────────────────────────────┐
          │  Server:                            │
          │  - Check duplicates (UNIQUE)         │
          │  - Run anomaly detection             │
          │  - Store records                     │
          │  - Return counts                     │
          └─────────────────────────────────────┘
                              ↓
          ┌─────────────────────────────────────┐
          │  Client:                            │
          │  - Clear queues                      │
          │  - Update lastSync timestamp         │
          │  - Show sync summary                 │
          └─────────────────────────────────────┘
```

## ⚙️ Configuration

### Geofences (hardcoded)
Location: `services/geofenceService.js`

```javascript
export const DEFAULT_GEOFENCES = {
  pune_taluka: {
    name: "Pune Taluka",
    coordinates: [
      { lat: 18.5204, lon: 73.8567 },
      // ... more points forming a polygon
    ]
  }
};
```

### Trusted WiFi SSIDs
Location: `services/wifiService.js`

```javascript
const TRUSTED_SSIDS = ["Office-Wifi", "GeoSentinel-NET", "Corporate-Network"];

// Add custom SSID:
wifiService.addTrustedSSID("Home-Network");
```

### Spoof Detection Thresholds
Location: `services/spoofDetectionService.js`

- **Max speed**: 200 km/h
- **GPS jump threshold**: 500 meters
- **Sensor mismatch**: Moved >50m but <0.5 m/s² acceluation change
- **Pattern replay**: 5 of last 5 readings within 5 meters

### Battery Thresholds
Location: `services/batteryOptimizationService.js`

```javascript
BATTERY_THRESHOLDS = {
  CRITICAL: 10,  // <10% triggers minimal tracking
  LOW: 20,       // <20% triggers reduced frequency
  MEDIUM: 50,    // <50% triggers balanced mode
  NORMAL: 100    // >50% = full accuracy
};
```

## 📦 Installation

```bash
cd mobile_app
npm install

# Install expo globally if needed
npm install -g expo-cli

# Start app
npm start

# Run on Android
npm run android

# Run on iOS
npm run ios
```

## 🔗 Backend Integration

### Required Environment Variables
Create `.env` file in `mobile_app/`:
```
VITE_API_BASE_URL=http://your-backend:8000
VITE_JWT_SECRET=your_jwt_secret
```

Update `services/apiService.js` if needed:
```javascript
const BASE_URL = process.env.VITE_API_BASE_URL || "http://localhost:8000";
```

### API Endpoints Used
- `POST /auth/login` - Authentication
- `POST /attendance` - Mark attendance
- `POST /tracking/location` - Log location
- `POST /upload` - Upload proof
- `GET /tasks` - Fetch tasks
- `POST /sync/bulk` - Bulk offline sync

## 🐛 Debugging

Enable verbose logging:
```javascript
// In any service, logs are already included
// Watch console output in development:
npm start  // Then press 'i' or 'a' to view logs
```

Check offline queue:
```javascript
import * as storage from './services/storageService';

const status = await storage.getQueueStatus();
console.log(status); // See pending records
```

## 📈 Battery & Performance Tips

1. **Reduce location frequency**
   - Increase `distanceInterval` to 25-50 meters
   - Increase `timeInterval` to 30-60 seconds

2. **Disable background tracking when not needed**
   - Only enable for specific work hours
   - Toggle from WorkerDashboard

3. **Reduce sensor monitoring**
   - Accelerometer updates are 500ms, can increase to 1000ms
   - Disable Bluetooth scanning when battery <30%

4. **Manual sync on WiFi**
   - Trigger sync only when on WiFi networks
   - Disable auto-sync on cellular for large queues

## 🔄 Troubleshooting

### Background Tracking Not Working
1. Check OS permissions: Settings → GeoSentinel → Location
2. Select "Allow All the Time" (not "While Using App")
3. Enable Battery Optimization exceptions

### Spoof Detection False Positives
1. Check accelerometer calibration
2. Ensure location has <30m accuracy
3. Verify geofence coordinates are correct

### Sync Failing
1. Check network connectivity (toggle WiFi)
2. Verify API base URL in apiService.js
3. Check server logs for duplicate constraint violations
4. Use manual sync button to re-trigger

## 📚 Additional Resources

- [Expo Documentation](https://docs.expo.dev)
- [React Native Sensors](https://github.com/react-native-sensors)
- [Point-in-Polygon Algorithm](https://wrf.ecse.rpi.edu/Research/Short_Notes/pnpoly.html)
- [Haversine Distance Formula](https://en.wikipedia.org/wiki/Haversine_formula)
