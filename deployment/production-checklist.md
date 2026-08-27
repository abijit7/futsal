# Production Deployment Checklist

Run these checks before deploying MeroFutsal to production.

## Backend

- Build from `backend/` with `mvn -DskipTests package`.
- Run with `SPRING_PROFILES_ACTIVE=prod`.
- Configure every variable from `deployment/backend.env.example` in the host secret manager.
- Use a strong `JWT_SECRET` and a separate strong `VERIFICATION_SECRET`.
- Set `CORS_ALLOWED_ORIGINS` to the real frontend origin only.
- Mount `UPLOAD_DIR` to persistent storage so uploaded venue images survive redeploys.
- Enable `VERIFICATION_EMAIL_ENABLED=true` and configure SMTP before using email verification or password reset.
- Configure `SMS_WEBHOOK_URL` before using phone verification in production.

## Database

- Back up the production database before applying migrations.
- Apply migrations from the repository root:

```sh
DB_HOST=YOUR_DB_HOST \
DB_PORT=3306 \
DB_NAME=YOUR_DB_NAME \
DB_USERNAME=YOUR_DB_USER \
DB_PASSWORD=YOUR_DB_PASSWORD \
sh deployment/apply-db-migrations.sh
```

- Keep `JPA_DDL_AUTO=validate` in production.

## Frontend

- Build from `frontend/` with `VITE_API_BASE_URL` set to the public backend URL.
- Example:

```sh
VITE_API_BASE_URL=https://YOUR_BACKEND_DOMAIN npm run build
```

## Smoke Tests

- Register and log in.
- Verify email/password-reset delivery.
- Browse venues and date-filtered slots.
- Book a slot.
- Update profile and change password.
- Admin: create/update venue, upload images, generate slots, approve/cancel/delete booking.
