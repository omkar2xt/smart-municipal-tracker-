# Mobile App Implementation Guide

Complete setup and deployment guide for GeoSentinel OS advanced React Native mobile application.

## Quick Start

### 1. Install Dependencies

```bash
cd mobile_app
npm install
```

This installs all required packages including:
- `expo-location` - GPS and geolocation
- `expo-sensors` - Accelerometer access
- `expo-task-manager` - Background tasks
- `expo-background-fetch` - Background processing
- `expo-network` - Network diagnostics
- `@react-native-async-storage/async-storage` - Local storage
- `react-native-netinfo` - Network monitoring
- `axios` - HTTP client
- `lodash` - Utility functions (debounce, etc.)
- Navigation and UI libraries

### 2. Configure Backend URL

Edit `services/apiService.js`:
```javascript
const BASE_URL = "http://192.168.x.x:8000";  // Your backend IP
```

Or use environment variable:
```bash
export EXPO_PUBLIC_API_BASE_URL=http://192.168.x.x:8000
```

### 3. Start Development Server

```bash
npm start
```

Output will show QR code. Scan with Expo Go app or use:
```bash
# Android
npm run android

# iOS
npm run ios
```

## Feature Implementation Walkthrough

### Setting Up GPS Tracking

```javascript
// In any screen, use:
import * as backgroundLocationService from '../services/backgroundLocationService';
import * as Location from 'expo-location';

// Start background tracking
const startTracking = async () => {
  // Define the task first (usually in App.js)
  backgroundLocationService.defineBackgroundLocationTask((location) => {
    console.log('Received location:', location);
    // Process location (queue it, send to server, etc.)
  });

  // Start tracking
  try {
    await backgroundLocationService.startBackgroundTracking({
      accuracy: Location.Accuracy.High,
      timeInterval: 10000,     // ms
      distanceInterval: 10,    // meters
    });
  } catch (error) {
    console.error('Failed to start tracking:', error);
  }
};
```

### Implementing Spoof Detection

```javascript
import * as spoofDetectionService from '../services/spoofDetectionService';
import { Accelerometer } from 'expo-sensors';

const checkForSpoofing = async (currentLocation, previousLocation, locationHistory) => {
  // Read accelerometer data
  const accelData = await new Promise((resolve) => {
    const subscription = Accelerometer.addListener((data) => {
      subscription.remove();
      resolve({
        accelerometer_x: data.x,
        accelerometer_y: data.y,
        accelerometer_z: data.z,
      });
    });
  });

  // Analyze spoof risk
  const analysis = spoofDetectionService.analyzeSpoofRisk(
    currentLocation,
    previousLocation,
    accelData,
    locationHistory  // Array of previous locations
  );

  if (analysis.isSpoofed) {
    console.warn('SPOOFED:', analysis.detections);
  }

  return analysis;
};
```

### Geofence Validation

```javascript
import * as geofenceService from '../services/geofenceService';

const validateAttendance = (latitude, longitude) => {
  // Get user's assigned geofence (e.g., district)
  const geofence = geofenceService.getGeofence('pune_taluka');

  // Check if location is inside
  const isInside = geofenceService.isWithinGeofence(latitude, longitude, geofence);

  if (!isInside) {
    // Get distance to boundary for feedback
    const distance = geofenceService.getDistanceToGeofenceBoundary(
      latitude, longitude, geofence
    );
    console.warn(`Outside geofence by ${distance.toFixed(0)}m`);
    return false;
  }

  return true;
};
```

### Offline Queue Management

```javascript
import * as storageService from '../services/storageService';

// Queue attendance if offline
const queueAttendance = async (attendanceData) => {
  try {
    const count = await storageService.queueAttendance(attendanceData);
    console.log(`Queued. Total in queue: ${count}`);
  } catch (error) {
    console.error('Failed to queue:', error);
  }
};

// Get queue status to show user
const showQueueStatus = async () => {
  const status = await storageService.getQueueStatus();
  console.log(`Pending: ${status.totalPending} records`);
  // Display to user: "You have 3 attendance records waiting to sync"
};

// Clear queue after successful sync
const clearQueue = async () => {
  await storageService.clearAttendanceQueue();
};
```

### Smart Sync Implementation

```javascript
import * as syncService from '../services/syncService';
import * as wifiService from '../services/wifiService';

// Setup automatic sync when network becomes available
const setupAutoSync = () => {
  const cleanup = syncService.setupAutoSync(
    (result) => {
      console.log(`Synced ${result.totalSynced} records`);
      updateUI(result);
    },
    5000  // Check every 5 seconds
  );

  // Cleanup when component unmounts
  return cleanup;
};

// Manual sync with progress
const manualSync = async () => {
  const isOnline = await wifiService.isNetworkConnected();
  
  if (!isOnline) {
    alert('Please connect to internet first');
    return;
  }

  const result = await syncService.syncAllOfflineData((progress) => {
    updateProgressBar(progress.current, progress.total);
  });

  if (result.success) {
    alert(`Synced ${result.totalSynced} records`);
  } else {
    alert(`Sync failed: ${result.error}`);
  }
};
```

