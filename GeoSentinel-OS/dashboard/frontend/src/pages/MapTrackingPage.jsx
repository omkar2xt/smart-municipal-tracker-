import React from "react";
import L from "leaflet";
import { MapContainer, Marker, Popup, TileLayer, useMap, useMapEvents } from "react-leaflet";

import StatusBadge from "../components/ui/StatusBadge";

const statePoints = [
  { id: 1, label: "Pune District", lat: 18.52, lng: 73.85, status: "active" },
  { id: 2, label: "Nashik District", lat: 20.0, lng: 73.78, status: "pending" },
  { id: 3, label: "Nagpur District", lat: 21.15, lng: 79.08, status: "active" },
];

const districtPoints = [
  { id: 11, label: "Hadapsar Taluka", lat: 18.50, lng: 73.93, status: "active" },
  { id: 12, label: "Shirur Taluka", lat: 18.82, lng: 74.38, status: "inactive" },
  { id: 13, label: "Baramati Taluka", lat: 18.15, lng: 74.58, status: "active" },
];

const talukaPoints = [
  { id: 21, label: "Worker Asha", lat: 18.505, lng: 73.905, status: "active" },
  { id: 22, label: "Worker Ravi", lat: 18.518, lng: 73.895, status: "inactive" },
  { id: 23, label: "Worker Meera", lat: 18.495, lng: 73.915, status: "active" },
];

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

function zoomForLevel(level) {
  if (level === "state") return 7;
  if (level === "district") return 9;
  return 12;
}

function levelForZoom(zoom) {
  if (zoom < 8) return "state";
  if (zoom < 11) return "district";
  return "taluka";
}

function MapHandle({ mapRef }) {
  const map = useMap();
  React.useEffect(() => {
    mapRef.current = map;
  }, [map, mapRef]);
  return null;
}

function ZoomWatcher({ setLevel, programmaticZoomRef }) {
  useMapEvents({
    zoomend(e) {
      if (programmaticZoomRef.current) {
        programmaticZoomRef.current = false;
        return;
      }
      const zoom = e.target.getZoom();
      setLevel(levelForZoom(zoom));
    },
  });
  return null;
}

export default function MapTrackingPage() {
  const [level, setLevel] = React.useState("state");
  const [selected, setSelected] = React.useState(null);
  const mapRef = React.useRef(null);
  const programmaticZoomRef = React.useRef(false);

  React.useEffect(() => {
    setSelected(null);
  }, [level]);

  function setLevelAndZoom(nextLevel) {
    setLevel(nextLevel);
    setSelected(null);
    if (mapRef.current) {
      programmaticZoomRef.current = true;
      mapRef.current.setZoom(zoomForLevel(nextLevel));
    }
  }

  const points = level === "state" ? statePoints : level === "district" ? districtPoints : talukaPoints;

  return (
    <div>
      <div className="mb-5">
        <p className="text-sm text-slate-500">GeoSentinel OS / Tracking</p>
        <h1 className="text-3xl font-extrabold text-civic-900">Map & Tracking System</h1>
        <p className="mt-2 text-slate-600">Zoom controls auto-switch between state, district, and taluka visibility.</p>
      </div>

      <div className="mb-4 grid gap-3 md:grid-cols-3">
        <button
          type="button"
          onClick={() => setLevelAndZoom("state")}
          className={`rounded-xl px-4 py-2 text-sm font-semibold ${level === "state" ? "bg-civic-600 text-white" : "bg-white text-slate-600"}`}
        >
          State Level
        </button>
        <button
          type="button"
          onClick={() => setLevelAndZoom("district")}
          className={`rounded-xl px-4 py-2 text-sm font-semibold ${level === "district" ? "bg-civic-600 text-white" : "bg-white text-slate-600"}`}
        >
          District Level
        </button>
        <button
          type="button"
          onClick={() => setLevelAndZoom("taluka")}
          className={`rounded-xl px-4 py-2 text-sm font-semibold ${level === "taluka" ? "bg-civic-600 text-white" : "bg-white text-slate-600"}`}
        >
          Taluka Level
        </button>
      </div>

      <div className="grid gap-4 lg:grid-cols-[2fr,1fr]">
        <div className="glass-card overflow-hidden">
          <MapContainer center={[19.4, 75.3]} zoom={7} style={{ height: 520, width: "100%" }}>
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <MapHandle mapRef={mapRef} />
            <ZoomWatcher setLevel={setLevel} programmaticZoomRef={programmaticZoomRef} />
            {points.map((point) => (
              <Marker
                key={point.id}
                position={[point.lat, point.lng]}
                eventHandlers={{
                  click: () => {
                    setSelected(point);
                  },
                }}
              >
                <Popup>
                  <div>
                    <p className="font-semibold">{point.label}</p>
                    <p className="text-xs">{point.lat.toFixed(4)}, {point.lng.toFixed(4)}</p>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>

        <div className="glass-card p-4">
          <h3 className="text-lg font-bold text-civic-900">Level Summary</h3>
          <p className="mt-2 text-sm text-slate-600">Current view: <span className="font-semibold capitalize">{level}</span></p>

          <div className="mt-4 space-y-3">
            {points.map((point) => (
              <button
                key={point.id}
                onClick={() => setSelected(point)}
                type="button"
                className="w-full rounded-xl border border-slate-100 p-3 text-left hover:border-civic-200"
              >
                <p className="text-sm font-semibold text-slate-700">{point.label}</p>
                <div className="mt-2 flex items-center justify-between">
                  <p className="text-xs text-slate-500">{point.lat.toFixed(3)}, {point.lng.toFixed(3)}</p>
                  <StatusBadge status={point.status} />
                </div>
              </button>
            ))}
          </div>

          {selected ? (
            <div className="mt-4 rounded-xl bg-civic-50 p-3 text-sm text-civic-800">
              Selected: <span className="font-semibold">{selected.label}</span>
            </div>
          ) : null}
        </div>
      </div>

      <div className="h-20 lg:hidden" />
    </div>
  );
}
