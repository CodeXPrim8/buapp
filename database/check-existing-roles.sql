-- Step 1: Check what roles actually exist in the database
-- Run this FIRST to see what roles are in use
SELECT DISTINCT role, COUNT(*) as count 
FROM users 
GROUP BY role 
ORDER BY role;

-- This will show you all unique role values and how many users have each role
