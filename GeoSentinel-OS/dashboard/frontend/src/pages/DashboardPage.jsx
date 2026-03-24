import React from "react";
import { motion } from "framer-motion";
import { CheckCircle2, ClipboardList, MapPinned, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";

import StatusBadge from "../components/ui/StatusBadge";
import StatCard from "../components/ui/StatCard";
import { useAuth } from "../context/AuthContext";
import { downloadReport, fetchStats, fetchTasks, fetchWorkers } from "../services/api";

function ComparisonChart() {
  const data = [
    { label: "District A", value: 84 },
    { label: "District B", value: 66 },
    { label: "District C", value: 58 },
    { label: "District D", value: 75 },
  ];

  return (
    <div className="glass-card p-5">
      <h3 className="text-lg font-bold text-civic-900">District Comparison</h3>
      <div className="mt-4 space-y-3">
        {data.map((row) => (
          <div key={row.label}>
            <div className="mb-1 flex justify-between text-sm text-slate-600">
              <span>{row.label}</span>
              <span>{row.value}%</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-slate-100">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${row.value}%` }}
                transition={{ duration: 0.8 }}
                className="h-2 rounded-full bg-gradient-to-r from-eco-500 to-civic-500"
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function AdminPanels({
  role,
  stats,
  onDownloadAttendance,
  onDownloadTasks,
  onDownloadPerformance,
  onAssignTask,
  onOpenMap,
  onViewTasks,
  onUploadProof,
}) {
  if (role === "admin") {
    return (
      <>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard title="Total Workers" value={String(stats.total_users ?? 0)} subtitle="Across state operations" icon={<Users size={18} />} />
          <StatCard title="Total Tasks" value={String(stats.total_tasks ?? 0)} subtitle="Activity records" icon={<ClipboardList size={18} />} />
          <StatCard title="Spoof Detections" value={String(stats.spoof_detections ?? 0)} subtitle="Risk alerts" icon={<CheckCircle2 size={18} />} />
          <StatCard title="Location Logs" value={String(stats.total_location_logs ?? 0)} subtitle="Tracking records" icon={<MapPinned size={18} />} />
        </div>
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <ComparisonChart />
          <div className="glass-card p-5">
            <h3 className="text-lg font-bold text-civic-900">State Heat Summary</h3>
            <p className="mt-2 text-sm text-slate-600">High-intensity work clusters in Pune, Nashik, and Nagpur divisions.</p>
            <div className="mt-4 h-52 rounded-xl bg-gradient-to-br from-civic-100 via-eco-100 to-civic-200" />
            <div className="mt-4 flex flex-wrap gap-2">
              <button type="button" onClick={onDownloadAttendance} className="rounded-lg bg-civic-600 px-3 py-2 text-sm font-semibold text-white">Download Attendance CSV</button>
              <button type="button" onClick={onDownloadPerformance} className="rounded-lg border border-civic-300 px-3 py-2 text-sm font-semibold text-civic-700">Download Performance PDF</button>
            </div>
          </div>
        </div>
      </>
    );
  }

  if (role === "sub_admin") {
    return (
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="glass-card p-5">
          <h3 className="text-lg font-bold text-civic-900">District Analytics</h3>
          <ul className="mt-3 space-y-2 text-sm text-slate-600">
            <li>Attendance compliance: 91%</li>
            <li>Active workers: 328</li>
            <li>Open tasks: 74</li>
          </ul>
        </div>
        <div className="glass-card p-5">
          <h3 className="text-lg font-bold text-civic-900">Taluka Decisions Queue</h3>
          <ul className="mt-3 space-y-2 text-sm text-slate-600">
            <li>Approve budget shift: Hadapsar sanitation sprint</li>
            <li>Review urgent request: Khed waste transfer issue</li>
            <li>Sign off: weekly impact report exports</li>
          </ul>
          <div className="mt-4 flex flex-wrap gap-2">
            <button type="button" onClick={onDownloadTasks} className="rounded-lg bg-civic-600 px-3 py-2 text-sm font-semibold text-white">Download Task CSV</button>
            <button type="button" onClick={onDownloadPerformance} className="rounded-lg border border-civic-300 px-3 py-2 text-sm font-semibold text-civic-700">Download PDF</button>
          </div>
        </div>
      </div>
    );
  }

  if (role === "taluka_admin") {
    return (
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="glass-card p-5">
          <h3 className="text-lg font-bold text-civic-900">Worker Assignment Board</h3>
          <p className="mt-2 text-sm text-slate-600">Assign daily tasks and monitor movement in your taluka.</p>
          <button type="button" onClick={onAssignTask} className="mt-4 rounded-xl bg-eco-600 px-4 py-2 text-sm font-semibold text-white hover:bg-eco-700">
            Assign New Task
          </button>
        </div>
        <div className="glass-card p-5">
          <h3 className="text-lg font-bold text-civic-900">Taluka Movement Snapshot</h3>
          <div className="mt-3 h-48 rounded-xl bg-gradient-to-br from-eco-100 to-civic-100" />
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <button type="button" onClick={onOpenMap} className="glass-card p-5 text-left hover:border-eco-300">
        <p className="text-lg font-semibold text-civic-900">Mark Attendance</p>
        <p className="mt-1 text-sm text-slate-600">Submit GPS attendance for today.</p>
      </button>
      <button type="button" onClick={onViewTasks} className="glass-card p-5 text-left hover:border-eco-300">
        <p className="text-lg font-semibold text-civic-900">View Tasks</p>
        <p className="mt-1 text-sm text-slate-600">Open assigned tasks and completion details.</p>
      </button>
      <button type="button" onClick={onUploadProof} className="glass-card p-5 text-left hover:border-eco-300">
        <p className="text-lg font-semibold text-civic-900">Upload Proof</p>
        <p className="mt-1 text-sm text-slate-600">Attach before/after evidence for field work.</p>
      </button>
    </div>
  );
}

export default function DashboardPage() {
  const navigate = useNavigate();
  const { session } = useAuth();
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");
  const [workers, setWorkers] = React.useState([]);
  const [tasks, setTasks] = React.useState([]);
  const [stats, setStats] = React.useState({});

  React.useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      setError("");
      try {
        const [workersData, tasksData, statsData] = await Promise.all([
          fetchWorkers(),
          fetchTasks(),
          fetchStats(),
        ]);

        if (!mounted) return;
        setWorkers(Array.isArray(workersData) ? workersData : []);
        setTasks(Array.isArray(tasksData) ? tasksData : []);
        setStats(statsData || {});
      } catch (err) {
        if (!mounted) return;
        setError(err?.message || "Failed to load dashboard data");
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => {
      mounted = false;
    };
  }, []);

  async function onDownloadAttendance() {
    try {
      await downloadReport("/reports/attendance.csv", "attendance_report.csv");
    } catch (err) {
      setError(err?.message || "Failed to download attendance report");
    }
  }

  async function onDownloadTasks() {
    try {
      await downloadReport("/reports/tasks.csv", "task_report.csv");
    } catch (err) {
      setError(err?.message || "Failed to download task report");
    }
  }

  async function onDownloadPerformance() {
    try {
      await downloadReport("/reports/performance.pdf", "performance_report.pdf");
    } catch (err) {
      setError(err?.message || "Failed to download performance report");
    }
  }

  function scrollToTasks() {
    const section = document.getElementById("task-monitoring-section");
    if (section) {
      section.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  function onAssignTask() {
    scrollToTasks();
  }

  function onOpenMap() {
    navigate("/map");
  }

  function onViewTasks() {
    scrollToTasks();
  }

  function onUploadProof() {
    navigate("/map");
  }

  return (
    <div>
      <div className="mb-5">
        <p className="text-sm text-slate-500">GeoSentinel OS / Dashboard</p>
        <h1 className="text-3xl font-extrabold text-civic-900">Role-Based Operations Dashboard</h1>
        <p className="mt-2 text-slate-600">Welcome {session?.name}. This view is tailored for {session?.role}.</p>
      </div>

      {loading ? <div className="mb-4 rounded-xl bg-civic-50 px-4 py-3 text-sm text-civic-700">Loading live dashboard data...</div> : null}
      {error ? <div className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div> : null}

      <AdminPanels
        role={session?.role}
        stats={stats}
        onDownloadAttendance={onDownloadAttendance}
        onDownloadTasks={onDownloadTasks}
        onDownloadPerformance={onDownloadPerformance}
        onAssignTask={onAssignTask}
        onOpenMap={onOpenMap}
        onViewTasks={onViewTasks}
        onUploadProof={onUploadProof}
      />

      <div id="task-monitoring-section" className="mt-5 grid gap-4 lg:grid-cols-2">
        <div className="glass-card overflow-hidden p-4">
          <h3 className="mb-3 text-lg font-bold text-civic-900">Task Monitoring</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-slate-500">
                  <th className="pb-2">Task</th>
                  <th className="pb-2">Status</th>
                  <th className="pb-2">Fund</th>
                </tr>
              </thead>
              <tbody>
                {tasks.map((task) => (
                  <tr key={task.id} className="border-t border-slate-100">
                    <td className="py-3 pr-3">{task.title}</td>
                    <td className="py-3 pr-3">
                      <StatusBadge status={task.status} />
                    </td>
                    <td className="py-3">INR {Number(task.fund ?? task.fund_allocated ?? 0).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="glass-card overflow-hidden p-4">
          <h3 className="mb-3 text-lg font-bold text-civic-900">Workforce Status</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-slate-500">
                  <th className="pb-2">Worker</th>
                  <th className="pb-2">Area</th>
                  <th className="pb-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {workers.map((row) => (
                  <tr key={row.id} className="border-t border-slate-100">
                    <td className="py-3 pr-3">{row.name || row.email || `Worker #${row.id}`}</td>
                    <td className="py-3 pr-3">{row.area || row.taluka || row.district || "-"}</td>
                    <td className="py-3">
                      <StatusBadge status={row.status || "active"} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="h-20 lg:hidden" />
    </div>
  );
}
