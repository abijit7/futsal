# FutsalBook React Frontend

React SPA replacement for the legacy static frontend. It talks to the existing Spring Boot backend over REST and is meant to be served by a separate static server.

## Setup

- Set the API base URL (optional):
  - `VITE_API_BASE` (default `http://localhost:8080`)
  - `VITE_API_URL` (default `${VITE_API_BASE}/api`)

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

