import axios from "axios";

const API_URL_CACHE_KEY = "geosentinel_api_base_url";

const configuredBaseUrl = (import.meta.env.VITE_API_BASE_URL || "").trim();
const configuredBaseUrls = String(import.meta.env.VITE_API_BASE_URLS || "")
  .split(",")
  .map((v) => v.trim())
  .filter(Boolean);

function readCachedBaseUrl() {
  try {
    const cached = localStorage.getItem(API_URL_CACHE_KEY) || "";
    if (!cached) return "";
    if (typeof window !== "undefined" && window.location.protocol === "https:") {
      const lower = cached.toLowerCase();
      if (lower.includes("localhost") || lower.includes("127.0.0.1")) {
        return "";
      }
    }
    return cached;
  } catch {
    return "";
  }
}

function cacheBaseUrl(baseURL) {
  try {
    localStorage.setItem(API_URL_CACHE_KEY, baseURL);
  } catch {
    // Ignore storage errors in private mode or restricted contexts.
  }
}

const cachedBaseUrl = readCachedBaseUrl().trim();

const API_BASE_URLS = [...new Set([
  ...(cachedBaseUrl ? [cachedBaseUrl] : []),
  ...(configuredBaseUrl ? [configuredBaseUrl] : []),
  ...configuredBaseUrls,
  "http://127.0.0.1:8010",
  "http://localhost:8010",
  "http://localhost:8000",
  "http://127.0.0.1:8000",
])];

