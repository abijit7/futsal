-- V8 - Status columns become VARCHAR.
--
-- Every enum-valued column was declared as a MySQL ENUM listing its legal values, while the code
-- that produces those values lives in Java as @Enumerated(EnumType.STRING). The entities never name
-- a column type, so the two definitions drifted apart silently: adding a Java constant required a
-- matching ALTER, and forgetting one produced
--
--     SQL Error: 1265 - Data truncated for column 'status' at row 1
--
-- at runtime, inside whichever sweep happened to write the new value first. That happened twice:
-- booking_status_history.status rejecting EXPIRED, then payment_transactions.status rejecting
-- REFUND_PENDING.
--
-- Crucially this is not caught by ddl-auto=validate. Hibernate checks that columns exist and that
-- types are broadly compatible; it does not compare an ENUM's value set against the Java enum's
-- constants. A production database that skipped a migration starts perfectly and then fails in a
-- scheduled job hours later.
--
-- VARCHAR removes the coupling: the Java enum becomes the single source of truth, which is the
-- normal way @Enumerated(STRING) is used. The database no longer constrains the values, but
-- Hibernate still throws when reading one it does not recognise, so a bad row cannot pass silently
-- into the application.
--
-- 30 characters comfortably fits the longest constant, EMAIL_VERIFICATION at 18.
--
-- Safe to apply:
--   * MODIFY COLUMN is idempotent in effect - applying the same definition twice changes nothing.
--   * The existing indexes (idx_booking_slot_status, idx_payment_status,
--     idx_verification_user_purpose) are preserved across the type change.
--   * Nothing in the application orders by one of these columns, so the change from ENUM's
--     declaration-order sorting to VARCHAR's alphabetical sorting has no observable effect.
--
-- Earlier migrations keep their ENUM definitions on purpose: they are history and must stay
-- reproducible. A fresh database runs V1 through V8 and ends up here either way.

ALTER TABLE users
    MODIFY COLUMN role VARCHAR(30) NOT NULL;

ALTER TABLE bookings
    MODIFY COLUMN status VARCHAR(30) NOT NULL;

ALTER TABLE bookings
    MODIFY COLUMN payment_method VARCHAR(30) NOT NULL;

ALTER TABLE booking_status_history
    MODIFY COLUMN status VARCHAR(30) NOT NULL;

ALTER TABLE payment_transactions
    MODIFY COLUMN status VARCHAR(30) NOT NULL;

ALTER TABLE payment_transactions
    MODIFY COLUMN payment_method VARCHAR(30) NOT NULL;

ALTER TABLE verification_codes
    MODIFY COLUMN purpose VARCHAR(30) NOT NULL;
