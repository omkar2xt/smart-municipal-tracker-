import { useState, useEffect } from 'react'
import { MainLayout } from '../components/MainLayout'
import {
  Card,
  Button,
  LoadingSpinner,
  Alert,
  EmptyState,
} from '../components'
import { StatsCard, ProgressCard } from '../components/Cards'
import { DataTable } from '../components/DataTable'
import { districtAdminAPI } from '../services/api'
import { useAuthStore } from '../store/authStore'
import {
  BarChart3,
  AlertTriangle,
  TrendingUp,
  Users,
  CheckSquare,
  Clock,
} from 'lucide-react'

/**
 * District Admin Dashboard
 * - Monitor talukas
 * - Performance analysis
 * - Attendance tracking
 * - Alerts for missed tasks
 */
export const DistrictAdminDashboard = () => {
  const { user } = useAuthStore()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [stats, setStats] = useState(null)
  const [talukasData, setTalukasData] = useState([])
  const [alerts, setAlerts] = useState([])
  const [selectedPeriod, setSelectedPeriod] = useState('week')

  useEffect(() => {
    loadDashboardData()
  }, [selectedPeriod])

  const loadDashboardData = async () => {
    try {
      setLoading(true)

      // Load district stats
      const statsRes = await districtAdminAPI.getDistrictStats(
        user?.districtId
      )
      setStats(statsRes.data)

      // Load taluka performance
      const talukaRes = await districtAdminAPI.getTalukaPerformance(
        user?.districtId
      )
      setTalukasData(talukaRes.data.talukas || [])

      // Load alerts
      const alertsRes = await districtAdminAPI.getAlerts(user?.districtId)
      setAlerts(alertsRes.data.alerts || [])
    } catch (err) {
      setError('Failed to load dashboard data')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <MainLayout
        title="District Admin Dashboard"
        subtitle="Monitor talukas and worker performance"
      >
        <LoadingSpinner fullScreen />
      </MainLayout>
    )
  }

  const talukaColumns = [
    { key: 'name', label: 'Taluka' },
    { key: 'workers', label: 'Workers' },
    {
      key: 'taskCompletion',
      label: 'Task Completion',
      render: (val) => `${val}%`,
    },
    {
      key: 'attendance',
      label: 'Attendance Rate',
      render: (val) => `${val}%`,
    },
  ]

  return (
    <MainLayout
      title="District Admin Dashboard"
      subtitle="Monitor talukas and worker performance"
    >
      <div className="space-y-6">
        {/* Error Alert */}
        {error && (
          <Alert
            type="error"
            message={error}
            onClose={() => setError('')}
          />
        )}

        {/* Period Selector */}
        <div className="flex gap-2">
          {['day', 'week', 'month'].map((period) => (
            <Button
              key={period}
              variant={selectedPeriod === period ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => setSelectedPeriod(period)}
            >
              {period.charAt(0).toUpperCase() + period.slice(1)}
            </Button>
          ))}
        </div>

        {/* KPI Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatsCard
              title="Total Workers"
              value={stats.totalWorkers}
              icon={Users}
              color="primary"
              trend={stats.workersTrend}
            />
            <StatsCard
              title="Tasks Completed"
              value={stats.tasksCompleted}
              icon={CheckSquare}
              color="success"
              trend={stats.tasksTrend}
            />
            <StatsCard
              title="Avg Attendance"
              value={`${stats.avgAttendance}%`}
              icon={Clock}
              color="primary"
            />
            <StatsCard
              title="Performance Score"
              value={stats.performanceScore}
              icon={TrendingUp}
              color="warning"
              trend={stats.scoreTrend}
            />
          </div>
        )}

        {/* Taluka Performance Section */}
        <Card className="p-6">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
            <BarChart3 size={28} className="text-primary-600" />
            Taluka Performance
          </h2>

          {talukasData.length === 0 ? (
            <EmptyState
              icon={BarChart3}
              title="No taluka data"
              description="Performance data will appear as workers complete tasks."
            />
          ) : (
            <div className="space-y-4">
              {talukasData.map((taluka) => (
                <div
                  key={taluka.id}
                  className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() =>
                    (window.location.href = `/district/taluka/${taluka.id}`)
                  }
                >
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {taluka.name}
                    </h3>
                    <span className="text-sm font-semibold text-gray-600 dark:text-gray-400">
                      {taluka.workers} workers
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <ProgressCard
                      title="Task Completion"
                      current={taluka.completedTasks}
                      total={taluka.totalTasks}
                      color="primary"
                    />
                    <ProgressCard
                      title="Attendance"
                      current={taluka.attendance}
                      total={100}
                      color="success"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Alerts Section */}
        <Card className="p-6">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
            <AlertTriangle size={28} className="text-danger" />
            Alerts & Issues
          </h2>

          {alerts.length === 0 ? (
            <EmptyState
              icon={CheckSquare}
              title="No active alerts"
              description="Everything is running smoothly!"
            />
          ) : (
            <div className="space-y-3">
              {alerts.map((alert) => (
                <div
                  key={alert.id}
                  className="p-4 border-l-4 border-danger bg-danger bg-opacity-5 rounded-lg"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-white">
                        {alert.title}
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        {alert.description}
                      </p>
                    </div>
                    <span className="text-xs text-gray-500">
                      {new Date(alert.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Detailed Taluka Table */}
        <Card className="p-6">
          <h2 className="text-2xl font-bold mb-6">Detailed Performance</h2>
          <DataTable
            columns={talukaColumns}
            data={talukasData}
            pagination
            pageSize={5}
            onRowClick={(row) =>
              (window.location.href = `/district/taluka/${row.id}`)
            }
          />
        </Card>

        {/* Reports Button */}
        <div className="flex gap-4">
          <Button
            variant="primary"
            size="lg"
            fullWidth
            onClick={() => (window.location.href = '/district/reports')}
          >
            Download Reports
          </Button>
          <Button
            variant="secondary"
            size="lg"
            fullWidth
            onClick={() => (window.location.href = '/district/analytics')}
          >
            View Analytics
          </Button>
        </div>
      </div>
    </MainLayout>
  )
}

export default DistrictAdminDashboard
