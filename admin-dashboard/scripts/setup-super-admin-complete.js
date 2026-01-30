// Complete script to set up super admin
// This will generate the SQL with the PIN hash included

const bcrypt = require('bcryptjs')
const fs = require('fs')
const path = require('path')

async function generateSuperAdminSQL(phoneNumber, pin) {
  try {
    console.log('Generating super admin setup SQL...')
    console.log('')
    
    // Hash the PIN
    const saltRounds = 10
    const pinHash = await bcrypt.hash(pin, saltRounds)
    
    console.log('✅ PIN hashed successfully')
    console.log(`PIN: ${pin}`)
    console.log(`Hash: ${pinHash}`)
    console.log('')
    
    // Generate SQL
    const sql = `-- Complete SQL script to set up super admin
-- Run this in Supabase SQL Editor

-- Step 1: Update constraint to allow admin roles
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;

ALTER TABLE users ADD CONSTRAINT users_role_check 
  CHECK (role IN ('user', 'celebrant', 'vendor', 'both', 'admin', 'super_admin'));

-- Step 2: Update user to super_admin with new PIN
UPDATE users 
SET 
  role = 'super_admin',
  pin_hash = '${pinHash}'
WHERE phone_number = '${phoneNumber}';

-- Step 3: Verify
SELECT id, phone_number, first_name, last_name, role 
FROM users 
WHERE phone_number = '${phoneNumber}';
`
    
    // Save to file
    const sqlPath = path.join(__dirname, 'setup-super-admin-final.sql')
    fs.writeFileSync(sqlPath, sql)
    
    console.log('✅ SQL script generated!')
    console.log('')
    console.log('📄 File saved to: scripts/setup-super-admin-final.sql')
    console.log('')
    console.log('📋 Next steps:')
    console.log('1. Open Supabase SQL Editor')
    console.log('2. Copy and paste the contents of setup-super-admin-final.sql')
    console.log('3. Run the SQL')
    console.log('4. Login to admin dashboard at http://localhost:3001')
    console.log('')
    console.log('🔐 Login Credentials:')
    console.log(`   Phone: ${phoneNumber}`)
    console.log(`   PIN: ${pin}`)
    console.log('')
    
    // Also output the SQL to console
    console.log('═══════════════════════════════════════════════════════════')
    console.log('SQL TO RUN IN SUPABASE:')
    console.log('═══════════════════════════════════════════════════════════')
    console.log(sql)
    console.log('═══════════════════════════════════════════════════════════')
    
  } catch (error) {
    console.error('❌ Error:', error.message)
    process.exit(1)
  }
}

const phoneNumber = '+2348131074911'
const pin = '222222'

generateSuperAdminSQL(phoneNumber, pin)
