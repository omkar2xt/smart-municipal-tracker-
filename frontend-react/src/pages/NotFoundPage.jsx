import { Link } from 'react-router-dom'
import { Button } from '../components'
import { AlertCircle } from 'lucide-react'

/**
 * 404 Not Found Page
 */
export const NotFoundPage = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
    <div className="text-center">
      <AlertCircle size={64} className="text-danger mx-auto mb-6" />
      <h1 className="text-5xl font-bold text-gray-900 dark:text-white mb-2">
        404
      </h1>
      <p className="text-xl text-gray-600 dark:text-gray-400 mb-8">
        Page not found
      </p>
      <Link to="/">
        <Button variant="primary" size="lg">
          Go Home
        </Button>
      </Link>
    </div>
  </div>
)

export default NotFoundPage
