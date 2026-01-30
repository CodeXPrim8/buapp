-- Run this AFTER fixing the constraint
-- This updates the user to super_admin with correct PIN

-- Update user role and PIN hash for PIN '222222'
UPDATE users 
SET 
  role = 'super_admin',
  pin_hash = '$2b$10$DnVAUSQVkFrdjwe09HgEpe01vvdmvFV0gS0xX8r4k54fjeOPd3Jmy'
WHERE phone_number = '+2348131074911';

-- Verify the update
SELECT id, phone_number, first_name, last_name, role, created_at, updated_at
FROM users 
WHERE phone_number = '+2348131074911';
