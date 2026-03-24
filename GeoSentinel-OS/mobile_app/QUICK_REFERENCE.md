# Mobile App - Quick Reference Card

## 🚀 Quick Start

```bash
cd mobile_app
npm install
npm start                    # Press 'a' for Android, 'i' for iOS
```

## 📁 Service Import Patterns

```javascript
import * as backgroundLocationService from '../services/backgroundLocationService';
import * as geofenceService from '../services/geofenceService';
import * as spoofDetectionService from '../services/spoofDetectionService';
import * as storageService from '../services/storageService';
import * as syncService from '../services/syncService';
import * as wifiService from '../services/wifiService';
import * as bluetoothService from '../services/bluetoothService';
import * as batteryOptimizationService from '../services/batteryOptimizationService';
import { apiRequest, setAuthToken } from '../services/apiService';
import { getCurrentLocation } from '../services/gpsService';
```

## 🗺️ Geofence Service

| Function | Purpose | Returns |
|----------|---------|---------|
| `isWithinGeofence(lat, lon, geofence)` | Point in polygon check | `boolean` |
| `getDistanceToGeofenceBoundary(lat, lon, geofence)` | Distance to polygon edge | `number` (meters) |
| `getGeofence(name)` | Get geofence by ID | `object \| null` |
| `createGeofence(name, coords)` | Create custom geofence | `{ name, coordinates }` |
| `validateAgainstGeofences(lat, lon, list)` | Check multiple geofences | `{isValid, validGeofences[], nearbyGeofences[]}` |
| `getGeofenceCoverage(lat, lon)` | Get coverage info for location | `{currentLocation, coverage}` |

**Example**:
```javascript
const geofence = geofenceService.getGeofence('pune_taluka');
if (!geofenceService.isWithinGeofence(lat, lon, geofence)) {
  console.warn('Outside geofence!');
}
```

---

## 🕵️ Spoof Detection Service

| Function | Purpose | Returns |
|----------|---------|---------|
| `analyzeSpoofRisk(curr, prev, sensor, history)` | Full spoof analysis | `{isSpoofed, riskLevel, score, detections[], analysisDetails}` |
| `quickSpoofCheck(curr, prev, sensor)` | Fast spoof check | `{isSuspicious, reason, speedKmh}` |

**Risk Levels**: `safe` | `warning` | `danger`  
**Detection Types**: `GPS_JUMP` | `SENSOR_MISMATCH` | `STATIONARY_MISMATCH` | `PATTERN_REPLAY`

**Example**:
```javascript
const risk = spoofDetectionService.analyzeSpoofRisk(
  currentLoc, previousLoc, accelData, locationHistory
);
if (risk.isSpoofed) alert(`⚠️ ${risk.detections[0].reason}`);
```

---

## 📍 Background Location Service

| Function | Purpose | Returns |
|----------|---------|---------|
| `defineBackgroundLocationTask(callback)` | Register background task | `void` |
| `startBackgroundTracking(options)` | Start background GPS | `Promise<boolean>` |
| `stopBackgroundTracking()` | Stop background GPS | `Promise<boolean>` |
| `isBackgroundTrackingActive()` | Check tracking status | `Promise<boolean>` |
| `getCurrentLocation(options)` | Get high-accuracy location | `{lat, lon, accuracy, altitude, speed, heading, timestamp}` |
| `getLastKnownLocation()` | Get cached location (fast) | `{lat, lon, accuracy, timestamp} \| null` |
| `watchLocation(callback, options)` | Stream location updates | `unsubscribe()` |

**Example**:
```javascript
backgroundLocationService.defineBackgroundLocationTask((loc) => {
  console.log(`${loc.latitude}, ${loc.longitude}`);
});

await backgroundLocationService.startBackgroundTracking({
  accuracy: Location.Accuracy.High,
  timeInterval: 10000,
  distanceInterval: 10
});
```

---

