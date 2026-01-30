-- SQL script to set a user as admin
-- Run this in Supabase SQL Editor

-- Option 1: Exact phone number match
UPDATE users SET role = 'admin' WHERE phone_number = '08131074911';

-- Option 2: If phone number has country code
UPDATE users SET role = 'admin' WHERE phone_number = '+2348131074911';

-- Option 3: Partial match (if unsure of exact format)
UPDATE users SET role = 'admin' WHERE phone_number LIKE '%8131074911%';

-- Verify the update
SELECT id, phone_number, first_name, last_name, role 
FROM users 
WHERE phone_number LIKE '%8131074911%';
