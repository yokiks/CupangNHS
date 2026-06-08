import { useEffect, useMemo, useState } from 'react'
import axios from 'axios'
import { useToast } from '../../context/ToastContext'
import Pagination from '../Pagination'

const STATUS_LABELS = {
  pending_approval: 'Pending Approval',
}

const PAGE_SIZE = 6

const formatGradeSection = (gradeLevel, section) => {
  if (!gradeLevel && !section) return 'N/A'
  if (gradeLevel && section) return `Grade ${gradeLevel} - ${section}`
  if (gradeLevel) return `Grade ${gradeLevel}`
  return section
}

const PendingRegistrations = ({ refreshKey }) => {
  const [registrations, setRegistrations] = useState([])
  const [loading, setLoading] = useState(false)
  const [actionLoading, setActionLoading] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)
  const { showToast } = useToast()

  const fetchRegistrations = async () => {
    setLoading(true)
    try {
      const res = await axios.get('/api/auth/pending-registrations?status=pending_approval')
      setRegistrations(res.data)
    } catch (error) {
      showToast(error.response?.data?.message || 'Unable to load registrations. Please try again.', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    setCurrentPage(1)
    fetchRegistrations()
  }, [refreshKey])

  const executeAction = async (path, method, payload) => {
    setActionLoading(path)
    try {
      await axios({ url: path, method, data: payload })
      showToast('Action completed successfully.', 'success')
      fetchRegistrations()
    } catch (error) {
      showToast(error.response?.data?.message || 'Unable to complete action.', 'error')
    } finally {
      setActionLoading(null)
    }
  }

  const handleApprove = (id) => executeAction(`/api/auth/registrations/${id}/approve`, 'patch')

  const handleReject = (id) => {
    const reason = window.prompt('Enter a reason for rejection (optional):')
    if (reason === null) {
      return
    }
    executeAction(`/api/auth/registrations/${id}/reject`, 'patch', { reason })
  }

  const pagedRegistrations = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE
    return registrations.slice(start, start + PAGE_SIZE)
  }, [registrations, currentPage])

  const totalPages = Math.max(1, Math.ceil(registrations.length / PAGE_SIZE))

  return (
    <div className="bg-white rounded-3xl shadow-lg p-6 mt-10">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-primary-700">Student Registration Review</h2>
          <p className="text-gray-600 mt-1">
            Review newly submitted student registrations. Annual enrollment revalidation is handled separately.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-500">Loading registrations...</div>
      ) : registrations.length === 0 ? (
        <div className="text-center py-12 text-gray-500">No pending registrations found.</div>
      ) : (
        <>
          <div className="space-y-4">
            {pagedRegistrations.map((registration) => (
              <div key={registration.id} className="border border-gray-200 rounded-3xl p-5 shadow-sm">
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Username: {registration.username}</p>
                    <h3 className="text-xl font-semibold text-gray-900">{registration.firstName} {registration.lastName}</h3>
                    <p className="text-sm text-gray-500">LRN: {registration.lrn}</p>
                    <p className="text-sm text-gray-500">Email: {registration.email}</p>
                    <p className="text-sm text-gray-500">
                      Submitted Grade / Section: {formatGradeSection(registration.gradeLevel, registration.section)}
                    </p>
                    <p className="text-sm text-gray-500">Parent: {registration.parentName || 'N/A'}</p>
                    <p className="text-sm text-gray-500">Parent Email: {registration.parentEmail || 'N/A'}</p>
                    <p className="text-sm text-gray-500">Status: <span className="font-semibold">{STATUS_LABELS[registration.accountStatus] || registration.accountStatus}</span></p>
                    {registration.rejectionReason && (
                      <p className="mt-2 text-sm text-red-600">Rejected reason: {registration.rejectionReason}</p>
                    )}
                  </div>
                  <div className="flex flex-col gap-3 md:items-end">
                    {registration.schoolIdProofUrl ? (
                      <a
                        href={registration.schoolIdProofUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-primary-600 text-primary-700 hover:bg-primary-50"
                      >
                        View Registration School ID / Enrollment Proof
                      </a>
                    ) : (
                      <span className="inline-flex px-4 py-2 rounded-xl bg-yellow-100 text-yellow-700">No document uploaded</span>
                    )}
                    {registration.schoolIdProofName && (
                      <p className="text-xs text-gray-500">{registration.schoolIdProofName}</p>
                    )}
                    <p className="text-xs text-gray-500">Submitted: {new Date(registration.createdAt).toLocaleString()}</p>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => handleApprove(registration.id)}
                    disabled={actionLoading === `/api/auth/registrations/${registration.id}/approve`}
                    className="px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 disabled:opacity-50"
                  >
                    {actionLoading === `/api/auth/registrations/${registration.id}/approve` ? 'Approving...' : 'Approve'}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleReject(registration.id)}
                    disabled={actionLoading === `/api/auth/registrations/${registration.id}/reject`}
                    className="px-4 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 disabled:opacity-50"
                  >
                    {actionLoading === `/api/auth/registrations/${registration.id}/reject` ? 'Rejecting...' : 'Reject'}
                  </button>
                </div>
              </div>
            ))}
          </div>
          <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
        </>
      )}
    </div>
  )
}

export default PendingRegistrations
