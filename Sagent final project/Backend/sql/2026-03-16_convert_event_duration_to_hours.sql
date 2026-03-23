ALTER TABLE events
MODIFY COLUMN duration DECIMAL(5,2) NULL;

UPDATE events
SET duration = ROUND(duration / 60, 2)
WHERE duration IS NOT NULL
  AND duration > 24;
