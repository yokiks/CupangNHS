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

// Get all notifications for current user
router.get('/', authenticateToken, async (req, res) => {
  try {
    const db = getDb()
    const notifications = await db.all(
      'SELECT * FROM notifications WHERE userId = ? ORDER BY createdAt DESC',
      [req.user.id]
    )

    res.json(notifications)
  } catch (error) {
    console.error('Error fetching notifications:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

// Mark notification as read
router.patch('/:id/read', authenticateToken, async (req, res) => {
  try {
    const db = getDb()
    
    // Verify notification belongs to user
    const notification = await db.get('SELECT * FROM notifications WHERE id = ? AND userId = ?', [req.params.id, req.user.id])
    
    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' })
    }

    await db.run('UPDATE notifications SET read = 1 WHERE id = ?', [req.params.id])

    res.json({ message: 'Notification marked as read' })
  } catch (error) {
    console.error('Error updating notification:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

// Mark all notifications as read
router.patch('/read-all', authenticateToken, async (req, res) => {
  try {
    const db = getDb()
    await db.run('UPDATE notifications SET read = 1 WHERE userId = ?', [req.user.id])

    res.json({ message: 'All notifications marked as read' })
  } catch (error) {
    console.error('Error updating notifications:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

// Get unread count
router.get('/unread/count', authenticateToken, async (req, res) => {
  try {
    const db = getDb()
    const result = await db.get(
      'SELECT COUNT(*) as count FROM notifications WHERE userId = ? AND read = 0',
      [req.user.id]
    )

    res.json({ count: result.count || 0 })
  } catch (error) {
    console.error('Error fetching unread count:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

export default router

