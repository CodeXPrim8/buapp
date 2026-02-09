import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { successResponse, errorResponse, getAuthUser } from '@/lib/api-helpers'
import { sendPushToUser } from '@/lib/push'

// Get notifications for user
export async function GET(request: NextRequest) {
  try {
    const authUser = await getAuthUser(request)
    if (!authUser) {
      return errorResponse('Unauthorized', 401)
    }

    const { data: notifications, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', authUser.userId)
      .order('created_at', { ascending: false })
      .limit(100)

    if (error) {
      return errorResponse('Failed to fetch notifications', 500)
    }

    const list = Array.isArray(notifications) ? notifications : []
    const unreadCount = list.filter((n: { read?: boolean }) => !n.read).length

    return successResponse({ notifications: list, unreadCount })
  } catch (error: any) {
    console.error('Get notifications error:', error)
    return errorResponse(error.message || 'Internal server error', 500)
  }
}

// Create notification (internal use)
export async function POST(request: NextRequest) {
  try {
    const authUser = await getAuthUser(request)
    if (!authUser) {
      return errorResponse('Unauthorized', 401)
    }

    const body = await request.json()
    const { user_id, type, title, message, amount, metadata } = body

    const { data: notification, error } = await supabase
      .from('notifications')
      .insert([{
        user_id: user_id || authUser.userId,
        type,
        title,
        message,
        amount,
        metadata,
        read: false,
      }])
      .select()
      .single()

    if (error || !notification) {
      return errorResponse('Failed to create notification', 500)
    }

    void sendPushToUser(notification.user_id, {
      title: notification.title,
      body: notification.message,
      data: { url: '/?page=notifications', notificationId: notification.id },
    })

    return successResponse({ notification }, 201)
  } catch (error: any) {
    console.error('Create notification error:', error)
    return errorResponse(error.message || 'Internal server error', 500)
  }
}
