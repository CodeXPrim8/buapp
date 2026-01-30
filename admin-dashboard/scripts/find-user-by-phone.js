// Script to find user by phone number (trying different formats)
const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://cmqtnppqpksvyhtqrcqi.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

if (!supabaseAnonKey) {
  console.error('❌ NEXT_PUBLIC_SUPABASE_ANON_KEY not found in .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function findUser() {
  try {
    console.log('🔍 Searching for user with phone number variations...')
    console.log('')
    
    const phoneVariations = [
      '+2348131074911',
      '2348131074911',
      '08131074911',
      '8131074911'
    ]
    
    for (const phone of phoneVariations) {
      console.log(`Checking: ${phone}`)
      const { data: users, error } = await supabase
        .from('users')
        .select('id, phone_number, first_name, last_name, role, pin_hash')
        .eq('phone_number', phone)
      
      if (users && users.length > 0) {
        console.log(`✅ Found user with phone: ${phone}`)
        users.forEach(user => {
          console.log('')
          console.log('User Details:')
          console.log(`  ID: ${user.id}`)
          console.log(`  Phone: ${user.phone_number}`)
          console.log(`  Name: ${user.first_name} ${user.last_name}`)
          console.log(`  Role: ${user.role}`)
          console.log(`  Has PIN: ${user.pin_hash ? 'Yes' : 'No'}`)
        })
        return
      }
    }
    
    console.log('')
    console.log('❌ User not found with any phone number variation')
    console.log('')
    console.log('Checking all users in database...')
    const { data: allUsers } = await supabase
      .from('users')
      .select('phone_number, first_name, last_name, role')
      .limit(20)
    
    if (allUsers && allUsers.length > 0) {
      console.log('')
      console.log('All users in database:')
      allUsers.forEach(u => {
        console.log(`  - ${u.phone_number} (${u.first_name} ${u.last_name}) - Role: ${u.role}`)
      })
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message)
    process.exit(1)
  }
}

findUser()
