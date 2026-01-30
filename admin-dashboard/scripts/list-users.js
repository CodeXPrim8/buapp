// Script to list all users
// Usage: node scripts/list-users.js

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://cmqtnppqpksvyhtqrcqi.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

if (!supabaseAnonKey) {
  console.error('❌ NEXT_PUBLIC_SUPABASE_ANON_KEY not found in .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function listUsers() {
  try {
    console.log('Fetching all users...')
    console.log('')
    
    const { data: users, error } = await supabase
      .from('users')
      .select('id, phone_number, first_name, last_name, role, created_at')
      .order('created_at', { ascending: false })
      .limit(50)
    
    if (error) {
      console.error('❌ Error fetching users:', error.message)
      process.exit(1)
    }
    
    if (!users || users.length === 0) {
      console.log('❌ No users found in database')
      console.log('')
      console.log('You need to create a user first in the main BU app, then update their role.')
      process.exit(1)
    }
    
    console.log(`✅ Found ${users.length} user(s):`)
    console.log('')
    console.log('┌─────────────────────────────────────────────────────────────────────────┐')
    console.log('│ Phone Number        │ Name                │ Role      │ Created        │')
    console.log('├─────────────────────────────────────────────────────────────────────────┤')
    
    users.forEach((user) => {
      const phone = (user.phone_number || '').padEnd(20)
      const name = `${user.first_name || ''} ${user.last_name || ''}`.trim().padEnd(20)
      const role = (user.role || '').padEnd(10)
      const created = new Date(user.created_at).toLocaleDateString().padEnd(15)
      console.log(`│ ${phone} │ ${name} │ ${role} │ ${created} │`)
    })
    
    console.log('└─────────────────────────────────────────────────────────────────────────┘')
    console.log('')
    console.log('To set a user as admin, use one of these methods:')
    console.log('')
    console.log('1. Using SQL in Supabase SQL Editor:')
    console.log('   UPDATE users SET role = \'admin\' WHERE phone_number = \'<phone_number>\';')
    console.log('')
    console.log('2. Using the script:')
    console.log('   node scripts/set-admin-role.js <phone_number>')
    console.log('')
    console.log('3. Register a new user in the main app, then update their role')
    
  } catch (error) {
    console.error('❌ Error:', error.message)
    process.exit(1)
  }
}

listUsers()
