import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { BadgeCheck, BookOpen, CalendarDays, Eye, Mail, UploadCloud, UserRound } from 'lucide-react'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import PageBackground from '../components/PageBackground'
import ConcernForm from '../components/concerns/ConcernForm'
import ConcernList from '../components/concerns/ConcernList'
import CounselorReviewPanel from '../components/concerns/CounselorReviewPanel'
import StudentConcernDetail from '../components/concerns/StudentConcernDetail'
import PendingRegistrations from '../components/registrations/PendingRegistrations'
import RevalidationReview from '../components/registrations/RevalidationReview'
import StudentAccountManager from '../components/registrations/StudentAccountManager'
import { openPrintableReport, openOverallReport } from '../components/concerns/ConcernReport'
import axios from 'axios'

const STATUS_LABELS = {
  active: 'Active',
  pending_revalidation: 'Pending Revalidation',
  inactive: 'Inactive',
  graduated: 'Graduated',
  pending_approval: 'Pending Approval',
  transferred: 'Transferred',
}

const formatGradeSection = (gradeLevel, section) => {
  if (gradeLevel && section) return `Grade ${gradeLevel} - ${section}`
  if (gradeLevel) return `Grade ${gradeLevel}`
  return section || 'N/A'
}

const StudentInfoItem = ({ icon: Icon, label, value }) => (
  <div className="flex items-start gap-2.5 border-t border-gray-100 py-2 first:border-t-0">
    <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary-50 text-primary-700">
      <Icon className="h-4 w-4" aria-hidden="true" />
    </span>
    <div className="min-w-0">
      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">{label}</p>
      <p className="mt-0.5 break-words text-sm font-semibold text-gray-900">{value || 'N/A'}</p>
    </div>
  </div>
)

