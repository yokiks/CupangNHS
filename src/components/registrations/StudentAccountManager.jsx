import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { useToast } from '../../context/ToastContext'
import Pagination from '../Pagination'

const STATUS_LABELS = {
  all: 'All',
  active: 'Active',
  inactive: 'Inactive',
  graduated: 'Graduated',
  transferred: 'Transferred',
  pending_approval: 'Pending Approval',
  pending_revalidation: 'For Revalidation',
  rejected: 'Rejected Registration',
  deleted: 'Archived',
}

const STATUS_FILTERS = ['all', 'active', 'inactive', 'graduated', 'transferred', 'pending_revalidation', 'rejected', 'deleted']
const STATUS_OPTIONS = ['active', 'inactive', 'graduated', 'transferred', 'pending_revalidation']

const PAGE_SIZE = 6

const StudentAccountManager = ({ onStatusUpdated }) => {
  const [statusFilter, setStatusFilter] = useState('all')
  const [accounts, setAccounts] = useState([])
  const [loading, setLoading] = useState(false)
  const [actionLoadingId, setActionLoadingId] = useState(null)
  const [selectedStatus, setSelectedStatus] = useState({})
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedPhotoAccount, setSelectedPhotoAccount] = useState(null)
  const navigate = useNavigate()
  const { showToast } = useToast()

  const fetchAccounts = async (filterStatus = statusFilter) => {
    setLoading(true)
    try {
      const url = filterStatus === 'all' ? '/api/auth/students' : `/api/auth/students?status=${filterStatus}`
      const res = await axios.get(url)
      setAccounts(res.data)
      setSelectedStatus(
        res.data.reduce((map, account) => {
          map[account.id] = STATUS_OPTIONS.includes(account.accountStatus)
            ? account.accountStatus
            : STATUS_OPTIONS[0]
          return map
        }, {})
      )
    } catch (error) {
      showToast('Unable to load student accounts. Please try again.', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    setCurrentPage(1)
    fetchAccounts()
  }, [statusFilter])

  const handleStatusChange = (id, value) => {
    setSelectedStatus((prev) => ({ ...prev, [id]: value }))
  }

  const handleUpdateStatus = async (id) => {
    const newStatus = selectedStatus[id]
    if (!newStatus) {
      showToast('Please choose a status before updating.', 'error')
      return
    }
    setActionLoadingId(id)
    try {
      await axios.patch(`/api/auth/students/${id}/status`, { status: newStatus })
      showToast('Student account status updated.', 'success')
      fetchAccounts()
      if (onStatusUpdated) {
        onStatusUpdated()
      }
    } catch (error) {
      showToast(error.response?.data?.message || 'Unable to update status.', 'error')
    } finally {
      setActionLoadingId(null)
    }
  }

  const handleArchiveAccount = async (account) => {
    const reason = window.prompt(
      `Enter the reason for archiving ${account.firstName} ${account.lastName}'s account:`
    )
    if (reason === null) {
      return
    }

    const trimmedReason = reason.trim()
    if (!trimmedReason) {
      showToast('Archive reason is required.', 'error')
      return
    }

    if (!window.confirm('Archive this student account? The account will no longer be able to log in, but records will be preserved.')) {
      return
    }

    setActionLoadingId(account.id)
    try {
      await axios.patch(`/api/auth/students/${account.id}/status`, {
        status: 'deleted',
        reason: trimmedReason,
      })
      showToast('Student account archived.', 'success')
      fetchAccounts()
      onStatusUpdated?.()
    } catch (error) {
      showToast(error.response?.data?.message || 'Unable to archive account.', 'error')
    } finally {
      setActionLoadingId(null)
    }
  }

  const handleRestoreAccount = async (account) => {
    if (!window.confirm(`Restore ${account.firstName} ${account.lastName}'s archived account to Inactive?`)) {
      return
    }

    setActionLoadingId(account.id)
    try {
      await axios.patch(`/api/auth/students/${account.id}/status`, { status: 'inactive' })
      showToast('Archived account restored to inactive.', 'success')
      fetchAccounts()
      onStatusUpdated?.()
    } catch (error) {
      showToast(error.response?.data?.message || 'Unable to restore account.', 'error')
    } finally {
      setActionLoadingId(null)
    }
  }

  const pagedAccounts = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE
    return accounts.slice(start, start + PAGE_SIZE)
  }, [accounts, currentPage])

  const totalPages = Math.max(1, Math.ceil(accounts.length / PAGE_SIZE))

  return (
    <div className="bg-white rounded-3xl shadow-lg p-6 mt-10">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-primary-700">Student Account Management</h2>
          <p className="text-gray-600 mt-1">
            {statusFilter === 'deleted'
              ? 'Viewing deleted student accounts and preserved history.'
              : 'View all student accounts and update their enrollment status.'}
          </p>
        </div>
        <div className="flex flex-wrap justify-start items-center gap-2">
          {STATUS_FILTERS.map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => setStatusFilter(key)}
              className={`px-4 py-2 rounded-xl font-semibold transition ${statusFilter === key ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
            >
              {STATUS_LABELS[key]}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-500">Loading student accounts...</div>
      ) : accounts.length === 0 ? (
        <div className="text-center py-12 text-gray-500">No student accounts found.</div>
      ) : (
        <>
          <div className="space-y-4">
            {pagedAccounts.map((account) => (
            <div key={account.id} className="border border-gray-200 rounded-3xl p-5 shadow-sm">
              <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_auto]">
                <div>
                  <p className="text-sm text-gray-500">Username: {account.username}</p>
                  <div className="mt-1 flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setSelectedPhotoAccount(account)}
                      className="h-12 w-12 overflow-hidden rounded-full bg-primary-100 flex items-center justify-center text-sm font-bold text-primary-700 shrink-0 ring-2 ring-transparent transition hover:ring-primary-300"
                      aria-label="View student profile picture"
                    >
                      {account.profilePhotoUrl ? (
                        <img
                          src={account.profilePhotoUrl}
                          alt={`${account.firstName} ${account.lastName}`}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <span>{account.firstName?.[0]}{account.lastName?.[0]}</span>
                      )}
                    </button>
                    <h3 className="text-xl font-semibold text-gray-900">{account.firstName} {account.lastName}</h3>
                  </div>
                  <p className="text-sm text-gray-500">LRN: {account.lrn || 'N/A'}</p>
                  <p className="text-sm text-gray-500">Email: {account.email || 'N/A'}</p>
                  <p className="text-sm text-gray-500">Parent: {account.parentName || 'N/A'}</p>
                  <p className="text-sm text-gray-500">Status: <span className="font-semibold">{STATUS_LABELS[account.accountStatus] || account.accountStatus}</span></p>
                </div>
                <div className="flex flex-col gap-3 md:items-end md:text-right w-full">
                  {['pending_approval', 'pending_revalidation', 'rejected', 'deleted'].includes(account.accountStatus) ? (
                    <div className="flex flex-col gap-3 items-start md:items-end w-full">
                      <div className={`rounded-full px-4 py-2 text-sm font-semibold ${
                        account.accountStatus === 'deleted'
                          ? 'bg-gray-100 text-gray-700'
                          : 'bg-yellow-50 text-yellow-800'
                      }`}>
                        {account.accountStatus === 'pending_approval'
                          ? 'Review this student in Student Registration Review.'
                          : account.accountStatus === 'pending_revalidation'
                            ? 'Review this student in Enrollment Revalidation Review.'
                            : account.accountStatus === 'deleted'
                              ? 'This account is archived and kept for records.'
                              : 'This new registration was rejected.'}
                      </div>
                      <button
                        type="button"
                        onClick={() => navigate(`/dashboard/student/${account.id}`)}
                        className="w-full sm:w-auto px-4 py-2 bg-white text-primary-700 rounded-xl border border-primary-200 hover:bg-primary-50"
                      >
                        View Account
                      </button>
                      {account.accountStatus === 'deleted' && (
                        <button
                          type="button"
                          onClick={() => handleRestoreAccount(account)}
                          disabled={actionLoadingId === account.id}
                          className="w-full sm:w-auto px-4 py-2 bg-primary-600 text-white rounded-xl hover:bg-primary-700 disabled:opacity-50"
                        >
                          {actionLoadingId === account.id ? 'Restoring...' : 'Restore to Inactive'}
                        </button>
                      )}
                      {account.rejectionReason && (
                        <p className="max-w-xs text-sm text-red-600 md:text-right">
                          Reason: {account.rejectionReason}
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-end gap-2 w-full">
                      <button
                        type="button"
                        onClick={() => navigate(`/dashboard/student/${account.id}`)}
                        className="w-full sm:w-auto px-4 py-2 bg-white text-primary-700 rounded-xl border border-primary-200 hover:bg-primary-50"
                      >
                        View Account
                      </button>
                      <select
                        value={selectedStatus[account.id] || account.accountStatus}
                        onChange={(e) => handleStatusChange(account.id, e.target.value)}
                        className="w-full sm:w-auto rounded-xl border border-gray-300 bg-white px-4 py-2"
                      >
                        {STATUS_OPTIONS.map((statusOption) => (
                          <option key={statusOption} value={statusOption}>
                            {STATUS_LABELS[statusOption]}
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={() => handleUpdateStatus(account.id)}
                        disabled={actionLoadingId === account.id}
                        className="w-full sm:w-auto px-4 py-2 bg-primary-600 text-white rounded-xl hover:bg-primary-700 disabled:opacity-50"
                      >
                        {actionLoadingId === account.id ? 'Updating...' : 'Update'}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleArchiveAccount(account)}
                        disabled={actionLoadingId === account.id}
                        className="w-full sm:w-auto px-4 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 disabled:opacity-50"
                      >
                        {actionLoadingId === account.id ? 'Processing...' : 'Archive'}
                      </button>
                    </div>
                  )}
                  <p className="text-xs text-gray-500">Last updated: {new Date(account.updatedAt).toLocaleString()}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
        <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
      </>
      )}

      {selectedPhotoAccount && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 px-4">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-xl font-bold text-gray-900">Student Picture</h2>
              <button
                type="button"
                onClick={() => setSelectedPhotoAccount(null)}
                className="rounded-full p-2 text-gray-500 hover:bg-gray-100"
                aria-label="Close student picture"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="mt-5 flex justify-center">
              <div className="h-64 w-64 overflow-hidden rounded-3xl bg-primary-100 flex items-center justify-center text-6xl font-bold text-primary-700">
                {selectedPhotoAccount.profilePhotoUrl ? (
                  <img
                    src={selectedPhotoAccount.profilePhotoUrl}
                    alt={`${selectedPhotoAccount.firstName} ${selectedPhotoAccount.lastName}`}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span>{selectedPhotoAccount.firstName?.[0]}{selectedPhotoAccount.lastName?.[0]}</span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default StudentAccountManager
