import { useState, useEffect } from 'react'
import { MainLayout } from '../components/MainLayout'
import {
  Card,
  Button,
  StatusBadge,
  LoadingSpinner,
  Alert,
  EmptyState,
} from '../components'
import { TaskCard, AttendanceStatusCard } from '../components/Cards'
import { workerAPI } from '../services/api'
import { useWorkerStore } from '../store/authStore'
import {
  MapPin,
  CheckCircle,
  AlertCircle,
  Camera,
  Clock,
  Navigation,
} from 'lucide-react'

/**
 * Worker Dashboard
 * Mobile-first interface for field workers
 * - Mark Attendance (GPS)
 * - View Tasks
 * - Upload Work Proof
 * - Status indicator (inside/outside geofence)
 */
export const WorkerDashboard = () => {
  const [tasks, setTasks] = useState([])
  const [attendance, setAttendance] = useState(null)
  const [loading, setLoading] = useState(true)
  const [geofenceStatus, setGeofenceStatus] = useState(null)
  const [location, setLocation] = useState(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    loadDashboardData()
    startLocationTracking()
  }, [])

  const loadDashboardData = async () => {
    try {
      setLoading(true)

      // Load tasks
      const tasksRes = await workerAPI.getTasks()
      setTasks(tasksRes.data.tasks || [])

      // Load attendance status
      const attendanceRes = await workerAPI.getAttendanceStatus()
      setAttendance(attendanceRes.data)
    } catch (err) {
      setError('Failed to load dashboard data')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const startLocationTracking = () => {
    if (!navigator.geolocation) {
      setError('Geolocation not supported on this device')
      return
    }

    // Get location and check geofence
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords
        setLocation({ latitude, longitude })

        try {
          const response = await workerAPI.checkGeofence(latitude, longitude)
          setGeofenceStatus(response.data.insideGeofence)
        } catch (err) {
          console.error('Geofence check error:', err)
        }
      },
      (err) => {
        console.error('Location error:', err)
        setError('Enable location to continue')
      }
    )

    // Watch position for continuous updates
    const watchId = navigator.geolocation.watchPosition(
      async (position) => {
        const { latitude, longitude } = position.coords
        setLocation({ latitude, longitude })

        try {
          await workerAPI.logLocation({ latitude, longitude })
        } catch (err) {
          console.error('Location logging error:', err)
        }
      }
    )

    return () => navigator.geolocation.clearWatch(watchId)
  }

  const handleMarkAttendance = async () => {
    try {
      if (!location) {
        setError('Location not available. Please enable location services.')
        return
      }

      setLoading(true)
      const response = await workerAPI.markAttendance({
        latitude: location.latitude,
        longitude: location.longitude,
        timestamp: new Date().toISOString(),
      })

      setAttendance(response.data)
      setSuccess('Attendance marked successfully!')
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to mark attendance')
    } finally {
      setLoading(false)
    }
  }

  const handleCompleteTask = (taskId) => {
    // Navigate to task completion page
    window.location.href = `/worker/tasks/${taskId}/complete`
  }

  if (loading && !tasks.length) {
    return (
      <MainLayout title="Worker Dashboard" subtitle="Your daily tasks and attendance">
        <LoadingSpinner fullScreen />
      </MainLayout>
    )
  }

  // Calculate stats
  const completedTasks = tasks.filter((t) => t.status === 'completed').length
  const pendingTasks = tasks.filter((t) => t.status !== 'completed').length

  return (
    <MainLayout title="Worker Dashboard" subtitle="Your daily tasks and attendance">
      <div className="space-y-6">
        {/* Error Alert */}
        {error && (
          <Alert
            type="error"
            message={error}
            onClose={() => setError('')}
          />
        )}

        {/* Success Alert */}
        {success && (
          <Alert
            type="success"
            message={success}
            onClose={() => setSuccess('')}
          />
        )}

        {/* Attendance Status Banner */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Attendance Card */}
          <AttendanceStatusCard
            checked={!!attendance?.checkedIn}
            timestamp={attendance?.checkedInTime}
            onAction={handleMarkAttendance}
          />

          {/* Geofence Status Card */}
          <Card className="p-6">
            <div className="text-center">
              {geofenceStatus === null ? (
                <>
                  <AlertCircle size={64} className="text-warning mx-auto mb-4" />
                  <h3 className="text-xl font-bold mb-2">Getting Location...</h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    Enable location services to continue
                  </p>
                </>
              ) : geofenceStatus ? (
                <>
                  <CheckCircle size={64} className="text-success mx-auto mb-4" />
                  <h3 className="text-xl font-bold mb-2">Inside Work Area</h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    You're in the designated work zone
                  </p>
                </>
              ) : (
                <>
                  <AlertCircle size={64} className="text-danger mx-auto mb-4" />
                  <h3 className="text-xl font-bold mb-2">Outside Work Area</h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    Please move to the designated work zone
                  </p>
                </>
              )}

              {location && (
                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    📍 {location.latitude.toFixed(4)}, {location.longitude.toFixed(4)}
                  </p>
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <Card className="p-4 text-center">
            <p className="text-2xl font-bold text-primary-600">
              {completedTasks}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Completed
            </p>
          </Card>
          <Card className="p-4 text-center">
            <p className="text-2xl font-bold text-warning">
              {pendingTasks}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Pending
            </p>
          </Card>
          <Card className="p-4 text-center">
            <p className="text-2xl font-bold text-success">
              {tasks.length}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Total
            </p>
          </Card>
        </div>

        {/* My Tasks Section */}
        <Card className="p-6">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
            <Clock size={28} className="text-primary-600" />
            My Tasks
          </h2>

          {tasks.length === 0 ? (
            <EmptyState
              icon={CheckCircle}
              title="No tasks assigned"
              description="You'll see your tasks here when assigned."
            />
          ) : (
            <div className="space-y-4">
              {tasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onAction={() => handleCompleteTask(task.id)}
                  actionLabel={task.status === 'completed' ? 'View Details' : 'Complete Task'}
                />
              ))}
            </div>
          )}
        </Card>

        {/* Action Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sticky bottom-6">
          <Button
            variant="success"
            size="lg"
            fullWidth
            onClick={() => window.location.href = '/worker/location'}
            className="flex items-center justify-center gap-2"
          >
            <Navigation size={20} /> View Location
          </Button>
          <Button
            variant="primary"
            size="lg"
            fullWidth
            onClick={() => window.location.href = '/worker/settings'}
            className="flex items-center justify-center gap-2"
          >
            <Camera size={20} /> Upload Proof
          </Button>
        </div>
      </div>
    </MainLayout>
  )
}

export default WorkerDashboard
