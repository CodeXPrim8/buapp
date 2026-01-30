import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { successResponse, errorResponse } from '@/lib/api-helpers'

// WARNING: This endpoint deletes ALL data from the database
// It should be protected with admin authentication or a secret key
export async function POST(request: NextRequest) {
  try {
    // Optional: Add a secret key check for security
    const authHeader = request.headers.get('authorization')
    const secretKey = process.env.CLEANUP_SECRET_KEY || 'cleanup-secret-key-change-in-production'
    
    if (authHeader !== `Bearer ${secretKey}`) {
      return errorResponse('Unauthorized: Invalid secret key', 401)
    }

    console.log('⚠️  Starting database cleanup - ALL DATA WILL BE DELETED!')

    // Delete in order to respect foreign key constraints
    const deleteOrder = [
      'transfers',
      'withdrawals',
      'tickets',
      'friend_requests',
      'contacts',
      'notifications',
      'invites',
      'gateways',
      'events',
      'wallets',
      'users',
    ]

    const results: Record<string, { deleted: number; error?: string }> = {}

    for (const tableName of deleteOrder) {
      try {
        // Use a condition that matches all rows (using a UUID that doesn't exist)
        const { error, count } = await supabase
          .from(tableName)
          .delete()
          .neq('id', '00000000-0000-0000-0000-000000000000')
          .select('*', { count: 'exact', head: true })

        if (error) {
          // If the above fails, try deleting all rows
          const { error: deleteError } = await supabase
            .from(tableName)
            .delete()
            .gte('created_at', '1970-01-01') // Match all dates

          if (deleteError) {
            results[tableName] = { deleted: 0, error: deleteError.message }
            console.error(`Error deleting ${tableName}:`, deleteError)
          } else {
            results[tableName] = { deleted: -1 } // Unknown count
            console.log(`✓ Deleted all rows from ${tableName}`)
          }
        } else {
          results[tableName] = { deleted: count || 0 }
          console.log(`✓ Deleted ${count || 0} rows from ${tableName}`)
        }
      } catch (error: any) {
        results[tableName] = { deleted: 0, error: error.message }
        console.error(`Error deleting ${tableName}:`, error)
      }
    }

    // Verify deletion
    const verification: Record<string, number> = {}
    for (const tableName of deleteOrder) {
      try {
        const { count } = await supabase
          .from(tableName)
          .select('*', { count: 'exact', head: true })
        verification[tableName] = count || 0
      } catch (error) {
        verification[tableName] = -1
      }
    }

    const allEmpty = Object.values(verification).every(count => count === 0)

    return successResponse({
      message: allEmpty 
        ? 'Database cleanup completed successfully. All data deleted.' 
        : 'Database cleanup completed with some warnings.',
      results,
      verification,
      allEmpty,
    })
  } catch (error: any) {
    console.error('Cleanup error:', error)
    return errorResponse('Failed to cleanup database: ' + error.message, 500)
  }
}
