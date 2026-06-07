# FutsalBook React Frontend

React SPA replacement for the legacy static frontend. It talks to the existing Spring Boot backend over REST and is meant to be served by a separate static server.

## Setup

- Set the API base URL if the backend is not running on the default local port:
  - `VITE_API_BASE` (default `http://localhost:8080`)
  - `VITE_API_URL` (default `${VITE_API_BASE}/api`)

Authentication is JWT-only. The frontend does not use static admin tokens or
`VITE_ADMIN_TOKEN`. Users and admins must sign in through `POST /api/users/login`;
the backend returns `authToken`, and API requests send it as
`Authorization: Bearer <authToken>`.

## Run

```bash
cd /Users/abijit/Downloads/futsal-main/frontend-react
npm install
npm run dev
```

## Build

```bash
npm run build
npm run preview
```

## Notes

- Styling reuses the existing look and feel via `src/styles.css`.
- Authentication state is stored in `localStorage` under `futsal_user`.
- If an old token causes authorization errors after auth changes, log out or
  clear `futsal_user` from `localStorage`, then sign in again to receive a fresh JWT.
