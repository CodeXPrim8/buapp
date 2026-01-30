// Script to generate a new super admin user with unique credentials
const bcrypt = require('bcryptjs')
const crypto = require('crypto')
const fs = require('fs')
const path = require('path')

async function generateNewSuperAdmin() {
  // Generate unique phone number (using timestamp + random)
  const timestamp = Date.now().toString().slice(-6)
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0')
  const phoneNumber = `+234${timestamp}${random}`.slice(0, 14) // Ensure valid length
  
  // Generate random 6-digit PIN
  const pin = Math.floor(100000 + Math.random() * 900000).toString()
  
  // Hash the PIN
  const saltRounds = 10
  const pinHash = await bcrypt.hash(pin, saltRounds)
  
  // Generate SQL
  const sql = `-- SQL to create new super admin user
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
    '${phoneNumber}',
    'Super',
    'Admin',
    'super_admin',
    '${pinHash}',
    NOW(),
    NOW()
);

-- Step 3: Verify the user was created
SELECT id, phone_number, first_name, last_name, role 
FROM users 
WHERE phone_number = '${phoneNumber}';
`
  
  // Save SQL to file
  const sqlPath = path.join(__dirname, 'create-new-super-admin.sql')
  fs.writeFileSync(sqlPath, sql)
  
  console.log('✅✅✅ NEW SUPER ADMIN USER GENERATED! ✅✅✅')
  console.log('')
  console.log('='.repeat(60))
  console.log('LOGIN CREDENTIALS:')
  console.log('='.repeat(60))
  console.log(`Phone Number: ${phoneNumber}`)
  console.log(`PIN: ${pin}`)
  console.log('')
  console.log('='.repeat(60))
  console.log('NEXT STEPS:')
  console.log('='.repeat(60))
  console.log('1. Open Supabase SQL Editor')
  console.log('2. Copy and run the SQL from:')
  console.log(`   ${sqlPath}`)
  console.log('3. After running SQL, login to admin dashboard with:')
  console.log(`   Phone: ${phoneNumber}`)
  console.log(`   PIN: ${pin}`)
  console.log('')
  console.log('⚠️  IMPORTANT: Save these credentials securely!')
  console.log('')
  
  // Also output SQL to console
  console.log('='.repeat(60))
  console.log('SQL TO RUN IN SUPABASE:')
  console.log('='.repeat(60))
  console.log(sql)
  console.log('='.repeat(60))
}

generateNewSuperAdmin().catch(console.error)
