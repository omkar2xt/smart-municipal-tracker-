import { Card, StatusBadge, Button } from './common'
import { MapPin, Clock, User, CheckCircle, AlertCircle } from 'lucide-react'

/**
 * Task Card Component
 * Used in worker and admin dashboards
 */
export const TaskCard = ({ task, onAction, actionLabel = 'View', showStatus = true }) => (
  <Card className="p-4 sm:p-6 hover:shadow-lg transition-all cursor-pointer">
    <div className="flex justify-between items-start mb-3">
      <h3 className="font-semibold text-gray-900 dark:text-white text-sm sm:text-base line-clamp-2">
        {task.title}
      </h3>
      {showStatus && <StatusBadge status={task.status} size="sm" />}
    </div>

    {task.description && (
      <p className="text-gray-600 dark:text-gray-400 text-sm mb-3 line-clamp-2">
        {task.description}
      </p>
    )}

    <div className="space-y-2 text-sm mb-4">
      {task.assignedTo && (
        <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
          <User size={16} />
          <span>{task.assignedTo}</span>
        </div>
      )}

      {task.dueDate && (
        <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
          <Clock size={16} />
          <span>{new Date(task.dueDate).toLocaleDateString()}</span>
        </div>
      )}

      {task.location && (
        <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
          <MapPin size={16} />
          <span>{task.location}</span>
        </div>
      )}
    </div>

    {onAction && (
      <Button
        variant="primary"
        size="sm"
        fullWidth
        onClick={onAction}
      >
        {actionLabel}
      </Button>
    )}
  </Card>
)

/**
 * Worker Card Component
 * Shows worker info and status
 */
export const WorkerCard = ({ worker, onAction, actionLabel = 'View Details' }) => (
  <Card className="p-4 sm:p-6">
    <div className="mb-4">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-12 h-12 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
          {worker.name?.charAt(0) || 'W'}
        </div>
        <div>
          <h3 className="font-semibold text-gray-900 dark:text-white">
            {worker.name}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            ID: {worker.id}
          </p>
        </div>
      </div>

      <StatusBadge
        status={worker.status || 'active'}
        size="sm"
      />
    </div>

    {worker.phone && (
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
        📱 {worker.phone}
      </p>
    )}

    {worker.location && (
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
        📍 {worker.location}
      </p>
    )}

    {worker.tasksCompleted !== undefined && (
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
        ✓ {worker.tasksCompleted} tasks completed
      </p>
    )}

    {onAction && (
      <Button variant="primary" size="sm" fullWidth onClick={onAction}>
        {actionLabel}
      </Button>
    )}
  </Card>
)

/**
 * Stats Card Component
 * For KPI displays
 */
export const StatsCard = ({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  color = 'primary',
  onClick,
}) => {
  const colorClasses = {
    primary: 'bg-primary-50 dark:bg-primary-900 text-primary-600',
    success: 'bg-success bg-opacity-10 text-success',
    danger: 'bg-danger bg-opacity-10 text-danger',
    warning: 'bg-warning bg-opacity-10 text-warning',
  }

  return (
    <Card
      className={`p-6 cursor-pointer transition-transform hover:scale-105 ${onClick ? 'hover:shadow-lg' : ''}`}
      onClick={onClick}
    >
      <div className="flex justify-between items-start mb-4">
        {Icon && (
          <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${colorClasses[color]}`}>
            <Icon size={24} />
          </div>
        )}
        {trend && (
          <span className={`text-sm font-semibold ${trend.direction === 'up' ? 'text-success' : 'text-danger'}`}>
            {trend.direction === 'up' ? '↑' : '↓'} {trend.value}%
          </span>
        )}
      </div>

      <h3 className="text-gray-600 dark:text-gray-400 text-sm font-medium mb-1">
        {title}
      </h3>
      <p className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
        {value}
      </p>
      {subtitle && (
        <p className="text-xs text-gray-500 dark:text-gray-400">
          {subtitle}
        </p>
      )}
    </Card>
  )
}

/**
 * Attendance Status Card
 * Shows current attendance state
 */
export const AttendanceStatusCard = ({ checked = false, timestamp, onAction }) => (
  <Card className="p-6 text-center">
    <div className="mb-4 flex justify-center">
      {checked ? (
        <CheckCircle size={64} className="text-success" />
      ) : (
        <AlertCircle size={64} className="text-warning" />
      )}
    </div>
    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
      {checked ? 'Attendance Marked' : 'Attendance Pending'}
    </h3>
    {timestamp && (
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
        {new Date(timestamp).toLocaleString()}
      </p>
    )}
    {onAction && (
      <Button
        variant={checked ? 'secondary' : 'primary'}
        fullWidth
        onClick={onAction}
      >
        {checked ? 'Mark as Left' : 'Mark Attendance'}
      </Button>
    )}
  </Card>
)

/**
 * Progress Card
 * Shows progress bar with percentage
 */
export const ProgressCard = ({
  title,
  current,
  total,
  color = 'primary',
  showPercentage = true,
}) => {
  const percentage = total > 0 ? (current / total) * 100 : 0

  const colorClasses = {
    primary: 'bg-primary-600',
    success: 'bg-success',
    warning: 'bg-warning',
    danger: 'bg-danger',
  }

  return (
    <Card className="p-6">
      <div className="flex justify-between items-center mb-3">
        <h3 className="font-semibold text-gray-900 dark:text-white text-sm">
          {title}
        </h3>
        {showPercentage && (
          <span className="text-lg font-bold text-gray-900 dark:text-white">
            {Math.round(percentage)}%
          </span>
        )}
      </div>

      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
        <div
          className={`h-full ${colorClasses[color]} transition-all duration-300`}
          style={{ width: `${percentage}%` }}
        ></div>
      </div>

      <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">
        {current} of {total}
      </p>
    </Card>
  )
}

export default {
  TaskCard,
  WorkerCard,
  StatsCard,
  AttendanceStatusCard,
  ProgressCard,
}
