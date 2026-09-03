# Azure Deployment Checklist

Target: Spring Boot API on **Azure App Service (Linux)** or **Container Apps**, React SPA on
**Azure Static Web Apps**, data in **Azure Database for MySQL Flexible Server**.

## 0. Secrets — do this before anything is pushed

A live MySQL password (`root` / the value still configured in `.idea/workspace.xml`) was committed
in `.idea/copilotDiffState.xml` and is present in six historical commits (`2560882`, `e2423c5`,
`7f86421`, `cb08611`, `3a89971`, `e775f44`) on the public GitHub repository. `.idea/` and
`.DS_Store` are now untracked and ignored, which stops the bleeding but does **not** remove the
password from history.

1. **Rotate the MySQL password** everywhere it is used. Treat the old one as burned and do not
   reuse it for the Azure database.
2. **Scrub history** with `git-filter-repo` (not `filter-branch`): drop the `.idea/` path across
   all commits and replace the literal secret, then `git push --force-with-lease`. This rewrites
   every commit SHA, so coordinate with anyone holding a clone.
3. **Generate fresh `JWT_SECRET` and `VERIFICATION_SECRET`** for production - at least 32 bytes
   each, and different from one another.
4. Optionally run `gitleaks` or `trufflehog` over the rewritten history to confirm it is clean.

Verify with:

```sh
# Substitute the old password for PLACEHOLDER when running this. It is deliberately not written
# out here: reproducing the literal in a tracked file is how it would get committed again.
git log --all -S 'PLACEHOLDER' --oneline    # must print nothing
git ls-files | grep -E '\.idea|\.DS_Store'  # must print nothing
```

The eSewa UAT key in `application.properties` is a published sandbox credential and is fine to
leave; the prod profile provides no default, and `PaymentCredentialsValidator` refuses to start the
prod profile if the sandbox code, secret or UAT URL is still in place.

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
- `V5__reviews.sql` adds the `reviews` table. Without it the app will not start under
  `ddl-auto=validate`.
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

**Replace the `YOUR_BACKEND_DOMAIN` / `YOUR_FRONTEND_DOMAIN` placeholders before deploying.** They
appear in three places and are not substituted automatically:

| File | Placeholder | Consequence if left |
|---|---|---|
| `public/staticwebapp.config.json` | `YOUR_BACKEND_DOMAIN` in the CSP `img-src` and `connect-src` | Every API call and venue photo is blocked by the browser |
| `index.html` | `YOUR_FRONTEND_DOMAIN` in the Open Graph / canonical tags | Link previews point at a domain that does not exist |
| `public/robots.txt`, `public/sitemap.xml` | `YOUR_FRONTEND_DOMAIN` | Crawlers get an unreachable sitemap |

The CSP also allows `epay.esewa.com.np` and `rc-epay.esewa.com.np` as `form-action` targets,
because eSewa checkout is an auto-submitted form POST. Removing those breaks eSewa payments.

## 4. Payments

- eSewa needs **production** merchant credentials; the defaults in
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
- Book with eSewa; confirm the booking exists and `payment_transactions` holds the
  real gateway reference.
- Abandon a gateway checkout, then confirm the slot is released (immediately via
  `/payment/failure`, or within `PAYMENT_HOLD_MINUTES` via the sweep).
- **Pay, then close the tab before returning.** Within `PAYMENT_HOLD_MINUTES` the reconciling sweep
  must *settle* that booking from eSewa's status API rather than cancel it. This is the check that
  proves a customer cannot be charged without receiving a booking.
- Watch the logs for `PAYMENT NEEDS REVIEW` — it marks a held slot that eSewa could not resolve and
  that needs a human.
- Cancel a booking, then book the same slot again — this must succeed.
- Admin: create/update a venue, upload images, generate slots, approve/cancel/delete a booking.
- Deep-link straight to `/venues/1` and hard-refresh.
- Upload a venue image, restart the App Service, confirm the image still loads over `https://`.
- Register with a **non-Gmail** address. Registration used to reject everything except
  `@gmail.com`, which turned away real customers.
- Confirm a **booking receipt email** arrives for a cash booking and for a gateway booking, and an
  approval email when an admin approves one.
- Leave a **review** on a past approved booking; confirm the venue's average rating updates, and
  that reviewing a venue you never booked is rejected.
- Open the browser console on the deployed site and confirm there are **no CSP violations** - that
  is what a missed `YOUR_BACKEND_DOMAIN` placeholder looks like.
