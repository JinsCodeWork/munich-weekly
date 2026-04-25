ALTER TABLE users
    ADD COLUMN IF NOT EXISTS account_type VARCHAR(64) NOT NULL DEFAULT 'REGISTERED';

ALTER TABLE submissions
    ADD COLUMN IF NOT EXISTS anonymous_contact_email VARCHAR(255);

UPDATE users
SET account_type = 'REGISTERED'
WHERE account_type IS NULL;
