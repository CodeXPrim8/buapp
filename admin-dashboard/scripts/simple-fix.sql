-- SIMPLE FIX: Run this SQL in Supabase SQL Editor
-- This will update the constraint and then update/create the user

-- Step 1: Fix constraint
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE users ADD CONSTRAINT users_role_check 
  CHECK (role IN ('user', 'celebrant', 'vendor', 'both', 'admin', 'super_admin'));

-- Step 2: Update user (if exists) or you may need to create it manually
-- First, check if user exists:
SELECT id, phone_number, first_name, last_name, role 
FROM users 
WHERE phone_number LIKE '%8131074911%' OR phone_number LIKE '%2348131074911%';

-- Step 3: Update the user (replace with actual phone number from step 2 if different)
UPDATE users 
SET 
  role = 'super_admin',
  pin_hash = '$2b$10$DnVAUSQVkFrdjwe09HgEpe01vvdmvFV0gS0xX8r4k54fjeOPd3Jmy'
WHERE phone_number = '+2348131074911';

-- If the UPDATE affects 0 rows, the user doesn't exist with that exact phone number
-- Check the SELECT result above and use the correct phone number format

-- Step 4: Verify
SELECT id, phone_number, first_name, last_name, role, pin_hash IS NOT NULL as has_pin
FROM users 
WHERE phone_number LIKE '%8131074911%';