## 💾 Storage Service (Offline Queue)

| Function | Purpose | Returns |
|----------|---------|---------|
| `queueAttendance(data)` | Queue attendance record | `Promise<number>` (queue length) |
| `queueLocation(data)` | Queue location record | `Promise<number>` |
| `getAttendanceQueue()` | Get all queued attendance | `Promise<object[]>` |
| `getLocationQueue()` | Get all queued locations | `Promise<object[]>` |
| `getUploadQueue()` | Get all queued uploads | `Promise<object[]>` |
| `getQueueStatus()` | Get queue counts | `{attendance, locations, uploads, totalPending}` |
| `clearAttendanceQueue()` | Clear attendance queue | `Promise<void>` |
| `clearLocationQueue()` | Clear location queue | `Promise<void>` |
| `removeAttendanceFromQueue(id)` | Remove one record | `Promise<void>` |

**Example**:
```javascript
if (isOffline) {
  await storageService.queueAttendance({latitude, longitude, accuracy});
  const status = await storageService.getQueueStatus();
  console.log(`${status.totalPending} records pending`);
}
```

---

## 🔄 Sync Service

| Function | Purpose | Returns |
|----------|---------|---------|
| `syncAllOfflineData(onProgress?)` | Bulk sync all queues | `{success, method, attendance{}, locations{}, totalSynced}` |
| `syncAttendance(onProgress?)` | Sync attendance only | `{success, synced, failed, failedItems[]}` |
| `syncLocations(onProgress?)` | Sync locations only | `{success, synced, failed, failedItems[]}` |
| `setupAutoSync(onComplete?, interval?)` | Auto-sync when online | `cleanup()` |
| `getSyncStats()` | Get sync statistics | `{pending{}, lastSync, isOnline, readyToSync}` |

**Example**:
```javascript
// Auto-sync
syncService.setupAutoSync((result) => {
  console.log(`Synced ${result.totalSynced} records`);
});

// Manual sync
const result = await syncService.syncAllOfflineData((progress) => {
  updateUI(`${progress.current}/${progress.total}`);
});
if (result.success) alert(`✓ Synced ${result.totalSynced}`);
```

---

## 🌐 WiFi Service

| Function | Purpose | Returns |
|----------|---------|---------|
| `getWiFiInfo()` | Get network status | `{isConnected, isInternetReachable, type, ipAddress}` |
| `isNetworkConnected()` | Check online status | `Promise<boolean>` |
| `getCurrentSSID()` | Get WiFi SSID (limited) | `{ssid, bssid, strength, frequency} \| null` |
| `getNetworkDiagnostics()` | Full network info | `{connectivity{}, network{}, timestamp}` |
| `watchNetworkConnectivity(callback)` | Watch network changes | `cleanup()` |
| `addTrustedSSID(ssid)` | Add trusted WiFi | `void` |
| `getTrustedSSIDs()` | Get trusted list | `string[]` |

**Example**:
```javascript
const isOnline = await wifiService.isNetworkConnected();
if (!isOnline) {
  queueAttendance(data);  // Store locally
} else {
  submitAttendance(data); // Send to server
}

wifiService.watchNetworkConnectivity((state) => {
  if (state.isConnected) triggerSync();
});
```

---

## 🔋 Battery Optimization Service

| Function | Purpose | Returns |
|----------|---------|---------|
| `getBatteryStatus()` | Battery level & state | `{level%, state, isCharging, isLow%, isCritical%}` |
| `getOptimizedLocationAccuracy()` | Adaptive accuracy | `{accuracy, level, timeInterval, distanceInterval}` |
| `applyBatteryOptimization(settings?)` | Apply all optimizations | `{applied, settings{}}` |
| `getBatteryRecommendations()` | Tips for low battery | `{batteryLevel, recommendations[]}` |
| `getBatteryDiagnostics()` | Full battery info | `{status, recommendations, consumption, trackingCapability}` |
| `canSustainTracking()` | Can maintain tracking? | `{canTrack, degraded, reason, recommendation}` |
| `watchBatteryLevel(callback)` | Watch battery changes | `cleanup()` |
| `estimatePowerConsumption(duration?)` | Power drain estimate | `{powerConsumption{}, estimatedDrainPercent, estimatedTime}` |

