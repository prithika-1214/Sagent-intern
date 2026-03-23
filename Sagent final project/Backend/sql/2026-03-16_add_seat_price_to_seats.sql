ALTER TABLE seats
ADD COLUMN seat_price DECIMAL(10,2) NULL AFTER seat_type;

UPDATE seats
SET seat_price = CASE
    WHEN UPPER(COALESCE(seat_type, '')) = 'PREMIUM' THEN 320.00
    ELSE 220.00
END
WHERE seat_price IS NULL;
