// Verify database connection and show what's actually in the database
const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://cmqtnppqpksvyhtqrcqi.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

console.log('🔍 Database Connection Verification')
console.log('='.repeat(60))
console.log('')
console.log('Supabase URL:', supabaseUrl)
console.log('Has API Key:', !!supabaseAnonKey)
console.log('')

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function verify() {
  try {
    // Check total users
    const { count, error: countError } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
    
    console.log('Total users in database:', count || 0)
    if (countError) {
      console.log('Error:', countError.message)
    }
    console.log('')
    
    // List all users
    const { data: users, error } = await supabase
      .from('users')
      .select('id, phone_number, first_name, last_name, role')
      .limit(10)
    
    if (error) {
      console.log('❌ Error querying users:', error.message)
      return
    }
    
    if (!users || users.length === 0) {
      console.log('⚠️  DATABASE IS EMPTY - No users found!')
      console.log('')
      console.log('📋 SOLUTION:')
      console.log('   1. Open Supabase SQL Editor')
      console.log('   2. Run the SQL from: admin-dashboard/scripts/create-super-admin-complete.sql')
      console.log('   3. This will create the user with:')
      console.log('      Phone: +2348131074911')
      console.log('      Role: super_admin')
      console.log('      PIN: 222222')
    } else {
      console.log(`✅ Found ${users.length} user(s):`)
      users.forEach((u, i) => {
        console.log(`   ${i + 1}. ${u.phone_number} - ${u.first_name} ${u.last_name} (${u.role})`)
      })
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message)
  }
}

verify()
