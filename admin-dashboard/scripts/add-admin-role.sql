-- SQL script to add 'admin' and 'super_admin' roles to users table
-- Run this in Supabase SQL Editor FIRST before setting users as admin

-- Step 1: Drop the existing check constraint
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;

-- Step 2: Add new constraint that includes admin roles
ALTER TABLE users ADD CONSTRAINT users_role_check 
  CHECK (role IN ('user', 'celebrant', 'vendor', 'both', 'admin', 'super_admin'));

-- Step 3: Now you can update the user role
UPDATE users SET role = 'admin' WHERE phone_number = '+2348131074911';

-- Step 4: Verify the update
SELECT id, phone_number, first_name, last_name, role 
FROM users 
WHERE phone_number = '+2348131074911';
