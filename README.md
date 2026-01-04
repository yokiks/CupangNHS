# Cupang National High School - Concern Management System

A modern, responsive web application for managing student concerns at Cupang National High School. Built with React, Tailwind CSS, and Node.js.

## Features

- 🎨 **Modern UI**: Beautiful, responsive design with Tailwind CSS
- 📱 **Mobile Responsive**: Works seamlessly on all devices
- 🔐 **Authentication**: Complete login, register, and password reset functionality
- 📊 **Dashboard**: Track and manage student concerns
- 👥 **Role-based Access**: Different views for students and guidance counselors
- 💾 **Database**: SQLite database for data persistence

## Tech Stack

### Frontend
- React 18
- React Router
- Tailwind CSS
- Axios

### Backend
- Node.js
- Express
- SQLite3
- JWT Authentication
- bcryptjs

## Getting Started

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn

### Installation

1. **Install frontend dependencies:**
```bash
npm install
```

2. **Install backend dependencies:**
```bash
cd server
npm install
cd ..
```

3. **Start the development servers:**

Option 1: Run both frontend and backend together
```bash
npm run dev:all
```

Option 2: Run separately
```bash
# Terminal 1 - Frontend
npm run dev

# Terminal 2 - Backend
npm run server
```

4. **Access the application:**
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000

## Project Structure

```
cupang-nhs/
├── src/
│   ├── components/      # Reusable components (Navbar, Footer, etc.)
│   ├── pages/           # Page components (Home, Login, Dashboard, etc.)
│   ├── context/           # React Context (AuthContext)
│   ├── App.jsx          # Main app component with routing
│   └── main.jsx         # Entry point
├── server/
│   ├── routes/          # API routes (auth, concerns)
│   ├── database.js      # Database setup and utilities
│   └── index.js         # Express server
├── images/              # Static images
└── package.json         # Frontend dependencies
```

## Database Schema

### Users Table
- id (Primary Key)
- firstName
- lastName
- username (Unique)
- password (Hashed)
- role (student/guidance_counselor)
- studentId (Optional, for students)
- createdAt

### Concerns Table
- id (Primary Key)
- userId (Foreign Key)
- title
- description
- category
- status (pending/in_progress/resolved)
- createdAt
- updatedAt

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password` - Reset password with token

### Concerns
- `GET /api/concerns` - Get all concerns (filtered by role)
- `POST /api/concerns` - Create new concern
- `PATCH /api/concerns/:id` - Update concern status (guidance counselor only)
- `DELETE /api/concerns/:id` - Delete concern

## User Roles

### Student
- Register and login
- Submit concerns
- View own concerns
- Track concern status

### Admin (Guidance Counselor)
- Login
- View all concerns
- Update concern status
- Delete concerns

## Environment Variables

Create a `.env` file in the `server` directory:

```
PORT=5000
JWT_SECRET=your-secret-key-here
```

## Building for Production

```bash
# Build frontend
npm run build

# The built files will be in the dist/ directory
```

## Notes

- The database file (`cupang_nhs.db`) will be created automatically on first run
- Default JWT secret is used for development - change it in production
- Password reset email functionality is stubbed - implement with a real email service for production

## License

© 2025 Cupang National High School. All Rights Reserved.

Developed by: BSIT