**Battery Levels**:
- **Normal** (>50%) - High accuracy, 5s interval
- **Medium** (20-50%) - Balanced accuracy, 15s interval
- **Low** (<20%) - Reduced accuracy, 30s interval
- **Critical** (<10%) - Minimal tracking, 60s interval

**Example**:
```javascript
const battery = await batteryOptimizationService.getBatteryStatus();
if (battery.isCritical) {
  await backgroundLocationService.stopBackgroundTracking();
}

const accuracy = await batteryOptimizationService.getOptimizedLocationAccuracy();
// Use accuracy.timeInterval for your tracking interval
```

---

## 🎙️ API Service (HTTP Client)

| Function | Purpose | Returns |
|----------|---------|---------|
| `apiRequest(method, path, data?, config?)` | HTTP request | `Promise<response data>` |
| `setAuthToken(token)` | Set JWT auth | `void` |
| `getApiClient()` | Get Axios instance | `axios client` |

**Example**:
```javascript
// POST request
const result = await apiRequest('POST', '/attendance', {
  latitude: 18.5204,
  longitude: 73.8567,
  accuracy: 5.2,
  accelerometer_x: 0.234,
  accelerometer_y: -0.156,
  accelerometer_z: 9.81,
  geofence_valid: true,
  spoof_risk_level: 'safe'
});

// GET request
const tasks = await apiRequest('GET', '/tasks');

// Login
const auth = await apiRequest('POST', '/auth/login', {
  name: 'user',
  password: 'pass',
  role: 'worker'
});
setAuthToken(auth.access_token);
```

---

## 📝 Common Code Patterns

### Mark Attendance (Complete Flow)

```javascript
const markAttendance = async () => {
  // 1. Get location
  const location = await getCurrentLocation();

  // 2. Get sensor data
  const data = await getAccelerometerData();

  // 3. Validate geofence
  const geo = geofenceService.getGeofence('pune_taluka');
  const inGeo = geofenceService.isWithinGeofence(
    location.latitude, location.longitude, geo
  );

  // 4. Check spoof
  const spoof = spoofDetectionService.analyzeSpoofRisk(
    location, prevLocation, data
  );

  // 5. Prepare data
  const attendance = {
    latitude: location.latitude,
    longitude: location.longitude,
    accuracy: location.accuracy,
    accelerometer_x: data.x,
    accelerometer_y: data.y,
    accelerometer_z: data.z,
    geofence_valid: inGeo,
    spoof_risk_level: spoof.riskLevel
  };

  // 6. Submit or queue
  try {
    const result = await apiRequest('POST', '/attendance', attendance);
    alert('✓ Attendance recorded');
  } catch (error) {
    if (!isOnline) {
      await storageService.queueAttendance(attendance);
      alert('Queued for sync');
    } else {
      alert('Error: ' + error.message);
    }
  }
};
```

### Setup Continuous Background Tracking

```javascript
React.useEffect(() => {
  // Define background task
  backgroundLocationService.defineBackgroundLocationTask((location) => {
    // Process or queue location
    storageService.queueLocation(location);
  });

  // Start tracking
  backgroundLocationService.startBackgroundTracking({
    accuracy: Location.Accuracy.High,
    timeInterval: 10000,
    distanceInterval: 10
  });

  // Setup auto-sync
  syncService.setupAutoSync((result) => {
    console.log(`Synced ${result.totalSynced}`);
  });

  // Watch battery
  batteryOptimizationService.watchBatteryLevel((status) => {
    if (status.isCritical) {
      backgroundLocationService.stopBackgroundTracking();
    }
  });

  // Watch network
  wifiService.watchNetworkConnectivity((state) => {
    if (state.isConnected) {
      syncService.syncAllOfflineData();
    }
  });

  return () => {
    backgroundLocationService.stopBackgroundTracking();
  };
}, []);
```

