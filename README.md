# Futsal Booking System (Multi-Venue)

This project supports multi-venue booking: users choose a futsal venue first, then book time slots for that venue.

## Quick Start

### Backend (Spring Boot)

- Set database credentials via environment variables (`DB_USERNAME`, `DB_PASSWORD`).
- Optional: set `DB_URL` and `SPRING_PROFILES_ACTIVE` (defaults to `dev`).
- Install Maven 3.9+ and make sure `mvn -v` works. On macOS, `brew install maven` is the simplest option.
- Run the backend:

```bash
cd /Users/abijit/Downloads/futsal-main/backend
mvn spring-boot:run
```

### Frontend (React)

```bash
cd /Users/abijit/Downloads/futsal-main/frontend-react
npm install
npm run dev
```

The React app defaults to `http://localhost:9090/api` for backend calls. Override with `VITE_API_BASE` or `VITE_API_URL` when needed.

## Core Flow

1. Admin creates futsal venues in the Admin UI (set hourly price, opening time, and photo).
2. Admin generates and manages slots for a selected venue/date range.
3. Users choose a futsal and then book available slots.

## Uploads

- Futsal photos are uploaded via `POST /api/uploads/futsal-image`.
- Files are stored in the local `uploads/` folder and served at `/uploads/*`.

## API Highlights

- `GET /api/futsals` list venues
- `POST /api/futsals` create venue
- `GET /api/slots?futsalId=ID` list available slots for a venue
- `POST /api/slots` create slot with `futsalId`

## Project Structure (Key Areas)

- `backend/src/main/java/com/futsal/model` entities (`Futsal`, `TimeSlot`, `Booking`, `User`)
- `backend/src/main/java/com/futsal/controller` REST endpoints
- `backend/src/main/java/com/futsal/service` business logic
- `frontend-react/src/pages` UI pages (user and admin)
- `frontend-react/src/api` shared API layer
- `frontend-react/src/components` shared React UI components
