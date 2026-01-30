import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { getAuthUser } from '@/lib/api-helpers'
import { errorResponse } from '@/lib/api-helpers'

// Comprehensive database diagnostic - ADMIN ONLY
// Disabled in production by default
export async function GET(request: NextRequest) {
  // Disable in production unless explicitly enabled
  if (process.env.NODE_ENV === 'production' && process.env.ENABLE_DEBUG_ENDPOINTS !== 'true') {
    return errorResponse('Diagnostic endpoints are disabled in production', 404)
  }

  // Require admin authentication
  const authUser = await getAuthUser(request)
  if (!authUser) {
    return errorResponse('Authentication required', 401)
  }

  // Check if user is admin or superadmin
  if (authUser.role !== 'admin' && authUser.role !== 'superadmin' && authUser.role !== 'super_admin') {
    return errorResponse('Admin access required', 403)
  }
  const diagnostics: any = {
    timestamp: new Date().toISOString(),
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
    hasAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    tests: {},
  }

  try {
    // Test 1: Check if we can connect to Supabase
    try {
      const { data, error } = await supabase
        .from('users')
        .select('count')
        .limit(1)
      
      diagnostics.tests.usersTable = {
        success: !error,
        error: error ? {
          message: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint,
        } : null,
        accessible: !error,
      }
    } catch (e: any) {
      diagnostics.tests.usersTable = {
        success: false,
        error: { message: e.message },
        accessible: false,
      }
    }

    // Test 2: Try to list all tables using raw SQL
    try {
      const { data: tables, error: tablesError } = await supabase
        .rpc('exec_sql', { sql: "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE' ORDER BY table_name" })
        .catch(() => ({ data: null, error: { message: 'RPC not available' } }))
      
      // Alternative: Try to query information_schema directly
      const { data: schemaData, error: schemaError } = await supabase
        .from('information_schema.tables')
        .select('table_name')
        .eq('table_schema', 'public')
        .catch(() => ({ data: null, error: { message: 'Cannot query information_schema' } }))
      
      diagnostics.tests.listTables = {
        success: !schemaError,
        error: schemaError ? { message: schemaError.message } : null,
        tables: schemaData || 'Cannot list tables',
      }
    } catch (e: any) {
      diagnostics.tests.listTables = {
        success: false,
        error: { message: e.message },
      }
    }

    // Test 3: Check each table individually
    const tableNames = ['users', 'wallets', 'gateways', 'events', 'transfers', 'vendor_pending_sales', 'notifications', 'withdrawals']
    diagnostics.tests.tableChecks = {}
    
    for (const tableName of tableNames) {
      try {
        const { error } = await supabase
          .from(tableName)
          .select('*')
          .limit(0)
        
        diagnostics.tests.tableChecks[tableName] = {
          exists: !error || error.code !== '42P01', // 42P01 = relation does not exist
          error: error ? {
            message: error.message,
            code: error.code,
          } : null,
        }
      } catch (e: any) {
        diagnostics.tests.tableChecks[tableName] = {
          exists: false,
          error: { message: e.message },
        }
      }
    }

    return NextResponse.json(diagnostics, { status: 200 })
  } catch (error: any) {
    diagnostics.error = error.message
    return NextResponse.json(diagnostics, { status: 500 })
  }
}
