-- Apply this migration to add payment transaction tracking
-- This should be applied before running the production profile with ddl-auto=validate

CREATE TABLE payment_transactions (
    transaction_id BIGINT NOT NULL AUTO_INCREMENT,
    booking_id BIGINT NOT NULL,
    payment_method VARCHAR(32) NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'NPR',
    gateway_transaction_id VARCHAR(100),
    gateway_response TEXT,
    status VARCHAR(32) NOT NULL DEFAULT 'PENDING',
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    completed_at DATETIME(6),
    failure_reason VARCHAR(500),
    idempotency_key VARCHAR(100) NOT NULL UNIQUE,
    PRIMARY KEY (transaction_id),
    CONSTRAINT fk_payment_booking FOREIGN KEY (booking_id) REFERENCES bookings(booking_id) ON DELETE CASCADE,
    INDEX idx_payment_gateway (gateway_transaction_id),
    INDEX idx_payment_status (status),
    INDEX idx_payment_booking (booking_id),
    INDEX idx_payment_idempotency (idempotency_key)
);
