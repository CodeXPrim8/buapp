-- Add saved bank details to users table
-- Run this in Supabase SQL Editor

ALTER TABLE users
ADD COLUMN IF NOT EXISTS bank_name TEXT;

ALTER TABLE users
ADD COLUMN IF NOT EXISTS account_number TEXT;

ALTER TABLE users
ADD COLUMN IF NOT EXISTS account_name TEXT;

-- Optional: refresh PostgREST schema cache
NOTIFY pgrst, 'reload schema';
