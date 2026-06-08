import { Navigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import PageBackground from '../components/PageBackground'
import SchoolYearManager from '../components/schoolYears/SchoolYearManager'
import { useAuth } from '../context/AuthContext'

const SchoolYears = () => {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <PageBackground>
        <Navbar />
        <main className="flex-grow container mx-auto px-4 py-16 text-center text-gray-500">
          Loading...
        </main>
        <Footer />
      </PageBackground>
    )
  }

  if (!user || user.role !== 'guidance_counselor') {
    return <Navigate to="/dashboard" replace />
  }

  return (
    <PageBackground>
      <Navbar />
      <main className="flex-grow container mx-auto px-4 py-8 md:py-12">
        <div className="text-center mb-10">
          <h1 className="text-3xl md:text-4xl font-bold text-primary-700">School Year Management</h1>
          <p className="text-gray-600 mt-2 max-w-2xl mx-auto">
            Create, activate, and archive school years for Cupang National High School.
          </p>
        </div>
        <SchoolYearManager />
      </main>
      <Footer />
    </PageBackground>
  )
}

export default SchoolYears
