import React from "react";

import LocationsTable from "./components/LocationsTable";
import RoleSelector from "./components/RoleSelector";
import TasksTable from "./components/TasksTable";
import WorkersTable from "./components/WorkersTable";
import { fetchLocations, fetchTasks, fetchWorkers } from "./services/api";

function roleFilter(row, role) {
  if (role === "state_admin") {
    return true;
  }

  if (role === "district_admin") {
    return row.role !== "state_admin";
  }

  return row.role === "worker" || row.role === "taluka_admin";
}

export default function App() {
  const [role, setRole] = React.useState("taluka_admin");
  const [loading, setLoading] = React.useState(true);
  const [workers, setWorkers] = React.useState([]);
  const [tasks, setTasks] = React.useState([]);
  const [locations, setLocations] = React.useState([]);
  const [error, setError] = React.useState("");

  const loadData = React.useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [workersData, tasksData, locationsData] = await Promise.all([
        fetchWorkers(),
        fetchTasks(),
        fetchLocations(),
      ]);

      setWorkers(Array.isArray(workersData) ? workersData : []);
      setTasks(Array.isArray(tasksData) ? tasksData : []);
      setLocations(Array.isArray(locationsData) ? locationsData : []);
    } catch (loadError) {
      setError(loadError?.message || "Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadData();
  }, [loadData]);

  const visibleWorkers = workers.filter((row) => roleFilter(row, role));
  const visibleTasks = tasks.filter((row) => roleFilter({ role: row.assigned_role || "worker" }, role));
  const visibleLocations = locations;

  return (
    <div className="app-shell">
      <header className="hero">
        <div>
          <h1>GeoSentinel OS Dashboard</h1>
          <p>Role-based operational visibility for municipal workforce intelligence.</p>
        </div>
        <button className="btn" onClick={loadData} type="button" disabled={loading}>
          Refresh
        </button>
      </header>

      <RoleSelector role={role} onChange={setRole} />

      {loading ? <div className="loading">Loading dashboard data...</div> : null}
      {!loading && error ? <div className="loading">{error}</div> : null}

      <div className="grid">
        <WorkersTable workers={visibleWorkers} />
        <TasksTable tasks={visibleTasks} />
      </div>

      <LocationsTable locations={visibleLocations} />
    </div>
  );
}