### Battery Optimization

```javascript
import * as batteryService from '../services/batteryOptimizationService';

const optimizeForBattery = async () => {
  // Get battery status
  const status = await batteryService.getBatteryStatus();
  console.log(`Battery: ${status.level}%, Charging: ${status.isCharging}`);

  // Get optimized accuracy settings
  const accuracy = await batteryService.getOptimizedLocationAccuracy();
  console.log(`Accuracy: ${accuracy.level}, Interval: ${accuracy.timeInterval}ms`);

  // Apply optimizations
  const settings = await batteryService.applyBatteryOptimization();

  // Get recommendations
  const recommendations = await batteryService.getBatteryRecommendations();
  recommendations.forEach((rec) => {
    console.log(`${rec.severity}: ${rec.message}`);
  });
};

// Watch battery changes
const watchBattery = () => {
  const cleanup = batteryService.watchBatteryLevel((status) => {
    if (status.isCritical) {
      stopBackgroundTracking();
    } else if (status.isLow) {
      reduceTrackingFrequency();
    }
  });

  return cleanup;
};
```

### Network Monitoring

```javascript
import * as wifiService from '../services/wifiService';

// Get network info
const checkNetwork = async () => {
  const info = await wifiService.getWiFiInfo();
  console.log(`Connected: ${info.isConnected}, Type: ${info.type}`);
};

// Watch for network changes
const watchNetwork = () => {
  const cleanup = wifiService.watchNetworkConnectivity((state) => {
    if (state.isConnected) {
      console.log('Connected! Trigger sync');
      syncAllOfflineData();
    } else {
      console.log('Offline - will queue data');
    }
  });

  return cleanup;
};

// Get WiFi diagnostics
const getWiFiInfo = async () => {
  const diagnostics = await wifiService.getNetworkDiagnostics();
  console.log(diagnostics);
};
```

## Complete Attendance Screen Example

Here's a full example of the enhanced AttendanceScreen:

