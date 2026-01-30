-- Add 'both', 'admin', and 'superadmin' role support to users table
-- This allows users to access Guest, Celebrant, AND Vendor features
-- Also supports admin roles for dashboard access

-- First, check what roles exist in the database (optional diagnostic query):
-- SELECT DISTINCT role FROM users;

-- Drop the existing constraint
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;

-- Add new constraint with ALL possible roles
ALTER TABLE users ADD CONSTRAINT users_role_check 
  CHECK (role IN ('user', 'celebrant', 'vendor', 'both', 'admin', 'superadmin'));
