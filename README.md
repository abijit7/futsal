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

### Frontend (React + TypeScript + Tailwind)

```bash
cd /Users/abijit/Downloads/futsal-main/frontend
npm install
npm run dev
```

The React app runs at `http://127.0.0.1:5174` and uses `VITE_API_BASE_URL` for backend calls.

## Core Flow

1. Admin creates futsal venues in the Admin UI (set hourly price, opening time, and photo).
2. Admin generates and manages slots for a selected venue/date range.
3. Users choose a futsal and then book available slots.

## Account Security

- Customers can edit their name and phone from `/profile`.
- Password changes require the current password and invalidate existing JWT sessions.
- Forgot-password recovery uses a six-digit, single-use code with expiry, resend cooldown, and attempt limits.
- Email and phone verification are available from the profile page.
- Development exposes verification codes in API responses for local testing.
- Production must configure `VERIFICATION_SECRET` plus SMTP and/or `SMS_WEBHOOK_URL` delivery settings.
- SMTP uses Spring Boot variables such as `SPRING_MAIL_HOST`, `SPRING_MAIL_PORT`, `SPRING_MAIL_USERNAME`, and `SPRING_MAIL_PASSWORD`.
- The mail health probe is disabled by default. Set `MAIL_HEALTH_ENABLED=true` only when a reachable SMTP server is configured.
- Apply `backend/src/main/resources/db/security-features.sql` before starting the production profile with `ddl-auto=validate`.

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
- `frontend/src/pages` UI pages (public, user, and admin)
- `frontend/src/api` shared API layer
- `frontend/src/components` shared React UI components
