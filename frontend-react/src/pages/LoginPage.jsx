import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { authAPI } from '../services/api'
import {
  Input,
  Button,
  LoadingSpinner,
  Alert,
  Select,
  Card,
} from '../components/common'
import { Eye, EyeOff, MapPin } from 'lucide-react'

/**
 * Login Page
 * - Clean login form
 * - Role selection
 * - Mobile-friendly design
 * - Error handling
 */
export const LoginPage = () => {
  const navigate = useNavigate()
  const { setUser, setToken, setRole } = useAuthStore()

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    role: 'worker',
  })

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  const roles = [
    { label: 'Worker', value: 'worker' },
    { label: 'Taluka Admin', value: 'taluka' },
    { label: 'District Admin', value: 'district' },
    { label: 'State Admin', value: 'state' },
  ]

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      // Call login API
      const response = await authAPI.login(formData.email, formData.password)
      
      const { token, user, role } = response.data

      // Store auth data
      setToken(token)
      setUser(user)
      setRole(role || formData.role)

      // Navigate to appropriate dashboard
      navigate(`/${role || formData.role}/dashboard`)
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please try again.')
      console.error('Login error:', err)
    } finally {
      setLoading(false)
    }
  }

  // Demo login handler (for testing)
  const handleDemoLogin = (role) => {
    setFormData((prev) => ({
      ...prev,
      email: `demo-${role}@geosentinel.local`,
      password: 'demo123',
      role: role,
    }))
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-600 via-primary-700 to-primary-900 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Decoration with Enhanced Animation */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-0 w-96 h-96 bg-primary-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse" style={{animationDuration: '4s'}}></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-primary-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse" style={{animationDuration: '6s'}}></div>
        <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-primary-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-pulse" style={{animationDuration: '5s'}}></div>
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Logo Section */}
        <div className="text-center mb-8 animate-fadeInDown">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-2xl transform hover:scale-110 transition-transform duration-300">
              <MapPin size={32} className="text-primary-600" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-white mb-2 drop-shadow-lg">GeoSentinel OS</h1>
          <p className="text-primary-100">Field Worker Tracking & Management</p>
        </div>

        {/* Login Card */}
        <Card className="p-8 shadow-2xl">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
            Welcome Back
          </h2>

          {error && (
            <Alert
              type="error"
              message={error}
              onClose={() => setError('')}
              autoClose={5000}
            />
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email Input */}
            <Input
              label="Email Address"
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="your@email.com"
              required
              disabled={loading}
            />

            {/* Password Input */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  required
                  disabled={loading}
                  className="input-field pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            {/* Role Selection */}
            <Select
              label="Select Your Role"
              name="role"
              value={formData.role}
              onChange={handleChange}
              options={roles}
              required
              disabled={loading}
            />

            {/* Submit Button */}
            <Button
              type="submit"
              variant="primary"
              fullWidth
              loading={loading}
              disabled={loading || !formData.email || !formData.password}
              className="mt-2"
            >
              Sign In
            </Button>
          </form>

          {/* Demo Credentials */}
          <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              👤 Demo Credentials (for testing)
            </p>
            <div className="grid grid-cols-2 gap-2">
              {roles.map((role) => (
                <button
                  key={role.value}
                  type="button"
                  onClick={() => handleDemoLogin(role.value)}
                  disabled={loading}
                  className="btn-secondary text-xs py-2"
                >
                  Test {role.label}
                </button>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="mt-6 text-center">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              © 2024 GeoSentinel OS. All rights reserved.
            </p>
          </div>
        </Card>

        {/* Feature Highlights */}
        <div className="mt-8 grid grid-cols-3 gap-4 text-center text-white">
          <div>
            <div className="text-2xl mb-2">📍</div>
            <p className="text-sm">Real-time Tracking</p>
          </div>
          <div>
            <div className="text-2xl mb-2">✓</div>
            <p className="text-sm">Task Management</p>
          </div>
          <div>
            <div className="text-2xl mb-2">📊</div>
            <p className="text-sm">Analytics</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default LoginPage
