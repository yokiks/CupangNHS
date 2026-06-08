import { useNavigate } from 'react-router-dom'
import Spinner from '../Spinner'

const STATUS_COLORS = {
  pending: 'bg-gray-100 text-gray-800',
  read: 'bg-blue-100 text-blue-800',
  in_review: 'bg-yellow-100 text-yellow-800',
  resolved: 'bg-green-100 text-green-800',
  deleted: 'bg-red-100 text-red-800',
}

const STATUS_LABELS = {
  pending: 'Pending',
  read: 'Read',
  in_review: 'In Progress',
  resolved: 'Resolved',
  deleted: 'Archived',
}

const STATUS_FLOW = ['read', 'in_review', 'resolved']

const ConcernCard = ({ concern, isCounselor, onStatusUpdate, onDelete, onRestore, onViewReport, isUpdating, isDeleting, isRestoring }) => {
  const currentIndex = STATUS_FLOW.indexOf(concern.status)
  const isDeleted = concern.status === 'deleted'
  const navigate = useNavigate()

  const goToProfile = (e, studentId) => {
    e.stopPropagation()
    navigate(`/dashboard/student/${studentId}`)
  }

  return (
    <div
      className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition cursor-pointer"
      onClick={() => onViewReport?.(concern)}
    >
      <div className="flex justify-between items-start mb-2">
        <div className="flex-1">
          <h3 className="text-xl font-semibold text-gray-800 mb-1">{concern.title}</h3>
          {isCounselor && (
            <p className="text-sm text-gray-600 flex items-center gap-2 flex-wrap">
              <span>
                Submitted by:{' '}
                <button
                  onClick={(e) => goToProfile(e, concern.userId)}
                  className="text-primary-600 hover:underline font-medium"
                >
                  {concern.firstName} {concern.lastName}
                </button>
                {concern.studentId && ` (LRN: ${concern.studentId})`}
              </span>
              {concern.concernCount != null && concern.concernCount >= 2 && (
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold ${
                  concern.concernCount >= 4 ? 'bg-red-100 text-red-700' :
                  concern.concernCount >= 2 ? 'bg-amber-100 text-amber-700' :
                  'bg-gray-100 text-gray-600'
                }`}>
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path d="M3 6a3 3 0 013-3h10l-4 4 4 4H6a3 3 0 01-3-3V6z" /></svg>
                  {concern.concernCount} reports
                </span>
              )}
            </p>
          )}
          {isCounselor && concern.involvedStudents && concern.involvedStudents.length > 0 && (
            <div className="mt-1 flex items-center gap-1 flex-wrap text-xs">
              <span className="text-gray-500 font-medium">Involved:</span>
              {concern.involvedStudents.map(s => (
                <button
                  key={s.id}
                  onClick={(e) => goToProfile(e, s.id)}
                  className="px-2 py-0.5 bg-orange-50 text-orange-700 border border-orange-200 rounded-full hover:bg-orange-100 transition"
                >
                  {s.firstName} {s.lastName}
                </button>
              ))}
            </div>
          )}
        </div>
        {!isDeleted && (
          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${STATUS_COLORS[concern.status] || STATUS_COLORS.pending}`}>
            {STATUS_LABELS[concern.status] || concern.status}
          </span>
        )}
      </div>

      <p className="text-gray-600 mb-3">{concern.description}</p>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
        <div className="flex gap-4 text-sm text-gray-500">
          <span>Category: <span className="font-semibold capitalize">{concern.category}</span></span>
          <span>Created: {new Date(concern.createdAt).toLocaleDateString()}</span>
        </div>

        {isCounselor && (
          <div className="flex flex-wrap gap-2" onClick={(e) => e.stopPropagation()}>
            {!isDeleted ? (
              <>
                <button
                  onClick={() => onViewReport?.(concern)}
                  className="px-3 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 transition font-semibold"
                >
                  View / Review
                </button>
                {STATUS_FLOW.map((status, index) => {
                  if (index <= currentIndex) return null
                  return (
                    <button
                      key={status}
                      onClick={() => onStatusUpdate?.(concern.id, status)}
                      disabled={isUpdating}
                      className="px-3 py-1 text-xs bg-primary-100 text-primary-700 rounded hover:bg-primary-200 transition disabled:opacity-50 flex items-center gap-1"
                    >
                      {isUpdating && <Spinner className="h-3 w-3" />}
                      Mark as {status === 'in_review' ? 'In Progress' : STATUS_LABELS[status]}
                    </button>
                  )
                })}
                <button
                  onClick={() => onDelete?.(concern.id)}
                  disabled={isDeleting}
                  className="px-3 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200 transition disabled:opacity-50 flex items-center gap-1"
                >
                  {isDeleting && <Spinner className="h-3 w-3" />}
                  {isDeleting ? 'Archiving...' : 'Archive'}
                </button>
              </>
            ) : (
              <>
                <span className="px-3 py-1 text-xs bg-red-100 text-red-700 rounded-full font-semibold">Archived</span>
                <button
                  onClick={() => onRestore?.(concern.id)}
                  disabled={isRestoring}
                  className="px-3 py-1 text-xs bg-primary-600 text-white rounded hover:bg-primary-700 transition disabled:opacity-50 flex items-center gap-1"
                >
                  {isRestoring && <Spinner className="h-3 w-3" />}
                  {isRestoring ? 'Restoring...' : 'Restore'}
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default ConcernCard
