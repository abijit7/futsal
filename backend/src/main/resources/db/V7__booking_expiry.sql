-- V7 - Booking expiry.
--
-- A booking sat PENDING until an admin acted on it, and nothing ever acted on one whose slot had
-- already come and gone. The slot stayed held (createPaidBooking sets available = false and only a
-- move to REJECTED or CANCELLED restores it), the customer could not cancel it because the
-- cancellation cutoff refuses anything starting soon, and an admin could still "approve" a match
-- that had already not happened. If the booking had been paid through the gateway, the money was
-- never even recorded as owed, because that only happens on cancel or reject.
--
-- EXPIRED is the state that was missing: "nobody confirmed this and its slot has passed". It is
-- terminal and written only by the sweep in BookingService, never by a user action, which is why
-- no transition leads out of it.
--
-- Reusing REJECTED instead was rejected: the customer is emailed "the venue could not accept this
-- booking" and any refund is filed as "Booking rejected by the venue", neither of which is true.
--
-- Both tables carry the same enum. Widening only `bookings` would leave the audit insert in
-- booking_status_history failing on an unknown value.
--
-- Every statement is idempotent, so re-running is safe.

-- 1. Widen the booking status enum. MODIFY is not conditional, but it is idempotent in effect:
--    applying the same definition twice leaves the column unchanged.
ALTER TABLE bookings
    MODIFY COLUMN status ENUM ('PENDING','APPROVED','REJECTED','CANCELLED','EXPIRED') NOT NULL;

-- 2. The status history column must accept the same values, or recording the transition fails.
ALTER TABLE booking_status_history
    MODIFY COLUMN status ENUM ('PENDING','APPROVED','REJECTED','CANCELLED','EXPIRED') NOT NULL;
