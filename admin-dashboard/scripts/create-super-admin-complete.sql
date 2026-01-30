-- Complete SQL script to create/update super admin user
-- Run this in Supabase SQL Editor

-- Step 1: Update constraint to allow admin roles
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;

ALTER TABLE users ADD CONSTRAINT users_role_check 
  CHECK (role IN ('user', 'celebrant', 'vendor', 'both', 'admin', 'super_admin'));

-- Step 2: Check if user exists, if not create, if yes update
-- First, try to find the user
DO $$
DECLARE
    user_exists BOOLEAN;
    user_id UUID;
BEGIN
    -- Check if user exists with phone number
    SELECT EXISTS(SELECT 1 FROM users WHERE phone_number = '+2348131074911') INTO user_exists;
    
    IF user_exists THEN
        -- Update existing user
        UPDATE users 
        SET 
            role = 'super_admin',
            pin_hash = '$2b$10$DnVAUSQVkFrdjwe09HgEpe01vvdmvFV0gS0xX8r4k54fjeOPd3Jmy',
            updated_at = NOW()
        WHERE phone_number = '+2348131074911';
        
        RAISE NOTICE 'User updated successfully';
    ELSE
        -- Create new user (you may need to adjust fields based on your schema)
        INSERT INTO users (
            phone_number,
            first_name,
            last_name,
            role,
            pin_hash,
            created_at,
            updated_at
        ) VALUES (
            '+2348131074911',
            'Stephen',
            'Iwewezinem',
            'super_admin',
            '$2b$10$DnVAUSQVkFrdjwe09HgEpe01vvdmvFV0gS0xX8r4k54fjeOPd3Jmy',
            NOW(),
            NOW()
        );
        
        RAISE NOTICE 'User created successfully';
    END IF;
END $$;

-- Step 3: Verify the user
SELECT 
    id, 
    phone_number, 
    first_name, 
    last_name, 
    role,
    created_at,
    updated_at
FROM users 
WHERE phone_number = '+2348131074911';
