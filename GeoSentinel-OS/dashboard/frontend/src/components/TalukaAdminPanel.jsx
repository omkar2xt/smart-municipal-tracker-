import React from "react";
import { Download, ShieldAlert, Trophy } from "lucide-react";
import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";
import L from "leaflet";

import {
  downloadReport,
  fetchTalukaSpoofCases,
  fetchTalukaStats,
  fetchTalukaTasks,
  fetchTalukaWorkers,
} from "../services/api";

const activeIcon = L.divIcon({
  className: "",
  html: '<div style="width:14px;height:14px;border-radius:999px;background:#16a34a;border:2px solid #ffffff;box-shadow:0 0 0 2px rgba(22,163,74,0.3);"></div>',
  iconSize: [14, 14],
  iconAnchor: [7, 7],
});

const suspiciousIcon = L.divIcon({
  className: "",
  html: '<div style="width:14px;height:14px;border-radius:999px;background:#dc2626;border:2px solid #ffffff;box-shadow:0 0 0 2px rgba(220,38,38,0.3);"></div>',
  iconSize: [14, 14],
  iconAnchor: [7, 7],
});

function SparkBars({ values = [], color = "#0f766e" }) {
  const max = Math.max(...values, 1);
  return (
    <div className="mt-2 flex h-28 items-end gap-2">
      {values.map((value, index) => (
        <div key={`${index}-${value}`} className="flex flex-1 flex-col items-center">
          <div
            className="w-full rounded-t-md"
            style={{
              height: `${Math.max((value / max) * 100, 6)}%`,
              backgroundColor: color,
            }}
          />
          <span className="mt-1 text-[10px] text-slate-500">D{index + 1}</span>
        </div>
      ))}
    </div>
  );
}

