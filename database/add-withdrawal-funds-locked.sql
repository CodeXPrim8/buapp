-- Lock withdrawal funds at request time
-- Run this in Supabase SQL Editor

ALTER TABLE withdrawals
ADD COLUMN IF NOT EXISTS funds_locked BOOLEAN DEFAULT FALSE;

ALTER TABLE withdrawals
ADD COLUMN IF NOT EXISTS locked_at TIMESTAMP WITH TIME ZONE;
