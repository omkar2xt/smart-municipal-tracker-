import axios from 'axios'
import { useAuthStore } from '../store/authStore'

/**
 * API Service - Central place for all API calls
 * Configures Axios with base URL and includes authentication token
 */

// Configure base URL - Change this to your backend URL
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Add token to requests
axiosInstance.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().token
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Handle response errors
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Logout user if unauthorized
      useAuthStore.getState().logout()
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

/**
 * Authentication APIs
 */
export const authAPI = {
  login: (email, password) =>
    axiosInstance.post('/auth/login', { email, password }),

  register: (userData) =>
    axiosInstance.post('/auth/register', userData),

  logout: () =>
    axiosInstance.post('/auth/logout'),

  getProfile: () =>
    axiosInstance.get('/auth/profile'),

  updateProfile: (userData) =>
    axiosInstance.put('/auth/profile', userData),
}

/**
 * Worker APIs
 */
export const workerAPI = {
  markAttendance: (data) =>
    axiosInstance.post('/attendance', data),

  getAttendanceStatus: () =>
    axiosInstance.get('/attendance/status'),

  getTasks: () =>
    axiosInstance.get('/tasks'),

  getTaskById: (taskId) =>
    axiosInstance.get(`/tasks/${taskId}`),

  completeTask: (taskId, proofData) =>
    axiosInstance.post(`/tasks/${taskId}/complete`, proofData),

  uploadImage: (formData) =>
    axiosInstance.post('/upload/image', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  getLocation: () =>
    axiosInstance.get('/location'),

  logLocation: (locationData) =>
    axiosInstance.post('/location/log', locationData),

  checkGeofence: (latitude, longitude) =>
    axiosInstance.post('/location/geofence-check', { latitude, longitude }),
}

/**
 * Admin APIs
 */
export const adminAPI = {
  // Workers
  getWorkers: (filters = {}) =>
    axiosInstance.get('/workers', { params: filters }),

  getWorkerById: (workerId) =>
    axiosInstance.get(`/workers/${workerId}`),

  assignTask: (taskData) =>
    axiosInstance.post('/tasks/assign', taskData),

  updateTaskStatus: (taskId, status) =>
    axiosInstance.put(`/tasks/${taskId}/status`, { status }),

  // Attendance
  getAttendanceRecords: (filters = {}) =>
    axiosInstance.get('/attendance', { params: filters }),

  getAttendanceReport: (startDate, endDate) =>
    axiosInstance.get('/attendance/report', { 
      params: { startDate, endDate } 
    }),

  // Tasks
  getAllTasks: (filters = {}) =>
    axiosInstance.get('/tasks/admin', { params: filters }),

  createTask: (taskData) =>
    axiosInstance.post('/tasks', taskData),

  updateTask: (taskId, taskData) =>
    axiosInstance.put(`/tasks/${taskId}`, taskData),

  deleteTask: (taskId) =>
    axiosInstance.delete(`/tasks/${taskId}`),

  // Statistics
  getStats: () =>
    axiosInstance.get('/admin/stats'),

  getWorkerStats: (workerId) =>
    axiosInstance.get(`/admin/stats/worker/${workerId}`),

  // Locations
  getWorkerLocations: () =>
    axiosInstance.get('/admin/locations'),

  getLocationHistory: (workerId, dateRange) =>
    axiosInstance.get(`/admin/locations/${workerId}`, { 
      params: { dateRange } 
    }),
}

/**
 * Taluka Admin APIs
 */
export const talukaAdminAPI = {
  getWorkersUnderTaluka: (talukaId, filters = {}) =>
    axiosInstance.get(`/taluka/${talukaId}/workers`, { params: filters }),

  getTalukaStats: (talukaId) =>
    axiosInstance.get(`/taluka/${talukaId}/stats`),

  getTalukaAttendance: (talukaId, filters = {}) =>
    axiosInstance.get(`/taluka/${talukaId}/attendance`, { params: filters }),

  getTalukaTasks: (talukaId, filters = {}) =>
    axiosInstance.get(`/taluka/${talukaId}/tasks`, { params: filters }),

  assignTaskToWorker: (workerId, taskData) =>
    axiosInstance.post(`/taluka/workers/${workerId}/assign-task`, taskData),
}

/**
 * District Admin APIs
 */
export const districtAdminAPI = {
  getDistrictStats: (districtId) =>
    axiosInstance.get(`/district/${districtId}/stats`),

  getTalukaPerformance: (districtId) =>
    axiosInstance.get(`/district/${districtId}/talukas`),

  getDistrictAttendance: (districtId, filters = {}) =>
    axiosInstance.get(`/district/${districtId}/attendance`, { params: filters }),

  getPerformanceReport: (districtId, startDate, endDate) =>
    axiosInstance.get(`/district/${districtId}/report`, {
      params: { startDate, endDate },
    }),

  getAlerts: (districtId) =>
    axiosInstance.get(`/district/${districtId}/alerts`),
}

/**
 * State Admin APIs
 */
export const stateAdminAPI = {
  getStateStats: () =>
    axiosInstance.get('/state/stats'),

  getDistrictComparison: () =>
    axiosInstance.get('/state/districts-comparison'),

  getStateAttendance: (filters = {}) =>
    axiosInstance.get('/state/attendance', { params: filters }),

  getAnalyticsReport: (startDate, endDate) =>
    axiosInstance.get('/state/analytics', {
      params: { startDate, endDate },
    }),

  getStateAlerts: () =>
    axiosInstance.get('/state/alerts'),

  getPerformanceTrends: (days = 30) =>
    axiosInstance.get('/state/trends', { params: { days } }),
}

export default axiosInstance
