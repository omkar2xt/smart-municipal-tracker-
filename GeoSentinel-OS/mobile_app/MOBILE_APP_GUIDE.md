# GeoSentinel OS - Mobile App (React Native/Expo) Complete Guide

## 📱 Mobile App Overview

GPS-based workforce tracking mobile app built with React Native and Expo.

**Features:**
- Role-based login
- GPS location capture with accuracy metrics
- Accelerometer-based movement detection
- Geofencing validation (is worker in approved zone)
- Task assignment and completion tracking
- Camera-based image upload for proofs
- Offline data storage with background sync
- Dark mode support
- Battery optimization

**Tech Stack:**
- React Native 0.74+
- Expo 51+
- React Navigation 6.x
- AsyncStorage for offline data
- expo-location for GPS
- expo-sensors for accelerometer
- axios for API calls

---

## 📁 Project Structure

```
mobile_app/
├── App.js                          # Root app component
├── package.json                    # Dependencies
├── app.json                        # Expo configuration
├── babel.config.js
├── .env                           # Environment config
│
├── screens/                       # App screens
│   ├── LoginScreen.js             # Email/password login
│   ├── AttendanceScreen.js        # Mark attendance with GPS
│   ├── TaskScreen.js              # View assigned tasks
│   ├── UploadScreen.js            # Upload proof images
│   ├── WorkerDashboard.js         # Main dashboard/home
│   └── ProfileScreen.js           # User profile & settings
│
├── services/                      # Business logic
│   ├── apiService.js              # HTTP client (axios)
│   ├── authService.js             # Login/logout logic
│   ├── gpsService.js              # Location tracking
│   ├── sensorService.js           # Accelerometer data
│   ├── spoofDetectionService.js   # Client spoof detection
│   ├── geofenceService.js         # Geofence validation
│   ├── storageService.js          # AsyncStorage wrapper
│   ├── syncService.js             # Offline sync logic
│   ├── backgroundLocationService.js # Background tracking
│   ├── wifiService.js             # Network detection
│   ├── batteryService.js          # Battery optimization
│   └── imageService.js            # Camera & image upload
│
├── components/                    # Reusable components
│   ├── Button.js
│   ├── Input.js
│   ├── Card.js
│   ├── LoadingSpinner.js
│   ├── LocationMap.js
│   └── StatusBadge.js
│
├── navigation/                    # Navigation setup
│   ├── RootNavigator.js           # Auth/App switching
│   └── AppNavigator.js            # Main app navigation
│
├── utils/                         # Utilities
│   ├── constants.js               # Config values
│   ├── validators.js              # Input validation
│   └── dateUtils.js               # Date/time helpers
│
└── styles/                        # Stylesheet
    └── theme.js                   # Colors & spacing
```

---

## 🚀 Installation

### Prerequisites
```
- Node.js 18+
- npm or yarn
- Expo CLI: npm install -g expo-cli
- Android emulator or iOS simulator (or physical device)
```

### Step-by-Step Setup

```bash
# 1. Navigate to mobile directory
cd mobile_app

# 2. Install dependencies
npm install
# or
yarn install

# 3. Create .env file
cat > .env << EOF
EXPO_PUBLIC_API_BASE_URL=http://10.0.2.2:8000/api
EXPO_PUBLIC_APP_NAME=GeoSentinel OS
EXPO_PUBLIC_GEOFENCE_RADIUS_METERS=100
EXPO_PUBLIC_GEOFENCE_CENTER_LAT=19.0760
EXPO_PUBLIC_GEOFENCE_CENTER_LON=72.8777
EXPO_PUBLIC_ENABLE_BACKGROUND_TRACKING=true
EXPO_PUBLIC_LOCATION_UPDATE_INTERVAL=30000
EXPO_PUBLIC_ENABLE_SPOOF_DETECTION=true
EOF

# 4. Start development server
npx expo start

# 5. Run on device
# Press 'a' for Android emulator
# Press 'i' for iOS simulator
# Scan QR code for physical device
```

---

## 📱 Core Screens

### 1. LoginScreen

**Purpose:** User authentication

**Features:**
- Email and password input fields
- Error message display
- Loading state during API call
- Store JWT token in secure storage
- Auto-login on app start if token exists

