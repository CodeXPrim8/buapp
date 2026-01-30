// Script to find a user by phone number
// Usage: node scripts/find-user.js <phone_number>

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://cmqtnppqpksvyhtqrcqi.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

if (!supabaseAnonKey) {
  console.error('❌ NEXT_PUBLIC_SUPABASE_ANON_KEY not found in .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function findUser(phoneNumber) {
  try {
    console.log(`Searching for user with phone number containing: ${phoneNumber}...`)
    console.log('')
    
    // Try exact match
    let { data, error } = await supabase
      .from('users')
      .select('id, phone_number, first_name, last_name, role')
      .eq('phone_number', phoneNumber)
    
    if (!data || data.length === 0) {
      // Try partial match
      const { data: partialData, error: partialError } = await supabase
        .from('users')
        .select('id, phone_number, first_name, last_name, role')
        .ilike('phone_number', `%${phoneNumber}%`)
      
      if (partialData && partialData.length > 0) {
        data = partialData
        error = partialError
      }
    }
    
    if (error) {
      console.error('❌ Error searching users:', error.message)
      process.exit(1)
    }
    
    if (!data || data.length === 0) {
      console.error(`❌ No user found with phone number containing: ${phoneNumber}`)
      console.log('')
      console.log('Try searching with different formats:')
      console.log('  - 08131074911')
      console.log('  - +2348131074911')
      console.log('  - 2348131074911')
      console.log('  - 8131074911')
      process.exit(1)
    }
    
    console.log(`✅ Found ${data.length} user(s):`)
    console.log('')
    data.forEach((user, index) => {
      console.log(`User ${index + 1}:`)
      console.log(`  ID: ${user.id}`)
      console.log(`  Name: ${user.first_name} ${user.last_name}`)
      console.log(`  Phone: ${user.phone_number}`)
      console.log(`  Role: ${user.role}`)
      console.log('')
    })
    
    console.log('To set as admin, run:')
    console.log(`  node scripts/set-admin-role.js "${data[0].phone_number}"`)
    console.log('')
    console.log('Or use SQL in Supabase:')
    console.log(`  UPDATE users SET role = 'admin' WHERE phone_number = '${data[0].phone_number}';`)
    
  } catch (error) {
    console.error('❌ Error:', error.message)
    process.exit(1)
  }
}

const phoneNumber = process.argv[2]

if (!phoneNumber) {
  console.error('Usage: node scripts/find-user.js <phone_number>')
  console.error('Example: node scripts/find-user.js 08131074911')
  process.exit(1)
}

findUser(phoneNumber)
