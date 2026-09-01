-- V3 - Payment transaction tracking.
--
-- Only does anything on a database created before payments existed; V1 already includes this
-- table for a fresh install. CREATE TABLE IF NOT EXISTS makes re-running a no-op.

CREATE TABLE IF NOT EXISTS payment_transactions (
    transaction_id         BIGINT        NOT NULL AUTO_INCREMENT,
    booking_id             BIGINT        NOT NULL,
    payment_method         ENUM ('ESEWA','KHALTI','CASH_IN_HAND') NOT NULL,
    amount                 DECIMAL(10,2) NOT NULL,
    currency               VARCHAR(3) DEFAULT 'NPR',
    gateway_transaction_id VARCHAR(100),
    gateway_response       TEXT,
    status                 ENUM ('PENDING','COMPLETED','FAILED','REFUNDED','CANCELLED') NOT NULL,
    created_at             DATETIME(6)   NOT NULL,
    completed_at           DATETIME(6),
    failure_reason         VARCHAR(500),
    idempotency_key        VARCHAR(100),
    PRIMARY KEY (transaction_id),
    UNIQUE KEY uk_payment_idempotency (idempotency_key),
    KEY idx_payment_gateway (gateway_transaction_id),
    KEY idx_payment_status (status),
    KEY idx_payment_booking (booking_id),
    CONSTRAINT fk_payment_booking FOREIGN KEY (booking_id) REFERENCES bookings (booking_id) ON DELETE CASCADE
) ENGINE=InnoDB;
