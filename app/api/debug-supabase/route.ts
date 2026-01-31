import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { getAuthUser } from '@/lib/api-helpers'
import { errorResponse } from '@/lib/api-helpers'

// Comprehensive Supabase debugging - ADMIN ONLY
// Disabled in production by default
export async function GET(request: NextRequest) {
  // Disable in production unless explicitly enabled
  if (process.env.NODE_ENV === 'production' && process.env.ENABLE_DEBUG_ENDPOINTS !== 'true') {
    return errorResponse('Debug endpoints are disabled in production', 404)
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
  const debug: any = {
    timestamp: new Date().toISOString(),
    env: {
      url: process.env.NEXT_PUBLIC_SUPABASE_URL,
      hasAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      anonKeyPrefix: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.substring(0, 20) + '...',
      publishableKey: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY?.substring(0, 20) + '...',
    },
    tests: {},
  }

  // Test 1: Basic connection test
  try {
    const { data, error } = await supabase
      .from('users')
      .select('count')
      .limit(0)
    
    debug.tests.basicQuery = {
      success: !error,
      error: error ? {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
      } : null,
    }
  } catch (e: any) {
    debug.tests.basicQuery = {
      success: false,
      error: { message: e.message, stack: e.stack },
    }
  }

  // Test 2: Try to get table info using RPC (if available)
  try {
    // Check if we can query information_schema
    const { data: schemaData, error: schemaError } = await supabase
      .rpc('exec_sql', {
        query: "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'users'"
      })
      .catch(() => ({ data: null, error: { message: 'RPC exec_sql not available' } }))
    
    debug.tests.schemaQuery = {
      available: !schemaError,
      error: schemaError ? { message: schemaError.message } : null,
    }
  } catch (e: any) {
    debug.tests.schemaQuery = {
      available: false,
      error: { message: e.message },
    }
  }

  // Test 3: Check Supabase client configuration
  debug.clientConfig = {
    url: supabase.supabaseUrl,
    // Don't log full key for security
  }

  return NextResponse.json(debug, { status: 200 })
}
