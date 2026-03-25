import React from "react";
import { motion } from "framer-motion";
import { CheckCircle2, ClipboardList, MapPinned, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";

import AdminStatePanel from "../components/AdminStatePanel";
import StatusBadge from "../components/ui/StatusBadge";
import SubAdminPanel from "../components/SubAdminPanel";
import StatCard from "../components/ui/StatCard";
import TalukaAdminPanel from "../components/TalukaAdminPanel";
import WorkerVerificationPanel from "../components/WorkerVerificationPanel";
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
  sessionKey,
  stats,
  session,
  tasks,
  onRefreshTasks,
  onDownloadAttendance,
  onDownloadTasks,
  onDownloadPerformance,
  onAssignTask,
  onOpenMap,
  onViewTasks,
  onUploadProof,
}) {
  const isAdminRole = role === "admin" || role === "state_admin";
  const isSubAdminRole = role === "sub_admin" || role === "district_admin";

  if (isAdminRole) {
    return <AdminStatePanel key={`admin-${sessionKey}`} />;
  }

  if (isSubAdminRole) {
    return <SubAdminPanel key={`subadmin-${sessionKey}`} />;
  }

  if (role === "taluka_admin") {
    return <TalukaAdminPanel key={`taluka-${sessionKey}`} />;
  }

  return (
    <WorkerVerificationPanel
      key={`worker-${sessionKey}`}
      userId={session?.id}
      tasks={tasks}
      onTasksRefresh={onRefreshTasks}
    />
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
    if (!session?.id) {
      setWorkers([]);
      setTasks([]);
      setStats({});
      setLoading(false);
      return;
    }

    let mounted = true;
    async function load() {
      setLoading(true);
      setError("");
      try {
        const [workersResult, tasksResult, statsResult] = await Promise.allSettled([
          fetchWorkers(),
          fetchTasks(),
          fetchStats(),
        ]);

        if (!mounted) return;
        const workersData = workersResult.status === "fulfilled" ? workersResult.value : [];
        const tasksData = tasksResult.status === "fulfilled" ? tasksResult.value : [];
        const statsData = statsResult.status === "fulfilled" ? statsResult.value : {};

        setWorkers(Array.isArray(workersData) ? workersData : []);
        setTasks(Array.isArray(tasksData) ? tasksData : []);
        setStats(statsData || {});

        if (workersResult.status === "rejected" || tasksResult.status === "rejected" || statsResult.status === "rejected") {
          setError("Some dashboard data could not be loaded. Showing available data.");
        }
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
  }, [session?.id, session?.role]);

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

  async function refreshTasks() {
    try {
      const latestTasks = await fetchTasks();
      setTasks(Array.isArray(latestTasks) ? latestTasks : []);
    } catch {
      // Keep currently loaded tasks if refresh fails.
    }
  }

  const isAdminRole = session?.role === "admin" || session?.role === "state_admin";
  const isSubAdminRole = session?.role === "sub_admin" || session?.role === "district_admin";
  const showDefaultTables = session?.role !== "taluka_admin" && !isSubAdminRole && !isAdminRole;

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
        sessionKey={session?.id || session?.email || "anonymous"}
        stats={stats}
        session={session}
        tasks={tasks}
        onRefreshTasks={refreshTasks}
        onDownloadAttendance={onDownloadAttendance}
        onDownloadTasks={onDownloadTasks}
        onDownloadPerformance={onDownloadPerformance}
        onAssignTask={onAssignTask}
        onOpenMap={onOpenMap}
        onViewTasks={onViewTasks}
        onUploadProof={onUploadProof}
      />

      {showDefaultTables ? (
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
      ) : null}

      <div className="h-20 lg:hidden" />
    </div>
  );
}
