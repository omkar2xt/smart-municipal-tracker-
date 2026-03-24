import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { MainLayout } from '../components/MainLayout'
import {
  Button,
  LoadingSpinner,
  Alert,
  Input,
  Textarea,
} from '../components'
import { Card } from '../components'
import { workerAPI } from '../services/api'
import { CheckCircle, Upload, MapPin, Clock } from 'lucide-react'

/**
 * Worker Task Completion Page
 * - Upload work proof/images
 * - Mark task complete
 * - Verify geolocation
 */
export const TaskCompletionPage = () => {
  const { taskId } = useParams()
  const navigate = useNavigate()
  const [task, setTask] = useState(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [formData, setFormData] = useState({
    notes: '',
    completionTime: new Date().toISOString(),
    images: [],
  })
  const [preview, setPreview] = useState([])

  useEffect(() => {
    loadTask()
  }, [taskId])

  const loadTask = async () => {
    try {
      const response = await workerAPI.getTaskById(taskId)
      setTask(response.data.task)
    } catch (err) {
      setError('Failed to load task details')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files)
    const newPreviews = files.map((file) => URL.createObjectURL(file))
    setFormData((prev) => ({
      ...prev,
      images: [...prev.images, ...files],
    }))
    setPreview((prev) => [...prev, ...newPreviews])
  }

  const removeImage = (idx) => {
    setPreview((prev) => prev.filter((_, i) => i !== idx))
    setFormData((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== idx),
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    try {
      setSubmitting(true)
      
      // Create FormData for file upload
      const uploadFormData = new FormData()
      formData.images.forEach((img) => {
        uploadFormData.append('images', img)
      })
      uploadFormData.append('notes', formData.notes)
      uploadFormData.append('completionTime', formData.completionTime)

      await workerAPI.completeTask(taskId, uploadFormData)
      setSuccess('Task completed successfully!')
      
      setTimeout(() => {
        navigate('/worker/dashboard')
      }, 2000)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to complete task')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <MainLayout title="Complete Task">
        <LoadingSpinner fullScreen />
      </MainLayout>
    )
  }

  if (!task) {
    return (
      <MainLayout title="Task Not Found">
        <Card className="p-8 text-center">
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Task not found or already completed
          </p>
          <Button
            variant="primary"
            onClick={() => navigate('/worker/dashboard')}
          >
            Back to Dashboard
          </Button>
        </Card>
      </MainLayout>
    )
  }

  return (
    <MainLayout title="Complete Task" subtitle={task.title}>
      <div className="max-w-2xl mx-auto">
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

          {/* Task Details */}
          <Card className="p-6">
            <h2 className="text-2xl font-bold mb-4">Task Details</h2>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Description
                </p>
                <p className="text-gray-900 dark:text-white">
                  {task.description}
                </p>
              </div>
              {task.location && (
                <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                  <MapPin size={20} className="text-primary-600" />
                  <span>{task.location}</span>
                </div>
              )}
              {task.dueDate && (
                <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                  <Clock size={20} className="text-primary-600" />
                  <span>Due: {new Date(task.dueDate).toLocaleDateString()}</span>
                </div>
              )}
            </div>
          </Card>

          {/* Completion Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Images Upload */}
            <Card className="p-6">
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                <Upload size={24} className="text-primary-600" />
                Upload Work Proof
              </h3>

              <div className="mb-4">
                <label className="flex items-center justify-center w-full px-4 py-6 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                  <div className="text-center">
                    <Camera size={32} className="mx-auto text-primary-600 mb-2" />
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">
                      Click to upload or drag and drop
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      PNG, JPG, GIF up to 10MB
                    </p>
                  </div>
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </label>
              </div>

              {/* Image Preview */}
              {preview.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-4">
                  {preview.map((src, idx) => (
                    <div key={idx} className="relative">
                      <img
                        src={src}
                        alt={`Preview ${idx}`}
                        className="w-full h-24 object-cover rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(idx)}
                        className="absolute top-1 right-1 bg-danger text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold hover:bg-red-600"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {preview.length} image(s) selected
              </p>
            </Card>

            {/* Notes */}
            <Textarea
              label="Work Completion Notes"
              value={formData.notes}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, notes: e.target.value }))
              }
              placeholder="Describe the work completed, any issues faced, etc."
            />

            {/* Submit Buttons */}
            <div className="flex gap-4">
              <Button
                type="button"
                variant="secondary"
                fullWidth
                onClick={() => navigate('/worker/dashboard')}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="success"
                fullWidth
                loading={submitting}
                disabled={submitting || preview.length === 0}
              >
                <CheckCircle size={20} className="mr-2" />
                Complete Task
              </Button>
            </div>
          </form>
        </div>
      </div>
    </MainLayout>
  )
}

// Import Camera icon
import { Camera } from 'lucide-react'

export default TaskCompletionPage