function MiniLine({ points = [] }) {
  if (!points.length) {
    return <div className="mt-2 text-xs text-slate-500">No trend data</div>;
  }
  const max = Math.max(...points, 1);
  const width = 280;
  const height = 90;
  const step = points.length > 1 ? width / (points.length - 1) : width;

  const coordinates = points
    .map((point, index) => {
      const x = index * step;
      const y = height - (point / max) * (height - 8) - 4;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="mt-2 h-24 w-full">
      <polyline points={coordinates} fill="none" stroke="#2563eb" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function Card({ title, value, subtitle }) {
  return (
    <div className="glass-card p-4">
      <p className="text-xs uppercase tracking-wide text-slate-500">{title}</p>
      <p className="mt-2 text-2xl font-extrabold text-civic-900">{value}</p>
      <p className="mt-1 text-xs text-slate-600">{subtitle}</p>
    </div>
  );
}

export default function TalukaAdminPanel() {
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");
  const [stats, setStats] = React.useState({});
  const [workers, setWorkers] = React.useState([]);
  const [tasks, setTasks] = React.useState([]);
  const [spoofCases, setSpoofCases] = React.useState([]);

  React.useEffect(() => {
    let mounted = true;

    async function load() {
      setLoading(true);
      setError("");
      try {
        const [statsData, workersData, tasksData, spoofData] = await Promise.all([
          fetchTalukaStats(),
          fetchTalukaWorkers(),
          fetchTalukaTasks(),
          fetchTalukaSpoofCases(),
        ]);

        if (!mounted) return;
        setStats(statsData || {});
        setWorkers(Array.isArray(workersData) ? workersData : []);
        setTasks(Array.isArray(tasksData) ? tasksData : []);
        setSpoofCases(Array.isArray(spoofData) ? spoofData : []);
      } catch (err) {
        if (!mounted) return;
        setError(err?.response?.data?.detail || err?.message || "Failed to load taluka analytics.");
      } finally {
        if (mounted) setLoading(false);
      }
    }

    load();
    return () => {
      mounted = false;
    };
  }, []);

  const attendanceTrend = Array.isArray(stats?.attendance_trend) ? stats.attendance_trend.map((item) => Number(item.count || 0)) : [];
  const completionTrend = Array.isArray(stats?.task_completion_trend) ? stats.task_completion_trend.map((item) => Number(item.count || 0)) : [];
  const ranking = Array.isArray(stats?.performance_ranking) ? stats.performance_ranking : [];

  const workerMarkers = workers.filter((row) => Number.isFinite(row.latest_latitude) && Number.isFinite(row.latest_longitude));
  const mapCenter = workerMarkers.length
    ? [workerMarkers[0].latest_latitude, workerMarkers[0].latest_longitude]
    : [19.076, 72.8777];

  return (
    <div className="space-y-4">
      {loading ? <div className="rounded-xl bg-civic-50 px-4 py-3 text-sm text-civic-700">Loading taluka analytics...</div> : null}
      {error ? <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div> : null}

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
        <Card title="Total Workers" value={stats?.total_workers ?? 0} subtitle="Taluka workforce" />
        <Card title="Tasks Completed" value={stats?.tasks_completed ?? 0} subtitle="Completed field tasks" />
        <Card title="Tasks Pending" value={stats?.tasks_pending ?? 0} subtitle="Action backlog" />
        <Card title="Attendance Rate" value={`${stats?.attendance_rate ?? 0}%`} subtitle="Present days / total days" />
        <Card title="Spoof Detections" value={stats?.spoof_detection_count ?? 0} subtitle="Suspicious location events" />
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <div className="glass-card p-4">
          <p className="text-sm font-semibold text-civic-900">Daily Attendance Trend</p>
          <MiniLine points={attendanceTrend} />
        </div>
        <div className="glass-card p-4">
          <p className="text-sm font-semibold text-civic-900">Task Completion Graph</p>
          <SparkBars values={completionTrend} color="#0f766e" />
        </div>
        <div className="glass-card p-4">
          <p className="text-sm font-semibold text-civic-900">Top Performer</p>
          {stats?.top_performer ? (
            <div className="mt-3 rounded-xl bg-amber-50 p-3 text-sm text-amber-800">
              <div className="flex items-center gap-2 font-semibold">
                <Trophy size={16} />
                {stats.top_performer.name}
              </div>
              <p className="mt-2">Efficiency: {(Number(stats.top_performer.efficiency || 0) * 100).toFixed(0)}%</p>
              <p>Attendance: {stats.top_performer.attendance_rate}%</p>
            </div>
          ) : (
            <p className="mt-3 text-sm text-slate-500">No ranking data available.</p>
          )}

          {(stats?.low_performers || []).length > 0 ? (
            <div className="mt-3 rounded-xl bg-red-50 p-3 text-sm text-red-700">
              <div className="flex items-center gap-2 font-semibold">
                <ShieldAlert size={16} />
                Low attendance alerts
              </div>
              <p className="mt-1">{stats.low_performers.length} worker(s) below 50% attendance.</p>
            </div>
          ) : null}
        </div>
      </div>

      <div className="glass-card overflow-hidden p-4">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <p className="text-lg font-bold text-civic-900">Taluka Worker Map</p>
          <div className="flex gap-2">
            <button type="button" onClick={() => downloadReport("/taluka/report/attendance.csv", "taluka_attendance_report.csv")} className="inline-flex items-center gap-1 rounded-lg border border-civic-300 px-3 py-2 text-xs font-semibold text-civic-700">
              <Download size={14} />
              Attendance CSV
            </button>
            <button type="button" onClick={() => downloadReport("/taluka/report/tasks.csv", "taluka_tasks_report.csv")} className="inline-flex items-center gap-1 rounded-lg border border-civic-300 px-3 py-2 text-xs font-semibold text-civic-700">
              <Download size={14} />
              Tasks CSV
            </button>
            <button type="button" onClick={() => downloadReport("/taluka/report/performance.pdf", "taluka_performance_report.pdf")} className="inline-flex items-center gap-1 rounded-lg bg-civic-600 px-3 py-2 text-xs font-semibold text-white">
              <Download size={14} />
              Performance PDF
            </button>
          </div>
        </div>

        <MapContainer center={mapCenter} zoom={13} className="h-72 w-full rounded-xl">
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {workerMarkers.map((worker) => (
            <Marker
              key={worker.id}
              position={[worker.latest_latitude, worker.latest_longitude]}
              icon={worker.suspicious ? suspiciousIcon : activeIcon}
            >
              <Popup>
                <strong>{worker.name}</strong>
                <br />
                Status: {worker.status}
                <br />
                Suspicious: {worker.suspicious ? "Yes" : "No"}
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <div className="glass-card overflow-hidden p-4">
          <h3 className="mb-3 text-lg font-bold text-civic-900">Worker Performance Table</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-slate-500">
                  <th className="pb-2">Name</th>
                  <th className="pb-2">Status</th>
                  <th className="pb-2">Attendance %</th>
                  <th className="pb-2">Tasks Completed</th>
                </tr>
              </thead>
              <tbody>
                {workers.map((worker) => (
                  <tr key={worker.id} className="border-t border-slate-100">
                    <td className="py-2 pr-3">{worker.name}</td>
                    <td className="py-2 pr-3">{worker.status}</td>
                    <td className="py-2 pr-3">{worker.attendance_rate}</td>
                    <td className="py-2">{worker.tasks_completed}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="glass-card overflow-hidden p-4">
          <h3 className="mb-3 text-lg font-bold text-civic-900">Task Tracking Table</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-slate-500">
                  <th className="pb-2">Task Name</th>
                  <th className="pb-2">Worker</th>
                  <th className="pb-2">Status</th>
                  <th className="pb-2">Completion</th>
                  <th className="pb-2">Fund</th>
                </tr>
              </thead>
              <tbody>
                {tasks.map((task) => (
                  <tr key={task.id} className="border-t border-slate-100">
                    <td className="py-2 pr-3">{task.task_name}</td>
                    <td className="py-2 pr-3">{task.assigned_worker}</td>
                    <td className="py-2 pr-3">{task.status}</td>
                    <td className="py-2 pr-3">{task.completion_time ? new Date(task.completion_time).toLocaleString() : "-"}</td>
                    <td className="py-2">INR {Number(task.fund_allocated || 0).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {spoofCases.length > 0 ? (
        <div className="glass-card p-4">
          <h3 className="text-lg font-bold text-civic-900">Recent Spoof Alerts</h3>
          <div className="mt-2 space-y-1 text-sm text-slate-700">
            {spoofCases.slice(0, 5).map((item) => (
              <p key={item.id}>Worker #{item.user_id}: {item.spoof_reason || "Suspicious movement"}</p>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
