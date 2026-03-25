import React from "react";
import { AlertTriangle, CheckCircle2, Download, TrendingDown, Trophy } from "lucide-react";
import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";
import L from "leaflet";

import {
  adjustTaskBudget,
  decideTaskPlan,
  downloadReport,
  fetchSubAdminSpoofCases,
  fetchSubAdminStats,
  fetchSubAdminTalukas,
  fetchSubAdminTasks,
  fetchSubAdminWorkers,
  flagTaluka,
  reassignTask,
} from "../services/api";

const goodIcon = L.divIcon({
  className: "",
  html: '<div style="width:14px;height:14px;border-radius:999px;background:#16a34a;border:2px solid #fff;box-shadow:0 0 0 2px rgba(22,163,74,.35);"></div>',
  iconSize: [14, 14],
  iconAnchor: [7, 7],
});

const warningIcon = L.divIcon({
  className: "",
  html: '<div style="width:14px;height:14px;border-radius:999px;background:#dc2626;border:2px solid #fff;box-shadow:0 0 0 2px rgba(220,38,38,.35);"></div>',
  iconSize: [14, 14],
  iconAnchor: [7, 7],
});

function Card({ title, value, subtitle }) {
  return (
    <div className="glass-card p-4">
      <p className="text-xs uppercase tracking-wide text-slate-500">{title}</p>
      <p className="mt-2 text-2xl font-extrabold text-civic-900">{value}</p>
      <p className="mt-1 text-xs text-slate-600">{subtitle}</p>
    </div>
  );
}

