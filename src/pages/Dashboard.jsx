import { useState, useCallback } from 'react'
import { useAuth } from '../context/AuthContext'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import PageBackground from '../components/PageBackground'
import ConcernForm from '../components/concerns/ConcernForm'
import ConcernList from '../components/concerns/ConcernList'
import CounselorReviewPanel from '../components/concerns/CounselorReviewPanel'
import { openPrintableReport, openOverallReport } from '../components/concerns/ConcernReport'
import axios from 'axios'

const Dashboard = () => {
  const { user } = useAuth()
  const [showForm, setShowForm] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)
  const [reviewConcernId, setReviewConcernId] = useState(null)

  const isCounselor = user?.role === 'guidance_counselor'

  const triggerRefresh = useCallback(() => {
    setRefreshKey(k => k + 1)
    setShowForm(false)
  }, [])

  const handleViewReport = useCallback((concern) => {
    setReviewConcernId(concern.id)
  }, [])

  const handleGenerateOverallReport = useCallback(async () => {
    try {
      const res = await axios.get('/api/concerns/report')
      openOverallReport(res.data)
    } catch {
      alert('Failed to generate report. Please try again.')
    }
  }, [])

  const handlePrintReport = useCallback((data) => {
    openPrintableReport(data, `${user?.firstName || ''} ${user?.lastName || ''}`)
  }, [user])

  return (
    <PageBackground>
      <Navbar />

      <main className="flex-grow container mx-auto px-4 py-8 md:py-12">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-primary-600 mb-2">
            Welcome, {user?.firstName} {user?.lastName}!
          </h1>
          <p className="text-gray-600">
            {isCounselor ? 'Manage student concerns' : 'Submit and track your concerns'}
          </p>
        </div>

        {user?.role === 'student' && (
          <div className="mb-8">
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
          </div>
        )}

        <ConcernList
          isCounselor={isCounselor}
          onViewReport={handleViewReport}
          onGenerateOverallReport={handleGenerateOverallReport}
          refreshKey={refreshKey}
        />
      </main>

      {reviewConcernId && (
        <CounselorReviewPanel
          concernId={reviewConcernId}
          onClose={() => setReviewConcernId(null)}
          onPrint={handlePrintReport}
        />
      )}

      <Footer />
    </PageBackground>
  )
}

export default Dashboard
