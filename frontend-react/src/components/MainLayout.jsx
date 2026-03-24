import { useState, useEffect } from 'react'
import Navbar from './Navbar'
import Sidebar from './Sidebar'

/**
 * Main Layout Component
 * Provides consistent layout with navbar, sidebar, and content area
 * Responsive for mobile, tablet, and desktop
 */
export const MainLayout = ({ children, title, subtitle, showSidebar = true }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768)

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  return (
    <div className="flex flex-col h-screen bg-white dark:bg-gray-900">
      {/* Navbar */}
      <Navbar
        onMenuClick={() => setSidebarOpen(!sidebarOpen)}
        showMenuButton={showSidebar}
      />

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        {showSidebar && (
          <Sidebar
            isOpen={sidebarOpen}
            onClose={() => setSidebarOpen(false)}
            isMobileView={isMobile}
          />
        )}

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto">
          <div className="h-full flex flex-col">
            {/* Header Section */}
            {(title || subtitle) && (
              <div className="bg-gradient-to-r from-primary-500 via-primary-600 to-primary-700 text-white px-6 py-8 md:py-12">
                <div className="max-w-7xl mx-auto">
                  {title && <h1 className="text-3xl md:text-4xl font-bold mb-2">{title}</h1>}
                  {subtitle && <p className="text-primary-100">{subtitle}</p>}
                </div>
              </div>
            )}

            {/* Content Section */}
            <div className="flex-1 bg-gray-50 dark:bg-gray-900 px-4 py-6 md:px-8 md:py-8">
              <div className="max-w-7xl mx-auto">{children}</div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

export default MainLayout
