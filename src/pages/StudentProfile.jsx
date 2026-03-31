import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import axios from 'axios'

const STATUS_COLORS = {
  pending: 'bg-gray-100 text-gray-800',
  read: 'bg-blue-100 text-blue-800',
  in_review: 'bg-yellow-100 text-yellow-800',
  resolved: 'bg-green-100 text-green-800',
}

const STATUS_LABELS = {
  pending: 'Pending',
  read: 'Read',
  in_review: 'In Review',
  resolved: 'Resolved',
}

const StudentProfile = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('reported')
  const [statusFilter, setStatusFilter] = useState('all')
  const [categoryFilter, setCategoryFilter] = useState('all')

  useEffect(() => {
    setLoading(true)
    axios.get(`/api/students/${id}/profile`)
      .then(res => setData(res.data))
      .catch(err => {
        console.error('Failed to load student profile:', err)
        alert('Failed to load student profile.')
        navigate('/dashboard')
      })
      .finally(() => setLoading(false))
  }, [id, navigate])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center">
        <div className="bg-white rounded-xl p-8 shadow-lg text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading student profile...</p>
        </div>
      </div>
    )
  }

  if (!data) return null

  const { student, stats, reportedConcerns, involvedConcerns } = data

  const activeConcerns = tab === 'reported' ? reportedConcerns : involvedConcerns
  const filtered = activeConcerns.filter(c => {
    if (statusFilter !== 'all' && c.status !== statusFilter) return false
    if (categoryFilter !== 'all' && c.category !== categoryFilter) return false
    return true
  })

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 p-4 md:p-8">
      <div className="max-w-5xl mx-auto">
        {/* Back Button */}
        <button
          onClick={() => navigate('/dashboard')}
          className="mb-4 inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-gray-600 bg-white rounded-lg shadow hover:bg-gray-50 transition"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          Back to Dashboard
        </button>

        {/* Student Info Header */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex flex-col md:flex-row md:items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 text-2xl font-bold shrink-0">
              {student.firstName[0]}{student.lastName[0]}
            </div>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-gray-800">{student.firstName} {student.lastName}</h1>
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-500 mt-1">
                {student.lrn && <span>LRN: <span className="font-medium text-gray-700">{student.lrn}</span></span>}
                {student.gradeLevel && student.section && (
                  <span>Grade/Section: <span className="font-medium text-gray-700">{student.gradeLevel} - {student.section}</span></span>
                )}
                {student.email && <span>Email: <span className="font-medium text-gray-700">{student.email}</span></span>}
              </div>
              {(student.parentName || student.parentEmail) && (
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-500 mt-1">
                  {student.parentName && <span>Parent: <span className="font-medium text-gray-700">{student.parentName}</span></span>}
                  {student.parentEmail && <span>Parent Email: <span className="font-medium text-gray-700">{student.parentEmail}</span></span>}
                  {student.parentContact && <span>Parent Contact: <span className="font-medium text-gray-700">{student.parentContact}</span></span>}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Stat Widgets */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow-lg p-6 flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
              <svg className="w-7 h-7 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
            </div>
            <div>
              <p className="text-sm text-gray-500 font-medium">Concerns Reported</p>
              <p className="text-3xl font-bold text-blue-700">{stats.reportedCount}</p>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-6 flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-orange-100 flex items-center justify-center shrink-0">
              <svg className="w-7 h-7 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" /></svg>
            </div>
            <div>
              <p className="text-sm text-gray-500 font-medium">Times Involved</p>
              <p className="text-3xl font-bold text-orange-700">{stats.involvedCount}</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setTab('reported')}
              className={`flex-1 px-4 py-3 text-sm font-semibold transition ${
                tab === 'reported'
                  ? 'text-primary-700 border-b-2 border-primary-600 bg-primary-50'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              Concerns Reported ({reportedConcerns.length})
            </button>
            <button
              onClick={() => setTab('involved')}
              className={`flex-1 px-4 py-3 text-sm font-semibold transition ${
                tab === 'involved'
                  ? 'text-orange-700 border-b-2 border-orange-500 bg-orange-50'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              Involved In ({involvedConcerns.length})
            </button>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-3 p-4 bg-gray-50 border-b border-gray-100">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="read">Read</option>
              <option value="in_review">In Review</option>
              <option value="resolved">Resolved</option>
            </select>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="all">All Categories</option>
              <option value="academic">Academic</option>
              <option value="behavioral">Behavioral</option>
              <option value="general">General</option>
              <option value="safety">Safety</option>
              <option value="other">Other</option>
            </select>
          </div>

          {/* Concern List */}
          <div className="p-4">
            {filtered.length === 0 ? (
              <p className="text-center text-gray-500 py-8">No concerns found for this filter.</p>
            ) : (
              <div className="space-y-3">
                {filtered.map(c => (
                  <div key={c.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-sm transition">
                    <div className="flex justify-between items-start mb-1">
                      <h4 className="font-semibold text-gray-800">{c.title}</h4>
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${STATUS_COLORS[c.status]}`}>
                        {STATUS_LABELS[c.status]}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-3 text-xs text-gray-500 mt-1">
                      <span className="capitalize">Category: <span className="font-medium">{c.category}</span></span>
                      <span>Created: {new Date(c.createdAt).toLocaleDateString()}</span>
                      {c.reportedBy && (
                        <span>Reported by: <span className="font-medium">{c.reportedBy}</span></span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default StudentProfile
