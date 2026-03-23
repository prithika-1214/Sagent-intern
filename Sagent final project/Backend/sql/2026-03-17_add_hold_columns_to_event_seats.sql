ALTER TABLE event_seats
    ADD COLUMN hold_token VARCHAR(100) NULL,
    ADD COLUMN hold_expires_at DATETIME NULL;
