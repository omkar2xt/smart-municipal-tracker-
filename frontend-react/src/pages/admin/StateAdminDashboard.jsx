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
import { stateAdminAPI } from '../services/api'
import {
  BarChart3,
  TrendingUp,
  Users,
  CheckSquare,
  Clock,
  AlertCircle,
} from 'lucide-react'

/**
 * State Admin Dashboard
 * - Full analytics across all districts
 * - District comparison
 * - Performance trends
 * - System-wide alerts
 */
export const StateAdminDashboard = () => {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [stats, setStats] = useState(null)
  const [districts, setDistricts] = useState([])
  const [alerts, setAlerts] = useState([])
  const [trends, setTrends] = useState(null)
  const [selectedMetric, setSelectedMetric] = useState('completion')

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      setLoading(true)

      // Load state stats
      const statsRes = await stateAdminAPI.getStateStats()
      setStats(statsRes.data)

      // Load district comparison
      const districtsRes = await stateAdminAPI.getDistrictComparison()
      setDistricts(districtsRes.data.districts || [])

      // Load alerts
      const alertsRes = await stateAdminAPI.getStateAlerts()
      setAlerts(alertsRes.data.alerts || [])

      // Load trends
      const trendsRes = await stateAdminAPI.getPerformanceTrends(30)
      setTrends(trendsRes.data)
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
        title="State Admin Dashboard"
        subtitle="System-wide analytics and performance"
      >
        <LoadingSpinner fullScreen />
      </MainLayout>
    )
  }

  const districtColumns = [
    { key: 'name', label: 'District' },
    {
      key: 'workers',
      label: 'Workers',
      render: (val) => val || 0,
    },
    {
      key: 'completion',
      label: 'Completion Rate',
      render: (val) => `${val || 0}%`,
    },
    {
      key: 'attendance',
      label: 'Attendance',
      render: (val) => `${val || 0}%`,
    },
    {
      key: 'score',
      label: 'Performance',
      render: (val) => `${val || 0}/100`,
    },
  ]

  return (
    <MainLayout
      title="State Admin Dashboard"
      subtitle="Comprehensive state-wide analytics"
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

        {/* KPI Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <StatsCard
              title="Total Districts"
              value={stats.totalDistricts}
              icon={BarChart3}
              color="primary"
            />
            <StatsCard
              title="Active Workers"
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
              title="Avg Completion"
              value={`${stats.avgCompletion}%`}
              icon={TrendingUp}
              color="primary"
            />
            <StatsCard
              title="Avg Attendance"
              value={`${stats.avgAttendance}%`}
              icon={Clock}
              color="success"
            />
          </div>
        )}

        {/* Performance Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Completion Trend */}
          <Card className="p-6">
            <h3 className="text-lg font-bold mb-4">Task Completion Trend</h3>
            {trends?.completionRate ? (
              <div className="space-y-3">
                {trends.completionRate.map((item, idx) => (
                  <div key={idx}>
                    <div className="flex justify-between text-sm mb-1">
                      <span>{item.date}</span>
                      <span className="font-semibold">{item.value}%</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div
                        className="bg-primary-600 h-full rounded-full transition-all"
                        style={{ width: `${item.value}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-600 dark:text-gray-400">
                No trend data available
              </p>
            )}
          </Card>

          {/* Attendance Trend */}
          <Card className="p-6">
            <h3 className="text-lg font-bold mb-4">Attendance Trend</h3>
            {trends?.attendance ? (
              <div className="space-y-3">
                {trends.attendance.map((item, idx) => (
                  <div key={idx}>
                    <div className="flex justify-between text-sm mb-1">
                      <span>{item.date}</span>
                      <span className="font-semibold">{item.value}%</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div
                        className="bg-success h-full rounded-full transition-all"
                        style={{ width: `${item.value}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-600 dark:text-gray-400">
                No trend data available
              </p>
            )}
          </Card>
        </div>

        {/* District Comparison */}
        <Card className="p-6">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
            <BarChart3 size={28} className="text-primary-600" />
            District Comparison
          </h2>

          {districts.length === 0 ? (
            <EmptyState
              icon={BarChart3}
              title="No district data"
              description="Data will appear as tasks are completed."
            />
          ) : (
            <>
              <div className="overflow-x-auto">
                <DataTable
                  columns={districtColumns}
                  data={districts}
                  pagination
                  pageSize={10}
                  onRowClick={(row) =>
                    (window.location.href = `/state/district/${row.id}`)
                  }
                />
              </div>
            </>
          )}
        </Card>

        {/* Performance Ranking */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Performing Districts */}
          <Card className="p-6">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <TrendingUp size={20} className="text-success" />
              Top Performers
            </h3>
            {districts.length === 0 ? (
              <p className="text-gray-600 dark:text-gray-400">
                No data available
              </p>
            ) : (
              <div className="space-y-3">
                {districts
                  .sort((a, b) => (b.score || 0) - (a.score || 0))
                  .slice(0, 5)
                  .map((district, idx) => (
                    <div
                      key={idx}
                      className="flex justify-between items-center p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:shadow-md transition-shadow cursor-pointer"
                      onClick={() =>
                        (window.location.href = `/state/district/${district.id}`)
                      }
                    >
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-lg text-primary-600">
                          #{idx + 1}
                        </span>
                        <span className="font-semibold">{district.name}</span>
                      </div>
                      <span className="bg-success bg-opacity-10 text-success px-3 py-1 rounded-full text-sm font-semibold">
                        {district.score}/100
                      </span>
                    </div>
                  ))}
              </div>
            )}
          </Card>

          {/* Alerts & Issues */}
          <Card className="p-6">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <AlertCircle size={20} className="text-danger" />
              Critical Alerts
            </h3>
            {alerts.length === 0 ? (
              <p className="text-gray-600 dark:text-gray-400">
                ✓ No critical issues
              </p>
            ) : (
              <div className="space-y-3">
                {alerts.slice(0, 5).map((alert) => (
                  <div
                    key={alert.id}
                    className="p-3 border-l-4 border-danger bg-danger bg-opacity-5 rounded-lg hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() =>
                      (window.location.href = `/state/alerts/${alert.id}`)
                    }
                  >
                    <p className="font-semibold text-gray-900 dark:text-white text-sm">
                      {alert.title}
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                      {alert.description}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Button
            variant="primary"
            size="lg"
            fullWidth
            onClick={() => (window.location.href = '/state/reports')}
          >
            Download Report
          </Button>
          <Button
            variant="secondary"
            size="lg"
            fullWidth
            onClick={() => (window.location.href = '/state/analytics')}
          >
            View Analytics
          </Button>
          <Button
            variant="secondary"
            size="lg"
            fullWidth
            onClick={() => (window.location.href = '/state/settings')}
          >
            Settings
          </Button>
        </div>
      </div>
    </MainLayout>
  )
}

export default StateAdminDashboard
