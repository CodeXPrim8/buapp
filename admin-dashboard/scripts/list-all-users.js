// List all users to see what's in the database
const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://cmqtnppqpksvyhtqrcqi.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function listUsers() {
  console.log('📋 Listing All Users in Database')
  console.log('='.repeat(60))
  console.log('')
  
  try {
    const { data: users, error } = await supabase
      .from('users')
      .select('id, phone_number, first_name, last_name, role')
      .limit(20)
    
    if (error) {
      console.log('❌ Error:', error.message)
      console.log('')
      console.log('This might indicate:')
      console.log('  1. Wrong Supabase URL or API key')
      console.log('  2. Database connection issue')
      console.log('  3. Table does not exist')
      return
    }
    
    if (!users || users.length === 0) {
      console.log('⚠️  No users found in database!')
      console.log('')
      console.log('You need to create a user first.')
      console.log('Run the SQL script: admin-dashboard/scripts/create-super-admin-complete.sql')
      return
    }
    
    console.log(`Found ${users.length} user(s):`)
    console.log('')
    
    users.forEach((user, index) => {
      console.log(`${index + 1}. Phone: ${user.phone_number}`)
      console.log(`   Name: ${user.first_name} ${user.last_name}`)
      console.log(`   Role: ${user.role}`)
      console.log(`   ID: ${user.id}`)
      console.log('')
    })
    
    console.log('='.repeat(60))
    console.log('')
    console.log('💡 TIP:')
    console.log('   If you see a user with phone number like "08131074911" or "2348131074911",')
    console.log('   update that user instead of creating a new one.')
    console.log('')
    console.log('   Example SQL:')
    console.log(`   UPDATE users SET role = 'super_admin', pin_hash = '$2b$10$DnVAUSQVkFrdjwe09HgEpe01vvdmvFV0gS0xX8r4k54fjeOPd3Jmy'`)
    console.log(`   WHERE phone_number = '<actual_phone_from_above>';`)
    
  } catch (error) {
    console.error('❌ Error:', error.message)
  }
}

listUsers()
