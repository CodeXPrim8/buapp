-- Complete SQL to fix admin login
-- Run this in Supabase SQL Editor

-- Step 1: Update constraint to allow admin roles
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;

ALTER TABLE users ADD CONSTRAINT users_role_check 
  CHECK (role IN ('user', 'celebrant', 'vendor', 'both', 'admin', 'super_admin'));

-- Step 2: Update user role and PIN hash for PIN '222222'
-- This hash was generated with: bcrypt.hash('222222', 10)
UPDATE users 
SET 
  role = 'super_admin',
  pin_hash = '$2b$10$DnVAUSQVkFrdjwe09HgEpe01vvdmvFV0gS0xX8r4k54fjeOPd3Jmy'
WHERE phone_number = '+2348131074911';

-- Step 3: Verify the update
SELECT id, phone_number, first_name, last_name, role 
FROM users 
WHERE phone_number = '+2348131074911';
