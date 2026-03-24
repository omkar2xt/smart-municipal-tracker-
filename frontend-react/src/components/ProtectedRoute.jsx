import { Navigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'

/**
 * Protected Route Component
 * Redirects unauthenticated users to login
 * Verifies user role matches required role
 */
export const ProtectedRoute = ({ children, requiredRole = null }) => {
  const { token, role } = useAuthStore()

  if (!token) {
    return <Navigate to="/login" replace />
  }

  if (requiredRole && role !== requiredRole) {
    return <Navigate to={`/${role}/dashboard`} replace />
  }

  return children
}

export default ProtectedRoute
