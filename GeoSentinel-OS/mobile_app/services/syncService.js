import { apiRequest } from "./apiService";
import * as storageService from "./storageService";
import * as networkService from "./wifiService";

/**
 * Sync offline data with server when online
 */

/**
 * Sync all queued attendance records
 */
export const syncAttendance = async (onProgress = null) => {
  try {
    const isOnline = await networkService.isNetworkConnected();
    if (!isOnline) {
      console.warn("Device offline - cannot sync attendance");
      return {
        success: false,
        reason: "offline",
        synced: 0,
        failed: 0,
      };
    }

    const queue = await storageService.getAttendanceQueue();
    if (queue.length === 0) {
      console.log("No attendance records to sync");
      return {
        success: true,
        synced: 0,
        failed: 0,
        message: "Queue empty",
      };
    }

    let synced = 0;
    let failed = 0;
    const failedItems = [];

    for (let i = 0; i < queue.length; i++) {
      const record = queue[i];

      try {
        // Remove local queue metadata before sending to server
        const { id, queuedAt, ...attendanceData } = record;

        const response = await apiRequest("POST", "/attendance", attendanceData);

        if (response) {
          await storageService.removeAttendanceFromQueue(id);
          synced++;
          console.log(`Synced attendance record ${i + 1}/${queue.length}`);
        }
      } catch (error) {
        failed++;
        failedItems.push({
          id: record.id,
          error: error.message,
        });
        console.error(`Failed to sync attendance record: ${error.message}`);
      }

      // Call progress callback
      if (onProgress) {
        onProgress({
          type: "attendance",
          current: i + 1,
          total: queue.length,
          synced,
          failed,
        });
      }
    }

    const result = {
      success: failed === 0,
      synced,
      failed,
      failedItems: failed > 0 ? failedItems : undefined,
    };

    if (synced > 0) {
      await storageService.setLastSyncTime(new Date().toISOString());
    }

    return result;
  } catch (error) {
    console.error("Attendance sync error:", error);
    return {
      success: false,
      error: error.message,
      synced: 0,
      failed: 0,
    };
  }
};

/**
 * Sync all queued location records
 */
export const syncLocations = async (onProgress = null) => {
  try {
    const isOnline = await networkService.isNetworkConnected();
    if (!isOnline) {
      console.warn("Device offline - cannot sync locations");
      return {
        success: false,
        reason: "offline",
        synced: 0,
        failed: 0,
      };
    }

    const queue = await storageService.getLocationQueue();
    if (queue.length === 0) {
      console.log("No location records to sync");
      return {
        success: true,
        synced: 0,
        failed: 0,
        message: "Queue empty",
      };
    }

    let synced = 0;
    let failed = 0;
    const failedItems = [];

    for (let i = 0; i < queue.length; i++) {
      const record = queue[i];

      try {
        const { id, queuedAt, ...locationData } = record;

        const response = await apiRequest("POST", "/tracking/location", locationData);

        if (response) {
          await storageService.removeLocationFromQueue(id);
          synced++;
          console.log(`Synced location record ${i + 1}/${queue.length}`);
        }
      } catch (error) {
        failed++;
        failedItems.push({
          id: record.id,
          error: error.message,
        });
        console.error(`Failed to sync location: ${error.message}`);
      }

      if (onProgress) {
        onProgress({
          type: "location",
          current: i + 1,
          total: queue.length,
          synced,
          failed,
        });
      }
    }

    const result = {
      success: failed === 0,
      synced,
      failed,
      failedItems: failed > 0 ? failedItems : undefined,
    };

    if (synced > 0) {
      await storageService.setLastSyncTime(new Date().toISOString());
    }

    return result;
  } catch (error) {
    console.error("Location sync error:", error);
    return {
      success: false,
      error: error.message,
      synced: 0,
      failed: 0,
    };
  }
};

/**
 * Bulk sync all offline data at once
 */
