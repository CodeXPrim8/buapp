-- STEP-BY-STEP FIX FOR ROLE CONSTRAINT ERROR
-- Run these queries ONE AT A TIME in order

-- ============================================
-- STEP 1: Check what roles exist in database
-- ============================================
-- Run this FIRST to see what roles are causing the problem
SELECT DISTINCT role, COUNT(*) as count 
FROM users 
GROUP BY role 
ORDER BY role;

-- This will show you all unique role values. Look for any that are NOT in:
-- ('user', 'celebrant', 'vendor', 'both', 'admin', 'superadmin')

-- ============================================
-- STEP 2: Drop the constraint (if it exists)
-- ============================================
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;

-- ============================================
-- STEP 3: Fix any invalid roles
-- ============================================
-- Based on Step 1 results, update invalid roles. Examples:

-- If you see NULL roles:
-- UPDATE users SET role = 'user' WHERE role IS NULL;

-- If you see empty string:
-- UPDATE users SET role = 'user' WHERE role = '';

-- If you see a typo (like 'admn' instead of 'admin'):
-- UPDATE users SET role = 'admin' WHERE role = 'admn';

-- If you see 'super_admin' (with underscore) and want to change it to 'superadmin':
-- UPDATE users SET role = 'superadmin' WHERE role = 'super_admin';

-- ============================================
-- STEP 4: Add the constraint with ALL valid roles
-- ============================================
-- After fixing invalid roles, add the constraint:
ALTER TABLE users ADD CONSTRAINT users_role_check 
  CHECK (role IN ('user', 'celebrant', 'vendor', 'both', 'admin', 'superadmin'));

-- ============================================
-- STEP 5: Verify it worked
-- ============================================
-- Run this to confirm all roles are now valid:
SELECT DISTINCT role, COUNT(*) as count 
FROM users 
GROUP BY role 
ORDER BY role;

-- All roles should now be in the allowed list
