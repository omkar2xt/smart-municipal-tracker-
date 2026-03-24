import React from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { logout } from "../services/authService";
import * as backgroundLocationService from "../services/backgroundLocationService";
import * as storageService from "../services/storageService";
import * as syncService from "../services/syncService";
import * as batteryOptimizationService from "../services/batteryOptimizationService";
import * as wifiService from "../services/wifiService";

export default function WorkerDashboard({ navigation, user, onLogout }) {
  const [backgroundTracking, setBackgroundTracking] = React.useState(false);
  const [queueStatus, setQueueStatus] = React.useState({
    attendance: 0,
    locations: 0,
    uploads: 0,
    totalPending: 0,
  });
  const [isOnline, setIsOnline] = React.useState(true);
  const [batteryLevel, setBatteryLevel] = React.useState(0);
  const [syncing, setSyncing] = React.useState(false);
  const [syncMessage, setSyncMessage] = React.useState("");
  const autoSyncCleanupRef = React.useRef(null);

  // Initialize background tracking and monitoring
  React.useEffect(() => {
    let cleanupWatchers = () => {};
    initializeTracking();
    cleanupWatchers = setupWatchers();

    return () => {
      if (autoSyncCleanupRef.current) {
        autoSyncCleanupRef.current();
      }
      cleanupWatchers();
    };
  }, []);

  const initializeTracking = async () => {
    try {
      // Define background location task
      backgroundLocationService.defineBackgroundLocationTask((location) => {
        console.log("Background location received:", location);
      });

      // Check if user wants background tracking
      const isActive = await backgroundLocationService.isBackgroundTrackingActive();
      setBackgroundTracking(isActive);

      // Update queue status
      updateQueueStatus();

      // Setup auto sync
      autoSyncCleanupRef.current = syncService.setupAutoSync((result) => {
        setSyncMessage(`Auto-synced: ${result.totalSynced} records`);
        setTimeout(() => setSyncMessage(""), 3000);
        updateQueueStatus();
      });
    } catch (error) {
      console.error("Initialization error:", error);
    }
  };

  const setupWatchers = () => {
    // Watch battery level
    const batteryUnsubscribe = batteryOptimizationService.watchBatteryLevel((status) => {
      setBatteryLevel(status.level);
    });

    // Watch network Status
    const networkUnsubscribe = wifiService.watchNetworkConnectivity((state) => {
      setIsOnline(state.isConnected);
    });

    return () => {
      batteryUnsubscribe?.();
      networkUnsubscribe?.();
    };
  };

  const updateQueueStatus = async () => {
    const status = await storageService.getQueueStatus();
    setQueueStatus(status);
  };

  const toggleBackgroundTracking = async () => {
    try {
      if (backgroundTracking) {
        await backgroundLocationService.stopBackgroundTracking();
        setBackgroundTracking(false);
        Alert.alert("Background tracking disabled");
      } else {
        await backgroundLocationService.startBackgroundTracking();
        setBackgroundTracking(true);
        Alert.alert(
          "Background tracking enabled",
          "Location will be tracked in background for 24 hours"
        );
      }
    } catch (error) {
      Alert.alert("Error", error.message || "Failed to toggle tracking");
    }
  };

  const handleManualSync = async () => {
    if (!isOnline) {
      Alert.alert("Offline", "Device is offline. Sync will occur automatically when online.");
      return;
    }

    try {
      setSyncing(true);
      setSyncMessage("Syncing data...");

      const result = await syncService.syncAllOfflineData((progress) => {
        setSyncMessage(`Syncing: ${progress.phase} (${progress.current}/${progress.total})`);
      });

      if (result.success) {
        const synced =
          typeof result.totalSynced === "number"
            ? result.totalSynced
            : (result.attendance?.synced || 0) + (result.locations?.synced || 0);
        
        setSyncMessage(`✓ Synced ${synced} records`);
        updateQueueStatus();
        Alert.alert(
          "Sync Complete",
          `Successfully synced ${synced} records.\n${result.totalDuplicates || 0} duplicates detected.`
        );
      } else {
        setSyncMessage(`✗ Sync failed: ${result.reason || result.error}`);
        Alert.alert("Sync Failed", result.error || "Please try again");
      }
    } catch (error) {
      setSyncMessage(`✗ Error: ${error.message}`);
      Alert.alert("Error", error.message);
    } finally {
      setSyncing(false);
      setTimeout(() => setSyncMessage(""), 3000);
    }
  };

  const handleLogout = async () => {
    try {
      // Stop background tracking before logout
      if (backgroundTracking) {
        await backgroundLocationService.stopBackgroundTracking();
      }
      await logout();
      onLogout();
    } catch (error) {
      console.error("Logout error:", error);
      onLogout();
    }
  };

  const getNetworkColor = () => (isOnline ? "#10b981" : "#ef4444");
  const getBatteryColor = () => {
    if (batteryLevel > 50) return "#10b981";
    if (batteryLevel > 20) return "#f59e0b";
    return "#ef4444";
  };

  return (
    <ScrollView style={styles.container}>
      {/* User info header */}
      <View style={styles.header}>
        <Text style={styles.title}>Welcome, {user?.name || "Worker"}</Text>
        <Text style={styles.subtitle}>Role: {user?.role || "worker"}</Text>
        {(user?.district || user?.taluka) && (
          <Text style={styles.info}>
            Area: {[user?.district, user?.taluka].filter(Boolean).join(", ")}
          </Text>
        )}
      </View>

      {/* Status indicators */}
      <View style={styles.statusGrid}>
        <View style={[styles.statusCard, { borderLeftColor: getNetworkColor() }]}>
          <Text style={styles.statusIcon}>📡</Text>
          <Text style={styles.statusLabel}>Network</Text>
          <Text style={[styles.statusValue, { color: getNetworkColor() }]}>
            {isOnline ? "Online" : "Offline"}
          </Text>
        </View>

        <View style={[styles.statusCard, { borderLeftColor: getBatteryColor() }]}>
          <Text style={styles.statusIcon}>🔋</Text>
          <Text style={styles.statusLabel}>Battery</Text>
          <Text style={[styles.statusValue, { color: getBatteryColor() }]}>{batteryLevel}%</Text>
        </View>

        <View style={[styles.statusCard, { borderLeftColor: "#3b82f6" }]}>
          <Text style={styles.statusIcon}>📦</Text>
          <Text style={styles.statusLabel}>Pending</Text>
          <Text style={styles.statusValue}>{queueStatus.totalPending}</Text>
          {queueStatus.totalPending > 0 && (
            <Text style={styles.syncHint}>Waiting to sync</Text>
          )}
        </View>

        <View style={[styles.statusCard, { borderLeftColor: backgroundTracking ? "#10b981" : "#94a3b8" }]}>
          <Text style={styles.statusIcon}>{backgroundTracking ? "✓" : "○"}</Text>
          <Text style={styles.statusLabel}>BG Tracking</Text>
          <Text style={[styles.statusValue, { color: backgroundTracking ? "#10b981" : "#94a3b8" }]}>
            {backgroundTracking ? "Active" : "Inactive"}
          </Text>
        </View>
      </View>

      {/* Sync message */}
      {syncMessage && (
        <View style={[styles.messageBox, syncing && styles.messageProcessing]}>
          <Text style={styles.messageText}>{syncMessage}</Text>
        </View>
      )}

      {/* Main action buttons */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>

        <Pressable style={styles.button} onPress={() => navigation.navigate("Attendance")}>
          <Text style={styles.buttonIcon}>📍</Text>
          <Text style={styles.buttonText}>Mark Attendance</Text>
        </Pressable>

        <Pressable style={styles.button} onPress={() => navigation.navigate("Tasks")}>
          <Text style={styles.buttonIcon}>📋</Text>
          <Text style={styles.buttonText}>View Tasks</Text>
        </Pressable>

        <Pressable style={styles.button} onPress={() => navigation.navigate("Upload")}>
          <Text style={styles.buttonIcon}>📸</Text>
          <Text style={styles.buttonText}>Upload Proof</Text>
        </Pressable>
      </View>

      {/* Tracking & Sync section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Tracking & Sync</Text>

        <Pressable
          style={[styles.button, backgroundTracking && styles.buttonActive]}
          onPress={toggleBackgroundTracking}
        >
          <Text style={styles.buttonIcon}>{backgroundTracking ? "🟢" : "⭕"}</Text>
          <Text style={styles.buttonText}>
            {backgroundTracking ? "Background Tracking" : "Enable Background Tracking"}
          </Text>
        </Pressable>

        {queueStatus.totalPending > 0 && (
          <Pressable
            style={[styles.button, styles.syncButton, syncing && styles.buttonDisabled]}
            onPress={handleManualSync}
            disabled={syncing}
          >
            <Text style={styles.buttonIcon}>🔄</Text>
            <Text style={styles.buttonText}>
              {syncing ? "Syncing..." : `Sync ${queueStatus.totalPending} Items`}
            </Text>
          </Pressable>
        )}

        {queueStatus.totalPending === 0 && isOnline && (
          <View style={styles.successBox}>
            <Text style={styles.successText}>✓ All data synced</Text>
          </View>
        )}
      </View>

      {/* Queue details */}
      {queueStatus.totalPending > 0 && (
        <View style={styles.queueBox}>
          <Text style={styles.queueTitle}>Offline Queue</Text>
          {queueStatus.attendance > 0 && (
            <Text style={styles.queueItem}>• Attendance: {queueStatus.attendance} records</Text>
          )}
          {queueStatus.locations > 0 && (
            <Text style={styles.queueItem}>• Locations: {queueStatus.locations} records</Text>
          )}
          {queueStatus.uploads > 0 && (
            <Text style={styles.queueItem}>• Uploads: {queueStatus.uploads} files</Text>
          )}
          {!isOnline && (
            <Text style={styles.queueHint}>📡 Will auto-sync when online</Text>
          )}
        </View>
      )}

      {/* Logout button */}
      <Pressable style={[styles.button, styles.logout]} onPress={handleLogout}>
        <Text style={styles.buttonIcon}>🚪</Text>
        <Text style={styles.buttonText}>Logout</Text>
      </Pressable>
    </ScrollView>
  );
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
    padding: 16,
  },
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#0f172a",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: "#64748b",
    marginBottom: 2,
  },
  info: {
    fontSize: 14,
    color: "#94a3b8",
    marginTop: 4,
  },
  statusGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 20,
  },
  statusCard: {
    flex: 1,
    minWidth: "45%",
    backgroundColor: "#fff",
    borderLeftWidth: 4,
    borderRadius: 8,
    padding: 12,
    alignItems: "center",
  },
  statusIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  statusLabel: {
    fontSize: 12,
    color: "#64748b",
    marginBottom: 4,
  },
  statusValue: {
    fontSize: 18,
    fontWeight: "600",
    color: "#0f172a",
  },
  syncHint: {
    fontSize: 10,
    color: "#94a3b8",
    marginTop: 2,
  },
  messageBox: {
    backgroundColor: "#dbeafe",
    borderLeftWidth: 4,
    borderLeftColor: "#3b82f6",
    padding: 12,
    borderRadius: 6,
    marginBottom: 16,
  },
  messageProcessing: {
    backgroundColor: "#fef3c7",
    borderLeftColor: "#f59e0b",
  },
  messageText: {
    fontSize: 14,
    color: "#1e40af",
    fontWeight: "500",
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#0f172a",
    marginBottom: 12,
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#0f172a",
    padding: 14,
    borderRadius: 8,
    marginBottom: 10,
  },
  buttonActive: {
    backgroundColor: "#10b981",
  },
  buttonIcon: {
    fontSize: 18,
    marginRight: 12,
  },
  buttonText: {
    color: "#ffffff",
    fontWeight: "600",
    flex: 1,
  },
  syncButton: {
    backgroundColor: "#3b82f6",
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  logout: {
    backgroundColor: "#ef4444",
    marginBottom: 40,
  },
  successBox: {
    backgroundColor: "#ecfdf5",
    borderLeftWidth: 4,
    borderLeftColor: "#10b981",
    padding: 12,
    borderRadius: 6,
    marginBottom: 20,
  },
  successText: {
    color: "#047857",
    fontWeight: "600",
    fontSize: 14,
  },
  queueBox: {
    backgroundColor: "#fef2f2",
    borderLeftWidth: 4,
    borderLeftColor: "#f59e0b",
    padding: 12,
    borderRadius: 6,
    marginBottom: 16,
  },
  queueTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#0f172a",
    marginBottom: 8,
  },
  queueItem: {
    fontSize: 13,
    color: "#475569",
    marginBottom: 4,
  },
  queueHint: {
    fontSize: 12,
    color: "#94a3b8",
    marginTop: 8,
    fontStyle: "italic",
  },
});
