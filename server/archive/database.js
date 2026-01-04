import sqlite3 from 'sqlite3'
import { promisify } from 'util'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const dbPath = path.join(__dirname, 'cupang_nhs.db')
let db = null

// Promisify database methods
const promisifyDb = (db) => {
  return {
    run: promisify(db.run.bind(db)),
    get: promisify(db.get.bind(db)),
    all: promisify(db.all.bind(db)),
    close: promisify(db.close.bind(db))
  }
}

export const getDb = () => {
  if (!db) {
    throw new Error('Database not initialized. Call initDatabase() first.')
  }
  return promisifyDb(db)
}

export const initDatabase = () => {
  return new Promise((resolve, reject) => {
    db = new sqlite3.Database(dbPath, (err) => {
      if (err) {
        console.error('Error opening database:', err)
        reject(err)
        return
      }
      console.log('Connected to SQLite database')
      createTables().then(resolve).catch(reject)
    })
  })
}

const createTables = async () => {
  const dbAsync = promisifyDb(db)
  
  try {
    // Users table
    await dbAsync.run(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        firstName TEXT NOT NULL,
        lastName TEXT NOT NULL,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'student',
        studentId TEXT,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `)

    // Concerns table
    await dbAsync.run(`
      CREATE TABLE IF NOT EXISTS concerns (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        userId INTEGER NOT NULL,
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        category TEXT NOT NULL DEFAULT 'general',
        status TEXT NOT NULL DEFAULT 'pending',
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (userId) REFERENCES users(id)
      )
    `)

    // Notifications table
    await dbAsync.run(`
      CREATE TABLE IF NOT EXISTS notifications (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        userId INTEGER NOT NULL,
        concernId INTEGER,
        message TEXT NOT NULL,
        type TEXT NOT NULL DEFAULT 'status_update',
        read INTEGER DEFAULT 0,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (userId) REFERENCES users(id),
        FOREIGN KEY (concernId) REFERENCES concerns(id)
      )
    `)

    // Student LRN records table (for verification)
    await dbAsync.run(`
      CREATE TABLE IF NOT EXISTS student_lrns (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        lrn TEXT UNIQUE NOT NULL,
        firstName TEXT NOT NULL,
        lastName TEXT NOT NULL,
        gradeLevel TEXT,
        section TEXT,
        verified INTEGER DEFAULT 1,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `)

    // Password reset tokens table
    await dbAsync.run(`
      CREATE TABLE IF NOT EXISTS password_reset_tokens (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        userId INTEGER NOT NULL,
        token TEXT UNIQUE NOT NULL,
        expiresAt DATETIME NOT NULL,
        used INTEGER DEFAULT 0,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (userId) REFERENCES users(id)
      )
    `)

    console.log('Database tables created successfully')
  } catch (error) {
    console.error('Error creating tables:', error)
    throw error
  }
}

// Close database connection
export const closeDatabase = () => {
  return new Promise((resolve, reject) => {
    if (db) {
      db.close((err) => {
        if (err) {
          reject(err)
        } else {
          console.log('Database connection closed')
          resolve()
        }
      })
    } else {
      resolve()
    }
  })
}

