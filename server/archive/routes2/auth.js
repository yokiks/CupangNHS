import express from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import crypto from 'crypto'
import { getDb } from '../database.js'

const router = express.Router()
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production'

// Helper function to generate JWT token
const generateToken = (user) => {
  return jwt.sign(
    { id: user.id, username: user.username, role: user.role },
    JWT_SECRET,
    { expiresIn: '7d' }
  )
}

// Register
router.post('/register', async (req, res) => {
  try {
    const { firstName, lastName, username, password, role, studentId } = req.body
    const db = getDb()

    // Validation
    if (!firstName || !lastName || !username || !password) {
      return res.status(400).json({ message: 'All fields are required' })
    }

    if (role === 'student' && !studentId) {
      return res.status(400).json({ message: 'Student LRN/ID is required for students' })
    }

    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' })
    }

    // Check if username already exists
    const existingUser = await db.get('SELECT id FROM users WHERE username = ?', [username])
    if (existingUser) {
      return res.status(400).json({ message: 'Username already exists' })
    }

    // For students: Verify LRN and check for duplicates
    if (role === 'student' && studentId) {
      // Check if LRN is already registered
      const existingLRN = await db.get('SELECT id FROM users WHERE studentId = ?', [studentId])
      if (existingLRN) {
        return res.status(400).json({ message: 'This LRN is already registered. Please use a different account or contact support.' })
      }

      // Verify LRN exists in student records (optional - can be enabled for strict verification)
      // For now, we'll allow registration but you can uncomment this for strict verification:
      /*
      const lrnRecord = await db.get('SELECT * FROM student_lrns WHERE lrn = ? AND verified = 1', [studentId])
      if (!lrnRecord) {
        return res.status(400).json({ message: 'LRN not found in school records. Please verify your LRN or contact the school.' })
      }
      
      // Verify name matches
      if (lrnRecord.firstName.toLowerCase() !== firstName.toLowerCase() || 
          lrnRecord.lastName.toLowerCase() !== lastName.toLowerCase()) {
        return res.status(400).json({ message: 'Name does not match the LRN record. Please verify your information.' })
      }
      */
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10)

    // Insert user
    const result = await db.run(
      'INSERT INTO users (firstName, lastName, username, password, role, studentId) VALUES (?, ?, ?, ?, ?, ?)',
      [firstName, lastName, username, hashedPassword, role, studentId || null]
    )

    const newUser = await db.get('SELECT id, firstName, lastName, username, role, studentId FROM users WHERE id = ?', [result.lastID])

    const token = generateToken(newUser)

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        id: newUser.id,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        username: newUser.username,
        role: newUser.role
      }
    })
  } catch (error) {
    console.error('Registration error:', error)
    res.status(500).json({ message: 'Server error during registration' })
  }
})

// Login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body
    const db = getDb()

    if (!username || !password) {
      return res.status(400).json({ message: 'Username and password are required' })
    }

    // Find user
    const user = await db.get('SELECT * FROM users WHERE username = ?', [username])
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' })
    }

    // Check password
    const isValidPassword = await bcrypt.compare(password, user.password)
    if (!isValidPassword) {
      return res.status(401).json({ message: 'Invalid credentials' })
    }

    const token = generateToken(user)

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        username: user.username,
        role: user.role
      }
    })
  } catch (error) {
    console.error('Login error:', error)
    res.status(500).json({ message: 'Server error during login' })
  }
})

// Get current user (protected route)
router.get('/me', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1]
    
    if (!token) {
      return res.status(401).json({ message: 'No token provided' })
    }

    const decoded = jwt.verify(token, JWT_SECRET)
    const db = getDb()
    const user = await db.get('SELECT id, firstName, lastName, username, role, studentId FROM users WHERE id = ?', [decoded.id])

    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }

    res.json({ user })
  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Invalid or expired token' })
    }
    console.error('Auth error:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

// Forgot Password
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body
    const db = getDb()

    // In a real app, you'd look up by email, but we're using username
    // For now, we'll accept username or create a simple email lookup
    // This is a simplified version - in production, you'd have an email field
    
    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex')
    const expiresAt = new Date(Date.now() + 3600000) // 1 hour from now

    // For demo purposes, we'll just return a message
    // In production, you'd:
    // 1. Find user by email
    // 2. Store token in database
    // 3. Send email with reset link
    
    res.json({
      message: 'If an account exists with that email, a password reset link has been sent. Please check your email.'
    })
  } catch (error) {
    console.error('Forgot password error:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

// Reset Password
router.post('/reset-password', async (req, res) => {
  try {
    const { token, newPassword } = req.body
    const db = getDb()

    if (!token || !newPassword) {
      return res.status(400).json({ message: 'Token and new password are required' })
    }

    // Find valid token
    const resetToken = await db.get(
      'SELECT * FROM password_reset_tokens WHERE token = ? AND used = 0 AND expiresAt > datetime("now")',
      [token]
    )

    if (!resetToken) {
      return res.status(400).json({ message: 'Invalid or expired token' })
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10)

    // Update user password
    await db.run('UPDATE users SET password = ? WHERE id = ?', [hashedPassword, resetToken.userId])

    // Mark token as used
    await db.run('UPDATE password_reset_tokens SET used = 1 WHERE id = ?', [resetToken.id])

    res.json({ message: 'Password reset successfully' })
  } catch (error) {
    console.error('Reset password error:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

export default router

