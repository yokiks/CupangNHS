import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { useToast } from '../../context/ToastContext'
import Spinner from '../Spinner'
import ConcernFilters from './ConcernFilters'
import ConcernCard from './ConcernCard'
import Pagination from '../Pagination'

const ConcernList = ({ isCounselor, onViewReport, onGenerateOverallReport, generatingReport, refreshKey }) => {
  const navigate = useNavigate()
  const { showToast } = useToast()
  const [concerns, setConcerns] = useState([])
  const [filteredConcerns, setFilteredConcerns] = useState([])
  const [loading, setLoading] = useState(true)
  const [flaggedStudents, setFlaggedStudents] = useState([])
  const [showFlagged, setShowFlagged] = useState(false)
  const [updatingId, setUpdatingId] = useState(null)
  const [deletingId, setDeletingId] = useState(null)
  const [restoringId, setRestoringId] = useState(null)
  const eventSourceRef = useRef(null)

  const [statusFilter, setStatusFilter] = useState('all')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [sortBy, setSortBy] = useState('created_at')
  const [sortOrder, setSortOrder] = useState('DESC')
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const PAGE_SIZE = 6

  const fetchConcerns = useCallback(async (overrideStatus = null) => {
    try {
      const params = new URLSearchParams()
      const currentStatus = overrideStatus ?? statusFilter
      if (currentStatus !== 'all') params.append('status', currentStatus)
      if (categoryFilter !== 'all') params.append('category', categoryFilter)
      params.append('sortBy', sortBy)
      params.append('sortOrder', sortOrder)

      const res = await axios.get(`/api/concerns?${params.toString()}`)
      const concernsFromServer = res.data
      const visibleConcerns = currentStatus === 'all'
        ? concernsFromServer.filter(c => c.status !== 'deleted')
        : concernsFromServer

      setConcerns(visibleConcerns)
      setFilteredConcerns(visibleConcerns)
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
    let filtered = concerns
    if (!searchQuery.trim()) {
      filtered = concerns
    } else {
      const q = searchQuery.toLowerCase()
      filtered = concerns.filter(c =>
        c.title.toLowerCase().includes(q) ||
        c.description.toLowerCase().includes(q) ||
        (isCounselor && (
          `${c.firstName} ${c.lastName}`.toLowerCase().includes(q) ||
          c.studentId?.toLowerCase().includes(q)
        ))
      )
    }
    
    if (statusFilter === 'all') {
      filtered = filtered.filter(c => c.status !== 'deleted')
    }
    setFilteredConcerns(filtered)
  }, [searchQuery, concerns, isCounselor, statusFilter])

  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery, statusFilter, categoryFilter, sortBy, sortOrder, concerns])

  const handleStatusUpdate = async (concernId, newStatus) => {
    setUpdatingId(concernId)
    try {
      setConcerns(prev => prev.map(c =>
        c.id === concernId ? { ...c, status: newStatus, updatedAt: new Date().toISOString() } : c
      ))
      await axios.patch(`/api/concerns/${concernId}`, { status: newStatus })
      fetchConcerns()
      window.dispatchEvent(new CustomEvent('notifications:refresh'))
    } catch {
      showToast('Failed to update status. Please try again.', 'error')
      fetchConcerns()
    } finally {
      setUpdatingId(null)
    }
  }

  const handleDelete = async (concernId) => {
    if (!window.confirm('Archive this concern? It will be hidden from the normal list but preserved for records.')) return
    setDeletingId(concernId)
    setConcerns(prev => prev.filter(c => c.id !== concernId))
    setFilteredConcerns(prev => prev.filter(c => c.id !== concernId))
    try {
      await axios.delete(`/api/concerns/${concernId}`)
      setCurrentPage(1)
      await fetchConcerns()
      showToast('Concern archived successfully.', 'success')
    } catch {
      showToast('Failed to archive concern. Please try again.', 'error')
      fetchConcerns()
    } finally {
      setDeletingId(null)
    }
  }

  const handleRestore = async (concernId) => {
    if (!window.confirm('Restore this archived concern to its previous status?')) return
    setRestoringId(concernId)
    try {
      const res = await axios.patch(`/api/concerns/${concernId}/restore`)
      showToast(res.data?.message || 'Concern restored.', 'success')
      setCurrentPage(1)
      await fetchConcerns(statusFilter)
      window.dispatchEvent(new CustomEvent('notifications:refresh'))
    } catch (error) {
      showToast(error.response?.data?.message || 'Failed to restore concern. Please try again.', 'error')
    } finally {
      setRestoringId(null)
    }
  }

  const flaggedWithMultiple = flaggedStudents.filter(s => s.concernCount >= 2)

  const pagedConcerns = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE
    return filteredConcerns.slice(start, start + PAGE_SIZE)
  }, [filteredConcerns, currentPage])

  const totalPages = Math.max(1, Math.ceil(filteredConcerns.length / PAGE_SIZE))

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 md:p-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div className="flex flex-col gap-3">
          <h2 className="text-2xl font-bold text-primary-600">
            {isCounselor ? 'All Concerns' : 'My Concerns'}
          </h2>
        </div>
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
              type="button"
              onClick={() => {
                setShowFlagged(false)
                setStatusFilter((current) => current === 'deleted' ? 'all' : 'deleted')
              }}
              className={`px-4 py-2 rounded-lg transition font-semibold text-sm flex items-center gap-2 ${
                statusFilter === 'deleted'
                  ? 'bg-red-600 text-white hover:bg-red-700'
                  : 'bg-red-100 text-red-700 hover:bg-red-200'
              }`}
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.5 2a1 1 0 00-.894.553L7.118 3.5H4a1 1 0 000 2h.293l.853 10.24A2.5 2.5 0 007.638 18h4.724a2.5 2.5 0 002.492-2.26l.853-10.24H16a1 1 0 100-2h-3.118l-.488-.947A1 1 0 0011.5 2h-3zM7.5 7a.75.75 0 01.75.75v6.5a.75.75 0 01-1.5 0v-6.5A.75.75 0 017.5 7zm5 0a.75.75 0 01.75.75v6.5a.75.75 0 01-1.5 0v-6.5A.75.75 0 0112.5 7z" clipRule="evenodd" />
              </svg>
              {statusFilter === 'deleted' ? 'Back to Active Concerns' : 'Archived Concerns'}
            </button>
          )}
          {isCounselor && (
            <button
              onClick={onGenerateOverallReport}
              disabled={generatingReport}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition font-semibold text-sm disabled:opacity-50 flex items-center gap-2"
            >
              {generatingReport && <Spinner />}
              {generatingReport ? 'Generating...' : 'Generate Overall Report'}
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
                <button
                  key={s.id}
                  onClick={() => navigate(`/dashboard/student/${s.id}`)}
                  className={`flex items-center justify-between p-2 rounded-lg border text-sm ${color} hover:shadow-sm transition text-left`}
                >
                  <span className="font-medium">{s.firstName} {s.lastName}</span>
                  <span className="font-bold ml-2">{s.concernCount} reports</span>
                </button>
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
        includeArchived={isCounselor}
      />

      {loading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
        </div>
      ) : (
        <>
          <div className="space-y-4">
            {pagedConcerns.map((concern) => (
              <ConcernCard
                key={concern.id}
                concern={concern}
                isCounselor={isCounselor}
                onStatusUpdate={handleStatusUpdate}
                onDelete={handleDelete}
                onRestore={handleRestore}
                onViewReport={onViewReport}
                isUpdating={updatingId === concern.id}
                isDeleting={deletingId === concern.id}
                isRestoring={restoringId === concern.id}
              />
            ))}
          </div>
          <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
        </>
      )}
    </div>
  )
}

export default ConcernList
