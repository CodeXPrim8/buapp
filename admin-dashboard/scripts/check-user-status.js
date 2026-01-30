// Check user status and provide exact fix
const { createClient } = require('@supabase/supabase-js')
const bcrypt = require('bcryptjs')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://cmqtnppqpksvyhtqrcqi.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function checkUser() {
  const phoneNumber = '+2348131074911'
  const pin = '222222'
  
  console.log('🔍 Checking User Status')
  console.log('='.repeat(60))
  console.log('')
  
  // Try exact match first
  console.log(`Looking for user with phone: ${phoneNumber}`)
  const { data: user, error } = await supabase
    .from('users')
    .select('*')
    .eq('phone_number', phoneNumber)
    .maybeSingle()
  
  if (error) {
    console.log('❌ Database Error:', error.message)
    console.log('')
  }
  
  if (!user) {
    console.log('❌ USER NOT FOUND IN DATABASE!')
    console.log('')
    console.log('📋 SOLUTION:')
    console.log('   1. Open Supabase SQL Editor')
    console.log('   2. Run the SQL from: admin-dashboard/scripts/create-super-admin-complete.sql')
    console.log('   3. Or run this quick fix:')
    console.log('')
    console.log('   UPDATE users SET')
    console.log("     role = 'super_admin',")
    console.log("     pin_hash = '$2b$10$DnVAUSQVkFrdjwe09HgEpe01vvdmvFV0gS0xX8r4k54fjeOPd3Jmy'")
    console.log(`   WHERE phone_number = '${phoneNumber}';`)
    console.log('')
    return
  }
  
  console.log('✅ User Found!')
  console.log('')
  console.log('User Details:')
  console.log(`   ID: ${user.id}`)
  console.log(`   Name: ${user.first_name} ${user.last_name}`)
  console.log(`   Phone: ${user.phone_number}`)
  console.log(`   Role: ${user.role}`)
  console.log(`   Has PIN Hash: ${user.pin_hash ? 'Yes' : 'No'}`)
  console.log('')
  
  // Check role
  if (user.role !== 'admin' && user.role !== 'super_admin') {
    console.log('❌ ROLE ISSUE!')
    console.log(`   Current role: ${user.role}`)
    console.log(`   Required: admin or super_admin`)
    console.log('')
    console.log('📋 SOLUTION:')
    console.log(`   UPDATE users SET role = 'super_admin' WHERE phone_number = '${phoneNumber}';`)
    console.log('')
  } else {
    console.log(`✅ Role OK: ${user.role}`)
    console.log('')
  }
  
  // Check PIN
  if (!user.pin_hash) {
    console.log('❌ NO PIN HASH!')
    console.log('')
    console.log('📋 SOLUTION:')
    const hash = await bcrypt.hash(pin, 10)
    console.log(`   UPDATE users SET pin_hash = '${hash}' WHERE phone_number = '${phoneNumber}';`)
    console.log('')
  } else {
    const pinValid = await bcrypt.compare(pin, user.pin_hash)
    if (pinValid) {
      console.log('✅ PIN is valid!')
      console.log('')
    } else {
      console.log('❌ PIN DOES NOT MATCH!')
      console.log(`   Expected PIN: ${pin}`)
      console.log('')
      console.log('📋 SOLUTION:')
      const hash = await bcrypt.hash(pin, 10)
      console.log(`   UPDATE users SET pin_hash = '${hash}' WHERE phone_number = '${phoneNumber}';`)
      console.log('')
    }
  }
  
  console.log('='.repeat(60))
  console.log('')
  
  if (user.role === 'super_admin' && user.pin_hash) {
    const pinValid = await bcrypt.compare(pin, user.pin_hash)
    if (pinValid) {
      console.log('✅✅✅ EVERYTHING IS CORRECT! ✅✅✅')
      console.log('')
      console.log('If login still fails, check:')
      console.log('   1. Server console logs for detailed error messages')
      console.log('   2. Phone number format matches exactly: +2348131074911')
      console.log('   3. PIN is exactly: 222222')
    }
  }
}

checkUser().catch(console.error)
