import { useState, useEffect } from 'react'
import { useSearchParams, Link, useNavigate } from 'react-router-dom'
import axios from 'axios'
import { Eye, EyeOff } from 'lucide-react'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import PageBackground from '../components/PageBackground'

const ResetPassword = () => {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token') || ''
  const navigate = useNavigate()

  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showError, setShowError] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [tokenStatus, setTokenStatus] = useState('checking') // 'checking' | 'valid' | 'invalid'

  useEffect(() => {
    if (!token) {
      setTokenStatus('invalid')
      setShowError('No reset token found in the URL. Please use the link from your email.')
      return
    }

    let cancelled = false
    axios
      .get(`/api/auth/validate-reset-token?token=${encodeURIComponent(token)}`)
      .then(() => {
        if (!cancelled) setTokenStatus('valid')
      })
      .catch((err) => {
        if (!cancelled) {
          setTokenStatus('invalid')
          setShowError(
            err.response?.data?.message ||
              'This reset link is invalid or has expired. Please request a new one.'
          )
        }
      })
    return () => { cancelled = true }
  }, [token])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setShowError('')
    setMessage('')

    if (!password || !confirm) {
      setShowError('Please enter and confirm your new password.')
      return
    }
    if (password !== confirm) {
      setShowError('Passwords do not match.')
      return
    }
    if (password.length < 8) {
      setShowError('Password must be at least 8 characters.')
      return
    }

    setLoading(true)
    try {
      const res = await axios.post('/api/auth/reset-password', { token, newPassword: password })
      setMessage(res.data.message || 'Password reset successful. You may now log in.')
      setTimeout(() => navigate('/login'), 2000)
    } catch (err) {
      setShowError(err.response?.data?.message || 'Unable to reset password. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const renderTokenInvalid = () => (
    <div className="relative p-8 md:p-10 text-center">
      <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-2xl mb-4">
        <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
      <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-3">Link Expired or Invalid</h2>
      <p className="text-gray-600 mb-6">{showError}</p>
      <Link
        to="/forgot-password"
        className="inline-block px-6 py-3 bg-gradient-to-r from-primary-600 to-primary-700 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-300"
      >
        Request a New Reset Link
      </Link>
      <div className="mt-4">
        <Link to="/login" className="text-primary-600 font-semibold text-sm">Back to Login</Link>
      </div>
    </div>
  )

  const renderChecking = () => (
    <div className="relative p-8 md:p-10 text-center">
      <svg className="animate-spin h-10 w-10 text-primary-600 mx-auto mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
      <p className="text-gray-600 font-medium">Verifying your reset link...</p>
    </div>
  )

  const renderForm = () => (
    <div className="relative p-8 md:p-10">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-primary-600 to-primary-700 rounded-2xl shadow-xl mb-4">
          <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
          </svg>
        </div>
        <h2 className="text-3xl md:text-4xl font-bold text-primary-700 mb-2">Reset Password</h2>
        <div className="w-20 h-1 bg-gradient-to-r from-primary-500 to-primary-700 mx-auto mb-3 rounded-full"></div>
        <p className="text-gray-600">Enter a new password for your account</p>
      </div>

      {showError && (
        <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-lg">
          <p className="text-sm text-red-700 font-medium">{showError}</p>
        </div>
      )}
      {message && (
        <div className="mb-6 p-4 bg-green-50 border-l-4 border-green-500 rounded-lg">
          <p className="text-sm text-green-700 font-medium">{message}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">New Password</label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 pr-12 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              minLength={8}
              placeholder="Minimum 8 characters"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-3 flex items-center text-gray-400 hover:text-primary-600 transition-colors"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff size={20} strokeWidth={2} /> : <Eye size={20} strokeWidth={2} />}
            </button>
          </div>
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Confirm New Password</label>
          <div className="relative">
            <input
              type={showConfirm ? 'text' : 'password'}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className="w-full px-4 py-3 pr-12 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              minLength={8}
              required
            />
            <button
              type="button"
              onClick={() => setShowConfirm(!showConfirm)}
              className="absolute inset-y-0 right-3 flex items-center text-gray-400 hover:text-primary-600 transition-colors"
              aria-label={showConfirm ? 'Hide password' : 'Show password'}
            >
              {showConfirm ? <EyeOff size={20} strokeWidth={2} /> : <Eye size={20} strokeWidth={2} />}
            </button>
          </div>
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full py-3.5 bg-gradient-to-r from-primary-600 to-primary-700 text-white font-bold rounded-xl shadow-lg hover:shadow-2xl transform hover:-translate-y-1 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
        >
          {loading ? 'Resetting...' : 'Reset Password'}
        </button>
      </form>

      <div className="mt-6 text-center">
        <Link to="/login" className="text-primary-600 font-semibold">Back to Login</Link>
      </div>
    </div>
  )

  return (
    <PageBackground>
      <Navbar />
      <main className="flex-grow flex items-center justify-center px-4 py-8 md:py-12">
        <div className="w-full max-w-lg">
          <div className="relative bg-gradient-to-br from-white via-primary-50 to-white rounded-3xl shadow-2xl overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary-200 rounded-full -mr-32 -mt-32 opacity-20"></div>
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-primary-300 rounded-full -ml-24 -mb-24 opacity-20"></div>
            {tokenStatus === 'checking' && renderChecking()}
            {tokenStatus === 'invalid' && renderTokenInvalid()}
            {tokenStatus === 'valid' && renderForm()}
          </div>
        </div>
      </main>
      <Footer />
    </PageBackground>
  )
}

export default ResetPassword
