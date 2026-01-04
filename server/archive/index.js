import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import { initDatabase } from './database.js'
import authRoutes from './routes/auth.js'
import concernRoutes from './routes/concerns.js'
import notificationRoutes from './routes/notifications.js'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 5000

// Middleware
app.use(cors())
app.use(express.json())

// Initialize database
initDatabase()

// Routes
app.use('/api/auth', authRoutes)
app.use('/api/concerns', concernRoutes)
app.use('/api/notifications', notificationRoutes)

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' })
})

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`)
})

