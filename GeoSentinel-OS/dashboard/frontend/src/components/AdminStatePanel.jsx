import React from "react";
import { AlertTriangle, CheckCircle2, Download, Shield, Trophy } from "lucide-react";
import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";
import L from "leaflet";

import {
  allocateDistrictFunds,
  createAdminUser,
  deleteAdminUser,
  downloadReport,
  fetchAdminDistricts,
  fetchAdminSpoofCases,
  fetchAdminStats,
  fetchAdminTalukas,
  fetchAdminTasks,
  fetchAdminUsers,
  fetchAdminWorkers,
  fetchFundSummary,
  flagDistrict,
  transferWorker,
  updateAdminUser,
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

function BarChart({ rows = [] }) {
  const max = Math.max(...rows.map((row) => Number(row.task_completion_rate || 0)), 1);
  return (
    <div className="mt-2 space-y-2">
      {rows.map((row) => {
        const value = Number(row.task_completion_rate || 0);
        const width = Math.max((value / max) * 100, 5);
        return (
          <div key={row.district_name}>
            <div className="mb-1 flex justify-between text-xs text-slate-600">
              <span>{row.district_name}</span>
              <span>{value}%</span>
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

function LineChart({ points = [] }) {
  if (!points.length) return <p className="mt-2 text-xs text-slate-500">No trend data</p>;
  const max = Math.max(...points, 1);
  const width = 280;
  const height = 90;
  const step = points.length > 1 ? width / (points.length - 1) : width;

  const poly = points
    .map((point, index) => {
      const x = index * step;
      const y = height - (point / max) * (height - 8) - 4;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="mt-2 h-24 w-full">
      <polyline points={poly} fill="none" stroke="#0f766e" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

function Pie({ completed = 0, pending = 0 }) {
  const total = Math.max(completed + pending, 1);
  const completedPct = (completed / total) * 100;
  return (
    <div className="mt-2 flex items-center gap-4">
      <div className="h-24 w-24 rounded-full" style={{ background: `conic-gradient(#16a34a ${completedPct}%, #f59e0b 0)` }} />
      <div className="text-sm text-slate-700">
        <p>Completed: {completed}</p>
        <p>Pending: {pending}</p>
      </div>
    </div>
  );
}

export default function AdminStatePanel() {
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");
  const [message, setMessage] = React.useState("");

  const [stats, setStats] = React.useState({});
  const [districts, setDistricts] = React.useState([]);
  const [talukas, setTalukas] = React.useState([]);
  const [workers, setWorkers] = React.useState([]);
  const [tasks, setTasks] = React.useState([]);
  const [spoofCases, setSpoofCases] = React.useState([]);
  const [fundSummary, setFundSummary] = React.useState([]);
  const [users, setUsers] = React.useState([]);

  const [newUser, setNewUser] = React.useState({
    name: "",
    email: "",
    password: "",
    role: "worker",
    state: "Maharashtra",
    district: "",
    taluka: "",
  });

  React.useEffect(() => {
    let mounted = true;

    async function load() {
      setLoading(true);
      setError("");
      try {
        const [statsData, districtData, talukaData, workerData, taskData, spoofData, fundData, usersData] = await Promise.all([
          fetchAdminStats(),
          fetchAdminDistricts(),
          fetchAdminTalukas(),
          fetchAdminWorkers(),
          fetchAdminTasks(),
          fetchAdminSpoofCases(),
          fetchFundSummary(),
          fetchAdminUsers(),
        ]);

        if (!mounted) return;
        setStats(statsData || {});
        setDistricts(Array.isArray(districtData) ? districtData : []);
        setTalukas(Array.isArray(talukaData) ? talukaData : []);
        setWorkers(Array.isArray(workerData) ? workerData : []);
        setTasks(Array.isArray(taskData) ? taskData : []);
        setSpoofCases(Array.isArray(spoofData) ? spoofData : []);
        setFundSummary(Array.isArray(fundData) ? fundData : []);
        setUsers(Array.isArray(usersData) ? usersData : []);
      } catch (err) {
        if (!mounted) return;
        setError(err?.response?.data?.detail || err?.message || "Failed to load state analytics");
      } finally {
        if (mounted) setLoading(false);
      }
    }

    load();
    return () => {
      mounted = false;
    };
  }, []);

  async function onCreateUser(event) {
    event.preventDefault();
    try {
      await createAdminUser(newUser);
      setMessage("User created successfully");
    } catch (err) {
      setError(err?.response?.data?.detail || err?.message || "Failed to create user");
    }
  }

  async function onToggleUserStatus(user) {
    try {
      await updateAdminUser({ user_id: user.id, is_active: !(user.status === "active") });
      setMessage("User status updated");
    } catch (err) {
      setError(err?.response?.data?.detail || err?.message || "Failed to update user");
    }
  }

  async function onDeleteUser(userId) {
    try {
      await deleteAdminUser(userId);
      setMessage("User deleted");
    } catch (err) {
      setError(err?.response?.data?.detail || err?.message || "Failed to delete user");
    }
  }

  async function onAllocateFunds() {
    const district = districts[0]?.district_name;
    if (!district) {
      setError("No district available for fund allocation");
      return;
    }
    try {
      const result = await allocateDistrictFunds({ district, amount: 25000, reason: "State strategic allocation" });
      setMessage(result?.message || "Funds allocated");
    } catch (err) {
      setError(err?.response?.data?.detail || err?.message || "Failed to allocate funds");
    }
  }

  async function onTransferWorker() {
    const worker = workers[0];
    const district = districts[1]?.district_name || districts[0]?.district_name;
    const taluka = talukas.find((row) => row.district === district)?.taluka_name || null;
    if (!worker || !district) {
      setError("Not enough data to transfer worker");
      return;
    }

    try {
      const result = await transferWorker({
        worker_id: worker.id,
        new_district: district,
        new_taluka: taluka,
        reason: "State-level resource balancing",
      });
      setMessage(result?.message || "Worker transferred");
    } catch (err) {
      setError(err?.response?.data?.detail || err?.message || "Failed to transfer worker");
    }
  }

  async function onFlagDistrict(name) {
    try {
      const result = await flagDistrict({ district: name, severity: "high", reason: "Low performance and alerts" });
      setMessage(result?.message || "District flagged");
    } catch (err) {
      setError(err?.response?.data?.detail || err?.message || "Failed to flag district");
    }
  }

  const districtMarkers = districts.map((row, index) => ({
    ...row,
    latitude: 18.8 + index * 0.25,
    longitude: 73.5 + index * 0.25,
  }));

  const attendanceTrend = (stats.attendance_trend || []).map((item) => Number(item.count || 0));

  return (
    <div className="space-y-4">
      {loading ? <div className="rounded-xl bg-civic-50 px-4 py-3 text-sm text-civic-700">Loading state governance dashboard...</div> : null}
      {error ? <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div> : null}
      {message ? <div className="rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{message}</div> : null}

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-7">
        <Card title="Districts" value={stats.total_districts ?? 0} subtitle="State districts" />
        <Card title="Talukas" value={stats.total_talukas ?? 0} subtitle="State talukas" />
        <Card title="Workers" value={stats.total_workers ?? 0} subtitle="Field workforce" />
        <Card title="Tasks" value={stats.total_tasks ?? 0} subtitle="Total tasks" />
        <Card title="Completed %" value={`${stats.completed_tasks_percent ?? 0}%`} subtitle="Task completion" />
        <Card title="Attendance" value={`${stats.state_attendance_rate ?? 0}%`} subtitle="State attendance" />
        <Card title="Spoof Cases" value={stats.spoof_detection_count ?? 0} subtitle="Risk detections" />
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <div className="glass-card p-4">
          <p className="text-sm font-semibold text-civic-900">District Task Completion (Bar)</p>
          <BarChart rows={districts} />
        </div>
        <div className="glass-card p-4">
          <p className="text-sm font-semibold text-civic-900">State Attendance Trend (Line)</p>
          <LineChart points={attendanceTrend} />
        </div>
        <div className="glass-card p-4">
          <p className="text-sm font-semibold text-civic-900">Task Status (Pie)</p>
          <Pie completed={stats.task_status_pie?.completed || 0} pending={stats.task_status_pie?.pending || 0} />
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <div className="glass-card p-4">
          <div className="flex items-center justify-between">
            <p className="text-lg font-bold text-civic-900">State Map View</p>
            <div className="flex gap-2">
              <button type="button" onClick={() => downloadReport("/admin/report/state-summary.csv", "state_summary.csv")} className="rounded-lg border border-civic-300 px-3 py-1.5 text-xs font-semibold text-civic-700">
                <Download size={14} className="inline mr-1" />Summary CSV
              </button>
              <button type="button" onClick={() => downloadReport("/admin/report/district-performance.csv", "district_performance.csv")} className="rounded-lg border border-civic-300 px-3 py-1.5 text-xs font-semibold text-civic-700">
                <Download size={14} className="inline mr-1" />District CSV
              </button>
              <button type="button" onClick={() => downloadReport("/admin/report/efficiency.pdf", "state_efficiency_report.pdf")} className="rounded-lg bg-civic-600 px-3 py-1.5 text-xs font-semibold text-white">
                <Download size={14} className="inline mr-1" />Efficiency PDF
              </button>
            </div>
          </div>

          <MapContainer center={[19.0, 74.0]} zoom={7} className="mt-3 h-72 w-full rounded-xl">
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {districtMarkers.map((row) => (
              <Marker key={row.district_name} position={[row.latitude, row.longitude]} icon={row.status === "Needs Improvement" ? warningIcon : goodIcon}>
                <Popup>
                  <strong>{row.district_name}</strong>
                  <br />Workers: {row.workers_count}
                  <br />Completion: {row.task_completion_rate}%
                  <br />Attendance: {row.attendance_rate}%
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>

        <div className="glass-card p-4">
          <p className="text-lg font-bold text-civic-900">Governance Insights</p>
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            <div className="rounded-xl bg-amber-50 p-3 text-sm text-amber-800">
              <div className="flex items-center gap-2 font-semibold"><Trophy size={16} />Best District</div>
              <p className="mt-1">{stats.best_district?.district_name || "-"}</p>
            </div>
            <div className="rounded-xl bg-red-50 p-3 text-sm text-red-700">
              <div className="flex items-center gap-2 font-semibold"><AlertTriangle size={16} />Worst District</div>
              <p className="mt-1">{stats.worst_district?.district_name || "-"}</p>
            </div>
          </div>

          {(stats.alerts || []).length ? (
            <div className="mt-3 rounded-xl bg-yellow-50 p-3 text-sm text-yellow-800">
              <div className="font-semibold">State Alerts</div>
              {(stats.alerts || []).map((item) => (
                <p key={item.type} className="mt-1">{item.message}</p>
              ))}
            </div>
          ) : null}

          <div className="mt-3 flex flex-wrap gap-2">
            <button type="button" onClick={onAllocateFunds} className="rounded-lg border border-civic-300 px-3 py-2 text-xs font-semibold text-civic-700">Allocate Funds</button>
            <button type="button" onClick={onTransferWorker} className="rounded-lg border border-civic-300 px-3 py-2 text-xs font-semibold text-civic-700">Transfer Worker</button>
            {districts[0] ? (
              <button type="button" onClick={() => onFlagDistrict(districts[0].district_name)} className="rounded-lg border border-red-300 px-3 py-2 text-xs font-semibold text-red-700">Flag District</button>
            ) : null}
          </div>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <div className="glass-card overflow-hidden p-4">
          <h3 className="mb-3 text-lg font-bold text-civic-900">District Table</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-slate-500">
                  <th className="pb-2">District</th>
                  <th className="pb-2">Workers</th>
                  <th className="pb-2">Task Completion %</th>
                  <th className="pb-2">Attendance %</th>
                  <th className="pb-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {districts.map((row) => (
                  <tr key={row.district_name} className="border-t border-slate-100">
                    <td className="py-2 pr-3">{row.district_name}</td>
                    <td className="py-2 pr-3">{row.workers_count}</td>
                    <td className="py-2 pr-3">{row.task_completion_rate}</td>
                    <td className="py-2 pr-3">{row.attendance_rate}</td>
                    <td className="py-2">{row.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="glass-card overflow-hidden p-4">
          <h3 className="mb-3 text-lg font-bold text-civic-900">Taluka Summary Table</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-slate-500">
                  <th className="pb-2">Taluka</th>
                  <th className="pb-2">District</th>
                  <th className="pb-2">Completion %</th>
                  <th className="pb-2">Attendance %</th>
                </tr>
              </thead>
              <tbody>
                {talukas.map((row) => (
                  <tr key={`${row.taluka_name}-${row.district}`} className="border-t border-slate-100">
                    <td className="py-2 pr-3">{row.taluka_name}</td>
                    <td className="py-2 pr-3">{row.district}</td>
                    <td className="py-2 pr-3">{row.task_completion_rate}</td>
                    <td className="py-2">{row.attendance_rate}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <div className="glass-card p-4">
          <h3 className="text-lg font-bold text-civic-900">User Management</h3>
          <form onSubmit={onCreateUser} className="mt-3 grid gap-2 md:grid-cols-2">
            <input value={newUser.name} onChange={(e) => setNewUser((prev) => ({ ...prev, name: e.target.value }))} className="rounded-lg border border-slate-300 px-3 py-2 text-sm" placeholder="Name" required />
            <input value={newUser.email} onChange={(e) => setNewUser((prev) => ({ ...prev, email: e.target.value }))} className="rounded-lg border border-slate-300 px-3 py-2 text-sm" placeholder="Email" required />
            <input type="password" value={newUser.password} onChange={(e) => setNewUser((prev) => ({ ...prev, password: e.target.value }))} className="rounded-lg border border-slate-300 px-3 py-2 text-sm" placeholder="Password" required />
            <select value={newUser.role} onChange={(e) => setNewUser((prev) => ({ ...prev, role: e.target.value }))} className="rounded-lg border border-slate-300 px-3 py-2 text-sm">
              <option value="sub_admin">sub_admin</option>
              <option value="taluka_admin">taluka_admin</option>
              <option value="worker">worker</option>
            </select>
            <input value={newUser.district} onChange={(e) => setNewUser((prev) => ({ ...prev, district: e.target.value }))} className="rounded-lg border border-slate-300 px-3 py-2 text-sm" placeholder="District" />
            <input value={newUser.taluka} onChange={(e) => setNewUser((prev) => ({ ...prev, taluka: e.target.value }))} className="rounded-lg border border-slate-300 px-3 py-2 text-sm" placeholder="Taluka" />
            <button type="submit" className="rounded-lg bg-civic-600 px-3 py-2 text-sm font-semibold text-white">Create User</button>
          </form>

          <div className="mt-3 max-h-56 overflow-auto rounded-xl border border-slate-200">
            <table className="min-w-full text-xs">
              <thead className="bg-slate-50">
                <tr className="text-left text-slate-500">
                  <th className="px-2 py-2">Name</th>
                  <th className="px-2 py-2">District</th>
                  <th className="px-2 py-2">Status</th>
                  <th className="px-2 py-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.slice(0, 12).map((user) => (
                  <tr key={user.id} className="border-t border-slate-100">
                    <td className="px-2 py-2">{user.name}</td>
                    <td className="px-2 py-2">{user.district || "-"}</td>
                    <td className="px-2 py-2">{user.status || "active"}</td>
                    <td className="px-2 py-2">
                      <div className="flex gap-1">
                        <button type="button" onClick={() => onToggleUserStatus(user)} className="rounded border border-civic-300 px-1.5 py-0.5 text-[10px] text-civic-700">Toggle</button>
                        <button type="button" onClick={() => onDeleteUser(user.id)} className="rounded border border-red-300 px-1.5 py-0.5 text-[10px] text-red-700">Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="glass-card p-4">
          <h3 className="text-lg font-bold text-civic-900">Fund Governance</h3>
          <div className="mt-3 max-h-72 overflow-auto rounded-xl border border-slate-200">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50">
                <tr className="text-left text-slate-500">
                  <th className="px-2 py-2">District</th>
                  <th className="px-2 py-2">Allocated</th>
                  <th className="px-2 py-2">Spent</th>
                  <th className="px-2 py-2">Utilization</th>
                  <th className="px-2 py-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {fundSummary.map((row) => (
                  <tr key={row.district} className="border-t border-slate-100">
                    <td className="px-2 py-2">{row.district}</td>
                    <td className="px-2 py-2">INR {Number(row.allocated).toLocaleString()}</td>
                    <td className="px-2 py-2">INR {Number(row.spent).toLocaleString()}</td>
                    <td className="px-2 py-2">{row.utilization_percent}%</td>
                    <td className="px-2 py-2">{row.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {spoofCases.length > 0 ? (
        <div className="glass-card p-4">
          <div className="mb-2 flex items-center gap-2 text-red-700">
            <Shield size={16} />
            <h3 className="text-lg font-bold text-civic-900">Security & Accountability Alerts</h3>
          </div>
          <div className="space-y-1 text-sm text-slate-700">
            {spoofCases.slice(0, 8).map((caseItem) => (
              <p key={caseItem.id}>
                <span className="font-semibold">{caseItem.district || "Unknown District"}</span>: {caseItem.worker_name} - {caseItem.spoof_reason || "Suspicious activity"}
              </p>
            ))}
          </div>
          <p className="mt-2 text-xs text-slate-500">All administrative actions are audit-logged for transparency and accountability.</p>
          <div className="mt-2 inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-1 text-xs text-emerald-700">
            <CheckCircle2 size={14} /> Governance logging active
          </div>
        </div>
      ) : null}
    </div>
  );
}