**Code Structure:**
```javascript
export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    try {
      setLoading(true);
      const response = await apiService.post('/auth/login', {
        email,
        password,
      });
      
      // Store token
      await storageService.setToken(response.data.access_token);
      
      // Navigate to main app
      navigation.reset({
        index: 0,
        routes: [{ name: 'MainApp' }],
      });
    } catch (err) {
      setError(err.response?.data?.detail || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>GeoSentinel OS</Text>
      
      <Input
        label="Email"
        value={email}
        onChangeText={setEmail}
        placeholder="your@email.com"
      />
      
      <Input
        label="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        placeholder="••••••••"
      />
      
      {error && <Text style={styles.error}>{error}</Text>}
      
      <Button
        title={loading ? 'Logging in...' : 'Login'}
        onPress={handleLogin}
        disabled={loading}
      />
    </View>
  );
}
```

**Test Credentials:**
```
Email: worker@geosential.gov
Password: worker123
```

---

### 2. AttendanceScreen

**Purpose:** Mark attendance with GPS location verification

**Flow:**
1. User taps "Mark Attendance" button
2. App requests location permission
3. Gets current GPS coordinates
4. Reads accelerometer data
5. Validates geofence (optional warning)
6. Sends attendance record to backend
7. Backend performs spoof detection
8. Shows success or error message

**Key Features:**
```javascript
// Get location
const location = await Location.getCurrentPositionAsync({
  accuracy: Location.Accuracy.High,
});
// Returns: { latitude, longitude, accuracy, altitude, heading, speed }

// Get accelerometer data
const accelData = await Sensors.getAccelerometerAsync();
// Returns: { x, y, z } - motion vector

// Check geofence (client-side warning)
const inZone = geofenceService.isInGeofence(
  location.latitude,
  location.longitude
);

// Send to backend
await apiService.post('/attendance/mark', {
  latitude: location.latitude,
  longitude: location.longitude,
  accuracy: location.accuracy,
  timestamp: new Date().toISOString(),
  accelerometer_x: accelData.x,
  accelerometer_y: accelData.y,
  accelerometer_z: accelData.z,
});
```

**Response Handling:**
```javascript
// Success response
{
  "status": "marked",
  "attendance_id": 145,
  "flags": []  // Empty if no issues
}

// Suspicious activity response
{
  "status": "marked",
  "attendance_id": 146,
  "flags": ["possible_spoof", "gps_jump", "sensor_mismatch"]
}
```

---

### 3. TaskScreen

**Purpose:** View assigned tasks

**Features:**
- Display list of tasks assigned to worker
- Show task status (Assigned, In Progress, Completed)
- Due date countdown
- Navigation to upload screen
- Mark task as complete

**Code Structure:**
```javascript
export default function TaskScreen() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      const response = await apiService.get('/tasks');
      setTasks(response.data);
    } catch (err) {
      Alert.alert('Error', 'Failed to fetch tasks');
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteTask = async (taskId) => {
    try {
      await apiService.put(`/tasks/${taskId}/status`, {
        status: 'COMPLETED',
      });
      fetchTasks(); // Refresh list
      Alert.alert('Success', 'Task marked as complete');
    } catch (err) {
      Alert.alert('Error', 'Failed to complete task');
    }
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={tasks}
        renderItem={({ item }) => (
          <Card style={styles.taskCard}>
            <Text style={styles.taskTitle}>{item.title}</Text>
            <Text style={styles.taskDesc}>{item.description}</Text>
            <Text style={styles.dueDate}>
              Due: {formatDate(item.due_date)}
            </Text>
            <StatusBadge status={item.status} />
            
            {item.status !== 'COMPLETED' && (
              <Button
                title="Upload Proof"
                onPress={() => navigation.navigate('Upload', {
                  taskId: item.id,
                })}
              />
            )}
          </Card>
        )}
        keyExtractor={(item) => item.id.toString()}
      />
    </View>
  );
}
```

---

### 4. UploadScreen

**Purpose:** Capture and upload proof images for task completion

**Flow:**
1. User selects task
2. Opens camera
3. Captures photo
4. Previews image
5. Uploads to backend
6. Marks task as complete

