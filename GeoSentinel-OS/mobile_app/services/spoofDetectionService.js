/**
 * Advanced spoof detection engine
 * Analyzes GPS + sensor data for spoofing patterns
 */

/**
 * Calculate distance between two coordinates (Haversine formula)
 */
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371000; // Earth radius in meters
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in meters
};

/**
 * Detect GPS jump (sudden large displacement)
 * Flags if movement > 500m in <60 seconds
 */
const detectGPSJump = (
  prevLat,
  prevLon,
  currLat,
  currLon,
  timeDeltaSeconds
) => {
  if (prevLat == null || prevLon == null || !Number.isFinite(prevLat) || !Number.isFinite(prevLon)) {
    return { detected: false, reason: null };
  }

  const distance = calculateDistance(prevLat, prevLon, currLat, currLon);
  const speedMps = distance / timeDeltaSeconds;
  const speedKmh = speedMps * 3.6;

  // Human max speed ~40 km/h, vehicle max ~200 km/h
  if (speedKmh > 200) {
    return {
      detected: true,
      reason: `GPS jump detected: ${speedKmh.toFixed(1)} km/h (${distance.toFixed(0)}m in ${timeDeltaSeconds}s)`,
      speedKmh: speedKmh.toFixed(1),
      distanceM: distance.toFixed(0),
    };
  }

  return { detected: false, reason: null, speedKmh, distanceM: distance };
};

/**
 * Detect sensor-movement mismatch
 * Flags if GPS moved but accelerometer unchanged
 */
const detectSensorMismatch = (
  gpsDistance,
  prevAccel,
  currAccel,
  timeDeltaSeconds
) => {
  // If GPS moved >50m but accelerometer shows minimal change, flag as suspicious
  const minAccelThreshold = 0.5; // m/s^2
  const significantGPSMove = gpsDistance > 50;

  if (significantGPSMove) {
    const accelDelta = Math.abs(currAccel - prevAccel);
    if (accelDelta < minAccelThreshold) {
      return {
        detected: true,
        reason: `Sensor mismatch: GPS moved ${gpsDistance.toFixed(0)}m but accel unchanged (${accelDelta.toFixed(3)} m/s²)`,
      };
    }
  }

  return { detected: false, reason: null };
};

/**
 * Detect stationary GPS with high acceleration
 * Flags if accelerometer shows movement but GPS is static
 */
const detectStationaryMismatch = (gpsDistance, currAccel) => {
  const expectedGravity = 9.8;
  const motionThreshold = 2.0; // linear acceleration threshold beyond gravity
  const movementThreshold = expectedGravity + motionThreshold;
  const staticGPS = gpsDistance < 10; // meters

  if (staticGPS && currAccel > movementThreshold) {
    return {
      detected: true,
      reason: `Stationary mismatch: GPS static but high acceleration (${currAccel.toFixed(2)} m/s²)`,
    };
  }

  return { detected: false, reason: null };
};

/**
 * Detect pattern spoofing (same location repeated too frequently)
 */
const detectPatternReplay = (
  locations,
  currLat,
  currLon,
  threshold = 5 // Check last 5 entries
) => {
  if (locations.length < threshold) return { detected: false, reason: null };

  const recent = locations.slice(-threshold);
  const duplicates = recent.filter((loc) => {
    const dist = calculateDistance(loc.latitude, loc.longitude, currLat, currLon);
    return dist < 5; // Within 5 meters
  });

  if (duplicates.length >= threshold - 1) {
    return {
      detected: true,
      reason: `Pattern replay: ${duplicates.length} of last ${threshold} readings at similar location`,
    };
  }

  return { detected: false, reason: null };
};

/**
 * Main spoof detection function
 * Returns comprehensive analysis
 */
