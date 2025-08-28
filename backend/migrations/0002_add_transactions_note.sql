-- Migration: add optional note column to transactions
BEGIN;
ALTER TABLE IF EXISTS transactions ADD COLUMN IF NOT EXISTS note TEXT;
COMMIT;
