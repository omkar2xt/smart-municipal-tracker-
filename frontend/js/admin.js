/* ── Leaflet map instance ─────────────────────────────── */
let map = null;
let workerMarkers = {};
let zoneCircles  = [];
let zones = [];
let workers = [];
let tasks = [];

/* ── Admin page init ──────────────────────────────────── */
document.addEventListener("DOMContentLoaded", async () => {
  if (!Auth.isLoggedIn()) { window.location.href = "index.html"; return; }
  const user = Auth.getUser();
  if (user?.role !== "admin") { window.location.href = "worker.html"; return; }

  document.getElementById("user-name").textContent = user?.name || "Admin";
  document.getElementById("btn-logout").addEventListener("click", () => {
    Auth.clear(); window.location.href = "index.html";
  });

  initMap();
  await Promise.all([loadDashboard(), loadWorkers(), loadTasks(), loadZones()]);
  setupEventListeners();

  // Auto-refresh worker locations every 30 s
  setInterval(refreshLocations, 30000);
});

/* ── Map ──────────────────────────────────────────────── */
function initMap() {
  map = L.map("map").setView([18.5204, 73.8567], 13);
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "© OpenStreetMap contributors",
    maxZoom: 19,
  }).addTo(map);
}

function plotZones(zonesArr) {
  zoneCircles.forEach((c) => c.remove());
  zoneCircles = [];
  zonesArr.forEach((z) => {
    const circle = L.circle([z.lat, z.lon], {
      radius: z.radius_metres,
      color: "#1e88e5",
      fillColor: "#90caf9",
      fillOpacity: 0.2,
      weight: 2,
    }).addTo(map).bindPopup(`<b>${z.name}</b><br>Radius: ${z.radius_metres}m`);
    zoneCircles.push(circle);
  });
}

function plotWorkerLocations(locations) {
  // Remove old markers
  Object.values(workerMarkers).forEach((m) => m.remove());
  workerMarkers = {};

  locations.forEach((w) => {
    if (!w.latitude) return;
    const color  = w.check_out_time ? "#757575" : "#43a047";
    const icon   = L.divIcon({
      html: `<div style="background:${color};width:16px;height:16px;border-radius:50%;border:2px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,.4)"></div>`,
      className: "",
      iconSize: [16, 16],
    });
    const marker = L.marker([w.latitude, w.longitude], { icon })
      .addTo(map)
      .bindPopup(`
        <b>${w.name}</b> (@${w.username})<br>
        Status: ${w.check_out_time ? "Checked out" : "Active"}<br>
        Last check-in: ${fmtDate(w.check_in_time)}<br>
        Zone: ${w.zone_status}
      `);
    workerMarkers[w.id] = marker;
  });
}

async function refreshLocations() {
  try {
    const locs = await apiFetch("/workers/locations");
    plotWorkerLocations(locs);
    updateLiveFeed(locs);
  } catch (_) {}
}

/* ── Dashboard stats ──────────────────────────────────── */
async function loadDashboard() {
  const [todayAtt, allTasks, allWorkers] = await Promise.all([
    apiFetch("/attendance/today"),
    apiFetch("/tasks"),
    apiFetch("/workers"),
  ]);

  document.getElementById("stat-present").textContent =
    todayAtt.filter((r) => !r.check_out_time).length;
  document.getElementById("stat-workers").textContent = allWorkers.length;
  document.getElementById("stat-tasks-open").textContent =
    allTasks.filter((t) => t.status !== "completed").length;
  document.getElementById("stat-tasks-done").textContent =
    allTasks.filter((t) => t.status === "completed").length;

  updateLiveFeed(await apiFetch("/workers/locations").catch(() => []));
}

function updateLiveFeed(locations) {
  const tbody = document.getElementById("live-feed-body");
  if (!locations.length) {
    tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;color:var(--muted)">No data</td></tr>';
    return;
  }
  tbody.innerHTML = locations.map((w) => `
    <tr>
      <td>${w.name}</td>
      <td>${w.latitude ? w.latitude.toFixed(5) : "—"}, ${w.longitude ? w.longitude.toFixed(5) : "—"}</td>
      <td>${w.check_out_time ? "Checked out" : '<span style="color:var(--secondary);font-weight:600">Active</span>'}</td>
      <td>${fmtDate(w.check_in_time)}</td>
      <td><span class="badge badge-${w.zone_status==='within'?'success':'warning'}">${w.zone_status}</span></td>
    </tr>`).join("");
}

