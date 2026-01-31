import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { getAuthUser } from '@/lib/api-helpers'
import { errorResponse } from '@/lib/api-helpers'

// Test endpoint to check Supabase connection - ADMIN ONLY
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
  try {
    // Test Supabase connection
    const { data, error } = await supabase.from('users').select('count').limit(1)
    
    return NextResponse.json({
      success: true,
      supabaseConnected: !error,
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
      hasAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || !!process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY,
      error: error?.message || null,
    })
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message,
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
      hasAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || !!process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY,
    }, { status: 500 })
  }
}
