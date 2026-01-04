# Setup Instructions

## Quick Start Guide

### Step 1: Install Dependencies

Open your terminal in the project root directory and run:

```bash
# Install frontend dependencies
npm install

# Install backend dependencies
cd server
npm install
cd ..
```

### Step 2: Configure Environment (Optional)

Create a `.env` file in the `server` directory:

```bash
cd server
cp .env.example .env
```

Edit `.env` and change the `JWT_SECRET` to a secure random string for production.

### Step 3: Start the Application

You have two options:

**Option A: Run both servers together (Recommended)**

```bash
npm run dev:all
```

**Option B: Run servers separately**

Terminal 1 (Frontend):

```bash
npm run dev
```

Terminal 2 (Backend):

```bash
npm run server
```

### Step 4: Access the Application

- **Frontend**: Open http://localhost:3000 in your browser
- **Backend API**: Running on http://localhost:5000

## First Time Setup

1. The database will be created automatically when you first run the server
2. The database file `server/cupang_nhs.db` will be created
3. All tables (users, concerns, password_reset_tokens) will be created automatically

## Testing the Application

### Register a New User

1. Go to http://localhost:3000/register
2. Fill in the registration form
3. Choose "Student" or "Guidance Counselor" role
4. Submit the form

### Login

1. Go to http://localhost:3000/login
2. Enter your username and password
3. You'll be redirected to the dashboard

### Submit a Concern (Students)

1. Login as a student
2. Go to Dashboard
3. Click "+ Submit New Concern"
4. Fill in the form and submit

### Manage Concerns (Admins)

1. Login as a Guidance Counselor
2. Go to Dashboard
3. View all concerns
4. Update concern status (pending → in_progress → resolved)

## Troubleshooting

### Port Already in Use

If port 3000 or 5000 is already in use:

1. **Frontend**: Edit `vite.config.js` and change the port
2. **Backend**: Edit `server/.env` and change the PORT value

### Database Errors

If you encounter database errors:

1. Delete `server/cupang_nhs.db`
2. Restart the server (it will recreate the database)

### Images Not Loading

Make sure the `images` folder is in the `public` directory (or root for Vite). The images should be accessible at `/images/...`

## Production Build

To build for production:

```bash
npm run build
```

The built files will be in the `dist/` directory. You can serve these with any static file server.

## Need Help?

Check the main README.md for more detailed information about the project structure and API endpoints.