**Code Structure:**
```javascript
export default function UploadScreen({ route, navigation }) {
  const { taskId } = route.params;
  const [image, setImage] = useState(null);
  const [uploading, setUploading] = useState(false);

  const takePhoto = async () => {
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  const uploadImage = async () => {
    try {
      setUploading(true);
      
      const formData = new FormData();
      formData.append('file', {
        uri: image,
        type: 'image/jpeg',
        name: `proof_${taskId}_${Date.now()}.jpg`,
      });
      formData.append('task_id', taskId);

      const response = await apiService.post(
        '/upload/proof',
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );

      Alert.alert('Success', 'Image uploaded successfully');
      navigation.goBack();
    } catch (err) {
      Alert.alert('Error', 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <View style={styles.container}>
      {image ? (
        <>
          <Image source={{ uri: image }} style={styles.preview} />
          <Button
            title="Retake"
            onPress={() => setImage(null)}
          />
          <Button
            title={uploading ? 'Uploading...' : 'Upload'}
            onPress={uploadImage}
            disabled={uploading}
          />
        </>
      ) : (
        <Button
          title="Take Photo"
          onPress={takePhoto}
        />
      )}
    </View>
  );
}
```

---

### 5. WorkerDashboard

**Purpose:** Main home screen with worker status and quick actions

**Features:**
- Display worker profile
- Show current location on map
- Last attendance status
- Quick action buttons
- Background tracking toggle
- Sync status indicator

**Code Structure:**
```javascript
export default function WorkerDashboard() {
  const [user, setUser] = useState(null);
  const [location, setLocation] = useState(null);
  const [trackingEnabled, setTrackingEnabled] = useState(false);
  const [syncStatus, setSyncStatus] = useState('idle');

  useEffect(() => {
    loadUserData();
    startLocationTracking();
    setupAutoSync();
  }, []);

  const loadUserData = async () => {
    const userData = await storageService.getUser();
    setUser(userData);
  };

  const startLocationTracking = async () => {
    if (trackingEnabled) {
      backgroundLocationService.startTracking();
    } else {
      backgroundLocationService.stopTracking();
    }
  };

  const syncOfflineData = async () => {
    setSyncStatus('syncing');
    try {
      const pendingData = await storageService.getPendingData();
      const result = await syncService.syncData(pendingData);
      Alert.alert('Success', `Synced ${result.total} records`);
    } finally {
      setSyncStatus('idle');
    }
  };

  return (
    <View style={styles.container}>
      <Card>
        <Text style={styles.welcomeText}>
          Welcome, {user?.full_name}
        </Text>
        <Text style={styles.role}>{user?.role}</Text>
      </Card>

      <Card>
        <Text style={styles.sectionTitle}>Status</Text>
        <Row>
          <Text>Location Tracking:</Text>
          <Switch
            value={trackingEnabled}
            onValueChange={setTrackingEnabled}
          />
        </Row>
        {location && (
          <Text style={styles.locationText}>
            📍 {location.latitude.toFixed(4)},
            {location.longitude.toFixed(4)}
          </Text>
        )}
      </Card>

      <Card>
        <Text style={styles.sectionTitle}>Sync</Text>
        <Button
          title={syncStatus === 'syncing' ? 'Syncing...' : 'Sync Now'}
          onPress={syncOfflineData}
          disabled={syncStatus === 'syncing'}
        />
      </Card>

      <Row>
        <Button
          title="Mark Attendance"
          onPress={() => navigation.navigate('Attendance')}
          flex={1}
        />
        <Button
          title="View Tasks"
          onPress={() => navigation.navigate('Tasks')}
          flex={1}
        />
      </Row>
    </View>
  );
}
```

---

## ⚙️ Core Services

### 1. apiService.js - HTTP Client

```javascript
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

const api = axios.create({
  baseURL: process.env.EXPO_PUBLIC_API_BASE_URL,
  timeout: 10000,
});

// Auto-inject JWT token
api.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired, navigate to login
      storageService.clearAuth();
      navigationRef.navigate('Login');
    }
    return Promise.reject(error);
  }
);

export default api;
```

### 2. authService.js - Login/Logout

```javascript
export const authService = {
  async login(email, password) {
    const response = await apiService.post('/auth/login', {
      email,
      password,
    });
    
    const { access_token, user } = response.data;
    
    // Store token securely
    await SecureStore.setItemAsync('authToken', access_token);
    
    // Store user data
    await AsyncStorage.setItem('user', JSON.stringify(user));
    
    return user;
  },

  async logout() {
    await SecureStore.deleteItemAsync('authToken');
    await AsyncStorage.removeItem('user');
  },

  async isLoggedIn() {
    const token = await SecureStore.getItemAsync('authToken');
    return !!token;
  },

  async getUser() {
    const userJson = await AsyncStorage.getItem('user');
    return userJson ? JSON.parse(userJson) : null;
  },
};
```

### 3. gpsService.js - Location Tracking

