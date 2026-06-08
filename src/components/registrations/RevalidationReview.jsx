import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { useToast } from '../../context/ToastContext'
import Pagination from '../Pagination'

const PAGE_SIZE = 6

const formatGradeSection = (gradeLevel, section) => {
  if (!gradeLevel && !section) return 'N/A'
  if (gradeLevel && section) return `Grade ${gradeLevel} - ${section}`
  if (gradeLevel) return `Grade ${gradeLevel}`
  return section
}

const RevalidationReview = ({ refreshKey, onReviewed }) => {
  const [requests, setRequests] = useState([])
  const [awaitingStudents, setAwaitingStudents] = useState([])
  const [loadWarning, setLoadWarning] = useState('')
  const [loading, setLoading] = useState(false)
  const [actionLoading, setActionLoading] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)
  const navigate = useNavigate()
  const { showToast } = useToast()

  const fetchRequests = async () => {
    setLoading(true)
    setLoadWarning('')
    try {
      const [requestsResult, studentsResult] = await Promise.allSettled([
        axios.get('/api/revalidation-requests'),
        axios.get('/api/auth/students?status=pending_revalidation'),
      ])

      if (requestsResult.status === 'fulfilled') {
        setRequests(requestsResult.value.data)
      } else {
        setRequests([])
        setLoadWarning(
          requestsResult.reason?.response?.data?.message ||
            'Submitted revalidation requests are temporarily unavailable.'
        )
      }

      if (studentsResult.status === 'fulfilled') {
        setAwaitingStudents(studentsResult.value.data)
      } else {
        setAwaitingStudents([])
        setLoadWarning(
          studentsResult.reason?.response?.data?.message ||
            'Students awaiting revalidation are temporarily unavailable.'
        )
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    setCurrentPage(1)
    fetchRequests()
  }, [refreshKey])

  const executeAction = async (path, method, payload) => {
    setActionLoading(path)
    try {
      await axios({ url: path, method, data: payload })
      showToast('Action completed successfully.', 'success')
      fetchRequests()
      onReviewed?.()
    } catch (error) {
      showToast(error.response?.data?.message || 'Unable to complete action.', 'error')
    } finally {
      setActionLoading(null)
    }
  }

  const handleApprove = (id) => {
    if (!window.confirm('Approve this revalidation request?')) {
      return
    }
    executeAction(`/api/revalidation-requests/${id}/approve`, 'patch')
  }

  const handleReject = (id) => {
    const reason = window.prompt('Enter a reason for rejection (optional):')
    if (reason === null) {
      return
    }
    executeAction(`/api/revalidation-requests/${id}/reject`, 'patch', { reason })
  }

  const pagedRequests = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE
    return requests.slice(start, start + PAGE_SIZE)
  }, [requests, currentPage])

  const totalPages = Math.max(1, Math.ceil(requests.length / PAGE_SIZE))
  const submittedStudentIds = useMemo(
    () => new Set(requests.map((request) => request.student.id)),
    [requests]
  )
  const studentsAwaitingSubmission = useMemo(
    () => awaitingStudents.filter((student) => !submittedStudentIds.has(student.id)),
    [awaitingStudents, submittedStudentIds]
  )

  return (
    <div className="bg-white rounded-3xl shadow-lg p-6 mt-10">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-primary-700">Enrollment Revalidation Review</h2>
        <p className="text-gray-600 mt-1">
          Review submitted revalidation requirements and approve or reject enrollment updates.
        </p>
      </div>

      {loadWarning && (
        <div className="mb-6 rounded-2xl border border-yellow-200 bg-yellow-50 p-4 text-sm text-yellow-800">
          {loadWarning}
        </div>
      )}

      {studentsAwaitingSubmission.length > 0 && (
        <div className="mb-6 rounded-2xl border border-yellow-200 bg-yellow-50 p-5">
          <h3 className="font-semibold text-yellow-900">Awaiting Student Submission</h3>
          <p className="mt-1 text-sm text-yellow-800">
            These students are marked for revalidation but have not uploaded their updated enrollment details yet.
          </p>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {studentsAwaitingSubmission.map((student) => (
              <div
                key={student.id}
                className="rounded-xl border border-yellow-200 bg-white p-4 transition hover:border-yellow-400 hover:shadow-sm"
              >
                <button
                  type="button"
                  onClick={() => navigate(`/dashboard/student/${student.id}`)}
                  className="block w-full text-left"
                >
                  <p className="font-semibold text-gray-900">{student.firstName} {student.lastName}</p>
                  <p className="text-sm text-gray-500">Username: {student.username}</p>
                  <p className="text-sm text-gray-500">LRN: {student.lrn || 'N/A'}</p>
                  <p className="mt-2 text-sm font-semibold text-primary-700">View Account</p>
                </button>
                {student.rejectionReason && (
                  <p className="mt-2 text-sm text-red-600">Reason: {student.rejectionReason}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-center py-12 text-gray-500">Loading revalidation requests...</div>
      ) : requests.length === 0 && studentsAwaitingSubmission.length === 0 ? (
        <div className="text-center py-12 text-gray-500">No pending revalidation requests.</div>
      ) : requests.length > 0 ? (
        <>
          <div className="mb-4">
            <h3 className="text-lg font-bold text-gray-900">Pending Revalidation Review</h3>
          </div>
          <div className="space-y-4">
            {pagedRequests.map((request) => (
              <div key={request.id} className="border border-gray-200 rounded-3xl p-5 shadow-sm">
                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                  <div className="space-y-2">
                    <p className="text-sm text-gray-500">Username: {request.student.username}</p>
                    <button
                      type="button"
                      onClick={() => navigate(`/dashboard/student/${request.student.id}`)}
                      className="text-left text-xl font-semibold text-gray-900 hover:text-primary-700"
                    >
                      {request.student.firstName} {request.student.lastName}
                    </button>
                    <p className="text-sm text-gray-500">LRN: {request.student.lrn || 'N/A'}</p>
                    <p className="text-sm text-gray-500">Email: {request.student.email || 'N/A'}</p>
                    {request.schoolYear?.label && (
                      <p className="text-sm text-gray-500">School Year: {request.schoolYear.label}</p>
                    )}
                    {(request.reviewType === 'catch_up' || request.reviewType === 'guidance_manual') && (
                      <span className="inline-flex rounded-full bg-orange-100 px-3 py-1 text-xs font-semibold text-orange-700">
                        {request.reviewType === 'guidance_manual' ? 'Guidance-Enabled Manual Review' : 'Catch-up / Manual Review'}
                      </span>
                    )}
                    <p className="text-xs text-gray-500">
                      Submitted: {new Date(request.submittedAt).toLocaleString()}
                    </p>
                  </div>

                  <div className="flex flex-col gap-3 lg:items-end">
                    {request.schoolIdProofUrl ? (
                      <a
                        href={request.schoolIdProofUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-primary-600 text-primary-700 hover:bg-primary-50"
                      >
                        View Updated School ID / Enrollment Proof
                      </a>
                    ) : (
                      <span className="inline-flex px-4 py-2 rounded-xl bg-yellow-100 text-yellow-700">
                        No document uploaded
                      </span>
                    )}
                    {request.schoolIdProofName && (
                      <p className="text-xs text-gray-500">{request.schoolIdProofName}</p>
                    )}
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
                    <p className="text-sm font-semibold text-gray-700 mb-1">Previous Enrollment</p>
                    <p className="text-gray-900">
                      {formatGradeSection(request.previousGradeLevel, request.previousSection)}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-primary-200 bg-primary-50 p-4">
                    <p className="text-sm font-semibold text-primary-700 mb-1">
                      Updated Grade Level / Section
                    </p>
                    <p className="text-xs text-primary-700 mb-2">
                      {request.reviewType === 'catch_up' || request.reviewType === 'guidance_manual'
                        ? 'Submitted by student for guidance verification'
                        : 'Submitted by student'}
                    </p>
                    <p className="text-primary-900">
                      {formatGradeSection(request.newGradeLevel, request.newSection)}
                    </p>
                  </div>
                </div>

                {(request.reviewType === 'catch_up' || request.reviewType === 'guidance_manual') && (
                  <div className="mt-4 rounded-2xl border border-orange-200 bg-orange-50 p-4 text-sm text-orange-800">
                    {request.reviewType === 'guidance_manual'
                      ? 'Guidance enabled this manual revalidation. Verify the uploaded proof before approval.'
                      : 'This request includes a grade catch-up. Verify the uploaded proof before approval.'}
                  </div>
                )}

                <div className="mt-4 flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => handleApprove(request.id)}
                    disabled={actionLoading === `/api/revalidation-requests/${request.id}/approve`}
                    className="px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 disabled:opacity-50"
                  >
                    {actionLoading === `/api/revalidation-requests/${request.id}/approve` ? 'Approving...' : 'Approve'}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleReject(request.id)}
                    disabled={actionLoading === `/api/revalidation-requests/${request.id}/reject`}
                    className="px-4 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 disabled:opacity-50"
                  >
                    {actionLoading === `/api/revalidation-requests/${request.id}/reject` ? 'Rejecting...' : 'Reject'}
                  </button>
                </div>
              </div>
            ))}
          </div>
          <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
        </>
      ) : studentsAwaitingSubmission.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          No submitted revalidation requests awaiting review.
        </div>
      ) : (
        null
      )}
    </div>
  )
}

export default RevalidationReview
