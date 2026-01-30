// Quick test script to verify login setup
const { createClient } = require('@supabase/supabase-js')
const bcrypt = require('bcryptjs')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://cmqtnppqpksvyhtqrcqi.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function testLogin() {
  const phoneNumber = '+2348131074911'
  const pin = '222222'
  
  console.log('🧪 Testing Login Setup')
  console.log('='.repeat(50))
  console.log(`Phone: ${phoneNumber}`)
  console.log(`PIN: ${pin}`)
  console.log('')
  
  // Step 1: Find user
  console.log('Step 1: Looking up user...')
  const { data: user, error: userError } = await supabase
    .from('users')
    .select('*')
    .eq('phone_number', phoneNumber)
    .single()
  
  if (userError || !user) {
    console.log('❌ USER NOT FOUND!')
    console.log('Error:', userError?.message)
    console.log('')
    console.log('🔧 SOLUTION: Run this SQL in Supabase SQL Editor:')
    console.log('   admin-dashboard/scripts/create-super-admin-complete.sql')
    process.exit(1)
  }
  
  console.log('✅ User found!')
  console.log(`   ID: ${user.id}`)
  console.log(`   Name: ${user.first_name} ${user.last_name}`)
  console.log(`   Phone: ${user.phone_number}`)
  console.log(`   Role: ${user.role}`)
  console.log('')
  
  // Step 2: Check role
  console.log('Step 2: Checking role...')
  if (user.role !== 'admin' && user.role !== 'super_admin') {
    console.log(`❌ ROLE INVALID! Current: ${user.role}, Required: admin or super_admin`)
    console.log('')
    console.log('🔧 SOLUTION: Run this SQL:')
    console.log(`   UPDATE users SET role = 'super_admin' WHERE phone_number = '${phoneNumber}';`)
    process.exit(1)
  }
  console.log(`✅ Role is valid: ${user.role}`)
  console.log('')
  
  // Step 3: Check PIN hash
  console.log('Step 3: Verifying PIN...')
  if (!user.pin_hash) {
    console.log('❌ NO PIN HASH!')
    console.log('')
    console.log('🔧 SOLUTION: Run SQL to set PIN hash')
    process.exit(1)
  }
  
  const pinValid = await bcrypt.compare(pin, user.pin_hash)
  if (!pinValid) {
    console.log('❌ PIN DOES NOT MATCH!')
    console.log('')
    console.log('🔧 SOLUTION: Run SQL to update PIN hash')
    console.log('   admin-dashboard/scripts/create-super-admin-complete.sql')
    process.exit(1)
  }
  
  console.log('✅ PIN is valid!')
  console.log('')
  console.log('='.repeat(50))
  console.log('✅✅✅ ALL CHECKS PASSED! ✅✅✅')
  console.log('')
  console.log('You should be able to login now with:')
  console.log(`   Phone: ${phoneNumber}`)
  console.log(`   PIN: ${pin}`)
}

testLogin().catch(console.error)
