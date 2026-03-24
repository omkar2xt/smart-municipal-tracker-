import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:8000",
  timeout: 10000,
});

export async function fetchWorkers() {
  try {
    const response = await api.get("/users");
    const data = response.data;
    return Array.isArray(data?.users) ? data.users : (Array.isArray(data) ? data : []);
  } catch (error) {
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
    throw new Error(error?.response?.data?.detail || "Unable to fetch locations");
  }
}

export default api;