### Monitor Offline State

```javascript
React.useEffect(() => {
  const watchNetwork = wifiService.watchNetworkConnectivity((state) => {
    setIsOnline(state.isConnected);
  });

  const watchBattery = batteryOptimizationService.watchBatteryLevel((status) => {
    setBatteryLevel(status.level);
  });

  const updateQueue = async () => {
    const status = await storageService.getQueueStatus();
    setQueueStatus(status);
  };

  updateQueue();
  const interval = setInterval(updateQueue, 5000);

  return () => {
    watchNetwork?.();
    watchBattery?.();
    clearInterval(interval);
  };
}, []);
```

---

## 🔍 Debugging Tips

```javascript
// Log all queued data
const queues = await Promise.all([
  storageService.getAttendanceQueue(),
  storageService.getLocationQueue(),
  storageService.getUploadQueue()
]);
console.log('Attendance queue:', queues[0]);
console.log('Location queue:', queues[1]);
console.log('Upload queue:', queues[2]);

// Check network
const net = await wifiService.getNetworkDiagnostics();
console.log(net);

// Check battery
const batt = await batteryOptimizationService.getBatteryDiagnostics();
console.log(batt);

// Test spoof detection
const spoof = spoofDetectionService.quickSpoofCheck(curr, prev, sensor);
if (spoof.isSuspicious) console.warn(spoof.reason);

// Verify geofence
const inGeo = geofenceService.isWithinGeofence(lat, lon, geo);
const coverage = geofenceService.getGeofenceCoverage(lat, lon);
console.log(coverage);
```

---

## 📊 Configuration Reference

**Location Accuracy** (vs battery):
```
Location.Accuracy.Lowest    - ~1500m
Location.Accuracy.Low       - ~500m
Location.Accuracy.Balanced  - ~100m
Location.Accuracy.High      - ~20m
Location.Accuracy.Highest   - ~5m
```

**Spoof Detection Thresholds**:
- GPS jump: >200 km/h (impossible speed)
- Sensor mismatch: Moved >50m but <0.5 m/s² accel
- Stationary mismatch: GPS static but >15 m/s² accel
- Pattern replay: 5+ recent readings at same location

**Battery Thresholds**:
- Critical: <10%
- Low: <20%
- Medium: <50%
- Normal: >50%

---

## 🆘 Common Errors & Fixes

| Error | Cause | Fix |
|-------|-------|-----|
| `Location permission denied` | User rejected permission | Settings → GeoSentinel → Location → Allow Always |
| `Cannot read property 'latitude'` | Location null | Check `getCurrentLocation()` success before use |
| `AsyncStorage undefined` | Module not imported | `import AsyncStorage from '@react-native-async-storage/async-storage'` |
| `Null is not an object (evaluating token)` | Auth token not set | Call `setAuthToken(token)` after login |
| `Network timeout` | Offline or slow connection | Check WiFi, retry after 5 seconds |
| `Duplicate entry` | Same record already synced | Server auto-deduplicates, clear queue and retry |
| `Background task failed` | Invalid task definition | Call `defineBackgroundLocationTask()` before `startBackgroundTracking()` |

---

## 📚 Documentation Links

- **ADVANCED_FEATURES.md** - Feature details, configuration
- **IMPLEMENTATION_GUIDE.md** - Step-by-step setup, testing
- **API_INTEGRATION.md** - Backend API reference, examples
- **SUMMARY.md** - Overview and quick answers
- **This File** - Function references and patterns

---

**Version**: 0.2.0  
**Last Updated**: March 24, 2024  
**Format**: Quick Reference Card (Print-friendly)
