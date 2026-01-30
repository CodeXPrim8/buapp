import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { successResponse, errorResponse, getAuthUser } from '@/lib/api-helpers'

// Mark notification as read
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authUser = await getAuthUser(request)
    if (!authUser) {
      return errorResponse('Unauthorized', 401)
    }

    const { id } = await params

    const { data: notification, error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', id)
      .eq('user_id', authUser.userId)
      .select()
      .single()

    if (error || !notification) {
      return errorResponse('Notification not found', 404)
    }

    return successResponse({ notification })
  } catch (error: any) {
    console.error('Mark notification read error:', error)
    return errorResponse(error.message || 'Internal server error', 500)
  }
}
