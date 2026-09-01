# Azure Deployment Checklist

Target: Spring Boot API on **Azure App Service (Linux)** or **Container Apps**, React SPA on
**Azure Static Web Apps**, data in **Azure Database for MySQL Flexible Server**.

## 1. Database

Provision the MySQL Flexible Server, then apply the migrations **before** the first backend start —
the prod profile runs `JPA_DDL_AUTO=validate` and will refuse to boot against an empty schema.

```sh
DB_HOST=YOUR_SERVER.mysql.database.azure.com \
DB_PORT=3306 \
DB_NAME=YOUR_DB_NAME \
DB_USERNAME=YOUR_DB_USER \
DB_PASSWORD=YOUR_DB_PASSWORD \
MYSQL_EXTRA_ARGS=--ssl-mode=REQUIRED \
sh deployment/apply-db-migrations.sh
```

- `V1__baseline_schema.sql` is generated from the JPA entities, so its column types match what
  `validate` expects. Regenerate it rather than hand-editing when entities change.
- Every migration is idempotent, so re-running is safe.
- Back up before applying to an existing database.
- Keep `JPA_DDL_AUTO=validate` in production.

## 2. Backend

- Build: `cd backend && mvn -DskipTests package`
- Run with `SPRING_PROFILES_ACTIVE=prod`.
- Set every variable from `deployment/backend.env.example`. Put `JWT_SECRET`,
  `VERIFICATION_SECRET`, `DB_PASSWORD` and the `PAYMENT_*` credentials in **Key Vault** and
  reference them from application settings rather than pasting them in as plain settings.
- `JWT_SECRET` and `VERIFICATION_SECRET` must each be at least 32 bytes and must differ. The app
  refuses to start in the prod profile without `JWT_SECRET`.
- Point the Azure **health probe** at `/actuator/health` (public; `show-details=never` in prod).
  `/actuator/metrics` requires authentication.
- `server.port` honours `PORT`; App Service on Linux expects **8080**.
- `server.forward-headers-strategy=framework` is set so the app sees the original scheme through
  Azure's reverse proxy. Without it, upload URLs come back as `http://` and are blocked as mixed
  content on an HTTPS site.

### Uploads — required before go-live

`app.upload.dir` writes to the local filesystem, which on App Service and Container Apps is
**ephemeral and per-instance**. Uploaded venue images disappear on restart, redeploy and
scale-out, and one instance cannot see another's files.

Mount an **Azure Files** share and point `UPLOAD_DIR` at it:

```sh
az webapp config storage-account add \
  --resource-group YOUR_RG --name YOUR_APP \
  --custom-id merofutsal-uploads --storage-type AzureFiles \
  --account-name YOUR_STORAGE --share-name uploads \
  --access-key "$STORAGE_KEY" --mount-path /mnt/merofutsal/uploads
```

Moving the images to **Blob Storage** is the better long-term option (cheaper, CDN-able, no
share to mount); it needs `saveImage` in `UploadController` and the handler in
`config/StaticResourceConfig` to be rewritten against the Blob SDK.

## 3. Frontend

```sh
cd frontend
VITE_API_BASE_URL=https://YOUR_BACKEND_DOMAIN npm run build
```

- Deploy `frontend/dist`.
- `public/staticwebapp.config.json` is copied into the build output and provides the
  `navigationFallback` to `/index.html`. Without it every deep link (`/venues/1`, `/admin/slots`)
  and every hard refresh returns 404.
- Set `CORS_ALLOWED_ORIGINS` on the backend to exactly this site's origin.

## 4. Payments

- eSewa and Khalti both need **production** merchant credentials; the defaults in
  `application.properties` point at UAT/sandbox.
- `PAYMENT_RETURN_BASE_URL` must be the public frontend origin. The server builds the gateway
  return URLs from it and never accepts them from the client.
- Verify against UAT/sandbox first — see the smoke tests below.

## 5. Smoke tests

Authorization (the regression that motivated this checklist):

```sh
# All of these must return 401 with no token, 403 with a customer token, 200 with an admin token.
curl -i https://YOUR_BACKEND_DOMAIN/api/users
curl -i https://YOUR_BACKEND_DOMAIN/api/bookings
curl -i https://YOUR_BACKEND_DOMAIN/api/slots/all
curl -i -X POST https://YOUR_BACKEND_DOMAIN/api/futsals -H 'Content-Type: application/json' -d '{}'

# These must stay reachable anonymously.
curl -i https://YOUR_BACKEND_DOMAIN/api/futsals
curl -i https://YOUR_BACKEND_DOMAIN/api/slots/public
curl -i https://YOUR_BACKEND_DOMAIN/actuator/health
```

Application:

- Register, log in, change password (old tokens must stop working).
- Browse venues and date-filtered slots.
- Book a slot with cash; confirm it appears under My Bookings.
- Book with eSewa and with Khalti; confirm the booking exists and `payment_transactions` holds the
  real gateway reference.
- Abandon a gateway checkout, then confirm the slot is released (immediately via
  `/payment/failure`, or within `PAYMENT_HOLD_MINUTES` via the sweep).
- Cancel a booking, then book the same slot again — this must succeed.
- Admin: create/update a venue, upload images, generate slots, approve/cancel/delete a booking.
- Deep-link straight to `/venues/1` and hard-refresh.
- Upload a venue image, restart the App Service, confirm the image still loads over `https://`.
