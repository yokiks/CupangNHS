import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import PageBackground from '../components/PageBackground'
import axios from 'axios'

const MAX_PROOF_SIZE = 10 * 1024 * 1024
const ALLOWED_PROOF_TYPES = ['image/jpeg', 'image/png', 'application/pdf']

const Revalidation = () => {
  const { user } = useAuth()
  const { showToast } = useToast()
  const navigate = useNavigate()
  const [gradeLevel, setGradeLevel] = useState('')
  const [section, setSection] = useState('')
  const [file, setFile] = useState(null)
  const [summary, setSummary] = useState(null)
  const [summaryError, setSummaryError] = useState('')
  const [summaryLoading, setSummaryLoading] = useState(false)
  const [submittedRequest, setSubmittedRequest] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (user?.accountStatus !== 'pending_revalidation') {
      navigate('/dashboard', { replace: true })
    }
  }, [navigate, user])

  useEffect(() => {
    if (user?.accountStatus !== 'pending_revalidation') {
      return
    }

    let isMounted = true
    setSummaryLoading(true)
    setSummaryError('')
    axios
      .get('/api/revalidation-requests/summary')
      .then((res) => {
        if (!isMounted) return
        setSummary(res.data)
        setGradeLevel(res.data.expectedNextGrade || res.data.minSelectableGrade || '')
      })
      .catch((error) => {
        if (!isMounted) return
        const message = error.response?.data?.message || 'Unable to load your enrollment summary.'
        setSummaryError(message)
        showToast(message, 'error')
      })
      .finally(() => {
        if (isMounted) setSummaryLoading(false)
      })

    return () => {
      isMounted = false
    }
  }, [showToast, user])

  const handleFileChange = (e) => {
    const selectedFile = e.target.files?.[0] || null
    if (selectedFile && !ALLOWED_PROOF_TYPES.includes(selectedFile.type)) {
      e.target.value = ''
      setFile(null)
      showToast('School ID must be a JPG, JPEG, PNG, or PDF file.', 'error')
      return
    }
    if (selectedFile && selectedFile.size > MAX_PROOF_SIZE) {
      e.target.value = ''
      setFile(null)
      showToast('School ID file must not exceed 10 MB.', 'error')
      return
    }
    setFile(selectedFile)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (summaryError) {
      showToast(summaryError, 'error')
      return
    }
    if (!summary?.canSubmit || (!summary?.manualGuidanceReview && !summary?.expectedNextGrade)) {
      showToast(summary?.note || 'No approved enrollment record was found. Please contact the guidance office before submitting.', 'error')
      return
    }
    if (!summary.manualGuidanceReview && !summary.catchUpAllowed && gradeLevel !== summary.expectedNextGrade) {
      showToast(`Please use Grade ${summary.expectedNextGrade} as your updated grade level.`, 'error')
      return
    }
    if (!section.trim()) {
      showToast('Please enter your updated section.', 'error')
      return
    }
    if (!file) {
      showToast('Please upload your school ID or enrollment proof.', 'error')
      return
    }

    setSubmitting(true)
    try {
      const formData = new FormData()
      formData.append('gradeLevel', gradeLevel)
      formData.append('section', section.trim())
      formData.append('schoolIdProof', file)
      const res = await axios.post('/api/revalidation-requests', formData)
      setSubmittedRequest(res.data.request || null)
      setFile(null)
      showToast(res.data.message || 'Your revalidation request was submitted. Please wait for approval.', 'success')
    } catch (error) {
      showToast(error.response?.data?.message || error.message || 'Unable to submit revalidation documents.', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <PageBackground>
      <Navbar />
      <main className="flex-grow container mx-auto px-4 py-10 md:py-14">
        <div className="max-w-3xl mx-auto bg-white rounded-3xl shadow-xl p-8 md:p-12">
          <h1 className="text-3xl font-bold text-primary-700 mb-4">Enrollment Revalidation Required</h1>
          <p className="text-gray-600 mb-6">
            Your account requires enrollment revalidation before you can submit concerns. Upload your updated school ID or enrollment proof below.
          </p>

          <div className="space-y-4 mb-8">
            <div className="rounded-2xl border border-gray-200 p-5 bg-gray-50">
              <h2 className="font-semibold text-gray-900 mb-2">Registration Summary</h2>
              {summaryLoading ? (
                <p className="text-gray-500">Loading enrollment summary...</p>
              ) : summaryError ? (
                <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                  {summaryError}
                </div>
              ) : (
                <div className="space-y-1">
                  <p className="text-gray-700">Name: {user?.firstName} {user?.lastName}</p>
                  <p className="text-gray-700">Username: {user?.username}</p>
                  <p className="text-gray-700">LRN: {user?.lrn || 'N/A'}</p>
                  <p className="text-gray-700">
                    Previous School Year: {summary?.previousEnrollment?.schoolYear?.label || 'No approved record found'}
                  </p>
                  <p className="text-gray-700">
                    Last Approved Grade / Section: {summary?.previousEnrollment?.label || 'No approved record found'}
                  </p>
                  <p className="text-gray-700">
                    New School Year: {summary?.activeSchoolYear?.label || 'No active school year'}
                  </p>
                  <p className="text-gray-700">
                    Required Next Grade: {summary?.manualGuidanceReview
                      ? 'Manual guidance review'
                      : summary?.expectedNextGrade
                      ? `Grade ${summary.expectedNextGrade}`
                      : 'Needs guidance review'}
                  </p>
                  {(summary?.catchUpAllowed || summary?.manualGuidanceReview) && (
                    <p className="text-gray-700">
                      Review Type: {summary?.manualGuidanceReview ? 'Guidance-enabled manual review' : 'Catch-up / Manual Review'}
                    </p>
                  )}
                  <p className="text-gray-700">Status: Pending Revalidation</p>
                </div>
              )}
            </div>

            {summary?.note && (
              <div className={`rounded-2xl border p-5 text-sm ${
                summary.canSubmit
                  ? 'border-primary-100 bg-primary-50 text-primary-700'
                  : 'border-yellow-200 bg-yellow-50 text-yellow-800'
              }`}>
                <p className="font-semibold">{summary.canSubmit ? 'Grade Level Reminder' : 'Please Contact Guidance'}</p>
                <p className="mt-1">{summary.note}</p>
              </div>
            )}

            {submittedRequest && (
              <div className="rounded-2xl border border-green-200 bg-green-50 p-5 text-green-800">
                <p className="font-semibold">Revalidation request submitted</p>
                <p className="mt-1 text-sm">
                  School Year: {submittedRequest.schoolYear?.label || 'Active school year'}
                </p>
                <p className="text-sm">
                  Requested Enrollment: Grade {submittedRequest.gradeLevel} - {submittedRequest.section}
                </p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label htmlFor="gradeLevel" className="block text-sm font-semibold text-gray-700 mb-2">
                    Updated Grade Level *
                  </label>
                  {summary?.catchUpAllowed || summary?.manualGuidanceReview ? (
                    <select
                      id="gradeLevel"
                      value={gradeLevel}
                      onChange={(e) => setGradeLevel(e.target.value)}
                      className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-gray-700"
                    >
                      {Array.from(
                        {
                          length:
                            Number(summary.maxSelectableGrade || summary.expectedNextGrade) -
                            Number(summary.minSelectableGrade || summary.expectedNextGrade) +
                            1,
                        },
                        (_, index) => Number(summary.minSelectableGrade || summary.expectedNextGrade) + index
                      ).map((grade) => (
                        <option key={grade} value={String(grade)}>
                          Grade {grade}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      id="gradeLevel"
                      type="text"
                      value={gradeLevel ? `Grade ${gradeLevel}` : ''}
                      readOnly
                      placeholder="Loaded from your previous enrollment"
                      className="w-full rounded-xl border border-gray-300 bg-gray-100 px-4 py-3 text-gray-700"
                    />
                  )}
                  <p className="mt-2 text-xs text-gray-500">
                    {summary?.catchUpAllowed
                      ? 'Select your current grade based on your uploaded proof. Guidance will manually verify it.'
                      : 'Grade level is automatic. Enter your updated section beside it.'}
                  </p>
                </div>

                <div>
                  <label htmlFor="section" className="block text-sm font-semibold text-gray-700 mb-2">
                    Updated Section *
                  </label>
                  <input
                    id="section"
                    type="text"
                    value={section}
                    onChange={(e) => setSection(e.target.value)}
                    placeholder="Enter section"
                    maxLength={50}
                    className="w-full rounded-xl border border-gray-300 px-4 py-3 text-gray-700"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Upload School ID or Enrollment Proof *</label>
                <input
                  type="file"
                  accept=".jpg,.jpeg,.png,.pdf,image/jpeg,image/png,application/pdf"
                  onChange={handleFileChange}
                  className="w-full text-sm text-gray-700 border border-gray-300 rounded-xl p-3"
                />
                {file && <p className="mt-2 text-sm text-gray-500">Selected file: {file.name}</p>}
                <p className="mt-2 text-xs text-gray-500">JPG, JPEG, PNG, or PDF only. Maximum file size: 10 MB.</p>
              </div>

              <button
                type="submit"
                disabled={submitting || summaryLoading || Boolean(submittedRequest)}
                className="w-full py-4 bg-primary-600 text-white font-bold rounded-xl shadow-lg hover:bg-primary-700 disabled:opacity-50"
              >
                {submitting ? 'Submitting...' : submittedRequest ? 'Submitted for Review' : 'Upload and Request Approval'}
              </button>
            </form>
          </div>

          <div className="rounded-2xl border border-primary-100 bg-primary-50 p-5 text-sm text-primary-700">
            <p className="font-semibold">Note:</p>
            <p>
              After you upload your updated document, the guidance counselor will review it and approve your account again.
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </PageBackground>
  )
}

export default Revalidation
