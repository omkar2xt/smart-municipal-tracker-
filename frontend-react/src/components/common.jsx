/**
 * Reusable Card Component
 */
export const Card = ({ children, className = '', ...props }) => (
  <div className={`card ${className}`} {...props}>
    {children}
  </div>
)

/**
 * Status Badge Component
 * - Completed (green)
 * - Pending (yellow)
 * - In Progress (blue)
 * - Failed (red)
 */
export const StatusBadge = ({ status, size = 'md' }) => {
  const statusColors = {
    completed: 'badge-success',
    pending: 'badge-warning',
    'in-progress': 'badge-primary',
    'in progress': 'badge-primary',
    failed: 'badge-danger',
    active: 'badge-success',
    inactive: 'badge-danger',
    'on-time': 'badge-success',
    late: 'badge-danger',
  }

  const sizeClasses = {
    sm: 'text-xs px-2 py-1',
    md: 'text-sm px-3 py-1',
    lg: 'text-base px-4 py-2',
  }

  return (
    <span className={`badge ${statusColors[status?.toLowerCase()] || 'badge-primary'} ${sizeClasses[size]}`}>
      {status}
    </span>
  )
}

/**
 * Loading Spinner Component
 */
export const LoadingSpinner = ({ size = 'md', fullScreen = false }) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  }

  const spinner = (
    <div className={`${sizeClasses[size]} border-4 border-gray-300 dark:border-gray-600 border-t-primary-600 rounded-full animate-spin`} />
  )

  if (fullScreen) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-white dark:bg-gray-900 bg-opacity-50 dark:bg-opacity-80 z-50">
        {spinner}
      </div>
    )
  }

  return <div className="flex justify-center">{spinner}</div>
}

/**
 * Alert / Toast Notification Component
 */
export const Alert = ({ type = 'info', message, onClose, autoClose = 5000 }) => {
  const typeStyles = {
    success: 'bg-success bg-opacity-10 border-success text-success',
    error: 'bg-danger bg-opacity-10 border-danger text-danger',
    warning: 'bg-warning bg-opacity-10 border-warning text-warning',
    info: 'bg-primary-600 bg-opacity-10 border-primary-600 text-primary-600',
  }

  React.useEffect(() => {
    if (autoClose) {
      const timer = setTimeout(onClose, autoClose)
      return () => clearTimeout(timer)
    }
  }, [autoClose, onClose])

  return (
    <div className={`border-l-4 p-4 rounded-lg flex justify-between items-center ${typeStyles[type]}`}>
      <span>{message}</span>
      <button
        onClick={onClose}
        className="text-sm font-semibold hover:opacity-75"
      >
        ✕
      </button>
    </div>
  )
}

/**
 * Input Component
 */
export const Input = ({
  label,
  error,
  required = false,
  ...props
}) => (
  <div className="w-full">
    {label && (
      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
        {label}
        {required && <span className="text-danger ml-1">*</span>}
      </label>
    )}
    <input
      className={`input-field ${error ? 'border-danger focus:ring-danger' : ''}`}
      {...props}
    />
    {error && (
      <p className="text-danger text-sm mt-1">{error}</p>
    )}
  </div>
)

/**
 * Select Component
 */
export const Select = ({
  label,
  options,
  error,
  required = false,
  ...props
}) => (
  <div className="w-full">
    {label && (
      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
        {label}
        {required && <span className="text-danger ml-1">*</span>}
      </label>
    )}
    <select
      className={`input-field ${error ? 'border-danger focus:ring-danger' : ''}`}
      {...props}
    >
      <option value="">-- Select {label?.toLowerCase()} --</option>
      {options?.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
    {error && (
      <p className="text-danger text-sm mt-1">{error}</p>
    )}
  </div>
)

/**
 * Textarea Component
 */
export const Textarea = ({
  label,
  error,
  required = false,
  ...props
}) => (
  <div className="w-full">
    {label && (
      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
        {label}
        {required && <span className="text-danger ml-1">*</span>}
      </label>
    )}
    <textarea
      className={`input-field resize-vertical min-h-[120px] ${error ? 'border-danger focus:ring-danger' : ''}`}
      {...props}
    />
    {error && (
      <p className="text-danger text-sm mt-1">{error}</p>
    )}
  </div>
)

/**
 * Button Component
 */
export const Button = ({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  disabled = false,
  loading = false,
  children,
  ...props
}) => {
  const variants = {
    primary: 'btn-primary',
    secondary: 'btn-secondary',
    danger: 'btn-danger',
    success: 'btn-success',
  }

  const sizes = {
    sm: 'px-3 py-2 text-sm',
    md: 'px-6 py-3 text-base',
    lg: 'px-8 py-4 text-lg',
  }

  return (
    <button
      className={`
        ${variants[variant]}
        ${sizes[size]}
        ${fullWidth ? 'w-full' : ''}
        ${loading ? 'opacity-70 cursor-not-allowed' : ''}
        rounded-lg font-semibold transition-colors
      `}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <span className="flex items-center justify-center gap-2">
          <LoadingSpinner size="sm" /> Processing...
        </span>
      ) : (
        children
      )}
    </button>
  )
}

/**
 * Modal / Dialog Component
 */
export const Modal = ({ isOpen, onClose, title, children, actions }) => {
  if (!isOpen) return null

  return (
    <>
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-40"
        onClick={onClose}
      />
      <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
        <Card className="w-full max-w-lg">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              {title}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-400"
            >
              ✕
            </button>
          </div>

          <div className="mb-6">{children}</div>

          {actions && (
            <div className="flex gap-3 justify-end">{actions}</div>
          )}
        </Card>
      </div>
    </>
  )
}

/**
 * Empty State Component
 */
export const EmptyState = ({ icon: Icon, title, description, action }) => (
  <div className="flex flex-col items-center justify-center py-12 px-4">
    {Icon && <Icon size={48} className="text-gray-400 mb-4" />}
    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
      {title}
    </h3>
    {description && (
      <p className="text-gray-600 dark:text-gray-400 text-center mb-6">
        {description}
      </p>
    )}
    {action && <>{action}</>}
  </div>
)

// Import React if needed
import React from 'react'
export default {
  Card,
  StatusBadge,
  LoadingSpinner,
  Alert,
  Input,
  Select,
  Textarea,
  Button,
  Modal,
  EmptyState,
}
