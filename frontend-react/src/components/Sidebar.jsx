import { Link } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import {
  BarChart3,
  Users,
  CheckSquare,
  MapPin,
  Clock,
  AlertCircle,
  TrendingUp,
  Settings,
  X,
} from 'lucide-react'

/**
 * Sidebar Navigation Component
 * - Role-based menu items
 * - Collapsible on mobile
 * - Active link highlighting
 */
const getSidebarItems = (role) => {
  const commonItems = [
    { label: 'Dashboard', href: `/${role}/dashboard`, icon: BarChart3 },
  ]

  const roleItems = {
    worker: [
      { label: 'Mark Attendance', href: '/worker/attendance', icon: Clock },
      { label: 'My Tasks', href: '/worker/tasks', icon: CheckSquare },
      { label: 'Location', href: '/worker/location', icon: MapPin },
      { label: 'Settings', href: '/worker/settings', icon: Settings },
    ],
    taluka: [
      { label: 'Workers', href: '/taluka/workers', icon: Users },
      { label: 'Attendance', href: '/taluka/attendance', icon: Clock },
      { label: 'Tasks', href: '/taluka/tasks', icon: CheckSquare },
      { label: 'Analytics', href: '/taluka/analytics', icon: TrendingUp },
      { label: 'Alerts', href: '/taluka/alerts', icon: AlertCircle },
      { label: 'Settings', href: '/taluka/settings', icon: Settings },
    ],
    district: [
      { label: 'Talukas', href: '/district/talukas', icon: BarChart3 },
      { label: 'Performance', href: '/district/performance', icon: TrendingUp },
      { label: 'Attendance', href: '/district/attendance', icon: Clock },
      { label: 'Alerts', href: '/district/alerts', icon: AlertCircle },
      { label: 'Reports', href: '/district/reports', icon: BarChart3 },
      { label: 'Settings', href: '/district/settings', icon: Settings },
    ],
    state: [
      { label: 'Districts', href: '/state/districts', icon: BarChart3 },
      { label: 'Analytics', href: '/state/analytics', icon: TrendingUp },
      { label: 'Performance', href: '/state/performance', icon: BarChart3 },
      { label: 'Reports', href: '/state/reports', icon: BarChart3 },
      { label: 'Alerts', href: '/state/alerts', icon: AlertCircle },
      { label: 'Settings', href: '/state/settings', icon: Settings },
    ],
  }

  return [...commonItems, ...(roleItems[role] || roleItems.worker)]
}

export const Sidebar = ({ isOpen, onClose, isMobileView }) => {
  const { role } = useAuthStore()
  const items = getSidebarItems(role)

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Close button for mobile */}
      {isMobileView && (
        <button
          onClick={onClose}
          className="ml-auto p-2 mb-4 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
        >
          <X size={24} />
        </button>
      )}

      {/* Menu Items */}
      <nav className="flex-1 space-y-2 overflow-y-auto">
        {items.map((item) => {
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              to={item.href}
              onClick={() => isMobileView && onClose()}
              className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-primary-50 dark:hover:bg-primary-900 hover:text-primary-600 dark:hover:text-primary-400 transition-colors group"
            >
              <Icon
                size={20}
                className="group-hover:text-primary-600 dark:group-hover:text-primary-400"
              />
              <span className="font-medium">{item.label}</span>
            </Link>
          )
        })}
      </nav>

      {/* Footer Info */}
      <div className="border-t border-gray-200 dark:border-gray-700 pt-4 px-4">
        <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
          GeoSentinel OS v1.0
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-400 text-center mt-2">
          © 2024. All rights reserved.
        </p>
      </div>
    </div>
  )

  // Mobile drawer
  if (isMobileView) {
    return (
      <>
        {isOpen && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
            onClick={onClose}
          />
        )}
        <aside
          className={`fixed left-0 top-16 h-[calc(100vh-64px)] w-64 bg-white dark:bg-gray-800 shadow-lg z-40 transform transition-transform duration-300 ease-in-out ${
            isOpen ? 'translate-x-0' : '-translate-x-full'
          } lg:hidden`}
        >
          <div className="p-4">
            <SidebarContent />
          </div>
        </aside>
      </>
    )
  }

  // Desktop sidebar
  return (
    <aside className="hidden lg:flex flex-col w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 h-[calc(100vh-64px)] sticky top-16">
      <div className="p-6">
        <SidebarContent />
      </div>
    </aside>
  )
}

export default Sidebar