/* ── Workers list ─────────────────────────────────────── */
async function loadWorkers() {
  workers = await apiFetch("/workers");
  renderWorkersTable(workers);

  // Populate assigned_to dropdowns
  ["edit-task-worker"].forEach((id) => {
    const sel = document.getElementById(id);
    if (!sel) return;
    sel.innerHTML = '<option value="">— Unassigned —</option>' +
      workers.map((w) => `<option value="${w.id}">${w.name}</option>`).join("");
  });
}

function renderWorkersTable(data) {
  const tbody = document.getElementById("workers-body");
  if (!data.length) {
    tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;color:var(--muted)">No workers</td></tr>';
    return;
  }
  tbody.innerHTML = data.map((w) => `
    <tr>
      <td>${w.name}</td>
      <td>@${w.username}</td>
      <td>${w.phone || "—"}</td>
      <td>${w.zone_name || "—"}</td>
      <td>${fmtDate(w.created_at)}</td>
    </tr>`).join("");
}

/* ── Tasks ────────────────────────────────────────────── */
async function loadTasks() {
  tasks = await apiFetch("/tasks");
  renderTasksTable(tasks);
}

function renderTasksTable(data) {
  const tbody = document.getElementById("tasks-body");
  if (!data.length) {
    tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;color:var(--muted)">No tasks</td></tr>';
    return;
  }
  tbody.innerHTML = data.map((t) => `
    <tr>
      <td>${t.title}</td>
      <td>${t.worker_name || "—"}</td>
      <td>${priorityBadge(t.priority)}</td>
      <td>${statusBadge(t.status)}</td>
      <td>${t.due_date || "—"}</td>
      <td>
        <button class="btn btn-outline btn-sm" onclick="openEditTask(${t.id})">Edit</button>
        <button class="btn btn-danger btn-sm" onclick="deleteTask(${t.id})">Delete</button>
      </td>
    </tr>`).join("");
}

/* ── Zones ────────────────────────────────────────────── */
async function loadZones() {
  zones = await apiFetch("/workers/zones");
  plotZones(zones);

  const populate = (id) => {
    const sel = document.getElementById(id);
    if (!sel) return;
    sel.innerHTML = '<option value="">— No zone —</option>' +
      zones.map((z) => `<option value="${z.id}">${z.name}</option>`).join("");
  };
  ["edit-task-zone"].forEach(populate);
  refreshLocations();
}

/* ── Task modal ───────────────────────────────────────── */
function openCreateTask() {
  document.getElementById("task-modal-title").textContent = "New Task";
  document.getElementById("task-form").reset();
  document.getElementById("edit-task-id").value = "";
  document.getElementById("task-modal").classList.remove("hidden");
}

async function openEditTask(taskId) {
  const t = tasks.find((x) => x.id === taskId);
  if (!t) return;
  document.getElementById("task-modal-title").textContent = "Edit Task";
  document.getElementById("edit-task-id").value    = t.id;
  document.getElementById("edit-task-title").value = t.title;
  document.getElementById("edit-task-desc").value  = t.description || "";
  document.getElementById("edit-task-worker").value = t.assigned_to || "";
  document.getElementById("edit-task-zone").value   = t.zone_id || "";
  document.getElementById("edit-task-priority").value = t.priority;
  document.getElementById("edit-task-due").value    = t.due_date || "";
  document.getElementById("edit-task-status").value = t.status;
  document.getElementById("task-modal").classList.remove("hidden");
}

function closeModal(id) {
  document.getElementById(id).classList.add("hidden");
}

