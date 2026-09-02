-- V5 - Venue reviews.
--
-- futsals.rating and futsals.review_count have existed since V1 and are rendered on every venue
-- card, but nothing could ever write them, so they were permanently 0. This adds the table those
-- aggregates are computed from.
--
-- One review per booking: the unique key is (futsal_id, user_id, booking_id) so a customer who
-- plays at the same venue repeatedly may review each visit, while a single booking can only be
-- reviewed once. ReviewService additionally requires that the booking is APPROVED and in the past.
--
-- Idempotent, like every other migration here.

CREATE TABLE IF NOT EXISTS reviews (
    review_id  BIGINT       NOT NULL AUTO_INCREMENT,
    futsal_id  BIGINT       NOT NULL,
    user_id    BIGINT       NOT NULL,
    booking_id BIGINT       NOT NULL,
    rating     INTEGER      NOT NULL,
    comment    VARCHAR(500),
    created_at DATETIME(6)  NOT NULL,
    updated_at DATETIME(6),
    PRIMARY KEY (review_id),
    UNIQUE KEY uk_review_booking (futsal_id, user_id, booking_id),
    KEY idx_review_futsal (futsal_id, created_at),
    CONSTRAINT fk_review_futsal FOREIGN KEY (futsal_id) REFERENCES futsals (futsal_id) ON DELETE CASCADE,
    CONSTRAINT fk_review_user FOREIGN KEY (user_id) REFERENCES users (user_id) ON DELETE CASCADE,
    CONSTRAINT fk_review_booking FOREIGN KEY (booking_id) REFERENCES bookings (booking_id) ON DELETE CASCADE
) ENGINE=InnoDB;
