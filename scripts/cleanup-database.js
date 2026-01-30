// Script to clean up all database data
// Run with: node scripts/cleanup-database.js

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Error: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in .env.local')
  console.error('\nTo get your Service Role Key:')
  console.error('1. Go to Supabase Dashboard → Project Settings → API')
  console.error('2. Copy the "service_role" key (NOT the anon key)')
  console.error('3. Add it to .env.local as: SUPABASE_SERVICE_ROLE_KEY=your-key-here')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function cleanupDatabase() {
  console.log('Starting database cleanup...')
  console.log('⚠️  WARNING: This will delete ALL data from the database!')
  
  try {
    // Delete in order to respect foreign key constraints
    
    console.log('1. Deleting transfers...')
    const { error: transfersError } = await supabase.from('transfers').delete().neq('id', '00000000-0000-0000-0000-000000000000')
    if (transfersError) console.error('Transfers error:', transfersError)
    else console.log('   ✓ Transfers deleted')
    
    console.log('2. Deleting withdrawals...')
    const { error: withdrawalsError } = await supabase.from('withdrawals').delete().neq('id', '00000000-0000-0000-0000-000000000000')
    if (withdrawalsError) console.error('Withdrawals error:', withdrawalsError)
    else console.log('   ✓ Withdrawals deleted')
    
    console.log('3. Deleting tickets...')
    const { error: ticketsError } = await supabase.from('tickets').delete().neq('id', '00000000-0000-0000-0000-000000000000')
    if (ticketsError) console.error('Tickets error:', ticketsError)
    else console.log('   ✓ Tickets deleted')
    
    console.log('4. Deleting friend requests...')
    const { error: friendRequestsError } = await supabase.from('friend_requests').delete().neq('id', '00000000-0000-0000-0000-000000000000')
    if (friendRequestsError) console.error('Friend requests error:', friendRequestsError)
    else console.log('   ✓ Friend requests deleted')
    
    console.log('5. Deleting contacts...')
    const { error: contactsError } = await supabase.from('contacts').delete().neq('id', '00000000-0000-0000-0000-000000000000')
    if (contactsError) console.error('Contacts error:', contactsError)
    else console.log('   ✓ Contacts deleted')
    
    console.log('6. Deleting notifications...')
    const { error: notificationsError } = await supabase.from('notifications').delete().neq('id', '00000000-0000-0000-0000-000000000000')
    if (notificationsError) console.error('Notifications error:', notificationsError)
    else console.log('   ✓ Notifications deleted')
    
    console.log('7. Deleting invites...')
    const { error: invitesError } = await supabase.from('invites').delete().neq('id', '00000000-0000-0000-0000-000000000000')
    if (invitesError) console.error('Invites error:', invitesError)
    else console.log('   ✓ Invites deleted')
    
    console.log('8. Deleting gateways...')
    const { error: gatewaysError } = await supabase.from('gateways').delete().neq('id', '00000000-0000-0000-0000-000000000000')
    if (gatewaysError) console.error('Gateways error:', gatewaysError)
    else console.log('   ✓ Gateways deleted')
    
    console.log('9. Deleting events...')
    const { error: eventsError } = await supabase.from('events').delete().neq('id', '00000000-0000-0000-0000-000000000000')
    if (eventsError) console.error('Events error:', eventsError)
    else console.log('   ✓ Events deleted')
    
    console.log('10. Deleting wallets...')
    const { error: walletsError } = await supabase.from('wallets').delete().neq('id', '00000000-0000-0000-0000-000000000000')
    if (walletsError) console.error('Wallets error:', walletsError)
    else console.log('   ✓ Wallets deleted')
    
    console.log('11. Deleting users...')
    const { error: usersError } = await supabase.from('users').delete().neq('id', '00000000-0000-0000-0000-000000000000')
    if (usersError) console.error('Users error:', usersError)
    else console.log('   ✓ Users deleted')
    
    // Verify deletion
    console.log('\nVerifying deletion...')
    const { data: users } = await supabase.from('users').select('id').limit(1)
    const { data: wallets } = await supabase.from('wallets').select('id').limit(1)
    const { data: transfers } = await supabase.from('transfers').select('id').limit(1)
    
    console.log('\n📊 Final counts:')
    console.log(`   Users: ${users?.length || 0}`)
    console.log(`   Wallets: ${wallets?.length || 0}`)
    console.log(`   Transfers: ${transfers?.length || 0}`)
    
    if ((users?.length || 0) === 0 && (wallets?.length || 0) === 0) {
      console.log('\n✅ Database cleanup completed successfully!')
      console.log('   All users and data have been deleted.')
      console.log('   Users can now register with 6-digit PINs.')
    } else {
      console.log('\n⚠️  Warning: Some data may still exist. Check the counts above.')
    }
    
  } catch (error) {
    console.error('Error during cleanup:', error)
    process.exit(1)
  }
}

cleanupDatabase()
