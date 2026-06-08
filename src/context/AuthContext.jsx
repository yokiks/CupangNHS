import { createContext, useState, useContext, useEffect, useRef } from 'react'
import axios from 'axios'

const AuthContext = createContext()
axios.defaults.baseURL = import.meta.env.VITE_API_BASE_URL || ''

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const sessionIntervalRef = useRef(null)

  useEffect(() => {
    // Check if user is logged in on mount
    const token = localStorage.getItem('token')
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
      // Verify token and get user info
      axios.get('/api/auth/me')
        .then(res => {
          setUser(res.data.user)
          // Set up session timeout (7 days = 604800000 ms, but we'll check every hour)
          sessionIntervalRef.current = setInterval(() => {
            axios.get('/api/auth/me')
              .catch(() => {
                // Token expired or invalid
                localStorage.removeItem('token')
                delete axios.defaults.headers.common['Authorization']
                setUser(null)
                if (sessionIntervalRef.current) {
                  clearInterval(sessionIntervalRef.current)
                  sessionIntervalRef.current = null
                }
              })
          }, 3600000) // Check every hour
        })
        .catch(() => {
          localStorage.removeItem('token')
          delete axios.defaults.headers.common['Authorization']
        })
        .finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
    return () => {
      if (sessionIntervalRef.current) {
        clearInterval(sessionIntervalRef.current)
      }
    }
  }, [])

  const login = async (identifier, password) => {
    try {
      const res = await axios.post('/api/auth/login', { identifier, password })
      const { token, user } = res.data
      localStorage.setItem('token', token)
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
      setUser(user)
      return { success: true, user }
    } catch (error) {
      return { 
        success: false, 
        message: error.response?.data?.message || 'Login failed' 
      }
    }
  }

  const register = async (userData) => {
    try {
      const res = await axios.post('/api/auth/register', userData)
      const { token, user, message } = res.data
      if (token) {
        localStorage.setItem('token', token)
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
        setUser(user)
      }
      return { success: true, message }
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Registration failed'
      }
    }
  }

  const logout = () => {
    localStorage.removeItem('token')
    delete axios.defaults.headers.common['Authorization']
    setUser(null)
    if (sessionIntervalRef.current) {
      clearInterval(sessionIntervalRef.current)
      sessionIntervalRef.current = null
    }
  }

  const updateUser = (updates) => {
    setUser((currentUser) => currentUser ? { ...currentUser, ...updates } : currentUser)
  }

  const value = {
    user,
    login,
    register,
    logout,
    updateUser,
    loading
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

