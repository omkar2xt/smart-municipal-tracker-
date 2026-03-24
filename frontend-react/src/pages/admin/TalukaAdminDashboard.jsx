import { useState, useEffect } from 'react'
import { MainLayout } from '../components/MainLayout'
import {
  Card,
  Button,
  LoadingSpinner,
  Alert,
  Modal,
  Input,
  Textarea,
} from '../components'
import { TaskCard, WorkerCard, StatsCard } from '../components/Cards'
import { DataTable, FilterBar } from '../components/DataTable'
import { talukaAdminAPI } from '../services/api'
import { useAuthStore } from '../store/authStore'
import { useAdminStore } from '../store/authStore'
import { Users, CheckSquare, Clock, TrendingUp } from 'lucide-react'

/**
 * Taluka Admin Dashboard
 * - Workers management
 * - Task assignment
 * - Attendance tracking
 * - Task completion tracking
 */
export const TalukaAdminDashboard = () => {
  const { user, role } = useAuthStore()
  const { workers, tasks, filters, setWorkers, setTasks, setFilters } =
    useAdminStore()

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [stats, setStats] = useState(null)
  const [showTaskModal, setShowTaskModal] = useState(false)
  const [selectedWorker, setSelectedWorker] = useState(null)
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    location: '',
    dueDate: '',
  })

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      setLoading(true)

      // Load workers
      const workersRes = await talukaAdminAPI.getWorkersUnderTaluka(
        user?.talukaId
      )
      setWorkers(workersRes.data.workers || [])

      // Load tasks
      const tasksRes = await talukaAdminAPI.getTalukaTasks(user?.talukaId)
      setTasks(tasksRes.data.tasks || [])

      // Load stats
      const statsRes = await talukaAdminAPI.getTalukaStats(user?.talukaId)
      setStats(statsRes.data)
    } catch (err) {
      setError('Failed to load dashboard data')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleAssignTask = async () => {
    if (!selectedWorker || !newTask.title) {
      setError('Please fill all required fields')
      return
    }

    try {
      await talukaAdminAPI.assignTaskToWorker(selectedWorker.id, newTask)
      setSuccess('Task assigned successfully!')
      setShowTaskModal(false)
      setNewTask({ title: '', description: '', location: '', dueDate: '' })
      setSelectedWorker(null)
      loadDashboardData()
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to assign task')
    }
  }

  const handleFilterChange = (key, value) => {
    setFilters({ [key]: value })
  }

  const handleReset = () => {
    setFilters({ status: 'all', dateRange: 'week', searchTerm: '' })
  }

  if (loading) {
    return (
      <MainLayout title="Taluka Admin Dashboard" subtitle="Manage workers and tasks">
        <LoadingSpinner fullScreen />
      </MainLayout>
    )
  }

  // Filter tasks and workers
  const filteredTasks = tasks.filter(
    (t) =>
      (filters.status === 'all' || t.status === filters.status) &&
      (t.title.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
        t.assignedTo?.toLowerCase().includes(filters.searchTerm.toLowerCase()))
  )

  const filteredWorkers = workers.filter((w) =>
    w.name.toLowerCase().includes(filters.searchTerm.toLowerCase())
  )

  return (
    <MainLayout title="Taluka Admin Dashboard" subtitle="Manage workers and tasks">
      <div className="space-y-6">
        {/* Error & Success Alerts */}
        {error && (
          <Alert
            type="error"
            message={error}
            onClose={() => setError('')}
          />
        )}
        {success && (
          <Alert
            type="success"
            message={success}
            onClose={() => setSuccess('')}
          />
        )}

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatsCard
              title="Active Workers"
              value={stats.activeWorkers}
              icon={Users}
              color="primary"
            />
            <StatsCard
              title="Pending Tasks"
              value={stats.pendingTasks}
              icon={CheckSquare}
              color="warning"
            />
            <StatsCard
              title="Completed Today"
              value={stats.completedToday}
              icon={Clock}
              color="success"
            />
            <StatsCard
              title="Attendance Rate"
              value={`${stats.attendanceRate}%`}
              icon={TrendingUp}
              color="primary"
            />
          </div>
        )}

        {/* Filters */}
        <FilterBar
          filters={filters}
          onFilterChange={handleFilterChange}
          onReset={handleReset}
        />

        {/* Workers Section */}
        <Card className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <Users size={28} className="text-primary-600" />
              Workers ({filteredWorkers.length})
            </h2>
            <Button
              variant="primary"
              size="sm"
              onClick={() => window.location.href = '/taluka/workers/new'}
            >
              Add Worker
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredWorkers.length === 0 ? (
              <div className="col-span-full text-center py-8">
                <p className="text-gray-600 dark:text-gray-400">
                  No workers found
                </p>
              </div>
            ) : (
              filteredWorkers.map((worker) => (
                <WorkerCard
                  key={worker.id}
                  worker={worker}
                  onAction={() =>
                    window.location.href = `/taluka/workers/${worker.id}`
                  }
                  actionLabel="Assign Task"
                />
              ))
            )}
          </div>
        </Card>

        {/* Tasks Section */}
        <Card className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <CheckSquare size={28} className="text-primary-600" />
              Tasks ({filteredTasks.length})
            </h2>
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                if (filteredWorkers.length > 0) {
                  setSelectedWorker(filteredWorkers[0])
                  setShowTaskModal(true)
                } else {
                  setError('No workers available. Please add workers first.')
                }
              }}
            >
              Assign New Task
            </Button>
          </div>

          <div className="space-y-4">
            {filteredTasks.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-600 dark:text-gray-400">
                  No tasks found
                </p>
              </div>
            ) : (
              filteredTasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onAction={() =>
                    window.location.href = `/taluka/tasks/${task.id}`
                  }
                  actionLabel="View Details"
                />
              ))
            )}
          </div>
        </Card>

        {/* Task Assignment Modal */}
        <Modal
          isOpen={showTaskModal}
          onClose={() => setShowTaskModal(false)}
          title="Assign New Task"
          actions={
            <>
              <Button
                variant="secondary"
                onClick={() => setShowTaskModal(false)}
              >
                Cancel
              </Button>
              <Button variant="primary" onClick={handleAssignTask}>
                Assign Task
              </Button>
            </>
          }
        >
          <div className="space-y-4">
            {/* Worker Selection */}
            <div>
              <label className="block text-sm font-semibold mb-2">
                Select Worker
              </label>
              <select
                value={selectedWorker?.id || ''}
                onChange={(e) => {
                  const worker = workers.find((w) => w.id === e.target.value)
                  setSelectedWorker(worker)
                }}
                className="input-field"
              >
                <option value="">-- Select a worker --</option>
                {workers.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Task Details */}
            <Input
              label="Task Title"
              value={newTask.title}
              onChange={(e) =>
                setNewTask({ ...newTask, title: e.target.value })
              }
              placeholder="e.g., Water Supply Installation"
              required
            />

            <Textarea
              label="Description"
              value={newTask.description}
              onChange={(e) =>
                setNewTask({ ...newTask, description: e.target.value })
              }
              placeholder="Task details..."
            />

            <Input
              label="Location"
              value={newTask.location}
              onChange={(e) =>
                setNewTask({ ...newTask, location: e.target.value })
              }
              placeholder="Task location"
            />

            <Input
              label="Due Date"
              type="date"
              value={newTask.dueDate}
              onChange={(e) =>
                setNewTask({ ...newTask, dueDate: e.target.value })
              }
            />
          </div>
        </Modal>
      </div>
    </MainLayout>
  )
}

export default TalukaAdminDashboard
