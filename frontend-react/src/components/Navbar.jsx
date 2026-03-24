import { useState, useEffect } from 'react'
import { useAuthStore } from '../store/authStore'
import { Moon, Sun, Menu, LogOut, User } from 'lucide-react'

/**
 * Navigation Bar Component
 * - Responsive top navigation
 * - Dark mode toggle
 * - User menu
 * - Mobile menu button
 */
export const Navbar = ({ onMenuClick, showMenuButton = true }) => {
  const { isDarkMode, toggleDarkMode, user, logout, role } = useAuthStore()

  return (
    <nav className="sticky top-0 z-50 bg-white dark:bg-gray-800 shadow-md border-b border-gray-200 dark:border-gray-700 backdrop-blur-sm bg-opacity-95 dark:bg-opacity-95 transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3 group">
            {showMenuButton && (
              <button
                onClick={onMenuClick}
                className="lg:hidden p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-all duration-200 hover:scale-110 active:scale-95"
              >
                <Menu size={24} className="text-primary-600" />
              </button>
            )}
            <div className="flex items-center gap-2 group-hover:scale-105 transition-transform duration-200">
              <div className="w-10 h-10 bg-gradient-to-br from-primary-600 to-primary-700 rounded-lg flex items-center justify-center text-white font-bold shadow-lg group-hover:shadow-primary-600/50 transition-shadow">
                GS
              </div>
              <span className="hidden sm:block text-xl font-bold bg-gradient-to-r from-primary-600 to-primary-700 bg-clip-text text-transparent">
                GeoSentinel OS
              </span>
            </div>
          </div>

          {/* Right Side Actions */}
          <div className="flex items-center gap-4">
            {/* Dark Mode Toggle */}
            <button
              onClick={toggleDarkMode}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-all duration-200 hover:scale-110 active:scale-95"
              title={isDarkMode ? 'Light mode' : 'Dark mode'}
            >
              {isDarkMode ? (
                <Sun size={20} className="text-yellow-400 animate-spin" style={{animationDuration: '3s'}} />
              ) : (
                <Moon size={20} className="text-gray-600" />
              )}
            </button>

            {/* User Menu */}
            <div className="flex items-center gap-2 hover:opacity-80 transition-opacity duration-200">
              <div className="hidden sm:block text-right">
                <p className="text-sm font-semibold text-gray-900 dark:text-white">
                  {user?.name || 'User'}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                  {role || 'worker'}
                </p>
              </div>
              <button
                onClick={logout}
                className="p-2 hover:bg-red-100 dark:hover:bg-red-900 rounded-lg transition-all duration-200 text-danger hover:scale-110 active:scale-95"
              >
                <LogOut size={20} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </nav>
  )
}

export default Navbar
