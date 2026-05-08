# Office Hour Booking Backend

This is a Node.js Express backend for an office hour booking system, integrated with Supabase PostgreSQL.

## Features

- User registration and login (JWT authentication)
- Role-based access (Student, Instructor, TA)
- RESTful endpoints for users, courses, enrollments, instructor-course assignments, office hour schedules, office hour sessions, time slots, and bookings
- Supabase integration for all database operations

## Setup
1. ```sh
   cd src
2. Copy `.env.example` to `.env` and fill in your Supabase credentials and JWT secret.
3. Install dependencies:
   ```sh
   npm install
   ```
4. Start the server:
   ```sh
   npm run dev
   ```


## Folder Structure

- `src/app.js` — Main Express app
- `src/routes/` — Route definitions
- `src/controllers/` — Endpoint logic
- `src/models/` — Database queries
- `src/middleware/` — Middleware (auth, validation)
- `src/utils/supabase.js` — Supabase client
