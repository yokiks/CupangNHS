import { useState, useEffect } from 'react'
import axios from 'axios'

const STATUS_LABELS = {
  pending: 'Pending',
  read: 'Read',
  in_review: 'In Progress',
  resolved: 'Resolved',
}

const STATUS_COLORS = {
  pending: 'bg-gray-100 text-gray-800',
  read: 'bg-blue-100 text-blue-800',
  in_review: 'bg-yellow-100 text-yellow-800',
  resolved: 'bg-green-100 text-green-800',
}

const StudentConcernDetail = ({ concernId, onClose }) => {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!concernId) return
    setLoading(true)
    axios.get(`/api/concerns/${concernId}/report`)
      .then((res) => setData(res.data))
      .catch((err) => {
        console.error('Failed to load concern details:', err)
        onClose?.()
      })
      .finally(() => setLoading(false))
  }, [concernId, onClose])

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
        <div className="bg-white rounded-xl p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading concern details...</p>
        </div>
      </div>
    )
  }

  if (!data) return null

  const { concern, student, statusHistory, files } = data

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex justify-between items-center z-10">
          <h2 className="text-xl font-bold text-primary-600">Concern Details</h2>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition font-semibold"
          >
            Close
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Title & Status */}
          <div className="flex justify-between items-start">
            <h3 className="text-2xl font-bold text-gray-800">{concern.title}</h3>
            <span className={`px-3 py-1 rounded-full text-xs font-semibold shrink-0 ml-3 ${STATUS_COLORS[concern.status]}`}>
              {STATUS_LABELS[concern.status]}
            </span>
          </div>

          {/* Info Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            <div className="flex gap-2 border-b border-gray-100 pb-2">
              <span className="font-semibold text-primary-700 min-w-[120px]">Category:</span>
              <span className="capitalize">{concern.category}</span>
            </div>
            <div className="flex gap-2 border-b border-gray-100 pb-2">
              <span className="font-semibold text-primary-700 min-w-[120px]">Date Submitted:</span>
              <span>{new Date(concern.createdAt).toLocaleDateString()}</span>
            </div>
            {concern.updatedAt && (
              <div className="flex gap-2 border-b border-gray-100 pb-2">
                <span className="font-semibold text-primary-700 min-w-[120px]">Last Updated:</span>
                <span>{new Date(concern.updatedAt).toLocaleDateString()}</span>
              </div>
            )}
          </div>

          {/* Description */}
          <section>
            <h4 className="text-sm font-bold text-white bg-primary-600 px-3 py-2 mb-3">DESCRIPTION</h4>
            <div className="bg-gray-50 border border-gray-200 rounded p-3 whitespace-pre-wrap text-sm">
              {concern.description}
            </div>
          </section>

          {/* Attachments */}
          {files && files.length > 0 && (
            <section>
              <h4 className="text-sm font-bold text-white bg-primary-600 px-3 py-2 mb-3">ATTACHMENTS ({files.length})</h4>
              <div className="space-y-1">
                {files.map((f) => (
                  <a
                    key={f.id}
                    href={f.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block text-sm text-blue-600 hover:underline bg-gray-50 px-3 py-2 rounded"
                  >
                    {f.name} ({(f.size / 1024).toFixed(1)} KB)
                  </a>
                ))}
              </div>
            </section>
          )}

          {/* Status Timeline */}
          <section>
            <h4 className="text-sm font-bold text-white bg-primary-600 px-3 py-2 mb-3">STATUS TIMELINE</h4>
            {statusHistory && statusHistory.length > 0 ? (
              <div className="space-y-2">
                {statusHistory.map((h) => (
                  <div key={h.id} className="border-l-4 border-primary-500 pl-3 py-1 text-sm">
                    <span className="font-semibold capitalize">{STATUS_LABELS[h.newStatus] || h.newStatus}</span>
                    {h.oldStatus && (
                      <span className="text-gray-500"> (from {STATUS_LABELS[h.oldStatus] || h.oldStatus})</span>
                    )}
                    <br />
                    <span className="text-gray-500">
                      {new Date(h.timestamp).toLocaleString()} &mdash; by {h.changedBy}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="border-l-4 border-primary-500 pl-3 py-1 text-sm">
                <span className="font-semibold">Submitted</span><br />
                <span className="text-gray-500">{new Date(concern.createdAt).toLocaleString()}</span>
              </div>
            )}
          </section>

          {/* Counselor Notes (read-only, only if they exist) */}
          {data.report && (
            <section>
              <h4 className="text-sm font-bold text-white bg-primary-600 px-3 py-2 mb-3">COUNSELOR FEEDBACK</h4>
              <div className="space-y-3 text-sm">
                {data.report.adminNotes && (
                  <div>
                    <span className="font-semibold text-primary-700 block mb-1">Notes:</span>
                    <div className="bg-gray-50 border border-gray-200 rounded p-3 whitespace-pre-wrap">{data.report.adminNotes}</div>
                  </div>
                )}
                {data.report.recommendations && (
                  <div>
                    <span className="font-semibold text-primary-700 block mb-1">Recommendations:</span>
                    <div className="bg-gray-50 border border-gray-200 rounded p-3 whitespace-pre-wrap">{data.report.recommendations}</div>
                  </div>
                )}
                {data.report.closingRemarks && (
                  <div>
                    <span className="font-semibold text-primary-700 block mb-1">Closing Remarks:</span>
                    <div className="bg-gray-50 border border-gray-200 rounded p-3 whitespace-pre-wrap">{data.report.closingRemarks}</div>
                  </div>
                )}
                <div className="flex gap-2 border-b border-gray-100 pb-2">
                  <span className="font-semibold text-primary-700 min-w-[140px]">Follow-up Required:</span>
                  <span>{data.report.followUpRequired ? 'Yes' : 'No'}</span>
                </div>
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  )
}

export default StudentConcernDetail
