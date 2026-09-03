-- V6 - Refund tracking.
--
-- Cancelling or rejecting a paid booking previously kept the customer's money with no record that
-- anything was owed. PaymentStatus.REFUNDED existed but was only ever written when reconciliation
-- happened to observe that eSewa had already refunded something out of band.
--
-- eSewa exposes no merchant refund API: money is moved from the merchant dashboard. So the system
-- cannot issue a refund, but it can record that one is owed, and it can detect a dashboard refund
-- afterwards, because the transaction status API reports FULL_REFUND once one has been issued.
--
-- REFUND_PENDING is the state that was missing: "we owe this customer money and nobody has paid it
-- yet". The lifecycle becomes COMPLETED -> REFUND_PENDING -> REFUNDED.
--
-- Refund data gets its own columns rather than reusing completed_at, gateway_response or
-- failure_reason, each of which holds settlement evidence that must not be overwritten.
--
-- Every statement is idempotent, so re-running is safe.

-- 1. Widen the status enum. MODIFY is not conditional, but it is idempotent in effect: applying the
--    same definition twice leaves the column unchanged.
ALTER TABLE payment_transactions
    MODIFY COLUMN status ENUM ('PENDING','COMPLETED','FAILED','REFUND_PENDING','REFUNDED','CANCELLED') NOT NULL;

-- 2. Refund metadata.
SET @ddl := IF(
    EXISTS(SELECT 1 FROM information_schema.COLUMNS
           WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'payment_transactions'
             AND COLUMN_NAME = 'refund_due_at'),
    'SELECT ''payment_transactions.refund_due_at already present''',
    'ALTER TABLE payment_transactions ADD COLUMN refund_due_at DATETIME(6)');
PREPARE stmt FROM @ddl; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @ddl := IF(
    EXISTS(SELECT 1 FROM information_schema.COLUMNS
           WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'payment_transactions'
             AND COLUMN_NAME = 'refund_reason'),
    'SELECT ''payment_transactions.refund_reason already present''',
    'ALTER TABLE payment_transactions ADD COLUMN refund_reason VARCHAR(500)');
PREPARE stmt FROM @ddl; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @ddl := IF(
    EXISTS(SELECT 1 FROM information_schema.COLUMNS
           WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'payment_transactions'
             AND COLUMN_NAME = 'refund_requested_by'),
    'SELECT ''payment_transactions.refund_requested_by already present''',
    'ALTER TABLE payment_transactions ADD COLUMN refund_requested_by VARCHAR(60)');
PREPARE stmt FROM @ddl; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @ddl := IF(
    EXISTS(SELECT 1 FROM information_schema.COLUMNS
           WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'payment_transactions'
             AND COLUMN_NAME = 'refunded_at'),
    'SELECT ''payment_transactions.refunded_at already present''',
    'ALTER TABLE payment_transactions ADD COLUMN refunded_at DATETIME(6)');
PREPARE stmt FROM @ddl; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @ddl := IF(
    EXISTS(SELECT 1 FROM information_schema.COLUMNS
           WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'payment_transactions'
             AND COLUMN_NAME = 'refund_reference'),
    'SELECT ''payment_transactions.refund_reference already present''',
    'ALTER TABLE payment_transactions ADD COLUMN refund_reference VARCHAR(100)');
PREPARE stmt FROM @ddl; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- 3. Index for the admin refund queue and the reconciliation sweep, both of which select
--    REFUND_PENDING ordered by how long the refund has been outstanding.
SET @ddl := IF(
    EXISTS(SELECT 1 FROM information_schema.STATISTICS
           WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'payment_transactions'
             AND INDEX_NAME = 'idx_payment_refund_due'),
    'SELECT ''idx_payment_refund_due already present''',
    'CREATE INDEX idx_payment_refund_due ON payment_transactions (status, refund_due_at)');
PREPARE stmt FROM @ddl; EXECUTE stmt; DEALLOCATE PREPARE stmt;
