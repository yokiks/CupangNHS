import { useState, useEffect, useCallback, useRef } from 'react'
import axios from 'axios'
import ConcernFilters from './ConcernFilters'
import ConcernCard from './ConcernCard'

const ConcernList = ({ isCounselor, onViewReport, onGenerateOverallReport, refreshKey }) => {
  const [concerns, setConcerns] = useState([])
  const [filteredConcerns, setFilteredConcerns] = useState([])
  const [loading, setLoading] = useState(true)
  const [flaggedStudents, setFlaggedStudents] = useState([])
  const [showFlagged, setShowFlagged] = useState(false)
  const eventSourceRef = useRef(null)

  const [statusFilter, setStatusFilter] = useState('all')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [sortBy, setSortBy] = useState('created_at')
  const [sortOrder, setSortOrder] = useState('DESC')
  const [searchQuery, setSearchQuery] = useState('')

  const fetchConcerns = useCallback(async () => {
    try {
      const params = new URLSearchParams()
      if (statusFilter !== 'all') params.append('status', statusFilter)
      if (categoryFilter !== 'all') params.append('category', categoryFilter)
      params.append('sortBy', sortBy)
      params.append('sortOrder', sortOrder)

      const res = await axios.get(`/api/concerns?${params.toString()}`)
      setConcerns(res.data)
      setFilteredConcerns(res.data)
    } catch (error) {
      console.error('Error fetching concerns:', error)
    } finally {
      setLoading(false)
    }
  }, [statusFilter, categoryFilter, sortBy, sortOrder])

  useEffect(() => {
    fetchConcerns()
  }, [fetchConcerns, refreshKey])

  useEffect(() => {
    if (isCounselor) {
      axios.get('/api/concerns/flagged-students').then(r => setFlaggedStudents(r.data)).catch(() => {})
    }
  }, [isCounselor, refreshKey, concerns])

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) return

    const baseUrl = (import.meta.env.VITE_API_BASE_URL || window.location.origin)
    const url = `${baseUrl}/api/concerns/events?token=${encodeURIComponent(token)}`
    const es = new EventSource(url)
    eventSourceRef.current = es

    es.addEventListener('concern:statusUpdate', (e) => {
      try {
        const data = JSON.parse(e.data)
        setConcerns(prev => prev.map(c =>
          c.id === data.concernId ? { ...c, status: data.newStatus, updatedAt: data.updatedAt } : c
        ))
      } catch { /* ignore parse errors */ }
    })

    es.addEventListener('concern:new', () => {
      fetchConcerns()
    })

    es.addEventListener('concern:deleted', (e) => {
      try {
        const data = JSON.parse(e.data)
        setConcerns(prev => prev.filter(c => c.id !== data.concernId))
      } catch { /* ignore */ }
    })

    es.onerror = () => {
      es.close()
      setTimeout(() => {
        if (eventSourceRef.current === es) {
          eventSourceRef.current = null
        }
      }, 5000)
    }

    return () => {
      es.close()
      eventSourceRef.current = null
    }
  }, [fetchConcerns])

  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredConcerns(concerns)
      return
    }
    const q = searchQuery.toLowerCase()
    setFilteredConcerns(
      concerns.filter(c =>
        c.title.toLowerCase().includes(q) ||
        c.description.toLowerCase().includes(q) ||
        (isCounselor && (
          `${c.firstName} ${c.lastName}`.toLowerCase().includes(q) ||
          c.studentId?.toLowerCase().includes(q)
        ))
      )
    )
  }, [searchQuery, concerns, isCounselor])

  const handleStatusUpdate = async (concernId, newStatus) => {
    try {
      setConcerns(prev => prev.map(c =>
        c.id === concernId ? { ...c, status: newStatus, updatedAt: new Date().toISOString() } : c
      ))
      await axios.patch(`/api/concerns/${concernId}`, { status: newStatus })
      fetchConcerns()
      window.dispatchEvent(new CustomEvent('notifications:refresh'))
    } catch {
      alert('Failed to update status. Please try again.')
      fetchConcerns()
    }
  }

  const handleDelete = async (concernId) => {
    if (!window.confirm('Are you sure you want to delete this concern?')) return
    try {
      setConcerns(prev => prev.filter(c => c.id !== concernId))
      await axios.delete(`/api/concerns/${concernId}`)
      fetchConcerns()
      alert('Concern deleted successfully!')
    } catch {
      alert('Failed to delete concern. Please try again.')
      fetchConcerns()
    }
  }

  const flaggedWithMultiple = flaggedStudents.filter(s => s.concernCount >= 2)

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 md:p-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <h2 className="text-2xl font-bold text-primary-600">
          {isCounselor ? 'All Concerns' : 'My Concerns'}
        </h2>
        <div className="flex flex-wrap gap-2">
          {isCounselor && flaggedWithMultiple.length > 0 && (
            <button
              onClick={() => setShowFlagged(v => !v)}
              className="px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition font-semibold text-sm flex items-center gap-1"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M3 6a3 3 0 013-3h10l-4 4 4 4H6a3 3 0 01-3-3V6z" /></svg>
              Flagged Students ({flaggedWithMultiple.length})
            </button>
          )}
          {isCounselor && (
            <button
              onClick={onGenerateOverallReport}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition font-semibold text-sm"
            >
              Generate Overall Report
            </button>
          )}
        </div>
      </div>

      {isCounselor && showFlagged && flaggedWithMultiple.length > 0 && (
        <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-xl">
          <h3 className="font-bold text-amber-800 mb-3 text-sm">Students with Multiple Concerns</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {flaggedWithMultiple.map(s => {
              const color = s.concernCount >= 4 ? 'bg-red-100 text-red-800 border-red-200' :
                            s.concernCount >= 2 ? 'bg-amber-100 text-amber-800 border-amber-200' :
                            'bg-gray-100 text-gray-700 border-gray-200'
              return (
                <div key={s.id} className={`flex items-center justify-between p-2 rounded-lg border text-sm ${color}`}>
                  <span className="font-medium">{s.firstName} {s.lastName}</span>
                  <span className="font-bold ml-2">{s.concernCount} reports</span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      <ConcernFilters
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        statusFilter={statusFilter}
        onStatusChange={setStatusFilter}
        categoryFilter={categoryFilter}
        onCategoryChange={setCategoryFilter}
        sortBy={sortBy}
        onSortByChange={setSortBy}
        sortOrder={sortOrder}
        onSortOrderChange={setSortOrder}
      />

      {loading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
        </div>
      ) : filteredConcerns.length === 0 ? (
        <p className="text-gray-600 text-center py-8">No concerns found.</p>
      ) : (
        <div className="space-y-4">
          {filteredConcerns.map((concern) => (
            <ConcernCard
              key={concern.id}
              concern={concern}
              isCounselor={isCounselor}
              onStatusUpdate={handleStatusUpdate}
              onDelete={handleDelete}
              onViewReport={onViewReport}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export default ConcernList
