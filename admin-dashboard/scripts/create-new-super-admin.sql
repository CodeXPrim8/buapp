-- SQL to create new super admin user
-- Run this in Supabase SQL Editor

-- Step 1: Update constraint to allow admin roles (if not already done)
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE users ADD CONSTRAINT users_role_check 
  CHECK (role IN ('user', 'celebrant', 'vendor', 'both', 'admin', 'super_admin'));

-- Step 2: Create the new super admin user
INSERT INTO users (
    phone_number,
    first_name,
    last_name,
    role,
    pin_hash,
    created_at,
    updated_at
) VALUES (
    '+2342924053841',
    'Super',
    'Admin',
    'super_admin',
    '$2b$10$m2YBe4jsUqahI8PDw6nNTuOXgZbfveVTypKdVi3PXq5QvxpAccume',
    NOW(),
    NOW()
);

-- Step 3: Verify the user was created
SELECT id, phone_number, first_name, last_name, role 
FROM users 
WHERE phone_number = '+2342924053841';
