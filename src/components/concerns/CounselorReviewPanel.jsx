import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { useToast } from '../../context/ToastContext'
import Spinner from '../Spinner'

const STATUS_LABELS = {
  pending: 'Pending',
  read: 'Read',
  in_review: 'In Progress',
  resolved: 'Resolved',
  deleted: 'Deleted',
}

const CounselorReviewPanel = ({ concernId, onClose, onPrint }) => {
  const navigate = useNavigate()
  const { showToast } = useToast()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [notifyingParent, setNotifyingParent] = useState(false)

  const [adminNotes, setAdminNotes] = useState('')
  const [findings, setFindings] = useState('')
  const [recommendations, setRecommendations] = useState('')
  const [closingRemarks, setClosingRemarks] = useState('')
  const [followUpRequired, setFollowUpRequired] = useState(false)

  useEffect(() => {
    if (!concernId) return
    setLoading(true)
    axios.get(`/api/concerns/${concernId}/report`)
      .then((res) => {
        setData(res.data)
        if (res.data.report) {
          setAdminNotes(res.data.report.adminNotes || '')
          setFindings(res.data.report.findings || '')
          setRecommendations(res.data.report.recommendations || '')
          setClosingRemarks(res.data.report.closingRemarks || '')
          setFollowUpRequired(res.data.report.followUpRequired || false)
        }
      })
      .catch((err) => {
        console.error('Failed to load report data:', err)
        showToast('Failed to load concern details.', 'error')
        onClose?.()
      })
      .finally(() => setLoading(false))
  }, [concernId, onClose])

  const handleSave = async () => {
    setSaving(true)
    try {
      await axios.put(`/api/concerns/${concernId}/report`, {
        adminNotes,
        findings,
        recommendations,
        closingRemarks,
        followUpRequired,
      })
      showToast('Report saved successfully!', 'success')
    } catch {
      showToast('Failed to save report. Please try again.', 'error')
    } finally {
      setSaving(false)
    }
  }

  const handlePrintReport = () => {
    onPrint?.({
      ...data,
      report: {
        adminNotes,
        findings,
        recommendations,
        closingRemarks,
        followUpRequired,
      },
    })
  }

  const handleNotifyParent = async () => {
    const hasInvolved = involvedStudents && involvedStudents.length > 0
    const confirmMsg = hasInvolved
      ? 'Send an email notification to the reporting student\'s parent and the parents of all involved students?'
      : 'Send an email notification to the parent/guardian about this concern?'
    if (!window.confirm(confirmMsg)) return
    setNotifyingParent(true)
    try {
      const res = await axios.post(`/api/concerns/${concernId}/notify-parent`)
      showToast(res.data.message || 'Parent notification sent successfully!', 'success')
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to send parent notification.', 'error')
    } finally {
      setNotifyingParent(false)
    }
  }

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
        <div className="bg-white rounded-xl p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading concern details...</p>
        </div>
      </div>
    )
  }

  if (!data) return null

  const { concern, student, statusHistory, files, involvedStudents } = data

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex justify-between items-center z-10">
          <h2 className="text-xl font-bold text-primary-600">Concern Review</h2>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition font-semibold disabled:opacity-50 flex items-center gap-2"
            >
              {saving && <Spinner />}
              {saving ? 'Saving...' : 'Save'}
            </button>
            <button
              onClick={handleNotifyParent}
              disabled={notifyingParent}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold disabled:opacity-50 flex items-center gap-1"
            >
              {notifyingParent ? <Spinner /> : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
              )}
              {notifyingParent ? 'Sending...' : (involvedStudents && involvedStudents.length > 0 ? 'Notify Parents' : 'Notify Parent')}
            </button>
            <button
              onClick={handlePrintReport}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition font-semibold"
            >
              Print Report
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition font-semibold"
            >
              Close
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Section I: Student Information */}
          <section>
            <h3 className="text-sm font-bold text-white bg-primary-600 px-3 py-2 mb-3">I. STUDENT INFORMATION</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              <div className="flex gap-2 border-b border-gray-100 pb-2">
                <span className="font-semibold text-primary-700 min-w-[140px]">Student Name:</span>
                <button
                  onClick={() => { onClose?.(); navigate(`/dashboard/student/${student.id}`) }}
                  className="text-primary-600 hover:underline font-medium"
                >
                  {student.firstName} {student.lastName}
                </button>
              </div>
              <div className="flex gap-2 border-b border-gray-100 pb-2">
                <span className="font-semibold text-primary-700 min-w-[140px]">Student ID/LRN:</span>
                <span>{student.lrn || 'N/A'}</span>
              </div>
              <div className="flex gap-2 border-b border-gray-100 pb-2">
                <span className="font-semibold text-primary-700 min-w-[140px]">Grade/Section:</span>
                <span>{student.gradeLevel && student.section ? `${student.gradeLevel} - ${student.section}` : 'N/A'}</span>
              </div>
              <div className="flex gap-2 border-b border-gray-100 pb-2">
                <span className="font-semibold text-primary-700 min-w-[140px]">Date Submitted:</span>
                <span>{new Date(concern.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          </section>

          {/* Section: Involved Students */}
          {involvedStudents && involvedStudents.length > 0 && (
            <section>
              <h3 className="text-sm font-bold text-white bg-orange-600 px-3 py-2 mb-3">INVOLVED STUDENTS</h3>
              <div className="flex flex-wrap gap-2">
                {involvedStudents.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => { onClose?.(); navigate(`/dashboard/student/${s.id}`) }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-orange-50 text-orange-800 border border-orange-200 rounded-full text-sm font-medium hover:bg-orange-100 transition"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                    {s.firstName} {s.lastName}
                    {s.lrn && <span className="text-orange-500 text-xs">({s.lrn})</span>}
                  </button>
                ))}
              </div>
            </section>
          )}

          {/* Section II: Concern Details */}
          <section>
            <h3 className="text-sm font-bold text-white bg-primary-600 px-3 py-2 mb-3">II. CONCERN DETAILS</h3>
            <div className="space-y-2 text-sm">
              <div className="flex gap-2 border-b border-gray-100 pb-2">
                <span className="font-semibold text-primary-700 min-w-[140px]">Title:</span>
                <span className="font-bold">{concern.title}</span>
              </div>
              <div className="flex gap-2 border-b border-gray-100 pb-2">
                <span className="font-semibold text-primary-700 min-w-[140px]">Category:</span>
                <span className="capitalize">{concern.category}</span>
              </div>
              <div className="flex gap-2 border-b border-gray-100 pb-2">
                <span className="font-semibold text-primary-700 min-w-[140px]">Current Status:</span>
                <span className="capitalize font-semibold">{STATUS_LABELS[concern.status]}</span>
              </div>
              <div>
                <span className="font-semibold text-primary-700 block mb-1">Description:</span>
                <div className="bg-gray-50 border border-gray-200 rounded p-3 whitespace-pre-wrap">
                  {concern.description}
                </div>
              </div>
            </div>

            {files && files.length > 0 && (
              <div className="mt-3">
                <span className="font-semibold text-sm text-primary-700">Attached Files ({files.length}):</span>
                <div className="mt-1 space-y-1">
                  {files.map((f) => (
                    <a
                      key={f.id}
                      href={f.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block text-sm text-blue-600 hover:underline bg-gray-50 px-3 py-1 rounded"
                    >
                      {f.name} ({(f.size / 1024).toFixed(1)} KB)
                    </a>
                  ))}
                </div>
              </div>
            )}
          </section>

          {/* Section III: Status Timeline */}
          <section>
            <h3 className="text-sm font-bold text-white bg-primary-600 px-3 py-2 mb-3">III. STATUS TIMELINE</h3>
            {statusHistory.length > 0 ? (
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

          {/* Section IV: Counselor Notes */}
          <section>
            <h3 className="text-sm font-bold text-white bg-primary-600 px-3 py-2 mb-3">IV. COUNSELOR NOTES / REMARKS</h3>
            <textarea
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
              placeholder="Add your notes and remarks here..."
              className="w-full px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 min-h-[80px] text-sm"
              rows="3"
            />
          </section>

          {/* Section V: Summary of Findings */}
          <section>
            <h3 className="text-sm font-bold text-white bg-primary-600 px-3 py-2 mb-3">V. SUMMARY OF FINDINGS</h3>
            <textarea
              value={findings}
              onChange={(e) => setFindings(e.target.value)}
              placeholder="Document your findings and observations..."
              className="w-full px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 min-h-[80px] text-sm"
              rows="3"
            />
          </section>

          {/* Section VI: Recommendations */}
          <section>
            <h3 className="text-sm font-bold text-white bg-primary-600 px-3 py-2 mb-3">VI. RECOMMENDATIONS / ACTIONS</h3>
            <textarea
              value={recommendations}
              onChange={(e) => setRecommendations(e.target.value)}
              placeholder="List recommendations and actions taken..."
              className="w-full px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 min-h-[80px] text-sm"
              rows="3"
            />
          </section>

          {/* Section VII: Closing Remarks */}
          <section>
            <h3 className="text-sm font-bold text-white bg-primary-600 px-3 py-2 mb-3">VII. CLOSING REMARKS</h3>
            <textarea
              value={closingRemarks}
              onChange={(e) => setClosingRemarks(e.target.value)}
              placeholder="Add final summary and closing remarks..."
              className="w-full px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 min-h-[80px] text-sm"
              rows="3"
            />
          </section>

          {/* Follow-up Required */}
          <section>
            <h3 className="text-sm font-bold text-white bg-primary-600 px-3 py-2 mb-3">FOLLOW-UP</h3>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={followUpRequired}
                onChange={(e) => setFollowUpRequired(e.target.checked)}
                className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
              <span>Follow-up is required for this concern</span>
            </label>
          </section>
        </div>
      </div>
    </div>
  )
}

export default CounselorReviewPanel
