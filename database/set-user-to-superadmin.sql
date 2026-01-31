-- Set user with phone number 08131074911 to superadmin role
-- This grants them Guest + Celebrant + Vendor + Admin + Superadmin privileges
-- Run this in your Supabase SQL Editor

-- First, ensure the constraint allows 'superadmin' role
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE users ADD CONSTRAINT users_role_check 
  CHECK (role IN ('user', 'celebrant', 'vendor', 'both', 'admin', 'superadmin'));

-- Update the user to superadmin role
-- Try multiple phone number formats to ensure we find the user
UPDATE users 
SET role = 'superadmin' 
WHERE phone_number = '+2348131074911' 
   OR phone_number = '2348131074911' 
   OR phone_number = '08131074911'
   OR phone_number LIKE '%8131074911%';

-- Verify the update
SELECT id, phone_number, first_name, last_name, role, created_at 
FROM users 
WHERE phone_number LIKE '%8131074911%';

-- Expected result: role should be 'superadmin'
