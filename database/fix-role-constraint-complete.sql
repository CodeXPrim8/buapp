-- Complete fix for role constraint issue
-- Run these queries in order

-- Step 1: Check what roles exist (run this first to see the problem)
SELECT DISTINCT role, COUNT(*) as count 
FROM users 
GROUP BY role 
ORDER BY role;

-- Step 2: If you see any roles not in the list below, you have two options:

-- Option A: Update invalid roles to valid ones (recommended)
-- Example: If you see role 'invalid_role', update it:
-- UPDATE users SET role = 'user' WHERE role = 'invalid_role';

-- Option B: Add the invalid role to the constraint (if it's a valid role you want to keep)
-- Then modify the constraint below to include it

-- Step 3: Drop the constraint
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;

-- Step 4: Add constraint with ALL roles (modify this list based on Step 1 results)
ALTER TABLE users ADD CONSTRAINT users_role_check 
  CHECK (role IN ('user', 'celebrant', 'vendor', 'both', 'admin', 'superadmin'));

-- If Step 1 shows other roles, add them to the CHECK list above
