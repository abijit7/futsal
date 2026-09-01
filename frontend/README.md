# MeroFutsal TypeScript Frontend

New React + Vite + TypeScript + Tailwind frontend for the Spring Boot futsal booking backend.

## Run

```bash
npm install
npm run dev
```

The dev server is configured for:

```txt
http://localhost:5173
```

## Environment

Local development can run without `.env`; Vite proxies `/api` and `/uploads` to the backend at `http://localhost:9090`.

Create `.env` from `.env.example` only when you need to point the frontend at a different backend:

```env
VITE_API_BASE_URL=http://localhost:9090
```

The backend uses `server.port=9090` by default, overridable with `PORT`.

## Backend Integration

The frontend uses a central Axios client in `src/api/client.ts`.

- Auth: `/api/users/login`, `/api/users/register`
- Futsals: `/api/futsals`
- Slots: `/api/slots`, `/api/slots/all`
- Payments: `/api/payments/initiate`, `/api/payments/verify`, `/api/payments/cancel/{id}`
- Bookings: `/api/bookings`
- Uploads: `/api/uploads/futsal-image`

Booking always goes through the payment flow, never `POST /api/bookings` (which rejects every
request by design). `/api/payments/confirm` handles cash only.

## Verification

```bash
npm test
npm run build
```
