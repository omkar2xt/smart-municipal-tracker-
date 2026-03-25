import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:8000",
  timeout: 10000,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("geosentinel_token");
  if (token && !config.headers?.Authorization) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export function setAuthToken(token) {
  if (token) {
    api.defaults.headers.common.Authorization = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common.Authorization;
  }
}

export async function loginRequest(username, password) {
  const response = await api.post("/auth/login", { username, password });
  return response.data;
}

export async function fetchCurrentUser() {
  const response = await api.get("/auth/me");
  return response.data;
}

export async function fetchStats() {
  try {
    const response = await api.get("/admin/stats");
    return response.data || {};
  } catch (err) {
    if (err?.response?.status === 403) {
      return {};
    }
    console.error("fetchStats failed", {
      status: err?.response?.status,
      data: err?.response?.data,
      message: err?.message,
    });
    throw new Error(err?.response?.data?.detail || "Unable to fetch stats");
  }
}

export async function fetchWorkers() {
  try {
    const response = await api.get("/admin/users");
    const data = response.data;
    return Array.isArray(data?.users) ? data.users : (Array.isArray(data) ? data : []);
  } catch (error) {
    if (error?.response?.status === 403) {
      return [];
    }
    throw new Error(error?.response?.data?.detail || "Unable to fetch workers");
  }
}

export async function fetchTasks() {
  try {
    const response = await api.get("/tasks");
    const data = response.data;
    return Array.isArray(data?.records) ? data.records : (Array.isArray(data) ? data : []);
  } catch (error) {
    throw new Error(error?.response?.data?.detail || "Unable to fetch tasks");
  }
}

export async function fetchLocations() {
  try {
    const response = await api.get("/admin/reports/spoof-detections");
    const data = response.data;
    return Array.isArray(data?.records) ? data.records : (Array.isArray(data) ? data : []);
  } catch (error) {
    if (error?.response?.status === 403) {
      try {
        const fallback = await api.get("/tracking/locations");
        const data = fallback.data;
        return Array.isArray(data?.records) ? data.records : (Array.isArray(data) ? data : []);
      } catch {
        return [];
      }
    }
    throw new Error(error?.response?.data?.detail || "Unable to fetch locations");
  }
}

export async function postTrackingLocation(payload) {
  const response = await api.post("/tracking/location", payload);
  return response.data;
}

export async function downloadReport(endpoint, filename) {
  const response = await api.get(endpoint, { responseType: "blob" });
  const url = window.URL.createObjectURL(response.data);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.URL.revokeObjectURL(url);
}

export default api;