const Dashboard = () => {
  const { user, updateUser } = useAuth()
  const { showToast } = useToast()
  const [showForm, setShowForm] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)
  const [pendingRegistrationRefreshKey, setPendingRegistrationRefreshKey] = useState(0)
  const [revalidationRefreshKey, setRevalidationRefreshKey] = useState(0)
  const [reviewConcernId, setReviewConcernId] = useState(null)
  const [reviewConcernDeleted, setReviewConcernDeleted] = useState(false)
  const [generatingReport, setGeneratingReport] = useState(false)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const [removingPhoto, setRemovingPhoto] = useState(false)
  const [showPhotoModal, setShowPhotoModal] = useState(false)
  const [cropImageUrl, setCropImageUrl] = useState('')
  const [cropScale, setCropScale] = useState(1)
  const [cropRotation, setCropRotation] = useState(0)
  const [draggingPhoto, setDraggingPhoto] = useState(false)

  const isCounselor = user?.role === 'guidance_counselor'

  useEffect(() => {
    if (user?.role !== 'student') return

    let isMounted = true
    axios.get('/api/auth/me')
      .then((res) => {
        if (isMounted && res.data?.user) {
          updateUser(res.data.user)
        }
      })
      .catch(() => {})

    return () => {
      isMounted = false
    }
  }, [user?.role])

  const triggerRefresh = useCallback(() => {
    setRefreshKey(k => k + 1)
    setShowForm(false)
  }, [])

  const handleViewReport = useCallback((concern, isDeletedView = false) => {
    setReviewConcernId(concern.id)
    setReviewConcernDeleted(concern.status === 'deleted' || isDeletedView)
  }, [])

  const handleGenerateOverallReport = useCallback(async () => {
    setGeneratingReport(true)
    try {
      const res = await axios.get('/api/concerns/report')
      openOverallReport(res.data)
    } catch {
      showToast('Failed to generate report. Please try again.', 'error')
    } finally {
      setGeneratingReport(false)
    }
  }, [showToast])

  const handlePrintReport = useCallback((data) => {
    openPrintableReport(data, `${user?.firstName || ''} ${user?.lastName || ''}`)
  }, [user])

  const prepareProfilePhoto = (file) => {
    if (!file) return

    if (!file.type.startsWith('image/')) {
      showToast('Please upload an image file.', 'error')
      return
    }

    if (cropImageUrl) {
      URL.revokeObjectURL(cropImageUrl)
    }
    setCropScale(1)
    setCropRotation(0)
    setCropImageUrl(URL.createObjectURL(file))
    setShowPhotoModal(false)
  }

  const handleProfilePhotoChange = async (event) => {
    prepareProfilePhoto(event.target.files?.[0])
    event.target.value = ''
  }

  const handleProfilePhotoDrop = (event) => {
    event.preventDefault()
    setDraggingPhoto(false)
    prepareProfilePhoto(event.dataTransfer.files?.[0])
  }

  const handleCropAndUpload = async () => {
    if (!cropImageUrl) return

    setUploadingPhoto(true)
    try {
      const image = new Image()
      image.src = cropImageUrl
      await new Promise((resolve, reject) => {
        image.onload = resolve
        image.onerror = reject
      })

      const size = 512
      const canvas = document.createElement('canvas')
      canvas.width = size
      canvas.height = size
      const ctx = canvas.getContext('2d')
      const naturalMin = Math.min(image.naturalWidth, image.naturalHeight)
      const cropSize = naturalMin / cropScale
      const sx = (image.naturalWidth - cropSize) / 2
      const sy = (image.naturalHeight - cropSize) / 2
      const rotation = ((cropRotation % 360) + 360) % 360

      ctx.save()
      ctx.translate(size / 2, size / 2)
      ctx.rotate((rotation * Math.PI) / 180)
      ctx.drawImage(image, sx, sy, cropSize, cropSize, -size / 2, -size / 2, size, size)
      ctx.restore()

      const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.9))
      if (!blob) {
        throw new Error('Unable to crop profile photo.')
      }

      const formData = new FormData()
      formData.append('profilePhoto', blob, 'profile-photo.jpg')
      const res = await axios.patch('/api/auth/me/profile-photo', formData)
      updateUser(res.data.user)
      URL.revokeObjectURL(cropImageUrl)
      setCropImageUrl('')
      showToast('Profile photo updated.', 'success')
    } catch (error) {
      showToast(error.response?.data?.message || 'Unable to upload profile photo.', 'error')
    } finally {
      setUploadingPhoto(false)
    }
  }

  const handleCancelCrop = () => {
    if (cropImageUrl) {
      URL.revokeObjectURL(cropImageUrl)
    }
    setCropImageUrl('')
    setCropScale(1)
    setCropRotation(0)
  }

  const handleRemoveProfilePhoto = async () => {
    if (!user?.profilePhotoUrl || !window.confirm('Remove your profile picture?')) {
      return
    }

    setRemovingPhoto(true)
    try {
      const res = await axios.delete('/api/auth/me/profile-photo')
      updateUser(res.data.user)
      setShowPhotoModal(false)
      showToast('Profile photo removed.', 'success')
    } catch (error) {
      showToast(error.response?.data?.message || 'Unable to remove profile photo.', 'error')
    } finally {
      setRemovingPhoto(false)
    }
  }

  return (
    <PageBackground>
      <Navbar />

      <main className="flex-grow container mx-auto px-4 py-8 md:py-12">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-primary-600 mb-2">
            {isCounselor ? `Welcome, ${user?.firstName} ${user?.lastName}!` : 'Submit and track your concerns'}
          </h1>
          <p className="text-gray-600">
            {isCounselor ? 'Manage student concerns' : 'Manage your student profile and concern submissions'}
          </p>
        </div>

        {user?.role === 'student' && (
          <div className="mb-8">
            <div className="mb-5 overflow-hidden rounded-2xl border border-primary-100 bg-white shadow-lg">
              <div className="grid gap-0 lg:grid-cols-[minmax(220px,270px)_1fr]">
                <div className="flex flex-col items-center justify-center bg-gradient-to-b from-primary-50 to-white px-4 py-5 text-center sm:px-5">
                  <label
                    onDragOver={(event) => {
                      event.preventDefault()
                      setDraggingPhoto(true)
                    }}
                    onDragLeave={() => setDraggingPhoto(false)}
                    onDrop={handleProfilePhotoDrop}
                    className={`relative h-24 w-24 cursor-pointer overflow-hidden rounded-full bg-primary-100 flex items-center justify-center text-2xl font-bold text-primary-700 ring-4 transition sm:h-28 sm:w-28 ${
                      draggingPhoto ? 'ring-primary-400' : 'ring-white hover:ring-primary-200'
                    }`}
                    aria-label="Upload profile picture"
                  >
                    {user.profilePhotoUrl ? (
                      <img
                        src={user.profilePhotoUrl}
                        alt={`${user.firstName} ${user.lastName}`}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <span>{user.firstName?.[0]}{user.lastName?.[0]}</span>
                    )}
                    <span className="absolute inset-x-0 bottom-0 flex items-center justify-center gap-1 bg-black bg-opacity-55 py-2 text-xs font-semibold text-white">
                      <UploadCloud className="h-3.5 w-3.5" aria-hidden="true" />
                      Upload
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleProfilePhotoChange}
                      disabled={uploadingPhoto}
                      className="hidden"
                    />
                  </label>

                  <h2 className="mt-3 max-w-full break-words text-lg font-bold text-gray-900 sm:text-xl">
                    {user?.firstName} {user?.lastName}
                  </h2>
                  <span className="mt-1.5 inline-flex max-w-full items-center gap-1.5 rounded-full bg-white px-3 py-1 text-xs font-semibold text-primary-700 shadow-sm ring-1 ring-primary-100">
                    <BadgeCheck className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                    <span className="truncate">
                      {STATUS_LABELS[user?.accountStatus] || user?.accountStatus || 'N/A'}
                    </span>
                  </span>

                  <p className="mt-3 max-w-xs text-xs leading-5 text-gray-600 sm:text-sm">
                    Tap the circle to upload, crop, zoom, rotate, and preview your student photo.
                  </p>

                  {user.profilePhotoUrl && (
                    <button
                      type="button"
                      onClick={() => setShowPhotoModal(true)}
                      className="mt-3 inline-flex items-center gap-2 rounded-lg border border-primary-200 bg-white px-3 py-1.5 text-sm font-semibold text-primary-700 transition hover:bg-primary-50"
                    >
                      <Eye className="h-4 w-4" aria-hidden="true" />
                      View Picture
                    </button>
                  )}
                </div>

                <div className="px-4 py-4 sm:px-5 lg:px-6">
                  <div className="mb-3">
                    <p className="text-sm font-semibold text-primary-700">Student Profile</p>
                    <p className="mt-0.5 text-sm text-gray-600">
                      These details help guidance counselors verify your account and current enrollment.
                    </p>
                  </div>

                  <div className="grid gap-x-6 sm:grid-cols-2">
                    <StudentInfoItem icon={UserRound} label="LRN" value={user?.lrn} />
                    <StudentInfoItem
                      icon={BookOpen}
                      label="Grade / Section"
                      value={formatGradeSection(user?.gradeLevel, user?.section)}
                    />
                    <StudentInfoItem
                      icon={CalendarDays}
                      label="School Year"
                      value={user?.lastValidatedSchoolYear?.label}
                    />
                    <StudentInfoItem
                      icon={Mail}
                      label="Email"
                      value={user?.email}
                    />
                  </div>
                </div>
              </div>
            </div>

            {(user.accountStatus === 'active') ? (
              <>
                <button
                  onClick={() => setShowForm(!showForm)}
                  className="px-6 py-3 bg-gradient-to-r from-primary-600 to-primary-700 text-white font-bold rounded-lg shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-300"
                >
                  {showForm ? 'Cancel' : '+ Submit New Concern'}
                </button>

                {showForm && (
                  <div className="mt-6">
                    <ConcernForm onSubmitted={triggerRefresh} />
                  </div>
                )}
              </>
            ) : (
              <div className="rounded-3xl border border-yellow-200 bg-yellow-50 p-6 text-yellow-800">
                {user.accountStatus === 'pending_revalidation' && (
                  <p>Your account requires enrollment revalidation before you can submit concerns. Please update your school ID or enrollment information.</p>
                )}
                {user.accountStatus === 'inactive' && (
                  <p>Your account is inactive. You cannot submit concerns at this time.</p>
                )}
                {user.accountStatus === 'graduated' && (
                  <p>Your account is graduated. You cannot submit new concerns.</p>
                )}
                {user.accountStatus === 'pending_approval' && (
                  <p>Your account is pending guidance counselor approval and cannot submit concerns yet.</p>
                )}
                {user.accountStatus === 'transferred' && (
                  <p>Your account is transferred and cannot access the system.</p>
                )}
              </div>
            )}
          </div>
        )}

        {isCounselor && (
          <>
            <div className="mb-8">
              <PendingRegistrations refreshKey={pendingRegistrationRefreshKey} />
            </div>
            <div className="mb-8">
              <RevalidationReview
                refreshKey={revalidationRefreshKey}
                onReviewed={() => {
                  setRevalidationRefreshKey((key) => key + 1)
                  setPendingRegistrationRefreshKey((key) => key + 1)
                }}
              />
            </div>
            <div className="mb-8">
              <StudentAccountManager
                onStatusUpdated={() => {
                  setPendingRegistrationRefreshKey((key) => key + 1)
                  setRevalidationRefreshKey((key) => key + 1)
                }}
              />
            </div>
          </>
        )}

        <ConcernList
          isCounselor={isCounselor}
          onViewReport={handleViewReport}
          onGenerateOverallReport={handleGenerateOverallReport}
          generatingReport={generatingReport}
          refreshKey={refreshKey}
        />
      </main>

      {reviewConcernId && (
        reviewConcernDeleted ? (
          <StudentConcernDetail
            concernId={reviewConcernId}
            onClose={() => {
              setReviewConcernId(null)
              setReviewConcernDeleted(false)
            }}
          />
        ) : isCounselor ? (
          <CounselorReviewPanel
            concernId={reviewConcernId}
            onClose={() => setReviewConcernId(null)}
            onPrint={handlePrintReport}
          />
        ) : (
          <StudentConcernDetail
            concernId={reviewConcernId}
            onClose={() => setReviewConcernId(null)}
          />
        )
      )}

      {showPhotoModal && user?.role === 'student' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 px-4">
          <div className="max-h-[92vh] w-full max-w-md overflow-y-auto rounded-3xl bg-white p-5 shadow-2xl sm:p-6">
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-xl font-bold text-gray-900">Profile Picture</h2>
              <button
                type="button"
                onClick={() => setShowPhotoModal(false)}
                className="rounded-full p-2 text-gray-500 hover:bg-gray-100"
                aria-label="Close profile picture"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="mt-5 flex justify-center">
              <div className="h-64 w-64 overflow-hidden rounded-3xl bg-primary-100 flex items-center justify-center text-6xl font-bold text-primary-700">
                {user.profilePhotoUrl ? (
                  <img
                    src={user.profilePhotoUrl}
                    alt={`${user.firstName} ${user.lastName}`}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span>{user.firstName?.[0]}{user.lastName?.[0]}</span>
                )}
              </div>
            </div>

            <div className="mt-6 flex flex-col sm:flex-row gap-3 sm:justify-end">
              {user.profilePhotoUrl && (
                <button
                  type="button"
                  onClick={handleRemoveProfilePhoto}
                  disabled={removingPhoto}
                  className="rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
                >
                  {removingPhoto ? 'Removing...' : 'Remove Picture'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {cropImageUrl && user?.role === 'student' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 px-4">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-xl font-bold text-gray-900">Crop Picture</h2>
              <button
                type="button"
                onClick={handleCancelCrop}
                className="rounded-full p-2 text-gray-500 hover:bg-gray-100"
                aria-label="Close crop picture"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="mt-5 flex justify-center">
              <div className="aspect-square w-full max-w-72 overflow-hidden rounded-3xl bg-primary-100 sm:max-w-80">
                <img
                  src={cropImageUrl}
                  alt="Profile crop preview"
                  className="h-full w-full object-cover"
                  style={{ transform: `scale(${cropScale}) rotate(${cropRotation}deg)` }}
                />
              </div>
            </div>

            <div className="mt-5 rounded-2xl border border-gray-200 bg-gray-50 p-4">
              <label htmlFor="profileCropScale" className="block text-sm font-semibold text-gray-700">
                Zoom
              </label>
              <input
                id="profileCropScale"
                type="range"
                min="1"
                max="3"
                step="0.05"
                value={cropScale}
                onChange={(e) => setCropScale(Number(e.target.value))}
                className="mt-2 w-full"
              />
              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setCropRotation((rotation) => rotation - 90)}
                  className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                >
                  Rotate Left
                </button>
                <button
                  type="button"
                  onClick={() => setCropRotation((rotation) => rotation + 90)}
                  className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                >
                  Rotate Right
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setCropScale(1)
                    setCropRotation(0)
                  }}
                  className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                >
                  Reset
                </button>
              </div>
            </div>

            <div className="mt-6 flex flex-col sm:flex-row gap-3 sm:justify-end">
              <button
                type="button"
                onClick={handleCropAndUpload}
                disabled={uploadingPhoto}
                className="rounded-xl bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700 disabled:opacity-50"
              >
                {uploadingPhoto ? 'Uploading...' : 'Save Picture'}
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </PageBackground>
  )
}

export default Dashboard
