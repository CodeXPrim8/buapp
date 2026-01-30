// Script to set a user as admin
// Usage: node scripts/set-admin-role.js <phone_number>

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://cmqtnppqpksvyhtqrcqi.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

if (!supabaseAnonKey) {
  console.error('❌ NEXT_PUBLIC_SUPABASE_ANON_KEY not found in .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function setAdminRole(phoneNumber) {
  try {
    console.log(`Updating user with phone number: ${phoneNumber}...`)
    
    const { data, error } = await supabase
      .from('users')
      .update({ role: 'admin' })
      .eq('phone_number', phoneNumber)
      .select()
    
    if (error) {
      console.error('❌ Error updating user:', error.message)
      process.exit(1)
    }
    
    if (!data || data.length === 0) {
      console.error(`❌ User with phone number ${phoneNumber} not found`)
      process.exit(1)
    }
    
    const user = data[0]
    console.log('✅ User updated successfully!')
    console.log(`   Name: ${user.first_name} ${user.last_name}`)
    console.log(`   Phone: ${user.phone_number}`)
    console.log(`   Role: ${user.role}`)
    console.log('')
    console.log('You can now login to the admin dashboard at http://localhost:3001')
  } catch (error) {
    console.error('❌ Error:', error.message)
    process.exit(1)
  }
}

const phoneNumber = process.argv[2]

if (!phoneNumber) {
  console.error('Usage: node scripts/set-admin-role.js <phone_number>')
  console.error('Example: node scripts/set-admin-role.js 08131074911')
  process.exit(1)
}

setAdminRole(phoneNumber)
