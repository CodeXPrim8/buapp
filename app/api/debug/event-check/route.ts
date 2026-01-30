import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { successResponse, errorResponse, getAuthUser } from '@/lib/api-helpers'

// Debug endpoint to check event and user IDs - ADMIN ONLY
// Disabled in production by default
export async function POST(request: NextRequest) {
  // Disable in production unless explicitly enabled
  if (process.env.NODE_ENV === 'production' && process.env.ENABLE_DEBUG_ENDPOINTS !== 'true') {
    return errorResponse('Debug endpoints are disabled in production', 404)
  }

  try {
    // Require admin authentication
    const authUser = await getAuthUser(request)
    if (!authUser) {
      return errorResponse('Authentication required', 401)
    }

    // Check if user is admin or superadmin
    if (authUser.role !== 'admin' && authUser.role !== 'superadmin' && authUser.role !== 'super_admin') {
      return errorResponse('Admin access required', 403)
    }

    const body = await request.json()
    const { event_id } = body

    if (!event_id) {
      return errorResponse('Event ID required', 400)
    }

    // Get event
    const { data: event, error: eventError } = await supabase
      .from('events')
      .select('id, name, celebrant_id, created_at')
      .eq('id', event_id)
      .single()

    // Get user
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, phone_number, first_name, last_name, role')
      .eq('id', authUser.userId)
      .single()

    return successResponse({
      event: event || null,
      eventError: eventError ? eventError.message : null,
      user: user || null,
      userError: userError ? userError.message : null,
      authUser: authUser,
      match: event?.celebrant_id === authUser.userId,
      event_celebrant_id: event?.celebrant_id,
      auth_user_id: authUser.userId,
    })
  } catch (error: any) {
    console.error('Debug error:', error)
    return errorResponse('Internal server error', 500)
  }
}
