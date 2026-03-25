import { useEffect, useRef, useState } from "react";
import { MapContainer, TileLayer, Marker, useMap } from "react-leaflet";
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
  map.setView(position, 17);
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

export default function MapTrackingPage() {
  const [position, setPosition] = useState([19.0, 73.0]);
  const [accuracy, setAccuracy] = useState(null);
  const [direction, setDirection] = useState(0);
  const [moving, setMoving] = useState(false);
  const [accelData, setAccelData] = useState({ x: 0, y: 0, z: 0, magnitude: 0 });
  const [sensorEnabled, setSensorEnabled] = useState(false);
  const [sensorStatus, setSensorStatus] = useState("Sensors pending permission");
  const [trackingError, setTrackingError] = useState("");

  const lastPositionRef = useRef(null);
  const lastTimestampRef = useRef(Date.now());
  const firstGpsRef = useRef(true);
  const directionRef = useRef(0);
  const movingRef = useRef(false);
  const accelRef = useRef({ x: 0, y: 0, z: 0, magnitude: 0 });

  useEffect(() => {
    directionRef.current = direction;
  }, [direction]);

  useEffect(() => {
    movingRef.current = moving;
  }, [moving]);

  useEffect(() => {
    accelRef.current = accelData;
  }, [accelData]);

  useEffect(() => {
    if (!("geolocation" in navigator)) {
      setTrackingError("Geolocation is not supported on this device/browser.");
      return undefined;
    }

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude, longitude, speed } = pos.coords;
        const now = Date.now();
        const nextPosition = [latitude, longitude];

        if (firstGpsRef.current || !lastPositionRef.current) {
          firstGpsRef.current = false;
          lastPositionRef.current = nextPosition;
          lastTimestampRef.current = now;
          setPosition(nextPosition);
          setAccuracy(pos.coords.accuracy ?? null);
          setTrackingError("");
          return;
        }

        const prevPosition = lastPositionRef.current;
        const distance = distanceMeters(prevPosition, nextPosition);
        const elapsedSeconds = Math.max((now - lastTimestampRef.current) / 1000, 1);
        const computedSpeed = distance / elapsedSeconds;
        const effectiveSpeed = Number.isFinite(speed) && speed >= 0 ? speed : computedSpeed;

        const lowMotion = accelRef.current.magnitude < 0.12;
        const spoofByJump = distance > 15 && lowMotion;
        const spoofBySpeed = effectiveSpeed > 55;
        const spoofDetectionFlag = spoofByJump || spoofBySpeed;
        const spoofReason = spoofByJump
          ? "GPS changed without accelerometer movement"
          : (spoofBySpeed ? "Unrealistic speed detected" : "");

        setPosition(nextPosition);
        setAccuracy(pos.coords.accuracy ?? null);
        setTrackingError("");

        lastPositionRef.current = nextPosition;
        lastTimestampRef.current = now;

        API.post("/tracking/location", {
          latitude,
          longitude,
          accuracy: pos.coords.accuracy ?? null,
          accelerometer_x: accelRef.current.x,
          accelerometer_y: accelRef.current.y,
          accelerometer_z: accelRef.current.z,
          accelerometer_magnitude: accelRef.current.magnitude,
          direction: directionRef.current,
          spoof_detection_flag: spoofDetectionFlag,
          spoof_reason: spoofReason,
        }).catch((error) => {
          console.error("Tracking sync failed", error);
        });
      },
      (error) => {
        setTrackingError(error?.message || "Unable to access live location.");
      },
      {
        enableHighAccuracy: true,
        maximumAge: 0,
        timeout: 15000,
      }
    );

    return () => {
      navigator.geolocation.clearWatch(watchId);
    };
  }, []);

  useEffect(() => {
    if (!sensorEnabled) return undefined;

    const onMotion = (event) => {
      const acc = event.acceleration || event.accelerationIncludingGravity;
      const x = Number(acc?.x || 0);
      const y = Number(acc?.y || 0);
      const z = Number(acc?.z || 0);
      const magnitude = Math.sqrt(x * x + y * y + z * z);
      setAccelData({ x, y, z, magnitude });
      setMoving(magnitude >= 0.12);
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

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="text-xl font-bold text-slate-800">Real-Time Worker Tracking</h2>
        <p className="mt-1 text-sm text-slate-600">GPS, accelerometer, and orientation tracking with spoof checks.</p>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={requestSensorPermissions}
            className="rounded-lg bg-civic-600 px-4 py-2 text-sm font-semibold text-white"
          >
            Enable Motion + Orientation
          </button>
          <span className="rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700">{sensorStatus}</span>
          {trackingError ? <span className="rounded-md bg-red-50 px-2 py-1 text-xs font-medium text-red-700">{trackingError}</span> : null}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[2fr,1fr]">
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <MapContainer center={position} zoom={17} className="h-[65vh] w-full">
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <Marker position={position} icon={headingIcon(direction)} />
            <UpdateMap position={position} />
          </MapContainer>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-800">Live Sensor Data</h3>
          <div className="mt-3 space-y-2 text-sm text-slate-700">
            <p>Latitude: <span className="font-semibold">{position[0].toFixed(6)}</span></p>
            <p>Longitude: <span className="font-semibold">{position[1].toFixed(6)}</span></p>
            <p>Accuracy: <span className="font-semibold">{accuracy != null ? `${Math.round(accuracy)} m` : "--"}</span></p>
            <p>Direction: <span className="font-semibold">{Math.round(direction)} deg</span></p>
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
