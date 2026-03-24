/**
 * Client-side geofence validation
 * Point-in-polygon algorithm for offline geofence checking
 */

/**
 * Ray casting algorithm to check if point is inside polygon
 * Used for fast geofence validation
 */
const pointInPolygon = (lat, lon, polygon) => {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].lat;
    const yi = polygon[i].lon;
    const xj = polygon[j].lat;
    const yj = polygon[j].lon;

    const intersect =
      yi > lon !== yj > lon && lat < ((xj - xi) * (lon - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
};

/**
 * Calculate distance from point to polygon edge (for proximity detection)
 */
const distanceToPolygonEdge = (lat, lon, polygon) => {
  let minDistance = Infinity;

  for (let i = 0; i < polygon.length; i++) {
    const p1 = polygon[i];
    const p2 = polygon[(i + 1) % polygon.length];

    const distance = pointToLineSegmentDistance(lat, lon, p1.lat, p1.lon, p2.lat, p2.lon);
    minDistance = Math.min(minDistance, distance);
  }

  return minDistance;
};

/**
 * Calculate distance from point to line segment
 */
const degreesToMeters = (lat, lon, originLat, originLon) => {
  const earthRadius = 6371000;
  const latRad = (lat * Math.PI) / 180;
  const lonRad = (lon * Math.PI) / 180;
  const originLatRad = (originLat * Math.PI) / 180;
  const originLonRad = (originLon * Math.PI) / 180;
  const x = (lonRad - originLonRad) * earthRadius * Math.cos((latRad + originLatRad) / 2);
  const y = (latRad - originLatRad) * earthRadius;
  return { x, y };
};

const pointToLineSegmentDistance = (px, py, x1, y1, x2, y2) => {
  const p = degreesToMeters(px, py, px, py);
  const a = degreesToMeters(x1, y1, px, py);
  const b = degreesToMeters(x2, y2, px, py);

  const A = p.x - a.x;
  const B = p.y - a.y;
  const C = b.x - a.x;
  const D = b.y - a.y;

  const dot = A * C + B * D;
  const lenSq = C * C + D * D;

  let param = -1;
  if (lenSq !== 0) param = dot / lenSq;

  let xx, yy;

  if (param < 0) {
    xx = a.x;
    yy = a.y;
  } else if (param > 1) {
    xx = b.x;
    yy = b.y;
  } else {
    xx = a.x + param * C;
    yy = a.y + param * D;
  }

  const dx = p.x - xx;
  const dy = p.y - yy;
  return Math.sqrt(dx * dx + dy * dy);
};

/**
 * Predefined geofences for major areas
 * Format: { name, coordinates: [{lat, lon}, ...] }
 */
export const DEFAULT_GEOFENCES = {
  pune_taluka: {
    name: "Pune Taluka",
    coordinates: [
      { lat: 18.5204, lon: 73.8567 },
      { lat: 18.5204, lon: 73.9567 },
      { lat: 18.4204, lon: 73.9567 },
      { lat: 18.4204, lon: 73.8567 },
    ],
  },
  baner_area: {
    name: "Baner-Balewadi",
    coordinates: [
      { lat: 18.562, lon: 73.8148 },
      { lat: 18.562, lon: 73.8548 },
      { lat: 18.542, lon: 73.8548 },
      { lat: 18.542, lon: 73.8148 },
    ],
  },
  aundh_area: {
    name: "Aundh Market",
    coordinates: [
      { lat: 18.553, lon: 73.8314 },
      { lat: 18.553, lon: 73.8514 },
      { lat: 18.533, lon: 73.8514 },
      { lat: 18.533, lon: 73.8314 },
    ],
  },
};

/**
 * Validate if location is within geofence
 */
export const isWithinGeofence = (lat, lon, geofence) => {
  if (!geofence || !geofence.coordinates || geofence.coordinates.length < 3) {
    console.warn("Invalid geofence polygon");
    return false;
  }

  return pointInPolygon(lat, lon, geofence.coordinates);
};

/**
 * Find distance from nearest geofence boundary
 */
export const getDistanceToGeofenceBoundary = (lat, lon, geofence) => {
  if (!geofence || !geofence.coordinates) return Infinity;

  return distanceToPolygonEdge(lat, lon, geofence.coordinates);
};

/**
 * Validate location against multiple geofences
 */
export const validateAgainstGeofences = (lat, lon, geofenceList) => {
  const results = {
    isValid: false,
    validGeofences: [],
    nearbyGeofences: [],
    allResults: [],
  };

  for (const geofence of geofenceList) {
    const isInside = isWithinGeofence(lat, lon, geofence);
    const distanceToBoundary = getDistanceToGeofenceBoundary(lat, lon, geofence);

    const result = {
      name: geofence.name,
      isInside,
      distanceToBoundary,
      proximityAlert: distanceToBoundary < 100, // Alert if within 100m of boundary
    };

    results.allResults.push(result);

    if (isInside) {
      results.isValid = true;
      results.validGeofences.push(geofence.name);
    }

    if (distanceToBoundary < 200) {
      results.nearbyGeofences.push({
        name: geofence.name,
        distance: distanceToBoundary.toFixed(0),
      });
    }
  }

  return results;
};

/**
 * Get geofence by name
 */
export const getGeofence = (name) => {
  return DEFAULT_GEOFENCES[name] || null;
};

/**
 * Get all available geofences
 */
export const getAllGeofences = () => {
  return Object.entries(DEFAULT_GEOFENCES).reduce((acc, [key, value]) => {
    acc[key] = {
      ...value,
      id: key,
    };
    return acc;
  }, {});
};

/**
 * Add custom geofence
 */
export const createGeofence = (name, coordinates) => {
  if (!coordinates || coordinates.length < 3) {
    throw new Error("Geofence must have at least 3 coordinates");
  }

  return {
    name,
    coordinates,
  };
};

/**
 * Calculate geofence coverage (for diagnostics)
 */
export const getGeofenceCoverage = (lat, lon) => {
  const results = validateAgainstGeofences(lat, lon, Object.values(DEFAULT_GEOFENCES));
  return {
    currentLocation: { lat, lon },
    coverage: {
      isWithinAnyGeofence: results.isValid,
      insideGeofences: results.validGeofences,
      nearbyGeofences: results.nearbyGeofences,
      allGeofences: results.allResults,
    },
  };
};
