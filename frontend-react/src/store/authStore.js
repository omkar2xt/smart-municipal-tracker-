import { create } from 'zustand'

/**
 * Auth Store - Manages authentication state across the application
 * Stores user info, token, role, and dark mode preference
 */
export const useAuthStore = create((set) => ({
  user: null,
  token: localStorage.getItem('token') || null,
  role: localStorage.getItem('role') || null,
  isDarkMode: localStorage.getItem('darkMode') === 'true' || false,

  setUser: (user) => {
    set({ user })
    if (user) {
      localStorage.setItem('user', JSON.stringify(user))
    }
  },

  setToken: (token) => {
    set({ token })
    if (token) {
      localStorage.setItem('token', token)
    } else {
      localStorage.removeItem('token')
    }
  },

  setRole: (role) => {
    set({ role })
    if (role) {
      localStorage.setItem('role', role)
    }
  },

  toggleDarkMode: () =>
    set((state) => {
      const newDarkMode = !state.isDarkMode
      localStorage.setItem('darkMode', newDarkMode)
      return { isDarkMode: newDarkMode }
    }),

  logout: () => {
    set({ user: null, token: null, role: null })
    localStorage.removeItem('user')
    localStorage.removeItem('token')
    localStorage.removeItem('role')
  },

  initializeAuth: () => {
    const token = localStorage.getItem('token')
    const role = localStorage.getItem('role')
    const user = localStorage.getItem('user')
    const darkMode = localStorage.getItem('darkMode') === 'true'

    set({
      token,
      role,
      user: user ? JSON.parse(user) : null,
      isDarkMode: darkMode,
    })
  },
}))

/**
 * UI Store - Manages UI state (modals, notifications, sidebar, etc.)
 */
export const useUIStore = create((set) => ({
  sidebarOpen: true,
  notifications: [],
  loading: false,

  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),

  setLoading: (loading) => set({ loading }),

  addNotification: (notification) =>
    set((state) => ({
      notifications: [...state.notifications, { id: Date.now(), ...notification }],
    })),

  removeNotification: (id) =>
    set((state) => ({
      notifications: state.notifications.filter((n) => n.id !== id),
    })),

  clearNotifications: () => set({ notifications: [] }),
}))

/**
 * Worker Store - Manages worker-specific data
 */
export const useWorkerStore = create((set) => ({
  attendanceStatus: null,
  currentTask: null,
  tasks: [],
  insideGeofence: false,
  location: null,

  setAttendanceStatus: (status) => set({ attendanceStatus: status }),
  setCurrentTask: (task) => set({ currentTask: task }),
  setTasks: (tasks) => set({ tasks }),
  setGeofenceStatus: (status) => set({ insideGeofence: status }),
  setLocation: (location) => set({ location }),
}))

/**
 * Admin Store - Manages admin dashboard data
 */
export const useAdminStore = create((set) => ({
  workers: [],
  tasks: [],
  attendance: [],
  stats: null,
  filters: {
    status: 'all',
    dateRange: 'week',
    searchTerm: '',
  },

  setWorkers: (workers) => set({ workers }),
  setTasks: (tasks) => set({ tasks }),
  setAttendance: (attendance) => set({ attendance }),
  setStats: (stats) => set({ stats }),
  setFilters: (filters) => set((state) => ({ filters: { ...state.filters, ...filters } })),
}))
