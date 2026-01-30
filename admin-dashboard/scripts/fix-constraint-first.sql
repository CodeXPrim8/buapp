-- CRITICAL: Run this FIRST before updating user role
-- This updates the constraint to allow admin roles

-- Step 1: Drop the old constraint
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;

-- Step 2: Create new constraint that includes admin roles
ALTER TABLE users ADD CONSTRAINT users_role_check 
  CHECK (role IN ('user', 'celebrant', 'vendor', 'both', 'admin', 'super_admin'));

-- Step 3: Verify the constraint was updated
SELECT 
  conname AS constraint_name,
  pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conname = 'users_role_check';
