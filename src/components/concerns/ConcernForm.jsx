import { useState, useEffect, useRef } from 'react'
import axios from 'axios'
import { useToast } from '../../context/ToastContext'
import Spinner from '../Spinner'

const ConcernForm = ({ onSubmitted }) => {
  const { showToast } = useToast()
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'academic',
    files: []
  })
  const [submitting, setSubmitting] = useState(false)

  const [involvedStudents, setInvolvedStudents] = useState([])
  const [studentQuery, setStudentQuery] = useState('')
  const [studentResults, setStudentResults] = useState([])
  const [showStudentDropdown, setShowStudentDropdown] = useState(false)
  const searchRef = useRef(null)
  const debounceRef = useRef(null)

  useEffect(() => {
    if (studentQuery.trim().length < 2) {
      setStudentResults([])
      return
    }
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await axios.get(`/api/students/search?q=${encodeURIComponent(studentQuery.trim())}`)
        const filtered = res.data.filter(s => !involvedStudents.some(i => i.id === s.id))
        setStudentResults(filtered)
        setShowStudentDropdown(true)
      } catch {
        setStudentResults([])
      }
    }, 300)
    return () => clearTimeout(debounceRef.current)
  }, [studentQuery, involvedStudents])

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setShowStudentDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const addStudent = (student) => {
    setInvolvedStudents(prev => [...prev, student])
    setStudentQuery('')
    setStudentResults([])
    setShowStudentDropdown(false)
  }

  const removeStudent = (studentId) => {
    setInvolvedStudents(prev => prev.filter(s => s.id !== studentId))
  }

  const handleFileChange = (e) => {
    setFormData({ ...formData, files: Array.from(e.target.files) })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      const submitData = new FormData()
      submitData.append('title', formData.title)
      submitData.append('description', formData.description)
      submitData.append('category', formData.category)

      if (involvedStudents.length > 0) {
        submitData.append('involvedStudentIds', JSON.stringify(involvedStudents.map(s => s.id)))
      }

      formData.files.forEach((file) => submitData.append('files', file))

      await axios.post('/api/concerns', submitData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })

      setFormData({ title: '', description: '', category: 'academic', files: [] })
      setInvolvedStudents([])
      window.dispatchEvent(new CustomEvent('notifications:push', {
        detail: { message: `Concern submitted: ${formData.title}` }
      }))
      onSubmitted?.()
      showToast('Concern submitted successfully!', 'success')
    } catch (error) {
      const errorMsg = error.response?.data?.message || 'Failed to submit concern. Please try again.'
      showToast(errorMsg, 'error')
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

        {/* Involved Students */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Involved Students <span className="text-gray-400 font-normal">(optional)</span>
          </label>

          {involvedStudents.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-2">
              {involvedStudents.map(s => (
                <span
                  key={s.id}
                  className="inline-flex items-center gap-1 px-3 py-1 bg-primary-100 text-primary-800 rounded-full text-sm font-medium"
                >
                  {s.firstName} {s.lastName}
                  {s.lrn && <span className="text-primary-500 text-xs">({s.lrn})</span>}
                  <button
                    type="button"
                    onClick={() => removeStudent(s.id)}
                    className="ml-1 text-primary-500 hover:text-red-600 font-bold"
                  >
                    &times;
                  </button>
                </span>
              ))}
            </div>
          )}

          <div className="relative" ref={searchRef}>
            <input
              type="text"
              value={studentQuery}
              onChange={(e) => setStudentQuery(e.target.value)}
              onFocus={() => studentResults.length > 0 && setShowStudentDropdown(true)}
              placeholder="Search by name or LRN..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
            {showStudentDropdown && studentResults.length > 0 && (
              <ul className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                {studentResults.map(s => (
                  <li key={s.id}>
                    <button
                      type="button"
                      onClick={() => addStudent(s)}
                      className="w-full text-left px-4 py-2 hover:bg-primary-50 text-sm flex justify-between items-center"
                    >
                      <span className="font-medium">{s.firstName} {s.lastName}</span>
                      {s.lrn && <span className="text-gray-400 text-xs">{s.lrn}</span>}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
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
          className="px-6 py-3 bg-gradient-to-r from-primary-600 to-primary-700 text-white font-bold rounded-lg hover:shadow-lg transition disabled:opacity-50 flex items-center gap-2"
        >
          {submitting && <Spinner />}
          {submitting ? 'Submitting...' : 'Submit Concern'}
        </button>
      </form>
    </div>
  )
}

export default ConcernForm
