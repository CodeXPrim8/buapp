-- Complete SQL script to set up super admin
-- Run this in Supabase SQL Editor

-- Step 1: Update constraint to allow admin roles
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;

ALTER TABLE users ADD CONSTRAINT users_role_check 
  CHECK (role IN ('user', 'celebrant', 'vendor', 'both', 'admin', 'super_admin'));

-- Step 2: Update user to super_admin with new PIN
UPDATE users 
SET 
  role = 'super_admin',
  pin_hash = '$2b$10$sEmTl20.rHoYzxL8SXllYeH875ci.pZLjs2aXgJnZH7OfoXLmanGS'
WHERE phone_number = '+2348131074911';

-- Step 3: Verify
SELECT id, phone_number, first_name, last_name, role 
FROM users 
WHERE phone_number = '+2348131074911';
