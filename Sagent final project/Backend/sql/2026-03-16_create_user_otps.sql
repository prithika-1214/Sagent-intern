CREATE TABLE IF NOT EXISTS user_otps (
    otp_id BIGINT NOT NULL AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    otp_code VARCHAR(8) NOT NULL,
    otp_purpose VARCHAR(50) NOT NULL,
    created_at DATETIME NOT NULL,
    expires_at DATETIME NOT NULL,
    verified_at DATETIME NULL,
    consumed_at DATETIME NULL,
    verification_attempts INT NULL,
    PRIMARY KEY (otp_id),
    CONSTRAINT fk_user_otps_user FOREIGN KEY (user_id) REFERENCES users (user_id)
);
