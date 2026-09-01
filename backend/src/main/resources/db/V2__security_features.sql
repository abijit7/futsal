-- V2 - Account verification and JWT session invalidation.
--
-- Only does anything on a database created before these features existed; V1 already includes
-- them for a fresh install.
--
-- The previous version of this file used `ALTER TABLE ... ADD COLUMN IF NOT EXISTS`, which is
-- MariaDB syntax and is a syntax error on MySQL. The information_schema guard below is the
-- portable MySQL 8 equivalent.

SET @ddl := IF(
    EXISTS(SELECT 1 FROM information_schema.COLUMNS
           WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME = 'email_verified'),
    'SELECT ''users.email_verified already present''',
    'ALTER TABLE users ADD COLUMN email_verified BIT NOT NULL DEFAULT 0');
PREPARE stmt FROM @ddl; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @ddl := IF(
    EXISTS(SELECT 1 FROM information_schema.COLUMNS
           WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME = 'phone_verified'),
    'SELECT ''users.phone_verified already present''',
    'ALTER TABLE users ADD COLUMN phone_verified BIT NOT NULL DEFAULT 0');
PREPARE stmt FROM @ddl; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @ddl := IF(
    EXISTS(SELECT 1 FROM information_schema.COLUMNS
           WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME = 'auth_version'),
    'SELECT ''users.auth_version already present''',
    'ALTER TABLE users ADD COLUMN auth_version INTEGER NOT NULL DEFAULT 0');
PREPARE stmt FROM @ddl; EXECUTE stmt; DEALLOCATE PREPARE stmt;

CREATE TABLE IF NOT EXISTS verification_codes (
    verification_code_id BIGINT       NOT NULL AUTO_INCREMENT,
    user_id              BIGINT       NOT NULL,
    purpose              ENUM ('EMAIL_VERIFICATION','PHONE_VERIFICATION','PASSWORD_RESET') NOT NULL,
    destination          VARCHAR(120) NOT NULL,
    code_hash            VARCHAR(64)  NOT NULL,
    expires_at           DATETIME(6)  NOT NULL,
    created_at           DATETIME(6)  NOT NULL,
    consumed_at          DATETIME(6),
    attempts             INTEGER      NOT NULL DEFAULT 0,
    PRIMARY KEY (verification_code_id),
    KEY idx_verification_user_purpose (user_id, purpose),
    KEY idx_verification_expiry (expires_at),
    CONSTRAINT fk_verification_user FOREIGN KEY (user_id) REFERENCES users (user_id) ON DELETE CASCADE
) ENGINE=InnoDB;
