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

The React app runs at `http://localhost:5173` (see `frontend/vite.config.ts`) and uses
`VITE_API_BASE_URL` for backend calls. The backend listens on `9090` by default, or on `PORT`
when the platform sets one.

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
- Apply the migrations in `backend/src/main/resources/db/` (via `deployment/apply-db-migrations.sh`)
  before starting the production profile with `ddl-auto=validate`.

## Uploads

- Futsal photos are uploaded via `POST /api/uploads/futsal-image`.
- Files are stored in the local `uploads/` folder and served at `/uploads/*`.

## API Highlights

- `GET /api/futsals` list venues (public)
- `POST /api/futsals` create venue (admin)
- `GET /api/slots?futsalId=ID` list available slots for a venue (public)
- `POST /api/slots` create slot with `futsalId` (admin)
- `POST /api/payments/initiate` start a payment (eSewa form, or a cash booking)
- `POST /api/payments/verify` confirm a gateway payment after the browser returns
- `GET /api/futsals/{id}/reviews` list a venue's reviews (public)
- `POST /api/futsals/{id}/reviews` leave a review (authenticated; requires an eligible booking)

## Payments

Cash bookings are created directly. eSewa goes through `/api/payments/initiate`, which holds the
slot and hands the browser to the gateway; the booking is only confirmed once
`/api/payments/verify` has checked the payment against eSewa's transaction status API. Khalti was
removed — the enum constant survives only so bookings taken while it was available still load.
The price is always computed server-side from the venue's hourly rate and the slot duration.

An unfinished checkout releases its slot when the user lands on `/payment/failure`, and otherwise
within `app.payment.hold-minutes` via a scheduled sweep.

### Reconciliation

eSewa has no server-to-server webhook, so settlement would otherwise depend entirely on the
customer's browser returning to call `/verify`. The sweep therefore **asks eSewa before it cancels
anything** (`PaymentGatewayService.reconcileExpiredHold`):

| eSewa says | Outcome |
|---|---|
| `COMPLETE`, amount matches | Booking is settled — the customer paid, so they get the booking |
| `NOT_FOUND` / `CANCELED` / `EXPIRED` | Hold released; no money was taken |
| `FULL_REFUND` / `PARTIAL_REFUND` | Hold released, recorded as `REFUNDED` rather than abandoned |
| `AMBIGUOUS` / `PENDING` / unreachable / amount mismatch | **Hold kept** and logged as `PAYMENT NEEDS REVIEW` |

The rule is that a hold is released only on a positive "no money was taken" answer. Holding one
slot is far cheaper than taking money without giving a booking. Each transaction is reconciled in
its own transaction, so one bad row cannot roll back the batch.

## Refunds

eSewa exposes **no merchant refund API** — their documentation states that only eSewa initiates
refunds and that merchants cannot trigger them programmatically. Money is therefore returned from
the merchant dashboard at `merchant.esewa.com.np`, and this system cannot change that. What it does
is remove every other manual step.

Cancelling or rejecting a **paid** booking moves its transaction to `REFUND_PENDING` and records
the reason and the actor (`RefundService.markRefundDue`). The refund then appears in the admin
queue at `/admin/refunds` with the gateway reference to paste into the dashboard. A scheduled sweep
polls eSewa and closes it out on its own:

| eSewa reports | Outcome |
|---|---|
| `FULL_REFUND` | Marked `REFUNDED`, `refunded_at` stamped, customer emailed |
| `PARTIAL_REFUND` | Kept open and logged `REFUND NEEDS REVIEW` — the policy is full refunds only |
| `COMPLETE` | Still owed; logged `REFUND OVERDUE` past `app.refund.overdue-hours` |
| unreachable / anything else | Kept open and retried next sweep |

Two guards matter. A refund is recorded **only** when the transaction is `COMPLETED` and was not
cash — an abandoned checkout is `PENDING`, so `PaymentGatewayService.releaseHold` cancelling it
through the same path cannot create a phantom refund. And `RefundService` depends on neither
`BookingService` nor `PaymentGatewayService`, because the latter already depends on the former and
a refund service in the middle would close the cycle.

Customers may self-cancel only up to `app.booking.cancellation-cutoff-hours` (default 24) before
the slot; admins are never subject to that window.

## Reviews

Venue ratings come from `reviews`, added in `V5__reviews.sql`. A review is only accepted when the
booking it cites belongs to the caller, is `APPROVED`, is for the venue being reviewed, and has
already finished - enforced in `ReviewService`, not in the UI. One review per booking, so a
regular can rate each visit but nobody can rate a venue twice for the same game. `Futsal.rating`
and `reviewCount` are recomputed in the same transaction as the write, so the venue card and the
review list can never disagree.

Customers leave reviews from **My bookings**, where the prompt appears only on bookings that are
actually eligible.

## Emails

Two kinds, both gated on SMTP being configured:

- Verification and password-reset codes (`VerificationDeliveryService`).
- Booking receipts and approve/reject/cancel notices (`BookingNotificationService`), controlled by
  `NOTIFICATION_EMAIL_ENABLED`, which defaults to `VERIFICATION_EMAIL_ENABLED`.

Booking emails are sent asynchronously and only after the surrounding transaction commits, so a
mail outage can never roll back a settled payment and a rolled-back booking never generates a
receipt. Failures are logged, never propagated.

## Build and CI

`.github/workflows/ci.yml` runs `mvn -B verify` and the frontend's typecheck, unit tests and build
on every push and pull request. `backend/Dockerfile` is a multi-stage build that produces a
JRE-only runtime image running as a non-root user.

## Authorization

Admin-only routes are enforced in two places: declaratively in
`backend/src/main/java/com/futsal/security/SecurityConfig.java`, and imperatively via
`SecurityAuth.requireAdmin()` in the controllers. `SecurityRulesTest` asserts the full matrix
(401 anonymous / 403 customer / 200 admin) — keep it passing.

## Project Structure (Key Areas)

- `backend/src/main/java/com/futsal/model` entities (`Futsal`, `TimeSlot`, `Booking`, `User`)
- `backend/src/main/java/com/futsal/controller` REST endpoints
- `backend/src/main/java/com/futsal/service` business logic
- `frontend/src/pages` UI pages (public, user, and admin)
- `frontend/src/api` shared API layer
- `frontend/src/components` shared React UI components
