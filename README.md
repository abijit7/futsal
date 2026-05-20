# Futsal Booking System (Multi-Venue)

This project supports multi-venue booking: users choose a futsal venue first, then book time slots for that venue.

## Quick Start

### Backend (Spring Boot)

- Configure MySQL credentials in `backend/src/main/resources/application.properties`.
- Run the backend:

```bash
cd /Users/abijit/Downloads/futsal-main/backend
mvn spring-boot:run
```

### Frontend (Static)

Open `frontend/index.html` in a browser, or serve the `frontend` folder with a local static server.

## Core Flow

1. Admin creates futsal venues in the Admin UI (set hourly price, opening time, and photo).
2. Hourly slots are auto-generated from the next full hour through 11:00 PM.
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
- `frontend/pages` UI pages (user and admin)
- `frontend/js/app.js` shared API layer and utilities
