// Script to verify admin user setup
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

async function verifyAdminSetup() {
  try {
    const phoneNumber = '+2348131074911'
    const pin = '222222'
    
    console.log('🔍 Verifying admin setup...')
    console.log('')
    
    // Check user exists
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('phone_number', phoneNumber)
      .single()
    
    if (userError || !user) {
      console.error('❌ User not found with phone number:', phoneNumber)
      console.log('')
      console.log('Checking for similar phone numbers...')
      const { data: similarUsers } = await supabase
        .from('users')
        .select('phone_number, first_name, last_name, role')
        .or(`phone_number.eq.08131074911,phone_number.eq.2348131074911`)
      if (similarUsers && similarUsers.length > 0) {
        console.log('Found similar users:')
        similarUsers.forEach(u => {
          console.log(`  - ${u.phone_number} (${u.first_name} ${u.last_name}) - Role: ${u.role}`)
        })
      }
      process.exit(1)
    }
    
    console.log('✅ User found:')
    console.log(`   Name: ${user.first_name} ${user.last_name}`)
    console.log(`   Phone: ${user.phone_number}`)
    console.log(`   Role: ${user.role}`)
    console.log(`   Has PIN hash: ${user.pin_hash ? 'Yes' : 'No'}`)
    console.log('')
    
    // Check role
    if (user.role !== 'admin' && user.role !== 'super_admin') {
      console.error('❌ User role is not admin or super_admin!')
      console.log(`   Current role: ${user.role}`)
      console.log('')
      console.log('Run this SQL in Supabase:')
      console.log(`UPDATE users SET role = 'super_admin' WHERE phone_number = '${phoneNumber}';`)
      console.log('')
    } else {
      console.log('✅ User role is correct:', user.role)
    }
    
    // Verify PIN
    if (!user.pin_hash) {
      console.error('❌ User has no PIN hash!')
      console.log('')
      console.log('Run the SQL script to set PIN hash')
      process.exit(1)
    }
    
    const pinValid = await bcrypt.compare(pin, user.pin_hash)
    if (pinValid) {
      console.log('✅ PIN verification successful!')
      console.log(`   PIN: ${pin}`)
      console.log('')
    } else {
      console.error('❌ PIN verification failed!')
      console.log(`   Expected PIN: ${pin}`)
      console.log('')
      console.log('The PIN hash in database does not match PIN "222222"')
      console.log('')
      console.log('Run this SQL in Supabase (with the correct hash):')
      const newHash = await bcrypt.hash(pin, 10)
      console.log(`UPDATE users SET pin_hash = '${newHash}' WHERE phone_number = '${phoneNumber}';`)
      console.log('')
    }
    
    console.log('═══════════════════════════════════════════════════════════')
    console.log('📋 SUMMARY')
    console.log('═══════════════════════════════════════════════════════════')
    console.log(`Phone: ${phoneNumber}`)
    console.log(`PIN: ${pin}`)
    console.log(`Role: ${user.role}`)
    console.log(`PIN Valid: ${pinValid ? '✅ Yes' : '❌ No'}`)
    console.log('')
    
    if (user.role === 'super_admin' && pinValid) {
      console.log('✅✅✅ Everything is set up correctly! ✅✅✅')
      console.log('')
      console.log('You should be able to login now.')
    } else {
      console.log('⚠️  Setup incomplete. Please run the SQL script.')
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message)
    process.exit(1)
  }
}

verifyAdminSetup()