```javascript
import * as Location from 'expo-location';

export const gpsService = {
  async requestPermission() {
    const { status } = await Location.requestForegroundPermissionsAsync();
    return status === 'granted';
  },

  async getCurrentLocation() {
    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.High,
      timeout: 5000,
    });
    
    return {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
      accuracy: location.coords.accuracy,
      altitude: location.coords.altitude,
      heading: location.coords.heading,
      speed: location.coords.speed,
      timestamp: new Date().toISOString(),
    };
  },

  async startContinuousTracking(intervalMs = 30000, callback) {
    const subscription = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.Balanced,
        timeInterval: intervalMs,
        distanceInterval: 10, // 10 meters
      },
      callback
    );
    
    return subscription;
  },
};
```

### 4. sensorService.js - Accelerometer

```javascript
import { Accelerometer } from 'expo-sensors';

export const sensorService = {
  async requestPermission() {
    // Expo sensors require runtime permission on Android 12+
    return true;
  },

  async getAccelerometerData() {
    return new Promise((resolve) => {
      const subscription = Accelerometer.addListener(({ x, y, z }) => {
        subscription.remove();
        resolve({ x, y, z });
      });
      
      setTimeout(() => {
        subscription.remove();
        resolve({ x: 0, y: 0, z: 9.8 }); // Default if timeout
      }, 2000);
    });
  },

  calculateMagnitude(x, y, z) {
    return Math.sqrt(x * x + y * y + z * z);
  },

  isMoving(magnitude) {
    // Threshold: significant movement detected if > 10.5 m/s²
    // (9.8 is gravity alone, >10 indicates acceleration)
    return magnitude > 10.5;
  },
};
```

### 5. spoofDetectionService.js - Client-Side Validation

```javascript
export const spoofDetectionService = {
  // Client-side warning system
  // (Final validation happens on server)

  checkGpsJump(prevLocation, currentLocation) {
    const distance = this.calculateDistance(
      prevLocation.latitude,
      prevLocation.longitude,
      currentLocation.latitude,
      currentLocation.longitude
    );
    
    const timeDiffSeconds = 
      (new Date(currentLocation.timestamp) - 
       new Date(prevLocation.timestamp)) / 1000;
    
    const speedKmH = (distance / timeDiffSeconds) * 3.6;
    
    if (speedKmH > 150) {
      return {
        isSuspicious: true,
        reason: 'Speed exceeds 150 km/h',
        speed: speedKmH,
      };
    }
    
    return { isSuspicious: false };
  },

  checkSensorMismatch(location, accelMagnitude) {
    // GPS shows movement but no acceleration
    // (Could indicate: spoofed location, GPS drift, or legitimate pause)
    
    const gpsMovement = location.speed > 1; // Moving
    const noAcceleration = accelMagnitude < 10.2; // Not accelerating
    
    if (gpsMovement && noAcceleration) {
      return {
        warning: 'GPS shows movement but no acceleration detected',
        severity: 'low',
      };
    }
    
    return null;
  },

  calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * 
      Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  },
};
```

### 6. syncService.js - Offline Data Sync

```javascript
export const syncService = {
  async syncOfflineData() {
    // Get all pending data from local storage
    const pendingAttendance = 
      await storageService.getPendingAttendance();
    const pendingTasks = 
      await storageService.getPendingTasks();
    const pendingLocations = 
      await storageService.getPendingLocations();

    if (!pendingAttendance && !pendingTasks && !pendingLocations) {
      return { success: true, synced: 0 };
    }

    try {
      // Send bulk data to server
      const response = await apiService.post('/sync/bulk', {
        attendance: pendingAttendance || [],
        tasks: pendingTasks || [],
        locations: pendingLocations || [],
      });

      // Clear synced data from local storage
      await storageService.clearSyncedData();

      return {
        success: true,
        synced: response.data.success_count,
        errors: response.data.error_count,
      };
    } catch (error) {
      // Keep data in queue if sync failed
      return {
        success: false,
        error: error.message,
      };
    }
  },

  setupAutoSync(intervalMinutes = 5) {
    return setInterval(() => {
      navigator.onLine && this.syncOfflineData();
    }, intervalMinutes * 60 * 1000);
  },
};
```

---

## 🔄 Offline Workflow

### Local Storage Structure

