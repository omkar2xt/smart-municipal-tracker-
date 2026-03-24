/* API base URL – override via window.API_BASE if needed */
const API_BASE = window.API_BASE || "http://localhost:5000/api";

const Auth = {
  getToken()  { return localStorage.getItem("token"); },
  getUser()   {
    try { return JSON.parse(localStorage.getItem("user")); } catch { return null; }
  },
  setSession(token, user) {
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(user));
  },
  clear() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
  },
  isLoggedIn() { return !!this.getToken(); },

  async login(username, password) {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Login failed");
    this.setSession(data.token, { id: data.id, name: data.name, role: data.role });
    return data;
  },
};

async function apiFetch(path, options = {}) {
  const token = Auth.getToken();
  const headers = { ...(options.headers || {}) };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  if (!(options.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }
  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  if (res.status === 401) {
    Auth.clear();
    window.location.href = "index.html";
    return;
  }
  const text = await res.text();
  let data;
  try { data = JSON.parse(text); } catch { data = { message: text }; }
  if (!res.ok) throw new Error(data.error || data.message || "Request failed");
  return data;
}

function showAlert(containerId, message, type = "info") {
  const el = document.getElementById(containerId);
  if (!el) return;
  el.innerHTML = `<div class="alert alert-${type}">${message}</div>`;
  el.classList.remove("hidden");
  setTimeout(() => { el.innerHTML = ""; }, 5000);
}

function priorityBadge(p) {
  const map = { high: "danger", medium: "warning", low: "success" };
  return `<span class="badge badge-${map[p] || "muted"}">${p}</span>`;
}

function statusBadge(s) {
  const map = { pending: "warning", in_progress: "info", completed: "success" };
  return `<span class="badge badge-${map[s] || "muted"}">${s.replace("_"," ")}</span>`;
}

function fmtDate(str) {
  if (!str) return "—";
  return new Date(str).toLocaleString();
}
