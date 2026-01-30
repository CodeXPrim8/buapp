-- Fix role constraint to include all existing roles
-- This handles cases where users have 'admin' or 'superadmin' roles

-- Step 1: First, check what roles exist (run this to see current roles)
-- SELECT DISTINCT role FROM users;

-- Step 2: Drop the existing constraint
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;

-- Step 3: Add new constraint with ALL possible roles (including admin and superadmin)
ALTER TABLE users ADD CONSTRAINT users_role_check 
  CHECK (role IN ('user', 'celebrant', 'vendor', 'both', 'admin', 'superadmin'));
