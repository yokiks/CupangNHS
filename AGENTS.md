# Agent Guidance for CupangNHS

## Purpose
This repository is a full-stack student concern management system.
- Frontend: React + Tailwind CSS + Vite
- Backend: Node.js + Express + SQLite (server directory)
- Authentication: JWT and bcrypt
- Testing: Playwright end-to-end tests and backend integration tests

## Key entry points
- `src/App.jsx` - application routes and layout
- `src/main.jsx` - frontend entry point
- `src/context/AuthContext.jsx` - auth state + token handling
- `src/pages/` - main page views
- `src/components/` - reusable UI components
- `server/server.js` - Express server startup
- `server/routes/` - request routing
- `server/controllers/` - business logic for auth, concerns, notifications, reports, students
- `server/db/knex.js` - database configuration
- `server/middleware/authMiddleware.js` - protected route enforcement

## Recommended commands
Use from repository root.
- `npm install` - install frontend dependencies
- `cd server && npm install` - install backend dependencies
- `npm run dev` - run frontend Vite dev server
- `npm run server` - run backend Express server
- `npm run dev:all` - run frontend and backend together
- `npm run build` - build frontend for production
- `npm run test:e2e` - run Playwright tests
- `npm --prefix server run test` - run backend tests

## Environment
The backend loads `.env` from `server/.env`.
- `PORT` controls the backend port
- `JWT_SECRET` is required for auth
- backend database is SQLite and created automatically on first run

## Frontend conventions
- Uses React Router v6 for routing
- Uses Tailwind CSS utility classes and some custom CSS in `style.css`
- Uses context-driven auth state via `AuthContext`
- Uses protected routes for authenticated pages
- API calls are made with `axios` to the backend API

## Backend conventions
- Controllers are separated from routes
- Route files live in `server/routes`
- Authentication middleware protects backend endpoints
- Database setup and migrations are in `server/` (though current repo uses SQLite file creation at startup)

## Testing notes
- `tests/e2e/` contains Playwright flow tests
- Backend tests are under `server/tests`
- Use `npm run test:e2e` for frontend flows and `npm --prefix server run test` for backend integration tests

## Figma / design note
No Figma assets or Figma references were found in the repository.
- Treat the current UI as the source of truth for layout, style, and components.
- If design changes require Figma-specific guidance, request the Figma link or exported design specs.

## How to use this file
- Use this document to understand repo structure quickly
- Prefer existing code and docs over inventing architecture
- Do not assume additional design assets exist outside the repository
