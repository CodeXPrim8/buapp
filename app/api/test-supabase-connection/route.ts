import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { getAuthUser } from '@/lib/api-helpers'
import { errorResponse } from '@/lib/api-helpers'

// Test Supabase connection with detailed error reporting - ADMIN ONLY
// Disabled in production by default
export async function GET(request: NextRequest) {
  // Disable in production unless explicitly enabled
  if (process.env.NODE_ENV === 'production' && process.env.ENABLE_DEBUG_ENDPOINTS !== 'true') {
    return errorResponse('Test endpoints are disabled in production', 404)
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
  const results: any = {
    timestamp: new Date().toISOString(),
    config: {
      url: process.env.NEXT_PUBLIC_SUPABASE_URL,
      hasAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      anonKeyLength: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.length || 0,
    },
    tests: {},
  }

  // Test 1: Basic connectivity
  try {
    const { data, error } = await supabase
      .from('users')
      .select('count')
      .limit(0)
    
    results.tests.basicQuery = {
      success: !error,
      error: error ? {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
      } : null,
    }
  } catch (e: any) {
    results.tests.basicQuery = {
      success: false,
      error: {
        message: e.message,
        type: e.constructor.name,
        stack: e.stack,
      },
      note: 'This is a network/connection error. Check if Supabase URL is correct and project is active.',
    }
  }

  // Test 2: Try to ping Supabase REST API directly
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const response = await fetch(`${supabaseUrl}/rest/v1/`, {
      method: 'GET',
      headers: {
        'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
        'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''}`,
      },
    })
    
    results.tests.directFetch = {
      success: response.ok,
      status: response.status,
      statusText: response.statusText,
      url: `${supabaseUrl}/rest/v1/`,
    }
  } catch (e: any) {
    results.tests.directFetch = {
      success: false,
      error: {
        message: e.message,
        type: e.constructor.name,
        code: e.code,
      },
      note: 'Direct fetch failed. Check network connectivity and Supabase URL.',
    }
  }

  return NextResponse.json(results, { status: 200 })
}
