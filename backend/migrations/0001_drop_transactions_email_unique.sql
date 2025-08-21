-- Migration: drop accidental unique constraint on transactions.email
-- This will safely drop the constraint if present.
BEGIN;
ALTER TABLE IF EXISTS transactions DROP CONSTRAINT IF EXISTS transactions_email_key;
COMMIT;
