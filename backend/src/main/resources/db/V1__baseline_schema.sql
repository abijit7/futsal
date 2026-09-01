-- V1 - Baseline schema.
--
-- Generated from the JPA entities with Hibernate's MySQL dialect and Spring Boot's
-- CamelCaseToUnderscoresNamingStrategy, so the column types here are exactly what
-- `spring.jpa.hibernate.ddl-auto=validate` expects in the prod profile. Regenerate rather than
-- hand-edit when entities change.
--
-- Every statement is idempotent (CREATE TABLE IF NOT EXISTS with constraints inlined), so this is
-- safe to run against a fresh database and against one already built by `ddl-auto=update`.
--
-- Tables are ordered so foreign keys always reference an existing table.

CREATE TABLE IF NOT EXISTS users (
    user_id        BIGINT       NOT NULL AUTO_INCREMENT,
    name           VARCHAR(255) NOT NULL,
    email          VARCHAR(255) NOT NULL,
    phone          VARCHAR(255) NOT NULL,
    password       VARCHAR(255) NOT NULL,
    role           ENUM ('USER','ADMIN') NOT NULL,
    created_at     DATETIME(6)  NOT NULL,
    email_verified BIT          NOT NULL,
    phone_verified BIT          NOT NULL,
    auth_version   INTEGER      NOT NULL,
    PRIMARY KEY (user_id),
    UNIQUE KEY uk_users_email (email)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS futsals (
    futsal_id    BIGINT        NOT NULL AUTO_INCREMENT,
    name         VARCHAR(255)  NOT NULL,
    address      VARCHAR(255)  NOT NULL,
    city         VARCHAR(255)  NOT NULL,
    phone        VARCHAR(255)  NOT NULL,
    hourly_price DECIMAL(10,2) NOT NULL,
    opening_time TIME(6)       NOT NULL,
    closing_time TIME          DEFAULT '23:00:00' NOT NULL,
    image_url    VARCHAR(300),
    verified     BOOLEAN       DEFAULT FALSE NOT NULL,
    court_type   VARCHAR(60),
    rating       DECIMAL(2,1),
    review_count INTEGER       DEFAULT 0 NOT NULL,
    description  VARCHAR(250),
    created_at   DATETIME(6)   NOT NULL,
    PRIMARY KEY (futsal_id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS futsal_images (
    image_id   BIGINT       NOT NULL AUTO_INCREMENT,
    futsal_id  BIGINT       NOT NULL,
    image_url  VARCHAR(300) NOT NULL,
    sort_order INTEGER      NOT NULL,
    cover      BIT          NOT NULL,
    caption    VARCHAR(120),
    created_at DATETIME(6)  NOT NULL,
    PRIMARY KEY (image_id),
    CONSTRAINT fk_futsal_image_futsal FOREIGN KEY (futsal_id) REFERENCES futsals (futsal_id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS time_slots (
    slot_id    BIGINT  NOT NULL AUTO_INCREMENT,
    futsal_id  BIGINT  NOT NULL,
    slot_date  DATE    NOT NULL,
    start_time TIME(6) NOT NULL,
    end_time   TIME(6) NOT NULL,
    available  BIT     NOT NULL,
    PRIMARY KEY (slot_id),
    CONSTRAINT uk_time_slot_schedule UNIQUE (futsal_id, slot_date, start_time, end_time),
    CONSTRAINT fk_time_slot_futsal FOREIGN KEY (futsal_id) REFERENCES futsals (futsal_id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS time_slot_status_history (
    history_id BIGINT      NOT NULL AUTO_INCREMENT,
    slot_id    BIGINT      NOT NULL,
    available  BIT         NOT NULL,
    changed_at DATETIME(6) NOT NULL,
    changed_by VARCHAR(60),
    note       VARCHAR(200),
    PRIMARY KEY (history_id),
    CONSTRAINT fk_slot_history_slot FOREIGN KEY (slot_id) REFERENCES time_slots (slot_id)
) ENGINE=InnoDB;

-- NOTE: slot_id is deliberately NOT unique. A slot freed by a cancellation must be bookable
-- again; only one *open* booking may exist per slot, which V4 enforces with a generated column.
CREATE TABLE IF NOT EXISTS bookings (
    booking_id     BIGINT      NOT NULL AUTO_INCREMENT,
    user_id        BIGINT      NOT NULL,
    slot_id        BIGINT      NOT NULL,
    status         ENUM ('PENDING','APPROVED','REJECTED','CANCELLED') NOT NULL,
    payment_method ENUM ('ESEWA','KHALTI','CASH_IN_HAND') NOT NULL,
    payment_ref    VARCHAR(80) NOT NULL,
    paid_at        DATETIME(6) NOT NULL,
    booked_at      DATETIME(6) NOT NULL,
    notes          VARCHAR(500),
    PRIMARY KEY (booking_id),
    KEY idx_booking_slot_status (slot_id, status),
    CONSTRAINT fk_booking_slot FOREIGN KEY (slot_id) REFERENCES time_slots (slot_id),
    CONSTRAINT fk_booking_user FOREIGN KEY (user_id) REFERENCES users (user_id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS booking_status_history (
    history_id BIGINT      NOT NULL AUTO_INCREMENT,
    booking_id BIGINT      NOT NULL,
    status     ENUM ('PENDING','APPROVED','REJECTED','CANCELLED') NOT NULL,
    changed_at DATETIME(6) NOT NULL,
    changed_by VARCHAR(60),
    note       VARCHAR(200),
    PRIMARY KEY (history_id),
    CONSTRAINT fk_booking_history_booking FOREIGN KEY (booking_id) REFERENCES bookings (booking_id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS payment_transactions (
    transaction_id         BIGINT        NOT NULL AUTO_INCREMENT,
    booking_id             BIGINT        NOT NULL,
    payment_method         ENUM ('ESEWA','KHALTI','CASH_IN_HAND') NOT NULL,
    amount                 DECIMAL(10,2) NOT NULL,
    currency               VARCHAR(3),
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

CREATE TABLE IF NOT EXISTS verification_codes (
    verification_code_id BIGINT       NOT NULL AUTO_INCREMENT,
    user_id              BIGINT       NOT NULL,
    purpose              ENUM ('EMAIL_VERIFICATION','PHONE_VERIFICATION','PASSWORD_RESET') NOT NULL,
    destination          VARCHAR(120) NOT NULL,
    code_hash            VARCHAR(64)  NOT NULL,
    expires_at           DATETIME(6)  NOT NULL,
    created_at           DATETIME(6)  NOT NULL,
    consumed_at          DATETIME(6),
    attempts             INTEGER      NOT NULL,
    PRIMARY KEY (verification_code_id),
    KEY idx_verification_user_purpose (user_id, purpose),
    KEY idx_verification_expiry (expires_at),
    CONSTRAINT fk_verification_user FOREIGN KEY (user_id) REFERENCES users (user_id) ON DELETE CASCADE
) ENGINE=InnoDB;
