-- Apply this migration before running the production profile with ddl-auto=validate.
-- The development profile uses ddl-auto=update and creates these changes automatically.

ALTER TABLE users
    ADD COLUMN IF NOT EXISTS email_verified BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS phone_verified BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS auth_version INT NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS verification_codes (
    verification_code_id BIGINT NOT NULL AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    purpose VARCHAR(32) NOT NULL,
    destination VARCHAR(120) NOT NULL,
    code_hash VARCHAR(64) NOT NULL,
    expires_at DATETIME(6) NOT NULL,
    created_at DATETIME(6) NOT NULL,
    consumed_at DATETIME(6) NULL,
    attempts INT NOT NULL DEFAULT 0,
    PRIMARY KEY (verification_code_id),
    CONSTRAINT fk_verification_user FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    INDEX idx_verification_user_purpose (user_id, purpose),
    INDEX idx_verification_expiry (expires_at)
);
