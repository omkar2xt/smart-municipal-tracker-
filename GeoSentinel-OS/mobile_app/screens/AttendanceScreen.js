import React from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { apiRequest } from "../services/apiService";
import { getCurrentLocation } from "../services/gpsService";
import * as backgroundLocationService from "../services/backgroundLocationService";
import * as geofenceService from "../services/geofenceService";
import * as spoofDetectionService from "../services/spoofDetectionService";
import * as storageService from "../services/storageService";
import * as wifiService from "../services/wifiService";
import * as batteryOptimizationService from "../services/batteryOptimizationService";
import { Accelerometer } from "expo-sensors";

// Set accelerometer update interval (ms)
Accelerometer.setUpdateInterval(500);

export default function AttendanceScreen() {
  const [loading, setLoading] = React.useState(false);
  const [result, setResult] = React.useState("");
  const [resultType, setResultType] = React.useState(""); // 'success', 'error', 'warning'
  const [details, setDetails] = React.useState([]);
  const [isOffline, setIsOffline] = React.useState(false);
  const [batteryLevel, setBatteryLevel] = React.useState(0);
  const previousLocationRef = React.useRef(null);

  React.useEffect(() => {
    // Monitor battery level
    const unsubscribe = batteryOptimizationService.watchBatteryLevel((status) => {
      setBatteryLevel(status.level);
    });

    // Monitor network status
    const networkUnsubscribe = wifiService.watchNetworkConnectivity((state) => {
      setIsOffline(!state.isConnected);
    });

    return () => {
      unsubscribe();
      networkUnsubscribe();
    };
  }, []);

  const handleAttendance = async () => {
    try {
      setLoading(true);
      setDetails([]);
      setResult("Fetching GPS location...");
      setResultType("");

      // Get current location with high accuracy
      const location = await getCurrentLocation({ accuracy: "Highest" });
      addDetail(`✓ GPS acquired: ${location.latitude.toFixed(5)}, ${location.longitude.toFixed(5)}`);

      // Get acceleration data for spoof detection
      const accelData = await new Promise((resolve) => {
        let settled = false;
        const timeoutId = setTimeout(() => {
          if (!settled) {
            settled = true;
            subscription.remove();
            resolve({ accelerometer_x: 0, accelerometer_y: 0, accelerometer_z: 0, magnitude: 0 });
          }
        }, 2000);

        const subscription = Accelerometer.addListener((data) => {
          if (settled) {
            return;
          }
          settled = true;
          clearTimeout(timeoutId);
          subscription.remove();
          const magnitude = Math.sqrt(data.x ** 2 + data.y ** 2 + data.z ** 2);
          resolve({ accelerometer_x: data.x, accelerometer_y: data.y, accelerometer_z: data.z, magnitude });
        });
      });
      addDetail(`✓ Accelerometer: ${accelData.magnitude.toFixed(2)} m/s²`);

      // Geofence validation
      const isInGeofence = geofenceService.isWithinGeofence(
        location.latitude,
        location.longitude,
        geofenceService.getGeofence("pune_taluka")
      );

      if (!isInGeofence) {
        addDetail("⚠ Location outside authorized geofence");
        const distToBoundary = geofenceService.getDistanceToGeofenceBoundary(
          location.latitude,
          location.longitude,
          geofenceService.getGeofence("pune_taluka")
        );
        addDetail(`  Distance to boundary: ${distToBoundary.toFixed(0)}m`);
      } else {
        addDetail("✓ Geofence validated");
      }

      // Spoof detection
      let spoofRisk = { isSpoofed: false, riskLevel: "safe", detections: [] };
      if (previousLocationRef.current) {
        spoofRisk = spoofDetectionService.analyzeSpoofRisk(
          location,
          previousLocationRef.current,
          accelData
        );
        addDetail(`✓ Spoof check: ${spoofRisk.riskLevel.toUpperCase()}`);

        if (spoofRisk.detections.length > 0) {
          spoofRisk.detections.forEach((det) => {
            addDetail(`  ⚠ ${det.type}: ${det.reason}`);
          });
        }
      } else {
        addDetail("✓ Spoof check: First check, no comparison data");
      }

      previousLocationRef.current = {
        ...location,
        accelMagnitude: accelData.magnitude,
      };

      // WiFi validation
      const wifiInfo = await wifiService.getWiFiInfo();
      addDetail(`✓ Network: ${wifiInfo.type || "Unknown"}`);

      // Battery check
      const batteryStatus = await batteryOptimizationService.getBatteryStatus();
      addDetail(`✓ Battery: ${batteryStatus.level}%`);

      // Prepare attendance data
      const attendanceData = {
        latitude: location.latitude,
        longitude: location.longitude,
        accuracy: location.accuracy,
        accelerometer_x: accelData.accelerometer_x,
        accelerometer_y: accelData.accelerometer_y,
        accelerometer_z: accelData.accelerometer_z,
        geofence_valid: isInGeofence,
        spoof_risk_level: spoofRisk.riskLevel,
        network_type: wifiInfo.type,
      };

      // Check if online or queue for offline
      if (isOffline) {
        await storageService.queueAttendance(attendanceData);
        setResultType("warning");
        setResult("Attendance queued (offline mode)");
        addDetail("Stored in offline queue for sync when online");
      } else {
        // Submit to server
        const response = await apiRequest("POST", "/attendance", attendanceData);
        setResultType("success");
        setResult("✓ Attendance submitted successfully");
        addDetail(`Server response: ${response.message || "Success"}`);
      }
    } catch (err) {
      setResultType("error");
      const errorMsg =
        err?.response?.data?.detail || err?.message || "Failed to mark attendance";
      setResult(errorMsg);
      addDetail(`Error: ${errorMsg}`);
    } finally {
      setLoading(false);
    }
  };

  const addDetail = (text) => {
    setDetails((prev) => [...prev, text]);
  };

  const getResultColor = () => {
    switch (resultType) {
      case "success":
        return "#10b981";
      case "error":
        return "#ef4444";
      case "warning":
        return "#f59e0b";
      default:
        return "#64748b";
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Attendance</Text>
      <Text style={styles.description}>Capture GPS location and sensor data for attendance</Text>

      {/* Status indicators */}
      <View style={styles.statusBar}>
        <View style={[styles.statusItem, { opacity: isOffline ? 1 : 0.5 }]}>
          <Text style={styles.statusLabel}>📡 Network</Text>
          <Text style={styles.statusValue}>{isOffline ? "Offline" : "Online"}</Text>
        </View>
        <View style={styles.statusItem}>
          <Text style={styles.statusLabel}>🔋 Battery</Text>
          <Text style={styles.statusValue}>{batteryLevel}%</Text>
        </View>
      </View>

      {/* Main button */}
      <Pressable
        style={[styles.button, loading && styles.buttonDisabled]}
        onPress={handleAttendance}
        disabled={loading}
      >
        <Text style={styles.buttonText}>{loading ? "Processing..." : "Mark Attendance"}</Text>
      </Pressable>

      {loading ? <ActivityIndicator size="large" color="#3b82f6" style={styles.loader} /> : null}

      {/* Result message */}
      {result ? (
        <View style={[styles.resultBox, { borderLeftColor: getResultColor() }]}>
          <Text style={[styles.resultText, { color: getResultColor() }]}>{result}</Text>
        </View>
      ) : null}

      {/* Details */}
      {details.length > 0 ? (
        <View style={styles.detailsBox}>
          <Text style={styles.detailsTitle}>Processing Details:</Text>
          {details.map((detail, idx) => (
            <Text key={idx} style={styles.detail}>
              {detail}
            </Text>
          ))}
        </View>
      ) : null}
    </ScrollView>
  );
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: "#f8fafc",
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 8,
    color: "#0f172a",
  },
  description: {
    fontSize: 14,
    color: "#64748b",
    marginBottom: 16,
  },
  statusBar: {
    flexDirection: "row",
    marginBottom: 20,
    gap: 12,
  },
  statusItem: {
    flex: 1,
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: "#3b82f6",
  },
  statusLabel: {
    fontSize: 12,
    color: "#64748b",
    marginBottom: 4,
  },
  statusValue: {
    fontSize: 16,
    fontWeight: "600",
    color: "#0f172a",
  },
  button: {
    backgroundColor: "#3b82f6",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 8,
    marginBottom: 16,
    alignItems: "center",
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 16,
  },
  loader: {
    marginBottom: 20,
  },
  resultBox: {
    backgroundColor: "#fff",
    borderLeftWidth: 4,
    borderLeftColor: "#3b82f6",
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  resultText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#0f172a",
  },
  detailsBox: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  detailsTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#0f172a",
    marginBottom: 12,
  },
  detail: {
    fontSize: 13,
    color: "#475569",
    marginBottom: 6,
    lineHeight: 18,
    fontFamily: "Menlo",
  },
});