export const syncAllOfflineData = async (onProgress = null) => {
  try {
    const isOnline = await networkService.isNetworkConnected();
    if (!isOnline) {
      console.warn("Device offline - cannot sync");
      return {
        success: false,
        reason: "offline",
        attendance: { synced: 0, failed: 0 },
        locations: { synced: 0, failed: 0 },
        uploads: { synced: 0, failed: 0 },
      };
    }

    const [attendanceQueue, locationQueue] = await Promise.all([
      storageService.getAttendanceQueue(),
      storageService.getLocationQueue(),
    ]);

    const totalRecords = attendanceQueue.length + locationQueue.length;

    if (totalRecords === 0) {
      console.log("No offline data to sync");
      return {
        success: true,
        totalSynced: 0,
        totalFailed: 0,
        message: "All queues empty",
      };
    }

    console.log(`Starting bulk sync: ${totalRecords} records pending`);

    // Try bulk sync endpoint first
    try {
      const bulkPayload = {
        attendance: attendanceQueue.map(({ id, queuedAt, ...data }) => data),
        locations: locationQueue.map(({ id, queuedAt, ...data }) => data),
      };

      const response = await apiRequest("POST", "/sync/bulk", bulkPayload);

      if (response) {
        // Clear queues on success
        await Promise.all([
          storageService.clearAttendanceQueue(),
          storageService.clearLocationQueue(),
        ]);

        await storageService.setLastSyncTime(new Date().toISOString());

        return {
          success: true,
          method: "bulk",
          attendance: {
            synced: response.attendance_inserted || 0,
            duplicates: response.attendance_duplicates || 0,
          },
          locations: {
            synced: response.locations_inserted || 0,
            duplicates: response.locations_duplicates || 0,
            anomalies: response.anomaly_count || 0,
          },
          totalSynced: (response.attendance_inserted || 0) + (response.locations_inserted || 0),
          totalDuplicates: (response.attendance_duplicates || 0) + (response.locations_duplicates || 0),
        };
      }
    } catch (error) {
      console.warn("Bulk sync failed, falling back to individual sync:", error.message);
    }

    // Fall back to individual syncs
    const attendanceResult = await syncAttendance((progress) => {
      if (onProgress) onProgress({ ...progress, phase: "attendance" });
    });

    const locationResult = await syncLocations((progress) => {
      if (onProgress) onProgress({ ...progress, phase: "location" });
    });

    return {
      success: attendanceResult.success && locationResult.success,
      method: "individual",
      attendance: {
        synced: attendanceResult.synced,
        failed: attendanceResult.failed,
      },
      locations: {
        synced: locationResult.synced,
        failed: locationResult.failed,
      },
      totalSynced: attendanceResult.synced + locationResult.synced,
      totalFailed: attendanceResult.failed + locationResult.failed,
    };
  } catch (error) {
    console.error("Bulk sync error:", error);
    return {
      success: false,
      error: error.message,
      totalSynced: 0,
      totalFailed: 0,
    };
  }
};

/**
 * Set up automatic sync when network becomes available
 */
export const setupAutoSync = (onSyncComplete = null, checkInterval = 20000) => {
  let previousOnlineState = false;

  const checkAndSync = async () => {
    try {
      const isOnline = await networkService.isNetworkConnected();

      // If just came online, trigger sync
      if (isOnline && !previousOnlineState) {
        console.log("Network reconnected, starting sync...");
        const result = await syncAllOfflineData();
        if (onSyncComplete) {
          onSyncComplete(result);
        }
      }

      previousOnlineState = isOnline;
    } catch (error) {
      console.error("Auto sync check error:", error);
    }
  };

  // Check network status periodically
  const interval = setInterval(checkAndSync, checkInterval);

  // Return cleanup function
  return () => {
    clearInterval(interval);
  };
};

/**
 * Get sync statistics
 */
export const getSyncStats = async () => {
  try {
    const queueStatus = await storageService.getQueueStatus();
    const lastSyncTime = await storageService.getLastSyncTime();
    const isOnline = await networkService.isNetworkConnected();

    const timeSinceLastSync = lastSyncTime
      ? Math.floor((Date.now() - new Date(lastSyncTime).getTime()) / 1000)
      : null;

    return {
      pending: queueStatus,
      lastSync: lastSyncTime,
      timeSinceSync: timeSinceLastSync,
      isOnline,
      readyToSync: isOnline && queueStatus.totalPending > 0,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    console.error("Failed to get sync stats:", error);
    return {
      error: error.message,
      pending: { attendance: 0, locations: 0, uploads: 0, totalPending: 0 },
    };
  }
};
