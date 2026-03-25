import { useEffect, useRef, useState } from "react";
import { Circle, MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet";
import L from "leaflet";
import API from "../services/api";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

function UpdateMap({ position }) {
  const map = useMap();
  useEffect(() => {
    // Fix partial/blank tiles when container size changes after initial mount.
    const raf = requestAnimationFrame(() => {
      map.invalidateSize();
      map.setView(position, map.getZoom() || 17);
    });

    const onResize = () => map.invalidateSize();
    window.addEventListener("resize", onResize);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
    };
  }, [map]);

  useEffect(() => {
    map.setView(position, 17);
  }, [map, position]);

  return null;
}

function headingIcon(direction) {
  const rotation = Number.isFinite(direction) ? Math.round(direction) : 0;
  return L.divIcon({
    className: "",
    html: `<div style="width:30px;height:30px;display:flex;align-items:center;justify-content:center;transform:rotate(${rotation}deg);transition:transform 180ms linear;"><div style="width:0;height:0;border-left:8px solid transparent;border-right:8px solid transparent;border-bottom:16px solid #0f766e;filter:drop-shadow(0 1px 2px rgba(0,0,0,0.35));"></div></div>`,
    iconSize: [30, 30],
    iconAnchor: [15, 15],
  });
}

function headingLabel(alpha) {
  if (!Number.isFinite(alpha)) return "Unknown";
  const normalized = ((alpha % 360) + 360) % 360;
  if (normalized >= 315 || normalized < 45) return "North";
  if (normalized >= 45 && normalized < 135) return "East";
  if (normalized >= 135 && normalized < 225) return "South";
  return "West";
}

