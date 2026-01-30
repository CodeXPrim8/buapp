// Script to set a user as super_admin and update PIN
// Usage: node scripts/set-super-admin.js <phone_number> <pin>

const { createClient } = require('@supabase/supabase-js')
const bcrypt = require('bcryptjs')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://cmqtnppqpksvyhtqrcqi.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

if (!supabaseAnonKey) {
  console.error('❌ NEXT_PUBLIC_SUPABASE_ANON_KEY not found in .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function setSuperAdmin(phoneNumber, pin) {
  try {
    console.log(`Setting up super admin for: ${phoneNumber}`)
    console.log('')
    
    // Hash the PIN
    const saltRounds = 10
    const pinHash = await bcrypt.hash(pin, saltRounds)
    console.log('✅ PIN hashed successfully')
    
    // First, check if user exists
    const { data: existingUser, error: checkError } = await supabase
      .from('users')
      .select('id, phone_number, first_name, last_name, role')
      .eq('phone_number', phoneNumber)
      .single()
    
    if (checkError || !existingUser) {
      console.error(`❌ User with phone number ${phoneNumber} not found`)
      console.log('')
      console.log('Available users:')
      const { data: allUsers } = await supabase
        .from('users')
        .select('phone_number, first_name, last_name')
        .limit(10)
      allUsers?.forEach(u => {
        console.log(`  - ${u.phone_number} (${u.first_name} ${u.last_name})`)
      })
      process.exit(1)
    }
    
    console.log(`Found user: ${existingUser.first_name} ${existingUser.last_name}`)
    console.log(`Current role: ${existingUser.role}`)
    console.log('')
    
    // Update user role and PIN
    const { data: updatedUser, error: updateError } = await supabase
      .from('users')
      .update({
        role: 'super_admin',
        pin_hash: pinHash,
      })
      .eq('phone_number', phoneNumber)
      .select()
      .single()
    
    if (updateError) {
      // Check if it's a constraint error
      if (updateError.message.includes('check constraint') || updateError.message.includes('users_role_check')) {
        console.error('❌ Database constraint error!')
        console.error('The users table constraint does not allow "super_admin" role.')
        console.log('')
        console.log('Please run this SQL in Supabase SQL Editor first:')
        console.log('')
        console.log('ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;')
        console.log('ALTER TABLE users ADD CONSTRAINT users_role_check')
        console.log("  CHECK (role IN ('user', 'celebrant', 'vendor', 'both', 'admin', 'super_admin'));")
        console.log('')
        console.log('Then run this script again.')
      } else {
        console.error('❌ Error updating user:', updateError.message)
      }
      process.exit(1)
    }
    
    console.log('✅✅✅ SUPER ADMIN SETUP COMPLETE! ✅✅✅')
    console.log('')
    console.log('User Details:')
    console.log(`  Name: ${updatedUser.first_name} ${updatedUser.last_name}`)
    console.log(`  Phone: ${updatedUser.phone_number}`)
    console.log(`  Role: ${updatedUser.role}`)
    console.log(`  PIN: ${pin} (hashed and stored)`)
    console.log('')
    console.log('🔐 Login Credentials:')
    console.log(`  Phone: ${phoneNumber}`)
    console.log(`  PIN: ${pin}`)
    console.log('')
    console.log('🌐 Access admin dashboard at: http://localhost:3001')
    console.log('')
    
  } catch (error) {
    console.error('❌ Error:', error.message)
    process.exit(1)
  }
}

const phoneNumber = process.argv[2]
const pin = process.argv[3]

if (!phoneNumber || !pin) {
  console.error('Usage: node scripts/set-super-admin.js <phone_number> <pin>')
  console.error('Example: node scripts/set-super-admin.js +2348131074911 222222')
  process.exit(1)
}

if (pin.length !== 6) {
  console.error('⚠️  Warning: PIN should be 6 digits (or 4 digits for existing users)')
  console.error('Continuing anyway...')
  console.log('')
}

setSuperAdmin(phoneNumber, pin)
