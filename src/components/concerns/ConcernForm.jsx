import { useState } from 'react'
import axios from 'axios'

const ConcernForm = ({ onSubmitted }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'academic',
    files: []
  })
  const [submitting, setSubmitting] = useState(false)

  const handleFileChange = (e) => {
    setFormData({ ...formData, files: Array.from(e.target.files) })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      if (formData.files.length > 0) {
        const submitData = new FormData()
        submitData.append('title', formData.title)
        submitData.append('description', formData.description)
        submitData.append('category', formData.category)
        formData.files.forEach((file) => submitData.append('files', file))

        await axios.post('/api/concerns', submitData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        })
      } else {
        await axios.post('/api/concerns', {
          title: formData.title,
          description: formData.description,
          category: formData.category
        })
      }

      setFormData({ title: '', description: '', category: 'academic', files: [] })
      window.dispatchEvent(new CustomEvent('notifications:push', {
        detail: { message: `Concern submitted: ${formData.title}` }
      }))
      onSubmitted?.()
      alert('Concern submitted successfully!')
    } catch (error) {
      const errorMsg = error.response?.data?.message || 'Failed to submit concern. Please try again.'
      alert(errorMsg)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <h2 className="text-2xl font-bold text-primary-600 mb-4">Submit a Concern</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Title *</label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Category *</label>
          <select
            value={formData.category}
            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            <option value="academic">Academic</option>
            <option value="behavioral">Behavioral</option>
            <option value="general">General</option>
            <option value="safety">Safety</option>
            <option value="other">Other</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Description *</label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            rows="4"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Attach Files (Photos, PDFs, Documents)
          </label>
          <input
            type="file"
            multiple
            onChange={handleFileChange}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            accept="image/*,.pdf,.doc,.docx"
          />
          {formData.files.length > 0 && (
            <div className="mt-2 text-sm text-gray-600">
              {formData.files.length} file(s) selected
            </div>
          )}
        </div>
        <button
          type="submit"
          disabled={submitting}
          className="px-6 py-3 bg-gradient-to-r from-primary-600 to-primary-700 text-white font-bold rounded-lg hover:shadow-lg transition disabled:opacity-50"
        >
          {submitting ? 'Submitting...' : 'Submit Concern'}
        </button>
      </form>
    </div>
  )
}

export default ConcernForm