export const analyzeSpoofRisk = (
  currentLocation,
  previousLocation,
  sensorData,
  locationHistory = []
) => {
  const timestamp = new Date();
  const risks = {
    isSpoofed: false,
    riskLevel: "safe", // safe, warning, danger
    detections: [],
    score: 0,
    timestamp,
    analysisDetails: {
      gpsJump: null,
      sensorMismatch: null,
      stationaryMismatch: null,
      patternReplay: null,
    },
  };

  // Skip analysis if missing critical data
  if (!currentLocation || !sensorData) {
    risks.riskLevel = "unknown";
    return risks;
  }

  const { latitude: currLat, longitude: currLon } = currentLocation;
  const accelX = Number(sensorData.accelerometer_x) || 0;
  const accelY = Number(sensorData.accelerometer_y) || 0;
  const accelZ = Number(sensorData.accelerometer_z) || 0;

  // Validate data before computing
  if (!Number.isFinite(accelX) || !Number.isFinite(accelY) || !Number.isFinite(accelZ)) {
    risks.riskLevel = "warning";
    return { ...risks, detections: [{ type: "SENSOR_INVALID", reason: "Invalid accelerometer values" }] };
  }

  // Calculate magnitude of acceleration (3D)
  const accelMagnitude = Math.sqrt(accelX ** 2 + accelY ** 2 + accelZ ** 2);

  // 1. GPS Jump Detection
  if (previousLocation) {
    const { latitude: prevLat, longitude: prevLon } = previousLocation;
    const timeDeltaSeconds =
      (new Date(currentLocation.timestamp) - new Date(previousLocation.timestamp)) /
      1000 || 1;

    const gpsJump = detectGPSJump(prevLat, prevLon, currLat, currLon, timeDeltaSeconds);
    risks.analysisDetails.gpsJump = gpsJump;

    if (gpsJump.detected) {
      risks.detections.push({
        type: "GPS_JUMP",
        severity: "high",
        reason: gpsJump.reason,
      });
      risks.score += 50;
    }

    // 2. Sensor-Movement Mismatch
    const prevAccelMag = previousLocation.accelMagnitude || 9.8;
    const sensorMismatch = detectSensorMismatch(
      gpsJump.distanceM || 0,
      prevAccelMag,
      accelMagnitude,
      timeDeltaSeconds
    );
    risks.analysisDetails.sensorMismatch = sensorMismatch;

    if (sensorMismatch.detected) {
      risks.detections.push({
        type: "SENSOR_MISMATCH",
        severity: "medium",
        reason: sensorMismatch.reason,
      });
      risks.score += 30;
    }
  }

  // 3. Stationary Mismatch Detection
  const stationaryMismatch = detectStationaryMismatch(
    previousLocation ? calculateDistance(
      previousLocation.latitude,
      previousLocation.longitude,
      currLat,
      currLon
    ) : 0,
    accelMagnitude
  );
  risks.analysisDetails.stationaryMismatch = stationaryMismatch;

  if (stationaryMismatch.detected) {
    risks.detections.push({
      type: "STATIONARY_MISMATCH",
      severity: "medium",
      reason: stationaryMismatch.reason,
    });
    risks.score += 25;
  }

  // 4. Pattern Replay Detection
  const patternReplay = detectPatternReplay(locationHistory, currLat, currLon);
  risks.analysisDetails.patternReplay = patternReplay;

  if (patternReplay.detected) {
    risks.detections.push({
      type: "PATTERN_REPLAY",
      severity: "high",
      reason: patternReplay.reason,
    });
    risks.score += 40;
  }

  // Determine risk level based on score
  if (risks.score >= 50) {
    risks.isSpoofed = true;
    risks.riskLevel = "danger";
  } else if (risks.score >= 25) {
    risks.riskLevel = "warning";
  } else {
    risks.riskLevel = "safe";
  }

  return risks;
};

/**
 * Quick spoof check (lightweight version for continuous tracking)
 */
export const quickSpoofCheck = (currentLocation, previousLocation, sensorData) => {
  if (!previousLocation || !currentLocation) {
    return { isSuspicious: false, reason: null };
  }

  const timeDeltaSeconds =
    (new Date(currentLocation.timestamp) - new Date(previousLocation.timestamp)) / 1000 ||
    1;

  // Just check for impossible speeds
  const distance = calculateDistance(
    previousLocation.latitude,
    previousLocation.longitude,
    currentLocation.latitude,
    currentLocation.longitude
  );

  const speedKmh = (distance / timeDeltaSeconds) * 3.6;

  if (speedKmh > 250) {
    return {
      isSuspicious: true,
      reason: `Impossible speed: ${speedKmh.toFixed(1)} km/h`,
      speedKmh,
    };
  }

  // Check for zero movement with sensor activity
  if (sensorData && distance < 2) {
    const ax = Number(sensorData.accelerometer_x) || 0;
    const ay = Number(sensorData.accelerometer_y) || 0;
    const az = Number(sensorData.accelerometer_z) || 0;
    const accelMag = Math.sqrt(ax ** 2 + ay ** 2 + az ** 2);
    if (accelMag > 15) {
      return {
        isSuspicious: true,
        reason: `Device motion but GPS static (accel: ${accelMag.toFixed(1)})`,
      };
    }
  }

  return { isSuspicious: false, reason: null, speedKmh };
};