```javascript
import React from 'react';
import { View, Text, Pressable, ActivityIndicator } from 'react-native';

import { getCurrentLocation } from '../services/gpsService';
import * as geofenceService from '../services/geofenceService';
import * as spoofDetectionService from '../services/spoofDetectionService';
import * as storageService from '../services/storageService';
import * as batteryOptimizationService from '../services/batteryOptimizationService';
import { Accelerometer } from 'expo-sensors';
import NetInfo from '@react-native-community/netinfo';
import { apiRequest } from '../services/apiService';

Accelerometer.setUpdateInterval(500);

export default function AttendanceScreen() {
  const [loading, setLoading] = React.useState(false);
  const [result, setResult] = React.useState('');
  const [details, setDetails] = React.useState([]);
  const [isOffline, setIsOffline] = React.useState(false);
  const previousLocationRef = React.useRef(null);

  React.useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsOffline(!state.isConnected);
    });
    return unsubscribe;
  }, []);

  const markAttendance = async () => {
    try {
      setLoading(true);
      setDetails([]);
      const logs = [];

      // 1. GET GPS
      const location = await getCurrentLocation();
      logs.push(`✓ GPS: ${location.latitude.toFixed(5)}, ${location.longitude.toFixed(5)}`);

      // 2. GET ACCELEROMETER
      const accelData = await getAccelerometerData();
      logs.push(`✓ Accel: ${accelData.magnitude.toFixed(2)} m/s²`);

      // 3. VALIDATE GEOFENCE
      const geofence = geofenceService.getGeofence('pune_taluka');
      const inGeofence = geofenceService.isWithinGeofence(
        location.latitude,
        location.longitude,
        geofence
      );
      logs.push(inGeofence ? '✓ Geofence OK' : '✗ Outside geofence');

      // 4. CHECK SPOOF
      let spoofRisk = { isSpoofed: false, riskLevel: 'safe' };
      if (previousLocationRef.current) {
        spoofRisk = spoofDetectionService.analyzeSpoofRisk(
          location,
          previousLocationRef.current,
          accelData
        );
      }
      logs.push(`✓ Spoof: ${spoofRisk.riskLevel.toUpperCase()}`);

      // 5. GET BATTERY
      const battery = await batteryOptimizationService.getBatteryStatus();
      logs.push(`✓ Battery: ${battery.level}%`);

      // 6. PREPARE ATTENDANCE
      const attendanceData = {
        latitude: location.latitude,
        longitude: location.longitude,
        accuracy: location.accuracy,
        accelerometer_x: accelData.x,
        accelerometer_y: accelData.y,
        accelerometer_z: accelData.z,
        geofence_valid: inGeofence,
        spoof_risk_level: spoofRisk.riskLevel,
      };

      // 7. SUBMIT OR QUEUE
      if (isOffline) {
        await storageService.queueAttendance(attendanceData);
        setResult('Queued for sync when online');
      } else {
        const response = await apiRequest('POST', '/attendance', attendanceData);
        setResult('✓ Attendance submitted');
      }

      previousLocationRef.current = location;
      setDetails(logs);
    } catch (error) {
      setResult(`✗ ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const getAccelerometerData = () => {
    return new Promise((resolve) => {
      const subscription = Accelerometer.addListener((data) => {
        subscription.remove();
        const magnitude = Math.sqrt(data.x ** 2 + data.y ** 2 + data.z ** 2);
        resolve({
          x: data.x,
          y: data.y,
          z: data.z,
          magnitude,
        });
      });
    });
  };

  return (
    <View style={{ flex: 1, padding: 20, justifyContent: 'center' }}>
      <Text style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 20 }}>
        Mark Attendance
      </Text>

      <Pressable
        onPress={markAttendance}
        disabled={loading}
        style={{
          backgroundColor: '#0f172a',
          padding: 14,
          borderRadius: 8,
          marginBottom: 20,
        }}
      >
        <Text style={{ color: 'white', fontWeight: 'bold', textAlign: 'center' }}>
          {loading ? 'Processing...' : 'Mark Attendance'}
        </Text>
      </Pressable>

      {loading && <ActivityIndicator size="large" />}
      {result && <Text style={{ fontSize: 16, marginBottom: 10 }}>{result}</Text>}
      {details.map((detail, i) => (
        <Text key={i} style={{ fontSize: 13, marginBottom: 4 }}>
          {detail}
        </Text>
      ))}
    </View>
  );
}
```

## Testing Checklist

- [ ] **GPS**: Test location capture in different places
- [ ] **Spoof**: Move quickly, check detection triggers
- [ ] **Geofence**: Test inside/outside geofence
- [ ] **Offline**: Disable WiFi, queue data, re-enable WiFi, verify sync
- [ ] **Background**: Minimize app, verify location still updates
- [ ] **Battery**: Check adaptive accuracy at different battery levels
- [ ] **WiFi**: Toggle WiFi network, verify auto-sync
- [ ] **Bluetooth**: Check nearby device detection
- [ ] **Sync**: Verify deduplication works
- [ ] **UI**: Test all screens, buttons, error messages

## Common Issues & Solutions

### Issue: Location Permission Denied
**Solution:**
1. Settings → GeoSentinel → Location
2. Select "Allow All the Time"
3. Restart app

### Issue: Background Tracking Not Working
**Solution:**
1. Ensure "Allow All the Time" location permission
2. Disable battery optimization for the app
3. Test with app in foreground first

### Issue: AsyncStorage Returns Undefined
**Solution:**
```javascript
const data = await AsyncStorage.getItem('key');
const parsed = data ? JSON.parse(data) : [];
```
Always check for null before parsing.

### Issue: Spoof Detection False Positives
**Solution:**
- Real-world GPS can jump 10-20m even with high accuracy
- Wait 5+ seconds between readings
- Increase `distanceInterval` to reduce noise

### Issue: Sync Hanging
**Solution:**
```javascript
// Add timeout to sync
const syncWithTimeout = async () => {
  return Promise.race([
    syncService.syncAllOfflineData(),
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Sync timeout')), 30000)
    ),
  ]);
};
```

## Production Deployment

### Android

```bash
# Generate APK
eas build --platform android

# Or local build
npm run android -- --build
```

### iOS

```bash
# Generate IPA
eas build --platform ios

# Or local build
npm run ios -- --build
```

### Environment Variables

Create `.env.production`:
```
EXPO_PUBLIC_API_BASE_URL=https://api.geosentinel.com
EXPO_PUBLIC_JWT_SECRET=your-production-secret
```

### App Store Release

1. Update version in `package.json`
2. Generate production build
3. Submit to Google Play / Apple App Store
4. Configure push notifications (optional)

## Performance Optimization

### Reduce Memory Usage
```javascript
// Limit location history kept in memory
const MAX_HISTORY = 100;
if (locationHistory.length > MAX_HISTORY) {
  locationHistory.shift(); // Remove oldest
}
```

### Batch Updates
```javascript
// Instead of queuing every location, batch them
const BATCH_SIZE = 10;
let batch = [];

onLocation = (location) => {
  batch.push(location);
  if (batch.length >= BATCH_SIZE) {
    storageService.queueLocation(batch);
    batch = [];
  }
};
```

### Debounce Updates
```javascript
import { debounce } from 'lodash';

const debouncedSensorUpdate = debounce((data) => {
  processSensorData(data);
}, 500); // Wait 500ms before processing
```

## Monitoring & Analytics

Add analytics to track:
- Login counts and failures
- Attendance submission success rate
- Average sync time
- Offline queue size over time
- Battery impact

```javascript
// Example analytics call
const trackEvent = (eventName, data) => {
  const event = {
    name: eventName,
    timestamp: new Date().toISOString(),
    data,
    appVersion: '0.2.0',
  };

  // Send to analytics backend
  axios.post('/analytics/events', event).catch(console.error);
};
```

## Support & Documentation

- Expo Docs: https://docs.expo.dev
- React Native: https://reactnative.dev
- Issue Tracker: Add to GeoSentinel repo