function distanceMeters(a, b) {
  const r = 6371000;
  const toRad = Math.PI / 180;
  const dLat = (b[0] - a[0]) * toRad;
  const dLng = (b[1] - a[1]) * toRad;
  const lat1 = a[0] * toRad;
  const lat2 = b[0] * toRad;
  const s1 = Math.sin(dLat / 2);
  const s2 = Math.sin(dLng / 2);
  const arc = 2 * Math.atan2(
    Math.sqrt(s1 * s1 + Math.cos(lat1) * Math.cos(lat2) * s2 * s2),
    Math.sqrt(1 - (s1 * s1 + Math.cos(lat1) * Math.cos(lat2) * s2 * s2))
  );
  return r * arc;
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function blendPosition(previous, next, alpha) {
  return [
    previous[0] + (next[0] - previous[0]) * alpha,
    previous[1] + (next[1] - previous[1]) * alpha,
  ];
}

const MAX_ACCEPTABLE_ACCURACY_M = 80;
const MAX_IGNORE_ACCURACY_M = 150;
const LAST_POSITION_CACHE_KEY = "geosentinel_last_position";
const GEOLOCATION_OPTIONS = {
  enableHighAccuracy: true,
  timeout: 10000,
  maximumAge: 0,
};

function readInitialPosition() {
  try {
    const raw = localStorage.getItem(LAST_POSITION_CACHE_KEY);
    if (!raw) return [19.0, 73.0];
    const parsed = JSON.parse(raw);
    const lat = Number(parsed?.latitude);
    const lng = Number(parsed?.longitude);
    if (Number.isFinite(lat) && Number.isFinite(lng)) {
      return [lat, lng];
    }
  } catch {
    // Ignore malformed cache.
  }
  return [19.0, 73.0];
}

function cacheLastPosition(lat, lng, accuracy, heading, speed) {
  try {
    localStorage.setItem(
      LAST_POSITION_CACHE_KEY,
      JSON.stringify({ latitude: lat, longitude: lng, accuracy, heading, speed, capturedAt: Date.now() })
    );
  } catch {
    // Ignore cache failures.
  }
}

export default function MapTrackingPage() {
  const [position, setPosition] = useState(() => readInitialPosition());
  const [targetPosition, setTargetPosition] = useState(() => readInitialPosition());
  const [mapReady, setMapReady] = useState(false);
  const [mapKey, setMapKey] = useState(1);
  const [accuracy, setAccuracy] = useState(null);
  const [speed, setSpeed] = useState(0);
  const [direction, setDirection] = useState(0);
  const [moving, setMoving] = useState(false);
  const [accelData, setAccelData] = useState({ x: 0, y: 0, z: 0, magnitude: 0 });
  const [sensorEnabled, setSensorEnabled] = useState(false);
  const [sensorStatus, setSensorStatus] = useState("Sensors pending permission");
  const [gpsEnabled, setGpsEnabled] = useState(false);
  const [gpsStatus, setGpsStatus] = useState("GPS permission not requested");
  const [trackingError, setTrackingError] = useState("");
  const [platformHint, setPlatformHint] = useState("");

  const lastPositionRef = useRef(null);
  const lastTimestampRef = useRef(Date.now());
  const lastUploadRef = useRef(0);
  const firstGpsRef = useRef(true);
  const directionRef = useRef(0);
  const movingRef = useRef(false);
  const accelRef = useRef({ x: 0, y: 0, z: 0, magnitude: 0 });
  const gravityRef = useRef({ x: 0, y: 0, z: 9.81 });
  const watchIdRef = useRef(null);

  useEffect(() => {
    if (typeof window !== "undefined" && !window.isSecureContext) {
      setPlatformHint("Sensors and geolocation require HTTPS or localhost on mobile browsers.");
    }
  }, []);

  useEffect(() => {
    if (mapReady) return undefined;
    const timeout = window.setTimeout(() => {
      setTrackingError((prev) => prev || "Map is loading slowly. Tap Reload Map if tiles are not visible.");
    }, 9000);
    return () => window.clearTimeout(timeout);
  }, [mapReady]);

  useEffect(() => {
    let rafId = 0;
    const animate = () => {
      let shouldContinue = true;
      setPosition((current) => {
        const dx = targetPosition[0] - current[0];
        const dy = targetPosition[1] - current[1];
        const closeEnough = Math.abs(dx) < 0.000002 && Math.abs(dy) < 0.000002;
        if (closeEnough) {
          shouldContinue = false;
          return targetPosition;
        }
        return [current[0] + dx * 0.25, current[1] + dy * 0.25];
      });

      if (shouldContinue) {
        rafId = requestAnimationFrame(animate);
      } else {
        rafId = 0;
      }
    };

    rafId = requestAnimationFrame(animate);
    return () => {
      if (rafId) {
        cancelAnimationFrame(rafId);
      }
    };
  }, [targetPosition]);

  useEffect(() => {
    directionRef.current = direction;
  }, [direction]);

  useEffect(() => {
    movingRef.current = moving;
  }, [moving]);

  useEffect(() => {
    accelRef.current = accelData;
  }, [accelData]);

  function stopGpsTracking() {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setGpsEnabled(false);
    setGpsStatus("GPS tracking stopped");
  }

  function handleGeolocationError(error) {
    const code = Number(error?.code);
    let message = error?.message || "Unable to access live location.";

    if (code === 1) {
      message = "Location permission denied. Enable location access in browser settings.";
    } else if (code === 2) {
      message = "Location unavailable. Check GPS signal and try again.";
    } else if (code === 3) {
      message = "Location request timed out. Move to open sky and retry.";
    }

    setTrackingError(message);
    setGpsEnabled(false);
    setGpsStatus(message);
  }

  function applyLivePosition(pos) {
    const { latitude, longitude, speed, heading } = pos.coords;
    const gpsAccuracy = Number.isFinite(pos.coords.accuracy) ? pos.coords.accuracy : null;
    const now = Date.now();
    const nextPosition = [latitude, longitude];

    if (gpsAccuracy != null && gpsAccuracy > MAX_IGNORE_ACCURACY_M) {
      const warning = `Weak GPS signal (${Math.round(gpsAccuracy)} m). Move to open sky for better precision.`;
      setTrackingError(warning);
      setGpsStatus(warning);
      return;
    }

    if (firstGpsRef.current || !lastPositionRef.current) {
      firstGpsRef.current = false;
      lastPositionRef.current = nextPosition;
      lastTimestampRef.current = now;
      setPosition(nextPosition);
      setTargetPosition(nextPosition);
      setAccuracy(gpsAccuracy);
      setSpeed(Number.isFinite(speed) && speed >= 0 ? speed : 0);
      if (Number.isFinite(heading)) {
        setDirection(heading);
      }
      cacheLastPosition(latitude, longitude, gpsAccuracy, heading, speed);
      setTrackingError("");
      setGpsStatus("GPS tracking active");
      return;
    }

    const prevPosition = lastPositionRef.current;
    const distance = distanceMeters(prevPosition, nextPosition);
    const elapsedSeconds = Math.max((now - lastTimestampRef.current) / 1000, 1);
    const computedSpeed = distance / elapsedSeconds;
    const effectiveSpeed = Number.isFinite(speed) && speed >= 0 ? speed : computedSpeed;
    const movementDetected = accelRef.current.magnitude >= 0.06;

    const jitterThreshold = clamp((gpsAccuracy ?? 20) * 0.35, 2.5, 14);
    if (distance < jitterThreshold && !movementDetected) {
      setAccuracy(gpsAccuracy);
      setSpeed(0);
      setTrackingError("");
      setGpsStatus("GPS tracking active");
      return;
    }

    const quality = gpsAccuracy == null ? 0.6 : clamp(1 - gpsAccuracy / MAX_ACCEPTABLE_ACCURACY_M, 0.15, 0.9);
    const smoothingAlpha = movementDetected ? clamp(0.3 + quality * 0.55, 0.3, 0.88) : clamp(0.2 + quality * 0.35, 0.2, 0.55);
    const filteredPosition = blendPosition(prevPosition, nextPosition, smoothingAlpha);

    const spoofDetectionFlag = distance > 8 && !movementDetected;
    const spoofReason = spoofDetectionFlag ? "GPS changed while accelerometer shows no movement" : "";

    setTargetPosition(filteredPosition);
    setAccuracy(gpsAccuracy);
    setSpeed(effectiveSpeed);
    if (Number.isFinite(heading)) {
      setDirection(heading);
    }
    cacheLastPosition(filteredPosition[0], filteredPosition[1], gpsAccuracy, heading, effectiveSpeed);
    setTrackingError("");
    setGpsStatus("GPS tracking active");

    lastPositionRef.current = filteredPosition;
    lastTimestampRef.current = now;

    if (now - lastUploadRef.current >= 7000) {
      lastUploadRef.current = now;
      API.post("/tracking/location", {
        latitude: filteredPosition[0],
        longitude: filteredPosition[1],
        accuracy: gpsAccuracy,
        speed: effectiveSpeed,
        accelerometer_x: accelRef.current.x,
        accelerometer_y: accelRef.current.y,
        accelerometer_z: accelRef.current.z,
        accelerometer_magnitude: accelRef.current.magnitude,
        direction: directionRef.current,
        movement: movementDetected,
        spoof_detection_flag: spoofDetectionFlag,
        spoof_reason: spoofReason,
      }).catch((error) => {
        console.error("Tracking sync failed", error);
      });
    }
  }

  function startGpsTracking() {
    if (!("geolocation" in navigator)) {
      setTrackingError("Geolocation is not supported on this device/browser.");
      setGpsStatus("Geolocation unsupported");
      return;
    }

    setTrackingError("");
    setGpsStatus("Requesting GPS permission...");

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        applyLivePosition(pos);
        setGpsEnabled(true);

        if (watchIdRef.current !== null) {
          navigator.geolocation.clearWatch(watchIdRef.current);
        }

        watchIdRef.current = navigator.geolocation.watchPosition(
          (nextPos) => {
            setGpsEnabled(true);
            applyLivePosition(nextPos);
          },
          handleGeolocationError,
          GEOLOCATION_OPTIONS
        );
      },
      handleGeolocationError,
      GEOLOCATION_OPTIONS
    );
  }

  useEffect(() => {
    if (!("geolocation" in navigator)) {
      setTrackingError("Geolocation is not supported on this device/browser.");
      setGpsStatus("Geolocation unsupported");
      return undefined;
    }

    let active = true;
    if (navigator.permissions?.query) {
      navigator.permissions
        .query({ name: "geolocation" })
        .then((result) => {
          if (!active) return;
          if (result.state === "granted") {
            startGpsTracking();
          } else if (result.state === "denied") {
            setGpsStatus("Location permission denied. Tap Enable GPS after allowing permission.");
          } else {
            setGpsStatus("Tap Enable GPS to allow high-accuracy live tracking.");
          }
        })
        .catch(() => {
          if (!active) return;
          setGpsStatus("Tap Enable GPS to start high-accuracy location tracking.");
        });
    } else {
      setGpsStatus("Tap Enable GPS to start high-accuracy location tracking.");
    }

    return () => {
      active = false;
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!sensorEnabled) return undefined;

    const onMotion = (event) => {
      const raw = event.accelerationIncludingGravity || event.acceleration;
      const rawX = Number(raw?.x || 0);
      const rawY = Number(raw?.y || 0);
      const rawZ = Number(raw?.z || 0);

      const gravityAlpha = 0.82;
      const g = gravityRef.current;
      const gx = gravityAlpha * g.x + (1 - gravityAlpha) * rawX;
      const gy = gravityAlpha * g.y + (1 - gravityAlpha) * rawY;
      const gz = gravityAlpha * g.z + (1 - gravityAlpha) * rawZ;
      gravityRef.current = { x: gx, y: gy, z: gz };

      const linearX = rawX - gx;
      const linearY = rawY - gy;
      const linearZ = rawZ - gz;
      const linearMagnitude = Math.sqrt(linearX * linearX + linearY * linearY + linearZ * linearZ);

      setAccelData({ x: linearX, y: linearY, z: linearZ, magnitude: linearMagnitude });
      setMoving(linearMagnitude >= 0.06);
    };

    const onOrientation = (event) => {
      if (event.alpha !== null) {
        setDirection(event.alpha);
      }
    };

    window.addEventListener("devicemotion", onMotion);
    window.addEventListener("deviceorientation", onOrientation);

    return () => {
      window.removeEventListener("devicemotion", onMotion);
      window.removeEventListener("deviceorientation", onOrientation);
    };
  }, [sensorEnabled]);

  async function requestSensorPermissions() {
    try {
      const motionSupported = typeof window !== "undefined" && "DeviceMotionEvent" in window;
      const orientationSupported = typeof window !== "undefined" && "DeviceOrientationEvent" in window;
      if (!motionSupported && !orientationSupported) {
        setSensorStatus("Sensors unsupported on this device/browser");
        return;
      }

      if (typeof DeviceMotionEvent !== "undefined" && typeof DeviceMotionEvent.requestPermission === "function") {
        const motionPermission = await DeviceMotionEvent.requestPermission();
        if (motionPermission !== "granted") {
          throw new Error("Motion permission denied.");
        }
      }

      if (typeof DeviceOrientationEvent !== "undefined" && typeof DeviceOrientationEvent.requestPermission === "function") {
        const orientationPermission = await DeviceOrientationEvent.requestPermission();
        if (orientationPermission !== "granted") {
          throw new Error("Orientation permission denied.");
        }
      }

      setSensorEnabled(true);
      setSensorStatus("Sensors enabled");
      setTrackingError("");
    } catch (error) {
      setSensorEnabled(false);
      setSensorStatus("Sensors unavailable");
      setTrackingError(error?.message || "Unable to enable motion/orientation sensors.");
    }
  }

  function reloadMap() {
    setMapReady(false);
    setMapKey((prev) => prev + 1);
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="text-xl font-bold text-slate-800">Real-Time Worker Tracking</h2>
        <p className="mt-1 text-sm text-slate-600">GPS, accelerometer, and orientation tracking with spoof checks.</p>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={startGpsTracking}
            className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white"
          >
            Enable GPS
          </button>
          <button
            type="button"
            onClick={stopGpsTracking}
            disabled={!gpsEnabled}
            className="rounded-lg border border-emerald-300 bg-white px-3 py-2 text-xs font-semibold text-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Stop GPS
          </button>
          <button
            type="button"
            onClick={requestSensorPermissions}
            className="rounded-lg bg-civic-600 px-4 py-2 text-sm font-semibold text-white"
          >
            Enable Sensors
          </button>
          <span className="rounded-md bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700">{gpsStatus}</span>
          <span className="rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700">{sensorStatus}</span>
          <button
            type="button"
            onClick={reloadMap}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700"
          >
            Reload Map
          </button>
          {trackingError ? <span className="rounded-md bg-red-50 px-2 py-1 text-xs font-medium text-red-700">{trackingError}</span> : null}
          {platformHint ? <span className="rounded-md bg-amber-50 px-2 py-1 text-xs font-medium text-amber-700">{platformHint}</span> : null}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[2fr,1fr]">
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="relative">
            {!mapReady ? (
              <div className="absolute inset-0 z-20 flex items-center justify-center bg-slate-50/80 text-sm font-medium text-slate-600">
                Loading map...
              </div>
            ) : null}
            <MapContainer
              key={mapKey}
              center={position}
              zoom={17}
              whenReady={() => setMapReady(true)}
              className="h-[70vh] min-h-[420px] w-full"
            >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
              eventHandlers={{
                load: () => setMapReady(true),
                tileerror: () => {
                  setMapReady(true);
                  setTrackingError((prev) => prev || "Unable to load map tiles. Check connection and reload map.");
                },
              }}
            />
            <Marker position={position} icon={headingIcon(direction)}>
              <Popup>
                Latitude: {position[0].toFixed(6)}
                <br />Longitude: {position[1].toFixed(6)}
                <br />Accuracy: {accuracy != null ? `${Math.round(accuracy)} m` : "--"}
              </Popup>
            </Marker>
            {accuracy != null ? (
              <Circle
                center={position}
                radius={Math.max(Number(accuracy) || 0, 2)}
                pathOptions={{ color: "#2563eb", fillColor: "#60a5fa", fillOpacity: 0.15 }}
              />
            ) : null}
            <UpdateMap position={position} />
            </MapContainer>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-800">Live Sensor Data</h3>
          <div className="mt-3 space-y-2 text-sm text-slate-700">
            <p>Latitude: <span className="font-semibold">{position[0].toFixed(6)}</span></p>
            <p>Longitude: <span className="font-semibold">{position[1].toFixed(6)}</span></p>
            <p>Accuracy: <span className="font-semibold">{accuracy != null ? `${Math.round(accuracy)} m` : "--"}</span></p>
            <p>Speed: <span className="font-semibold">{Number.isFinite(speed) ? speed.toFixed(2) : "0.00"} m/s</span></p>
            <p>Direction: <span className="font-semibold">{Math.round(direction)} deg ({headingLabel(direction)})</span></p>
            <p>Accel X: <span className="font-semibold">{accelData.x.toFixed(3)}</span></p>
            <p>Accel Y: <span className="font-semibold">{accelData.y.toFixed(3)}</span></p>
            <p>Accel Z: <span className="font-semibold">{accelData.z.toFixed(3)}</span></p>
            <p>Magnitude: <span className="font-semibold">{accelData.magnitude.toFixed(3)}</span></p>
            <p>Movement: <span className={`font-semibold ${moving ? "text-emerald-700" : "text-amber-700"}`}>{moving ? "Moving" : "No significant movement"}</span></p>
          </div>
        </div>
      </div>
    </div>
  );
}
