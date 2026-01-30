import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// Verify if tables exist by trying to query them
export async function GET() {
  const results: any = {
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
    hasKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    tables: {},
  }

  const tablesToCheck = [
    'users',
    'wallets',
    'gateways',
    'events',
    'transfers',
    'vendor_pending_sales',
    'notifications',
    'withdrawals',
  ]

  for (const tableName of tablesToCheck) {
    try {
      const { error } = await supabase
        .from(tableName)
        .select('*')
        .limit(0)
      
      results.tables[tableName] = {
        exists: !error,
        error: error ? {
          message: error.message,
          code: error.code,
          hint: error.hint,
        } : null,
      }
    } catch (e: any) {
      results.tables[tableName] = {
        exists: false,
        error: { message: e.message },
      }
    }
  }

  const allTablesExist = Object.values(results.tables).every((t: any) => t.exists)
  
  return NextResponse.json({
    ...results,
    allTablesExist,
    message: allTablesExist 
      ? 'All tables exist!' 
      : 'Some tables are missing. Run database/schema-no-rls.sql in Supabase SQL Editor.',
  })
}
