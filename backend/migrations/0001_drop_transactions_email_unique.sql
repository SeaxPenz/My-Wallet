-- Migration: drop accidental unique constraint on transactions.email
-- This will safely drop the constraint if present.
ALTER TABLE transactions DROP CONSTRAINT IF EXISTS transactions_email_key;
