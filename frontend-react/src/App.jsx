import { useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './store/authStore'
import { ProtectedRoute } from './components/ProtectedRoute'

// Pages
import LoginPage from './pages/LoginPage'
import NotFoundPage from './pages/NotFoundPage'
import WorkerDashboard from './pages/worker/WorkerDashboard'
import TaskCompletionPage from './pages/worker/TaskCompletionPage'
import TalukaAdminDashboard from './pages/admin/TalukaAdminDashboard'
import DistrictAdminDashboard from './pages/admin/DistrictAdminDashboard'
import StateAdminDashboard from './pages/admin/StateAdminDashboard'

/**
 * Main App Component
 * - Sets up routing for all pages
 * - Initializes authentication
 * - Manages dark mode globally
 * - Handles theme based on system preferences
 */
function App() {
  const { initializeAuth, isDarkMode } = useAuthStore()

  // Initialize authentication on app load
  useEffect(() => {
    initializeAuth()
  }, [initializeAuth])

  // Apply dark mode class to root element
  useEffect(() => {
    const htmlElement = document.documentElement
    if (isDarkMode) {
      htmlElement.classList.add('dark')
    } else {
      htmlElement.classList.remove('dark')
    }
  }, [isDarkMode])

  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<LoginPage />} />

        {/* Worker Routes */}
        <Route
          path="/worker/dashboard"
          element={
            <ProtectedRoute requiredRole="worker">
              <WorkerDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/worker/tasks/:taskId/complete"
          element={
            <ProtectedRoute requiredRole="worker">
              <TaskCompletionPage />
            </ProtectedRoute>
          }
        />
        
        {/* Placeholder routes for worker pages that can be implemented later */}
        <Route
          path="/worker/tasks"
          element={
            <ProtectedRoute requiredRole="worker">
              <WorkerDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/worker/location"
          element={
            <ProtectedRoute requiredRole="worker">
              <WorkerDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/worker/attendance"
          element={
            <ProtectedRoute requiredRole="worker">
              <WorkerDashboard />
            </ProtectedRoute>
          }
        />

        {/* Taluka Admin Routes */}
        <Route
          path="/taluka/dashboard"
          element={
            <ProtectedRoute requiredRole="taluka">
              <TalukaAdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/taluka/workers"
          element={
            <ProtectedRoute requiredRole="taluka">
              <TalukaAdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/taluka/tasks"
          element={
            <ProtectedRoute requiredRole="taluka">
              <TalukaAdminDashboard />
            </ProtectedRoute>
          }
        />

        {/* District Admin Routes */}
        <Route
          path="/district/dashboard"
          element={
            <ProtectedRoute requiredRole="district">
              <DistrictAdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/district/talukas"
          element={
            <ProtectedRoute requiredRole="district">
              <DistrictAdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/district/performance"
          element={
            <ProtectedRoute requiredRole="district">
              <DistrictAdminDashboard />
            </ProtectedRoute>
          }
        />

        {/* State Admin Routes */}
        <Route
          path="/state/dashboard"
          element={
            <ProtectedRoute requiredRole="state">
              <StateAdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/state/districts"
          element={
            <ProtectedRoute requiredRole="state">
              <StateAdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/state/analytics"
          element={
            <ProtectedRoute requiredRole="state">
              <StateAdminDashboard />
            </ProtectedRoute>
          }
        />

        {/* Redirect root to login or dashboard based on auth status */}
        <Route path="/" element={<Navigate to="/login" replace />} />

        {/* 404 Page */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Router>
  )
}

export default App
