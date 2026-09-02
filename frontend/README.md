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

Booking always goes through the payment flow. `POST /api/bookings` no longer exists - it used to
be a stub that rejected every request - and `/api/payments/confirm` handles cash only.

## Verification

```bash
npm run typecheck   # tsc -b
npm test            # vitest run
npm run build
```

Tests live beside the code they cover (`*.test.tsx`) and run under jsdom via `vitest.config.ts`.
The suite deliberately concentrates on the two places a mistake is expensive: the route guards in
`src/components/ProtectedRoute.tsx`, and the gateway return handling in
`src/pages/public/PaymentSuccess.tsx`, which must never report success without a server-verified
payment.
