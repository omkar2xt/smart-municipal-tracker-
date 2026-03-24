import AsyncStorage from "@react-native-async-storage/async-storage";

const ATTENDANCE_QUEUE = "attendance_queue";
const LOCATION_QUEUE = "location_queue";
const UPLOAD_QUEUE = "upload_queue";
const SYNC_STATUS = "sync_status";
const OFFLINE_MODE = "offline_mode";

/**
 * Queue attendance record for offline sync
 */
export const queueAttendance = async (attendanceData) => {
  try {
    const existing = await AsyncStorage.getItem(ATTENDANCE_QUEUE);
    const queue = existing ? JSON.parse(existing) : [];
    queue.push({
      ...attendanceData,
      queuedAt: new Date().toISOString(),
      id: `att_${Date.now()}_${Math.random()}`,
    });
    await AsyncStorage.setItem(ATTENDANCE_QUEUE, JSON.stringify(queue));
    console.log(`Queued attendance: ${queue.length} items`);
    return queue.length;
  } catch (error) {
    console.error("Failed to queue attendance:", error);
    throw error;
  }
};

/**
 * Queue location record for offline sync
 */
export const queueLocation = async (locationData) => {
  try {
    const existing = await AsyncStorage.getItem(LOCATION_QUEUE);
    const queue = existing ? JSON.parse(existing) : [];
    queue.push({
      ...locationData,
      queuedAt: new Date().toISOString(),
      id: `loc_${Date.now()}_${Math.random()}`,
    });
    await AsyncStorage.setItem(LOCATION_QUEUE, JSON.stringify(queue));
    return queue.length;
  } catch (error) {
    console.error("Failed to queue location:", error);
    throw error;
  }
};

/**
 * Queue upload proof for offline sync
 */
export const queueUpload = async (uploadData) => {
  try {
    const existing = await AsyncStorage.getItem(UPLOAD_QUEUE);
    const queue = existing ? JSON.parse(existing) : [];
    queue.push({
      ...uploadData,
      queuedAt: new Date().toISOString(),
      id: `upl_${Date.now()}_${Math.random()}`,
    });
    await AsyncStorage.setItem(UPLOAD_QUEUE, JSON.stringify(queue));
    return queue.length;
  } catch (error) {
    console.error("Failed to queue upload:", error);
    throw error;
  }
};

/**
 * Get all queued attendance records
 */
export const getAttendanceQueue = async () => {
  try {
    const data = await AsyncStorage.getItem(ATTENDANCE_QUEUE);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error("Failed to retrieve attendance queue:", error);
    return [];
  }
};

/**
 * Get all queued location records
 */
export const getLocationQueue = async () => {
  try {
    const data = await AsyncStorage.getItem(LOCATION_QUEUE);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error("Failed to retrieve location queue:", error);
    return [];
  }
};

/**
 * Get all queued uploads
 */
export const getUploadQueue = async () => {
  try {
    const data = await AsyncStorage.getItem(UPLOAD_QUEUE);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error("Failed to retrieve upload queue:", error);
    return [];
  }
};

/**
 * Clear processed attendance records
 */
export const clearAttendanceQueue = async () => {
  try {
    await AsyncStorage.removeItem(ATTENDANCE_QUEUE);
  } catch (error) {
    console.error("Failed to clear attendance queue:", error);
  }
};

/**
 * Clear processed location records
 */
export const clearLocationQueue = async () => {
  try {
    await AsyncStorage.removeItem(LOCATION_QUEUE);
  } catch (error) {
    console.error("Failed to clear location queue:", error);
  }
};

/**
 * Clear processed uploads
 */
export const clearUploadQueue = async () => {
  try {
    await AsyncStorage.removeItem(UPLOAD_QUEUE);
  } catch (error) {
    console.error("Failed to clear upload queue:", error);
  }
};

/**
 * Get queue status (counts)
 */
export const getQueueStatus = async () => {
  try {
    const [attendance, locations, uploads] = await Promise.all([
      getAttendanceQueue(),
      getLocationQueue(),
      getUploadQueue(),
    ]);
    return {
      attendance: attendance.length,
      locations: locations.length,
      uploads: uploads.length,
      totalPending: attendance.length + locations.length + uploads.length,
    };
  } catch (error) {
    console.error("Failed to get queue status:", error);
    return { attendance: 0, locations: 0, uploads: 0, totalPending: 0 };
  }
};

/**
 * Remove specific item from attendance queue
 */
export const removeAttendanceFromQueue = async (id) => {
  try {
    const queue = await getAttendanceQueue();
    const filtered = queue.filter((item) => item.id !== id);
    await AsyncStorage.setItem(ATTENDANCE_QUEUE, JSON.stringify(filtered));
  } catch (error) {
    console.error("Failed to remove from attendance queue:", error);
  }
};

/**
 * Remove specific item from location queue
 */
export const removeLocationFromQueue = async (id) => {
  try {
    const queue = await getLocationQueue();
    const filtered = queue.filter((item) => item.id !== id);
    await AsyncStorage.setItem(LOCATION_QUEUE, JSON.stringify(filtered));
  } catch (error) {
    console.error("Failed to remove from location queue:", error);
  }
};

/**
 * Store last sync timestamp
 */
export const setLastSyncTime = async (timestamp) => {
  try {
    await AsyncStorage.setItem(SYNC_STATUS, JSON.stringify({ lastSync: timestamp }));
  } catch (error) {
    console.error("Failed to set sync time:", error);
  }
};

/**
 * Get last sync timestamp
 */
export const getLastSyncTime = async () => {
  try {
    const data = await AsyncStorage.getItem(SYNC_STATUS);
    if (data) {
      const parsed = JSON.parse(data);
      return parsed.lastSync;
    }
    return null;
  } catch (error) {
    console.error("Failed to get sync time:", error);
    return null;
  }
};

/**
 * Set offline mode status
 */
export const setOfflineMode = async (isOffline) => {
  try {
    await AsyncStorage.setItem(OFFLINE_MODE, JSON.stringify({ isOffline }));
  } catch (error) {
    console.error("Failed to set offline mode:", error);
  }
};

/**
 * Get offline mode status
 */
export const getOfflineMode = async () => {
  try {
    const data = await AsyncStorage.getItem(OFFLINE_MODE);
    if (data) {
      const parsed = JSON.parse(data);
      return parsed.isOffline;
    }
    return false;
  } catch (error) {
    console.error("Failed to get offline mode:", error);
    return false;
  }
};
