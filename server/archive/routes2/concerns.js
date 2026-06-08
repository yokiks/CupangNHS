import express from 'express'
import jwt from 'jsonwebtoken'
import { getDb } from '../database.js'

const router = express.Router()
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production'

// Middleware to verify JWT token
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization']
  const token = authHeader && authHeader.split(' ')[1]

  if (!token) {
    return res.status(401).json({ message: 'Access token required' })
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ message: 'Invalid or expired token' })
    }
    req.user = user
    next()
  })
}

// Helper function to create notification
const createNotification = async (db, userId, concernId, message, type = 'status_update') => {
  try {
    await db.run(
      'INSERT INTO notifications (userId, concernId, message, type) VALUES (?, ?, ?, ?)',
      [userId, concernId, message, type]
    )
  } catch (error) {
    console.error('Error creating notification:', error)
  }
}

// Get all concerns with filtering and sorting
router.get('/', authenticateToken, async (req, res) => {
  try {
    const db = getDb()
    const { status, category, sortBy = 'createdAt', sortOrder = 'DESC' } = req.query
    let concerns
    let query
    let params = []

    if (req.user.role === 'admin') {
      // Admin sees all concerns
      query = `
        SELECT c.*, u.firstName, u.lastName, u.username 
        FROM concerns c 
        JOIN users u ON c.userId = u.id 
        WHERE 1=1
      `
      
      if (status) {
        query += ' AND c.status = ?'
        params.push(status)
      }
      
      if (category) {
        query += ' AND c.category = ?'
        params.push(category)
      }
      
      query += ` ORDER BY c.${sortBy} ${sortOrder.toUpperCase()}`
      
      concerns = await db.all(query, params)
    } else {
      // Students see only their own concerns
      query = 'SELECT * FROM concerns WHERE userId = ?'
      params = [req.user.id]
      
      if (status) {
        query += ' AND status = ?'
        params.push(status)
      }
      
      if (category) {
        query += ' AND category = ?'
        params.push(category)
      }
      
      query += ` ORDER BY ${sortBy} ${sortOrder.toUpperCase()}`
      
      concerns = await db.all(query, params)
    }

    res.json(concerns)
  } catch (error) {
    console.error('Error fetching concerns:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

// Create a new concern
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { title, description, category } = req.body
    const db = getDb()

    if (!title || !description) {
      return res.status(400).json({ message: 'Title and description are required' })
    }

    const result = await db.run(
      'INSERT INTO concerns (userId, title, description, category) VALUES (?, ?, ?, ?)',
      [req.user.id, title, description, category || 'general']
    )

    const newConcern = await db.get('SELECT * FROM concerns WHERE id = ?', [result.lastID])

    res.status(201).json(newConcern)
  } catch (error) {
    console.error('Error creating concern:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

// Update concern status (admin only) - New status flow: pending → read → in_review → resolved
router.patch('/:id', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Only admins can update concern status' })
    }

    const { status } = req.body
    const db = getDb()

    const validStatuses = ['pending', 'read', 'in_review', 'resolved']
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({ message: `Valid status is required. Must be one of: ${validStatuses.join(', ')}` })
    }

    // Get the concern to find the student
    const concern = await db.get('SELECT * FROM concerns WHERE id = ?', [req.params.id])
    if (!concern) {
      return res.status(404).json({ message: 'Concern not found' })
    }

    // Update status
    await db.run(
      'UPDATE concerns SET status = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?',
      [status, req.params.id]
    )

    const updatedConcern = await db.get('SELECT * FROM concerns WHERE id = ?', [req.params.id])

    // Create notification for student
    const statusMessages = {
      'pending': 'Your concern has been received and is pending review.',
      'read': 'Your concern has been read by the guidance counselor.',
      'in_review': 'Your concern is currently in progress.',
      'resolved': 'Your concern has been resolved.'
    }

    await createNotification(
      db,
      concern.userId,
      concern.id,
      `Your concern "${concern.title}" status has been updated to: ${status.replace('_', ' ').toUpperCase()}. ${statusMessages[status]}`,
      'status_update'
    )

    res.json(updatedConcern)
  } catch (error) {
    console.error('Error updating concern:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

// Delete concern (admin only, or user can delete their own)
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const db = getDb()
    const concern = await db.get('SELECT * FROM concerns WHERE id = ?', [req.params.id])

    if (!concern) {
      return res.status(404).json({ message: 'Concern not found' })
    }

    // Users can only delete their own concerns, admins can delete any
    if (req.user.role !== 'admin' && concern.userId !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to delete this concern' })
    }

    await db.run('DELETE FROM concerns WHERE id = ?', [req.params.id])

    res.json({ message: 'Concern deleted successfully' })
  } catch (error) {
    console.error('Error deleting concern:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

// Generate report (admin only)
router.get('/report', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Only admins can generate reports' })
    }

    const db = getDb()
    const { startDate, endDate, status, category } = req.query

    let query = `
      SELECT c.*, u.firstName, u.lastName, u.username, u.studentId
      FROM concerns c 
      JOIN users u ON c.userId = u.id 
      WHERE 1=1
    `
    let params = []

    if (startDate) {
      query += ' AND DATE(c.createdAt) >= ?'
      params.push(startDate)
    }

    if (endDate) {
      query += ' AND DATE(c.createdAt) <= ?'
      params.push(endDate)
    }

    if (status) {
      query += ' AND c.status = ?'
      params.push(status)
    }

    if (category) {
      query += ' AND c.category = ?'
      params.push(category)
    }

    query += ' ORDER BY c.createdAt DESC'

    const concerns = await db.all(query, params)

    // Generate summary statistics
    const stats = {
      total: concerns.length,
      byStatus: {
        pending: concerns.filter(c => c.status === 'pending').length,
        read: concerns.filter(c => c.status === 'read').length,
        in_review: concerns.filter(c => c.status === 'in_review').length,
        resolved: concerns.filter(c => c.status === 'resolved').length
      },
      byCategory: {}
    }

    concerns.forEach(concern => {
      stats.byCategory[concern.category] = (stats.byCategory[concern.category] || 0) + 1
    })

    res.json({
      summary: stats,
      concerns,
      generatedAt: new Date().toISOString()
    })
  } catch (error) {
    console.error('Error generating report:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

export default router