function Bars({ labels = [], values = [] }) {
  const max = Math.max(...values, 1);
  return (
    <div className="mt-3 space-y-2">
      {labels.map((label, index) => {
        const value = Number(values[index] || 0);
        const width = Math.max((value / max) * 100, 4);
        return (
          <div key={`${label}-${index}`}>
            <div className="mb-1 flex justify-between text-xs text-slate-600">
              <span>{label}</span>
              <span>{value}</span>
            </div>
            <div className="h-2 rounded-full bg-slate-100">
              <div className="h-2 rounded-full bg-civic-600" style={{ width: `${width}%` }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function Line({ points = [] }) {
  if (!points.length) return <p className="mt-3 text-xs text-slate-500">No trend data</p>;

  const width = 300;
  const height = 100;
  const max = Math.max(...points, 1);
  const step = points.length > 1 ? width / (points.length - 1) : width;

  const polyline = points
    .map((point, index) => {
      const x = index * step;
      const y = height - (Number(point) / max) * (height - 8) - 4;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="mt-2 h-24 w-full">
      <polyline points={polyline} fill="none" stroke="#0f766e" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

function Pie({ completed = 0, pending = 0 }) {
  const total = Math.max(completed + pending, 1);
  const completedPct = (completed / total) * 100;
  return (
    <div className="mt-2 flex items-center gap-4">
      <div
        className="h-24 w-24 rounded-full"
        style={{ background: `conic-gradient(#16a34a ${completedPct}%, #f59e0b 0)` }}
      />
      <div className="text-sm text-slate-700">
        <p>Completed: {completed}</p>
        <p>Pending: {pending}</p>
      </div>
    </div>
  );
}

export default function SubAdminPanel() {
  const [loading, setLoading] = React.useState(true);
  const [actionLoading, setActionLoading] = React.useState(false);
  const [error, setError] = React.useState("");
  const [message, setMessage] = React.useState("");

  const [stats, setStats] = React.useState({});
  const [talukas, setTalukas] = React.useState([]);
  const [workers, setWorkers] = React.useState([]);
  const [tasks, setTasks] = React.useState([]);
  const [spoofCases, setSpoofCases] = React.useState([]);

  const loadDashboard = React.useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const [statsData, talukasData, workersData, tasksData, spoofData] = await Promise.all([
        fetchSubAdminStats(),
        fetchSubAdminTalukas(),
        fetchSubAdminWorkers(),
        fetchSubAdminTasks(),
        fetchSubAdminSpoofCases(),
      ]);

      setStats(statsData || {});
      setTalukas(Array.isArray(talukasData) ? talukasData : []);
      setWorkers(Array.isArray(workersData) ? workersData : []);
      setTasks(Array.isArray(tasksData) ? tasksData : []);
      setSpoofCases(Array.isArray(spoofData) ? spoofData : []);
    } catch (err) {
      setError(err?.response?.data?.detail || err?.message || "Failed to load district analytics");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    let mounted = true;

    async function load() {
      if (!mounted) return;
      await loadDashboard();
    }

    load();
    return () => {
      mounted = false;
    };
  }, [loadDashboard]);

  async function onPlanDecision(taskId, decision) {
    try {
      setActionLoading(true);
      setError("");
      setMessage("");
      const result = await decideTaskPlan(taskId, {
        decision,
        reason: `Action taken from district dashboard: ${decision}`,
      });
      setMessage(result?.message || "Plan decision updated");
      await loadDashboard();
    } catch (err) {
      setError(err?.response?.data?.detail || err?.message || "Failed to update plan decision");
    } finally {
      setActionLoading(false);
    }
  }

  async function onAdjustBudget(task) {
    try {
      setActionLoading(true);
      setError("");
      setMessage("");
      const currentFund = Number(task.fund_allocated || 0);
      const newFund = Math.max(currentFund + 1000, 0);
      const result = await adjustTaskBudget(task.id, {
        new_fund_allocated: newFund,
        adjustment_amount: 1000,
        reason: "District-level incremental budget adjustment",
      });
      setMessage(result?.message || "Budget adjusted");
      await loadDashboard();
    } catch (err) {
      setError(err?.response?.data?.detail || err?.message || "Failed to adjust budget");
    } finally {
      setActionLoading(false);
    }
  }

  async function onReassign(task) {
    const normalizeTaluka = (value) => String(value || "").trim().toLowerCase();
    const currentAssigneeId = Number(task.assigned_to);
    const workerPool = workers.filter((worker) => Number(worker.id) !== currentAssigneeId);
    const activeWorkerPool = workerPool.filter((worker) => String(worker.status || "").toLowerCase() === "active");
    const sortByAssignedTasks = (a, b) => Number(a.assigned_tasks || 0) - Number(b.assigned_tasks || 0);

    const sameTalukaActive = activeWorkerPool
      .filter((worker) => normalizeTaluka(worker.taluka) === normalizeTaluka(task.taluka))
      .sort(sortByAssignedTasks);
    const sameTalukaAny = workerPool
      .filter((worker) => normalizeTaluka(worker.taluka) === normalizeTaluka(task.taluka))
      .sort(sortByAssignedTasks);
    const anyActive = [...activeWorkerPool].sort(sortByAssignedTasks);
    const anyWorker = [...workerPool].sort(sortByAssignedTasks);

    const target = sameTalukaActive[0] || sameTalukaAny[0] || anyActive[0] || anyWorker[0];
    if (!target) {
      setError("No alternate worker available for reassignment");
      return;
    }

    try {
      setActionLoading(true);
      setError("");
      setMessage("");
      const result = await reassignTask(task.id, {
        new_worker_id: target.id,
        reason: "District balancing reassignment",
      });
      setMessage(result?.message || "Task reassigned");
      await loadDashboard();
    } catch (err) {
      setError(err?.response?.data?.detail || err?.message || "Failed to reassign task");
    } finally {
      setActionLoading(false);
    }
  }

  async function onFlagTaluka(talukaName) {
    try {
      setActionLoading(true);
      setError("");
      setMessage("");
      const result = await flagTaluka(talukaName, {
        reason: "Performance/attendance anomaly observed",
        severity: "high",
      });
      setMessage(result?.message || "Taluka flagged");
      await loadDashboard();
    } catch (err) {
      setError(err?.response?.data?.detail || err?.message || "Failed to flag taluka");
    } finally {
      setActionLoading(false);
    }
  }

  const completionValues = talukas.map((row) => Number(row.task_completion_rate || 0));
  const attendancePoints = (stats.attendance_trend || []).map((row) => Number(row.count || 0));
  const mapMarkers = talukas
    .map((row) => {
      const latitude = Number(row.latest_latitude);
      const longitude = Number(row.latest_longitude);

      if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
        return null;
      }

      if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
        return null;
      }

      return {
        ...row,
        latitude,
        longitude,
      };
    })
    .filter(Boolean);
  const mapCenter = mapMarkers.length ? [mapMarkers[0].latitude, mapMarkers[0].longitude] : [19.1, 73.8];

  return (
    <div className="space-y-4">
      {loading ? <div className="rounded-xl bg-civic-50 px-4 py-3 text-sm text-civic-700">Loading district analytics...</div> : null}
      {actionLoading ? <div className="rounded-xl bg-civic-50 px-4 py-3 text-sm text-civic-700">Applying action...</div> : null}
      {error ? <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div> : null}
      {message ? <div className="rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{message}</div> : null}

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-6">
        <Card title="Total Talukas" value={stats.total_talukas ?? 0} subtitle="Under district supervision" />
        <Card title="Total Workers" value={stats.total_workers ?? 0} subtitle="District workforce" />
        <Card title="Total Tasks" value={stats.total_tasks ?? 0} subtitle="Assigned district tasks" />
        <Card title="Completed/Pending" value={`${stats.completed_tasks ?? 0}/${stats.pending_tasks ?? 0}`} subtitle="Task balance" />
        <Card title="Attendance Rate" value={`${stats.district_attendance_rate ?? 0}%`} subtitle="District attendance" />
        <Card title="Spoof Detections" value={stats.spoof_detection_count ?? 0} subtitle="Risk incidents" />
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <div className="glass-card p-4">
          <p className="text-sm font-semibold text-civic-900">Task Completion per Taluka</p>
          <Bars labels={talukas.map((row) => row.taluka)} values={completionValues} />
        </div>
        <div className="glass-card p-4">
          <p className="text-sm font-semibold text-civic-900">Attendance Trend (District)</p>
          <Line points={attendancePoints} />
        </div>
        <div className="glass-card p-4">
          <p className="text-sm font-semibold text-civic-900">Task Status Distribution</p>
          <Pie completed={stats.completed_tasks || 0} pending={stats.pending_tasks || 0} />
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <div className="glass-card p-4">
          <div className="flex items-center justify-between">
            <p className="text-lg font-bold text-civic-900">District Insights</p>
            <div className="flex gap-2">
              <button type="button" onClick={() => downloadReport("/subadmin/report/district-summary.csv", "district_summary.csv")} className="rounded-lg border border-civic-300 px-3 py-1.5 text-xs font-semibold text-civic-700">
                <Download size={14} className="inline mr-1" />Summary CSV
              </button>
              <button type="button" onClick={() => downloadReport("/subadmin/report/taluka-performance.csv", "taluka_performance.csv")} className="rounded-lg border border-civic-300 px-3 py-1.5 text-xs font-semibold text-civic-700">
                <Download size={14} className="inline mr-1" />Taluka CSV
              </button>
              <button type="button" onClick={() => downloadReport("/subadmin/report/efficiency.pdf", "district_efficiency_report.pdf")} className="rounded-lg bg-civic-600 px-3 py-1.5 text-xs font-semibold text-white">
                <Download size={14} className="inline mr-1" />Efficiency PDF
              </button>
            </div>
          </div>

          <div className="mt-3 grid gap-3 md:grid-cols-2">
            <div className="rounded-xl bg-amber-50 p-3 text-sm text-amber-800">
              <div className="flex items-center gap-2 font-semibold"><Trophy size={16} />Top Taluka</div>
              <p className="mt-2">{stats?.top_taluka?.taluka || "-"}</p>
              <p>Completion: {stats?.top_taluka?.task_completion_rate ?? 0}%</p>
            </div>
            <div className="rounded-xl bg-red-50 p-3 text-sm text-red-700">
              <div className="flex items-center gap-2 font-semibold"><TrendingDown size={16} />Worst Taluka</div>
              <p className="mt-2">{stats?.worst_taluka?.taluka || "-"}</p>
              <p>Completion: {stats?.worst_taluka?.task_completion_rate ?? 0}%</p>
            </div>
          </div>

          {(stats.alerts || []).length ? (
            <div className="mt-3 rounded-xl bg-yellow-50 p-3 text-sm text-yellow-800">
              <div className="font-semibold">District Alerts</div>
              {(stats.alerts || []).map((alert) => (
                <p key={alert.type} className="mt-1">{alert.message}</p>
              ))}
            </div>
          ) : null}
        </div>

        <div className="glass-card p-4">
          <p className="text-lg font-bold text-civic-900">District Taluka Map</p>
          {mapMarkers.length ? (
            <MapContainer center={mapCenter} zoom={10} className="mt-3 h-64 w-full rounded-xl">
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              {mapMarkers.map((row) => (
                <Marker
                  key={row.taluka}
                  position={[row.latitude, row.longitude]}
                  icon={row.status === "Needs Attention" ? warningIcon : goodIcon}
                >
                  <Popup>
                    <strong>{row.taluka}</strong>
                    <br />Workers: {row.workers_count}
                    <br />Completion: {row.task_completion_rate}%
                    <br />Attendance: {row.attendance_rate}%
                    <br />Lat/Lng: {row.latitude.toFixed(5)}, {row.longitude.toFixed(5)}
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          ) : (
            <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
              Taluka map is unavailable because recent worker coordinates are missing.
            </div>
          )}
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <div className="glass-card overflow-hidden p-4">
          <h3 className="mb-3 text-lg font-bold text-civic-900">Taluka Performance Table</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-slate-500">
                  <th className="pb-2">Taluka</th>
                  <th className="pb-2">Workers</th>
                  <th className="pb-2">Completion %</th>
                  <th className="pb-2">Attendance %</th>
                  <th className="pb-2">Status</th>
                  <th className="pb-2">Action</th>
                </tr>
              </thead>
              <tbody>
                {talukas.map((row) => (
                  <tr key={row.taluka} className="border-t border-slate-100">
                    <td className="py-2 pr-3">{row.taluka}</td>
                    <td className="py-2 pr-3">{row.workers_count}</td>
                    <td className="py-2 pr-3">{row.task_completion_rate}</td>
                    <td className="py-2 pr-3">{row.attendance_rate}</td>
                    <td className="py-2 pr-3">{row.status}</td>
                    <td className="py-2">
                      {row.status === "Needs Attention" ? (
                        <button type="button" disabled={actionLoading} onClick={() => onFlagTaluka(row.taluka)} className="rounded-lg bg-red-600 px-2 py-1 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60">Flag</button>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-emerald-700"><CheckCircle2 size={14} />OK</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="glass-card overflow-hidden p-4">
          <h3 className="mb-3 text-lg font-bold text-civic-900">Worker Summary</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-slate-500">
                  <th className="pb-2">Taluka</th>
                  <th className="pb-2">Total Workers</th>
                  <th className="pb-2">Active</th>
                  <th className="pb-2">Inactive</th>
                </tr>
              </thead>
              <tbody>
                {talukas.map((row) => (
                  <tr key={`summary-${row.taluka}`} className="border-t border-slate-100">
                    <td className="py-2 pr-3">{row.taluka}</td>
                    <td className="py-2 pr-3">{row.workers_count}</td>
                    <td className="py-2 pr-3">{row.active_workers}</td>
                    <td className="py-2">{row.inactive_workers}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="glass-card overflow-hidden p-4">
        <h3 className="mb-3 text-lg font-bold text-civic-900">Decision Console</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-slate-500">
                <th className="pb-2">Task</th>
                <th className="pb-2">Taluka</th>
                <th className="pb-2">Status</th>
                <th className="pb-2">Fund</th>
                <th className="pb-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {tasks.slice(0, 12).map((task) => (
                <tr key={task.id} className="border-t border-slate-100">
                  <td className="py-2 pr-3">{task.task_name}</td>
                  <td className="py-2 pr-3">{task.taluka || "-"}</td>
                  <td className="py-2 pr-3">{task.status}</td>
                  <td className="py-2 pr-3">INR {Number(task.fund_allocated || 0).toLocaleString()}</td>
                  <td className="py-2">
                    <div className="flex flex-wrap gap-1">
                      <button type="button" disabled={actionLoading} onClick={() => onPlanDecision(task.id, "approve")} className="rounded-lg border border-emerald-300 px-2 py-1 text-xs font-semibold text-emerald-700 disabled:cursor-not-allowed disabled:opacity-60">Approve</button>
                      <button type="button" disabled={actionLoading} onClick={() => onPlanDecision(task.id, "reject")} className="rounded-lg border border-red-300 px-2 py-1 text-xs font-semibold text-red-700 disabled:cursor-not-allowed disabled:opacity-60">Reject</button>
                      <button type="button" disabled={actionLoading} onClick={() => onAdjustBudget(task)} className="rounded-lg border border-amber-300 px-2 py-1 text-xs font-semibold text-amber-700 disabled:cursor-not-allowed disabled:opacity-60">Adjust Budget</button>
                      <button type="button" disabled={actionLoading} onClick={() => onReassign(task)} className="rounded-lg border border-civic-300 px-2 py-1 text-xs font-semibold text-civic-700 disabled:cursor-not-allowed disabled:opacity-60">Reassign</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {spoofCases.length > 0 ? (
        <div className="glass-card p-4">
          <div className="mb-2 flex items-center gap-2 text-red-700">
            <AlertTriangle size={16} />
            <h3 className="text-lg font-bold text-civic-900">High Spoof Detection Zones</h3>
          </div>
          <div className="space-y-1 text-sm text-slate-700">
            {spoofCases.slice(0, 5).map((item) => (
              <p key={item.id}>{item.taluka || "Unknown taluka"}: {item.worker_name} - {item.spoof_reason || "Suspicious pattern"}</p>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