const api = axios.create({
  baseURL: API_BASE_URLS[0],
  timeout: 8000,
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

function isRetryableNetworkError(err) {
  if (!err) return false;
  if (err.code === "ECONNABORTED") return true;
  if (!err.response) return true;
  return false;
}

async function requestWithFallback(config) {
  const preferredBaseUrl = (api.defaults.baseURL || "").trim();
  const candidateBaseUrls = [...new Set([
    ...(preferredBaseUrl ? [preferredBaseUrl] : []),
    ...API_BASE_URLS,
  ])];

  let lastError = null;
  for (let index = 0; index < candidateBaseUrls.length; index += 1) {
    const baseURL = candidateBaseUrls[index];
    const requestedTimeout = config.timeout ?? 8000;
    const timeout = index === 0 ? requestedTimeout : Math.min(requestedTimeout, 2500);
    try {
      const response = await api.request({ ...config, baseURL, timeout });
      if (api.defaults.baseURL !== baseURL) {
        api.defaults.baseURL = baseURL;
      }
      cacheBaseUrl(baseURL);
      return response;
    } catch (err) {
      lastError = err;
      if (!isRetryableNetworkError(err)) {
        throw err;
      }
    }
  }

  if (lastError?.code === "ECONNABORTED") {
    throw new Error("Request timed out. Please check backend server and try again.");
  }
  throw lastError || new Error("Unable to connect to API server.");
}

export async function loginRequest(username, password) {
  const response = await requestWithFallback({
    method: "post",
    url: "/auth/login",
    data: { username, password },
    timeout: 8000,
  });
  return response.data;
}

export async function fetchCurrentUser() {
  const response = await requestWithFallback({
    method: "get",
    url: "/auth/me",
    timeout: 8000,
  });
  return response.data;
}

export async function fetchStats() {
  try {
    const response = await api.get("/admin/stats");
    return response.data || {};
  } catch (err) {
    if (err?.response?.status === 403 || err?.response?.status === 500) {
      return {};
    }
    console.error("fetchStats failed", {
      status: err?.response?.status,
      data: err?.response?.data,
      message: err?.message,
    });
    return {};
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
    if (error?.response?.status === 403) {
      return [];
    }
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

export async function verifyFace(userId, image) {
  const response = await api.post("/verify-face", {
    user_id: userId,
    image,
  });
  return response.data;
}

export async function uploadTaskProof(taskId, beforeImage, afterImage) {
  const response = await api.post("/task/upload-proof", {
    task_id: taskId,
    before_image: beforeImage || null,
    after_image: afterImage || null,
  });
  return response.data;
}

export async function fetchTalukaStats() {
  const response = await api.get("/taluka/stats");
  return response.data || {};
}

export async function fetchTalukaWorkers() {
  const response = await api.get("/taluka/workers");
  const data = response.data;
  return Array.isArray(data?.records) ? data.records : [];
}

export async function fetchTalukaTasks() {
  const response = await api.get("/taluka/tasks");
  const data = response.data;
  return Array.isArray(data?.records) ? data.records : [];
}

export async function fetchTalukaSpoofCases() {
  const response = await api.get("/taluka/spoof-cases");
  const data = response.data;
  return Array.isArray(data?.records) ? data.records : [];
}

export async function fetchSubAdminStats() {
  const response = await api.get("/subadmin/stats");
  return response.data || {};
}

export async function fetchSubAdminTalukas() {
  const response = await api.get("/subadmin/talukas");
  const data = response.data;
  return Array.isArray(data?.records) ? data.records : [];
}

export async function fetchSubAdminWorkers() {
  const response = await api.get("/subadmin/workers");
  const data = response.data;
  return Array.isArray(data?.records) ? data.records : [];
}

export async function fetchSubAdminTasks() {
  const response = await api.get("/subadmin/tasks");
  const data = response.data;
  return Array.isArray(data?.records) ? data.records : [];
}

export async function fetchSubAdminSpoofCases() {
  const response = await api.get("/subadmin/spoof-cases");
  const data = response.data;
  return Array.isArray(data?.records) ? data.records : [];
}

export async function decideTaskPlan(taskId, payload) {
  const response = await api.post(`/subadmin/tasks/${taskId}/plan-decision`, payload);
  return response.data;
}

export async function adjustTaskBudget(taskId, payload) {
  const response = await api.post(`/subadmin/tasks/${taskId}/budget`, payload);
  return response.data;
}

export async function reassignTask(taskId, payload) {
  const response = await api.post(`/subadmin/tasks/${taskId}/reassign`, payload);
  return response.data;
}

export async function flagTaluka(talukaName, payload) {
  const response = await api.post(`/subadmin/talukas/${encodeURIComponent(talukaName)}/flag`, payload);
  return response.data;
}

export async function fetchAdminStats() {
  const response = await api.get("/admin/stats");
  return response.data || {};
}

export async function fetchAdminDistricts() {
  const response = await api.get("/admin/districts");
  const data = response.data;
  return Array.isArray(data?.records) ? data.records : [];
}

export async function fetchAdminTalukas() {
  const response = await api.get("/admin/talukas");
  const data = response.data;
  return Array.isArray(data?.records) ? data.records : [];
}

export async function fetchAdminWorkers() {
  const response = await api.get("/admin/workers");
  const data = response.data;
  return Array.isArray(data?.records) ? data.records : [];
}

export async function fetchAdminUsers() {
  const response = await api.get("/admin/users");
  const data = response.data;
  return Array.isArray(data?.users) ? data.users : [];
}

export async function fetchAdminTasks() {
  const response = await api.get("/admin/tasks");
  const data = response.data;
  return Array.isArray(data?.records) ? data.records : [];
}

export async function fetchAdminSpoofCases() {
  const response = await api.get("/admin/spoof-cases");
  const data = response.data;
  return Array.isArray(data?.records) ? data.records : [];
}

export async function createAdminUser(payload) {
  const response = await api.post("/admin/create-user", payload);
  return response.data;
}

export async function updateAdminUser(payload) {
  const response = await api.put("/admin/update-user", payload);
  return response.data;
}

export async function deleteAdminUser(userId) {
  const response = await api.delete("/admin/delete-user", { params: { user_id: userId } });
  return response.data;
}

export async function allocateDistrictFunds(payload) {
  const response = await api.post("/admin/funds/allocate-district", payload);
  return response.data;
}

export async function fetchFundSummary() {
  const response = await api.get("/admin/funds/summary");
  const data = response.data;
  return Array.isArray(data?.records) ? data.records : [];
}

export async function transferWorker(payload) {
  const response = await api.post("/admin/decisions/transfer-worker", payload);
  return response.data;
}

export async function flagDistrict(payload) {
  const response = await api.post("/admin/decisions/flag-district", payload);
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
