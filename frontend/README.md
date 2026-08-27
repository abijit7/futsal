# MeroFutsal TypeScript Frontend

New React + Vite + TypeScript + Tailwind frontend for the Spring Boot futsal booking backend.

## Run

```bash
npm install
npm run dev
```

The dev server is configured for:

```txt
http://127.0.0.1:5174
```

## Environment

Local development can run without `.env`; Vite proxies `/api` and `/uploads` to the backend at `http://localhost:9090`.

Create `.env` from `.env.example` only when you need to point the frontend at a different backend:

```env
VITE_API_BASE_URL=http://localhost:9090
```

The prompt mentioned `8080`, but this repository's current backend config uses `server.port=9090`.

## Backend Integration

The frontend uses a central Axios client in `src/api/client.ts`.

- Auth: `/api/users/login`, `/api/users/register`
- Futsals: `/api/futsals`
- Slots: `/api/slots`, `/api/slots/all`
- Booking confirmation: `/api/payments/confirm`
- Bookings: `/api/bookings`
- Uploads: `/api/uploads/futsal-image`

Booking intentionally uses `/api/payments/confirm`, not direct booking creation.

## Verification

```bash
npm test
npm run build
```
