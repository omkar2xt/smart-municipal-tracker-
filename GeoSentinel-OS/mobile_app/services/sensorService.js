import * as Location from "expo-location";
import { Accelerometer } from "expo-sensors";

const GPS_MOVE_THRESHOLD_METERS = 15;
const MOTION_THRESHOLD_G = 0.05;

function toRadians(value) {
  return (value * Math.PI) / 180;
}

function distanceInMeters(from, to) {
  if (!from || !to) {
    return 0;
  }

  const earthRadius = 6371000;
  const dLat = toRadians(to.latitude - from.latitude);
  const dLon = toRadians(to.longitude - from.longitude);
  const lat1 = toRadians(from.latitude);
  const lat2 = toRadians(to.latitude);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return earthRadius * c;
}

export const getCurrentLocation = async () => {
  const permission = await Location.requestForegroundPermissionsAsync();
  if (permission.status !== "granted") {
    throw new Error("Location permission not granted");
  }

  const position = await Location.getCurrentPositionAsync({
    accuracy: Location.Accuracy.Balanced,
  });

  return {
    latitude: position.coords.latitude,
    longitude: position.coords.longitude,
    accuracy: position.coords.accuracy,
    timestamp: position.timestamp,
  };
};

export const getSensorData = async () =>
  new Promise((resolve, reject) => {
    let completed = false;
    let subscription;

    const done = (callback) => {
      if (completed) {
        return;
      }
      completed = true;
      if (subscription) {
        subscription.remove();
      }
      callback();
    };

    Accelerometer.setUpdateInterval(250);
    subscription = Accelerometer.addListener((reading) => {
      const magnitude = Math.sqrt(
        reading.x * reading.x +
          reading.y * reading.y +
          reading.z * reading.z
      );

      done(() => {
        resolve({
          ...reading,
          magnitude,
          timestamp: Date.now(),
        });
      });
    });

    setTimeout(() => {
      done(() => {
        reject(new Error("Unable to read accelerometer data"));
      });
    }, 3000);
  });

export const detectSpoofing = (location, sensorData) => {
  const current = location?.current || location;
  const previous =
    location?.previous ||
    (location?.previousLatitude != null && location?.previousLongitude != null
      ? {
          latitude: location.previousLatitude,
          longitude: location.previousLongitude,
        }
      : null);

  const distanceMovedMeters = distanceInMeters(previous, current);
  const gpsMoved = distanceMovedMeters >= GPS_MOVE_THRESHOLD_METERS;

  const magnitude = sensorData?.magnitude;
  const sensorAvailable = sensorData && typeof magnitude === "number";
  const movementScore = sensorAvailable ? Math.abs(magnitude - 1) : null;
  const hasAccelerometerMovement =
    sensorAvailable && movementScore >= MOTION_THRESHOLD_G;

  const isSuspicious = gpsMoved && sensorAvailable && !hasAccelerometerMovement;

  return {
    isSuspicious,
    reason: isSuspicious
      ? "GPS changed without accelerometer movement"
      : "No spoofing pattern detected",
    details: {
      gpsMoved,
      distanceMovedMeters,
      sensorAvailable,
      hasAccelerometerMovement,
      movementScore,
    },
  };
};

// Backward-compatible alias for existing callers.
export const readMotionSignals = getSensorData;
