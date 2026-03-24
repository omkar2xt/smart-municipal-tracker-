import * as Location from "expo-location";
import * as TaskManager from "expo-task-manager";

const BACKGROUND_LOCATION_TASK = "background_location_tracking";

let isTaskDefined = false;

const normalizeHeading = (value) => {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return null;
  }
  const normalized = value % 360;
  return normalized < 0 ? normalized + 360 : normalized;
};

/**
 * Define background location task
 * This runs in background even when app is closed
 */
export const defineBackgroundLocationTask = (onLocationUpdate) => {
  if (isTaskDefined) return;

  TaskManager.defineTask(BACKGROUND_LOCATION_TASK, async ({ data, error }) => {
    if (error) {
      console.error("Background location error:", error.message);
      return;
    }

    if (data) {
      const { locations } = data;
      console.log(`Received ${locations.length} background location update(s)`);

      // Process each location
      locations.forEach((location) => {
        if (onLocationUpdate) {
          onLocationUpdate({
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            accuracy: location.coords.accuracy,
            altitude: location.coords.altitude,
            speed: location.coords.speed,
            heading: normalizeHeading(location.coords.heading),
            timestamp: location.timestamp,
            isBackground: true,
          });
        }
      });

      // Return true to indicate successful processing
      return true;
    }
  });

  isTaskDefined = true;
};

/**
 * Start background location tracking
 * Requires location permission
 */
export const startBackgroundTracking = async (options = {}) => {
  try {
    // Request background location permission
    const foregroundPermission = await Location.requestForegroundPermissionsAsync();
    if (foregroundPermission.status !== "granted") {
      throw new Error("Foreground location permission not granted");
    }

    const backgroundPermission = await Location.requestBackgroundPermissionsAsync();
    if (backgroundPermission.status !== "granted") {
      throw new Error("Background location permission not granted");
    }

    // Configure location options
    const locationOptions = {
      accuracy: options.accuracy || Location.Accuracy.High,
      timeInterval: options.timeInterval || 10000, // Update every 10 seconds
      distanceInterval: options.distanceInterval || 10, // Or when moved 10 meters
      foregroundService: {
        notificationTitle: "GeoSentinel OS",
        notificationBody: "Tracking location...",
        notificationColor: "#FF9800",
      },
      pausesUpdatesAutomatically: true,
      mayShowUserSettingsDialog: true,
    };

    // Start background tracking
    await Location.startLocationUpdatesAsync(BACKGROUND_LOCATION_TASK, locationOptions);
    console.log("Background location tracking started");

    return true;
  } catch (error) {
    console.error("Failed to start background tracking:", error);
    throw error;
  }
};

/**
 * Stop background location tracking
 */
export const stopBackgroundTracking = async () => {
  try {
    await Location.stopLocationUpdatesAsync(BACKGROUND_LOCATION_TASK);
    console.log("Background location tracking stopped");
    return true;
  } catch (error) {
    console.error("Failed to stop background tracking:", error);
    throw error;
  }
};

/**
 * Check if background tracking is running
 */
export const isBackgroundTrackingActive = async () => {
  try {
    const isRegistered = await TaskManager.isTaskRegisteredAsync(BACKGROUND_LOCATION_TASK);
    return isRegistered;
  } catch (error) {
    console.error("Failed to check background tracking status:", error);
    return false;
  }
};

/**
 * Get current location with high accuracy
 * Used for explicit check-in/attendance
 */
export const getCurrentLocation = async (options = {}) => {
  try {
    const permission = await Location.requestForegroundPermissionsAsync();
    if (permission.status !== "granted") {
      throw new Error("Location permission not granted");
    }

    const position = await Location.getCurrentPositionAsync({
      accuracy: options.accuracy || Location.Accuracy.Highest,
    });

    return {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
      accuracy: position.coords.accuracy,
      altitude: position.coords.altitude,
      speed: position.coords.speed,
      heading: normalizeHeading(position.coords.heading),
      timestamp: position.timestamp,
      isBackground: false,
    };
  } catch (error) {
    console.error("Failed to get current location:", error);
    throw error;
  }
};

/**
 * Get last known location (fast, may be stale)
 */
export const getLastKnownLocation = async () => {
  try {
    const permission = await Location.requestForegroundPermissionsAsync();
    if (permission.status !== "granted") {
      return null;
    }

    const lastLocation = await Location.getLastKnownPositionAsync();
    if (!lastLocation) return null;

    return {
      latitude: lastLocation.coords.latitude,
      longitude: lastLocation.coords.longitude,
      accuracy: lastLocation.coords.accuracy,
      altitude: lastLocation.coords.altitude,
      timestamp: lastLocation.timestamp,
      isLastKnown: true,
    };
  } catch (error) {
    console.error("Failed to get last known location:", error);
    return null;
  }
};

/**
 * Watch location changes in foreground
 */
export const watchLocation = async (onLocationChange, options = {}) => {
  try {
    const permission = await Location.requestForegroundPermissionsAsync();
    if (permission.status !== "granted") {
      throw new Error("Location permission not granted");
    }

    let accuracy = options.accuracy || Location.Accuracy.High;

    // Listen to location changes
    const subscription = await Location.watchPositionAsync(
      {
        accuracy,
        timeInterval: options.timeInterval || 5000,
        distanceInterval: options.distanceInterval || 5,
      },
      (location) => {
        if (onLocationChange) {
          onLocationChange({
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            accuracy: location.coords.accuracy,
            altitude: location.coords.altitude,
            speed: location.coords.speed,
            heading: normalizeHeading(location.coords.heading),
            timestamp: location.timestamp,
          });
        }
      }
    );

    // Return unsubscribe function
    return () => {
      if (subscription) {
        subscription.remove();
      }
    };
  } catch (error) {
    console.error("Failed to watch location:", error);
    throw error;
  }
};

/**
 * Get location with reverse geocoding (address)
 */
export const getLocationWithAddress = async (lat, lon) => {
  try {
    const reverseGeocode = await Location.reverseGeocodeAsync({
      latitude: lat,
      longitude: lon,
    });

    if (reverseGeocode.length > 0) {
      const address = reverseGeocode[0];
      return {
        latitude: lat,
        longitude: lon,
        address: `${address.street || ""} ${address.city || ""} ${address.region || ""}`.trim(),
        city: address.city,
        region: address.region,
        country: address.country,
        postalCode: address.postalCode,
      };
    }

    return {
      latitude: lat,
      longitude: lon,
      address: "Address not found",
    };
  } catch (error) {
    console.error("Reverse geocoding failed:", error);
    return {
      latitude: lat,
      longitude: lon,
      address: "Location coordinates",
    };
  }
};

/**
 * Calculate heading from one location to another
 */
export const calculateHeading = (lat1, lon1, lat2, lon2) => {
  const startLat = (lat1 * Math.PI) / 180;
  const startLon = (lon1 * Math.PI) / 180;
  const endLat = (lat2 * Math.PI) / 180;
  const endLon = (lon2 * Math.PI) / 180;
  const dLon = endLon - startLon;

  const y = Math.sin(dLon) * Math.cos(endLat);
  const x =
    Math.cos(startLat) * Math.sin(endLat) -
    Math.sin(startLat) * Math.cos(endLat) * Math.cos(dLon);

  return (Math.atan2(y, x) * 180) / Math.PI;
};