```javascript
// AsyncStorage format
{
  "pending_attendance": [
    {
      id: "local_1",
      user_id: 5,
      latitude: 19.0760,
      longitude: 72.8777,
      accuracy: 10.5,
      accelerometer_x: 0.2,
      accelerometer_y: -0.1,
      accelerometer_z: 9.8,
      timestamp: "2026-03-24T10:30:00Z",
      synced: false
    }
  ],
  
  "pending_locations": [
    {
      id: "local_2",
      user_id: 5,
      latitude: 19.0765,
      longitude: 72.8780,
      accuracy: 8.2,
      timestamp: "2026-03-24T10:31:00Z",
      synced: false
    }
  ],
  
  "pending_tasks": [
    {
      id: "local_3",
      task_id: 10,
      status: "COMPLETED",
      timestamp: "2026-03-24T14:45:00Z",
      synced: false
    }
  ]
}
```

### Sync Deduplication Logic (Server-Side)

```python
# Backend checks for existing records
existing = db.query(Attendance).filter(
    Attendance.user_id == user_id,
    Attendance.date == attendance_date
).first()

if existing:
    # Keep newer record
    if new_attendance.timestamp > existing.timestamp:
        db.delete(existing)
        db.add(new_attendance)
else:
    db.add(new_attendance)

db.commit()
```

---

## 🎨 UI/UX Components

### Color Scheme (Dark Theme)

```javascript
const theme = {
  colors: {
    primary: '#0ea5e9',      // Sky blue
    primaryDark: '#0284c7',
    background: '#111827',    // Dark gray
    surface: '#1f2937',       // Dark surface
    text: '#f3f4f6',          // Light text
    textSecondary: '#9ca3af',
    success: '#10b981',
    error: '#ef4444',
    warning: '#f59e0b',
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
  },
};
```

### Responsive Layout

```javascript
import { Dimensions } from 'react-native';

const screenWidth = Dimensions.get('window').width;
const isTablet = screenWidth > 768;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: isTablet ? 32 : 16,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  gridItem: {
    width: isTablet ? '48%' : '100%',
  },
});
```

---

## 🔐 Security

### Secure Token Storage

```javascript
import * as SecureStore from 'expo-secure-store';

await SecureStore.setItemAsync('authToken', token);
const token = await SecureStore.getItemAsync('authToken');
await SecureStore.deleteItemAsync('authToken');
```

### API Request Signing (Optional)

```javascript
import crypto from 'crypto';

const signRequest = (payload, secret) => {
  return crypto
    .createHmac('sha256', secret)
    .update(JSON.stringify(payload))
    .digest('hex');
};

api.interceptors.request.use((config) => {
  const signature = signRequest(config.data, JWT_SECRET);
  config.headers['X-Signature'] = signature;
  return config;
});
```

---

## 📊 Performance Optimization

### Battery & Network

```javascript
// Reduce location polling when battery low
const isLowBattery = await batteryService.getBatteryLevel() < 20;
const pollInterval = isLowBattery ? 60000 : 30000;

// Stop tracking when offline
const subscription = NetInfo.addEventListener(({ isConnected }) => {
  if (!isConnected && trackingEnabled) {
    backgroundLocationService.stopTracking();
  }
});

// Batch API requests
async function batchRequests(requests) {
  const allData = [];
  for (const req of requests) {
    allData.push(await req);
    await new Promise(r => setTimeout(r, 100)); // Throttle
  }
  return allData;
}
```

---

## 🧪 Testing

### Test Credentials

```
Role: Worker
Email: worker@geosential.gov
Password: worker123

Role: Taluka Admin  
Email: taluka_admin@geosential.gov
Password: admin123

Role: District Admin
Email: district_admin@geosential.gov
Password: admin123

Role: State Admin
Email: state_admin@geosential.gov
Password: admin123
```

### Test Scenarios

**Scenario 1: Offline Attendance**
1. Disable WiFi/Mobile data
2. Tap "Mark Attendance"
3. Data saved locally
4. Enable network
5. Tap "Sync"
6. Data uploaded

**Scenario 2: Geofence Boundary**
1. Move to edge of geofence zone
2. Mark attendance
3. Check backend for geofence_validated: true/false

**Scenario 3: Spoof Detection**
1. Manipulate GPS (use emulator with spoofed coordinates)
2. Mark attendance
3. Check backend for spoof_flag

---

## 🚀 Production Build

### Android APK

```bash
# Build debug APK
cd mobile_app
eas build --platform android

# Or local build
npx expo run:android --build
```

### iOS IPA

```bash
# Build for iOS
eas build --platform ios

# Test flight deployment
eas submit --platform ios --latest
```

---

**Need Help?** Review individual service files for detailed documentation.

