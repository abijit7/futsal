-- V4 - Allow a cancelled slot to be booked again.
--
-- Booking.timeSlot used to be @OneToOne, so Hibernate put a UNIQUE constraint on bookings.slot_id.
-- That made the mapping permanently reject a second booking for a slot, even after the first was
-- cancelled and the slot marked available again - the insert died on the constraint and the user
-- saw "This slot was just booked by someone else."
--
-- The entity is now @ManyToOne. Uniqueness is narrowed to *open* bookings only: the generated
-- column is NULL for CANCELLED/REJECTED rows, and MySQL's unique indexes ignore NULLs.

-- 1. Make sure a non-unique index covers slot_id before dropping the unique one, so the
--    bookings -> time_slots foreign key always has a usable index.
SET @ddl := IF(
    EXISTS(SELECT 1 FROM information_schema.STATISTICS
           WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'bookings'
             AND INDEX_NAME = 'idx_booking_slot_status'),
    'SELECT ''idx_booking_slot_status already present''',
    'CREATE INDEX idx_booking_slot_status ON bookings (slot_id, status)');
PREPARE stmt FROM @ddl; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- 2. Drop the legacy single-column UNIQUE index on slot_id, whatever Hibernate named it
--    (typically UK_<hash>). MySQL has no DROP INDEX IF EXISTS, hence the lookup.
SET @legacy_index := (
    SELECT INDEX_NAME
    FROM information_schema.STATISTICS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'bookings'
      AND NON_UNIQUE = 0
      AND INDEX_NAME <> 'PRIMARY'
      AND INDEX_NAME <> 'uk_booking_active_slot'
    GROUP BY INDEX_NAME
    HAVING COUNT(*) = 1 AND MAX(COLUMN_NAME) = 'slot_id'
    LIMIT 1);

SET @ddl := IF(
    @legacy_index IS NULL,
    'SELECT ''no legacy unique index on bookings.slot_id''',
    CONCAT('ALTER TABLE bookings DROP INDEX `', @legacy_index, '`'));
PREPARE stmt FROM @ddl; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- 3. Add the generated column that is non-NULL only while a booking is open.
SET @ddl := IF(
    EXISTS(SELECT 1 FROM information_schema.COLUMNS
           WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'bookings'
             AND COLUMN_NAME = 'active_slot_id'),
    'SELECT ''bookings.active_slot_id already present''',
    'ALTER TABLE bookings ADD COLUMN active_slot_id BIGINT
        GENERATED ALWAYS AS (CASE WHEN status IN (''PENDING'',''APPROVED'') THEN slot_id END) STORED');
PREPARE stmt FROM @ddl; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- 4. One open booking per slot.
SET @ddl := IF(
    EXISTS(SELECT 1 FROM information_schema.STATISTICS
           WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'bookings'
             AND INDEX_NAME = 'uk_booking_active_slot'),
    'SELECT ''uk_booking_active_slot already present''',
    'ALTER TABLE bookings ADD UNIQUE KEY uk_booking_active_slot (active_slot_id)');
PREPARE stmt FROM @ddl; EXECUTE stmt; DEALLOCATE PREPARE stmt;