async function submitTaskForm(e) {
  e.preventDefault();
  const id = document.getElementById("edit-task-id").value;
  const body = {
    title:       document.getElementById("edit-task-title").value,
    description: document.getElementById("edit-task-desc").value,
    assigned_to: document.getElementById("edit-task-worker").value || null,
    zone_id:     document.getElementById("edit-task-zone").value   || null,
    priority:    document.getElementById("edit-task-priority").value,
    due_date:    document.getElementById("edit-task-due").value    || null,
    status:      document.getElementById("edit-task-status").value,
  };
  try {
    if (id) {
      await apiFetch(`/tasks/${id}`, { method: "PUT", body: JSON.stringify(body) });
      showAlert("admin-alert", "Task updated", "success");
    } else {
      await apiFetch("/tasks", { method: "POST", body: JSON.stringify(body) });
      showAlert("admin-alert", "Task created", "success");
    }
    closeModal("task-modal");
    await loadTasks();
  } catch (err) {
    showAlert("admin-alert", err.message, "danger");
  }
}

async function deleteTask(id) {
  if (!confirm("Delete this task?")) return;
  try {
    await apiFetch(`/tasks/${id}`, { method: "DELETE" });
    showAlert("admin-alert", "Task deleted", "success");
    await loadTasks();
  } catch (e) {
    showAlert("admin-alert", e.message, "danger");
  }
}

/* ── Zone modal ───────────────────────────────────────── */
async function submitZoneForm(e) {
  e.preventDefault();
  const body = {
    name:          document.getElementById("zone-name").value,
    lat:           parseFloat(document.getElementById("zone-lat").value),
    lon:           parseFloat(document.getElementById("zone-lon").value),
    radius_metres: parseInt(document.getElementById("zone-radius").value, 10),
  };
  try {
    await apiFetch("/workers/zones", { method: "POST", body: JSON.stringify(body) });
    showAlert("admin-alert", "Zone created", "success");
    closeModal("zone-modal");
    await loadZones();
  } catch (err) {
    showAlert("admin-alert", err.message, "danger");
  }
}

/* ── Worker registration modal ────────────────────────── */
async function submitWorkerForm(e) {
  e.preventDefault();
  const body = {
    username: document.getElementById("new-username").value,
    password: document.getElementById("new-password").value,
    name:     document.getElementById("new-name").value,
    role:     "worker",
    phone:    document.getElementById("new-phone").value,
    zone_id:  document.getElementById("new-zone").value || null,
  };
  try {
    await apiFetch("/auth/register", { method: "POST", body: JSON.stringify(body) });
    showAlert("admin-alert", "Worker registered", "success");
    closeModal("worker-modal");
    await loadWorkers();
  } catch (err) {
    showAlert("admin-alert", err.message, "danger");
  }
}

/* ── Tab switching ────────────────────────────────────── */
function switchTab(name) {
  document.querySelectorAll(".tab-panel").forEach((p) => p.classList.add("hidden"));
  document.querySelectorAll(".tab-btn").forEach((b) => b.classList.remove("active"));
  document.getElementById(`tab-${name}`).classList.remove("hidden");
  document.querySelector(`[data-tab="${name}"]`).classList.add("active");
  if (name === "map") setTimeout(() => map.invalidateSize(), 100);
}

/* ── Wire up all event listeners ─────────────────────── */
function setupEventListeners() {
  document.querySelectorAll(".tab-btn").forEach((btn) => {
    btn.addEventListener("click", () => switchTab(btn.dataset.tab));
  });

  document.getElementById("btn-new-task").addEventListener("click", openCreateTask);
  document.getElementById("task-form").addEventListener("submit", submitTaskForm);
  document.getElementById("zone-form").addEventListener("submit", submitZoneForm);
  document.getElementById("worker-reg-form").addEventListener("submit", submitWorkerForm);

  // New zone / worker buttons
  document.getElementById("btn-new-zone").addEventListener("click",
    () => document.getElementById("zone-modal").classList.remove("hidden"));
  document.getElementById("btn-new-worker").addEventListener("click",
    () => {
      const sel = document.getElementById("new-zone");
      sel.innerHTML = '<option value="">— No zone —</option>' +
        zones.map((z) => `<option value="${z.id}">${z.name}</option>`).join("");
      document.getElementById("worker-modal").classList.remove("hidden");
    });
}
