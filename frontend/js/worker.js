/* ── GPS helpers ──────────────────────────────────────── */
let currentPosition = null;

function updateGpsDot(state) {
  const dot = document.querySelector(".gps-dot");
  const txt = document.getElementById("gps-text");
  if (!dot) return;
  dot.className = "gps-dot " + state;
  if (txt) {
    const labels = {
      acquiring: "Acquiring GPS…",
      ready: `GPS Ready (±${Math.round(currentPosition?.coords?.accuracy || 0)}m)`,
      error: "GPS unavailable",
    };
    txt.textContent = labels[state] || "";
  }
}

function getGPS() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Geolocation not supported"));
      return;
    }
    updateGpsDot("acquiring");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        currentPosition = pos;
        updateGpsDot("ready");
        resolve(pos);
      },
      (err) => {
        updateGpsDot("error");
        reject(new Error("Unable to get location: " + err.message));
      },
      { enableHighAccuracy: true, timeout: 15000 }
    );
  });
}

/* ── Worker page ──────────────────────────────────────── */
document.addEventListener("DOMContentLoaded", async () => {
  if (!Auth.isLoggedIn()) { window.location.href = "index.html"; return; }
  const user = Auth.getUser();
  if (user?.role === "admin") { window.location.href = "admin.html"; return; }

  document.getElementById("user-name").textContent = user?.name || "Worker";
  document.getElementById("btn-logout").addEventListener("click", () => {
    Auth.clear(); window.location.href = "index.html";
  });

  await loadWorkerData();

  // GPS watch for live tracking
  if (navigator.geolocation) {
    navigator.geolocation.watchPosition(
      (pos) => { currentPosition = pos; updateGpsDot("ready"); },
      () => updateGpsDot("error"),
      { enableHighAccuracy: true }
    );
  }

  document.getElementById("btn-checkin").addEventListener("click", doCheckin);
  document.getElementById("btn-checkout").addEventListener("click", doCheckout);
  document.getElementById("btn-upload").addEventListener("click", doUpload);
  document.getElementById("img-file").addEventListener("change", previewImage);
});

async function loadWorkerData() {
  const [tasks, attendance] = await Promise.all([
    apiFetch("/tasks"),
    apiFetch("/attendance/today"),
  ]);

  renderWorkerTasks(tasks);
  updateCheckinUI(attendance);

  // Populate task select for image upload
  const sel = document.getElementById("upload-task");
  sel.innerHTML = '<option value="">— Select task —</option>';
  tasks.forEach((t) => {
    const opt = document.createElement("option");
    opt.value = t.id;
    opt.textContent = t.title;
    sel.appendChild(opt);
  });
}

function updateCheckinUI(records) {
  const active = records.find((r) => !r.check_out_time);
  const btnIn  = document.getElementById("btn-checkin");
  const btnOut = document.getElementById("btn-checkout");
  const status = document.getElementById("checkin-status");

  if (active) {
    btnIn.disabled  = true;
    btnOut.disabled = false;
    status.innerHTML = `<div class="alert alert-success">
      ✅ Checked in at ${fmtDate(active.check_in_time)}
      &nbsp;|&nbsp; Lat: ${active.latitude}, Lon: ${active.longitude}
    </div>`;
  } else {
    btnIn.disabled  = false;
    btnOut.disabled = true;
    const last = records[records.length - 1];
    if (last?.check_out_time) {
      status.innerHTML = `<div class="alert alert-info">
        Last check-out: ${fmtDate(last.check_out_time)}
      </div>`;
    } else {
      status.innerHTML = "";
    }
  }
}

function renderWorkerTasks(tasks) {
  const tbody = document.getElementById("worker-tasks-body");
  if (!tasks.length) {
    tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;color:var(--muted)">No tasks assigned</td></tr>';
    return;
  }
  tbody.innerHTML = tasks.map((t) => `
    <tr>
      <td>${t.title}</td>
      <td>${t.description || "—"}</td>
      <td>${priorityBadge(t.priority)}</td>
      <td>${statusBadge(t.status)}</td>
      <td>
        <select class="form-control" style="width:auto;padding:.25rem .5rem;font-size:.82rem"
                onchange="updateTaskStatus(${t.id}, this.value)">
          <option value="pending"     ${t.status==="pending"     ? "selected":""}>Pending</option>
          <option value="in_progress" ${t.status==="in_progress" ? "selected":""}>In Progress</option>
          <option value="completed"   ${t.status==="completed"   ? "selected":""}>Completed</option>
        </select>
      </td>
    </tr>`).join("");
}

async function updateTaskStatus(taskId, status) {
  try {
    await apiFetch(`/tasks/${taskId}`, {
      method: "PUT",
      body: JSON.stringify({ status }),
    });
    showAlert("worker-alert", "Task status updated", "success");
  } catch (e) {
    showAlert("worker-alert", e.message, "danger");
  }
}

async function doCheckin() {
  try {
    const pos = await getGPS();
    const data = await apiFetch("/attendance/checkin", {
      method: "POST",
      body: JSON.stringify({
        latitude:  pos.coords.latitude,
        longitude: pos.coords.longitude,
      }),
    });
    showAlert("worker-alert", "✅ Checked in successfully!", "success");
    await loadWorkerData();
  } catch (e) {
    showAlert("worker-alert", "❌ " + e.message, "danger");
  }
}

async function doCheckout() {
  try {
    const pos = await getGPS().catch(() => null);
    await apiFetch("/attendance/checkout", {
      method: "POST",
      body: JSON.stringify({
        latitude:  pos?.coords?.latitude  || null,
        longitude: pos?.coords?.longitude || null,
      }),
    });
    showAlert("worker-alert", "✅ Checked out successfully!", "success");
    await loadWorkerData();
  } catch (e) {
    showAlert("worker-alert", "❌ " + e.message, "danger");
  }
}

function previewImage() {
  const file = document.getElementById("img-file").files[0];
  const preview = document.getElementById("img-preview");
  if (file) {
    preview.src = URL.createObjectURL(file);
    preview.style.display = "block";
  }
}

async function doUpload() {
  const file = document.getElementById("img-file").files[0];
  if (!file) { showAlert("worker-alert", "Please select an image", "warning"); return; }

  const formData = new FormData();
  formData.append("image", file);
  formData.append("task_id",    document.getElementById("upload-task").value);
  formData.append("image_type", document.getElementById("upload-type").value);
  formData.append("notes",      document.getElementById("upload-notes").value);

  if (currentPosition) {
    formData.append("latitude",  currentPosition.coords.latitude);
    formData.append("longitude", currentPosition.coords.longitude);
  }

  try {
    const token = Auth.getToken();
    const res = await fetch(`${API_BASE}/images/upload`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Upload failed");
    showAlert("worker-alert", "✅ Image uploaded successfully!", "success");
    document.getElementById("img-file").value = "";
    document.getElementById("img-preview").style.display = "none";
  } catch (e) {
    showAlert("worker-alert", "❌ " + e.message, "danger");
  }
}
