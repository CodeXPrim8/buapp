import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { successResponse, errorResponse, getAuthUser } from '@/lib/api-helpers'

// Mark all notifications as read for the current user
export async function PUT(request: NextRequest) {
  try {
    const authUser = await getAuthUser(request)
    if (!authUser) {
      return errorResponse('Unauthorized', 401)
    }

    const { data: notifications, error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('user_id', authUser.userId)
      .eq('read', false)
      .select()

    if (error) {
      console.error('Failed to mark all notifications as read:', error)
      return errorResponse('Failed to mark all notifications as read', 500)
    }

    return successResponse({ count: notifications?.length || 0 })
  } catch (error: any) {
    console.error('Mark all notifications read error:', error)
    return errorResponse(error.message || 'Internal server error', 500)
  }
}
