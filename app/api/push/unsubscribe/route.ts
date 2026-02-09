import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { successResponse, errorResponse, getAuthUser } from '@/lib/api-helpers'

export async function POST(request: NextRequest) {
  try {
    const authUser = await getAuthUser(request)
    if (!authUser) {
      return errorResponse('Authentication required', 401)
    }

    const body = await request.json()
    const endpoint = body?.endpoint || body?.subscription?.endpoint

    if (!endpoint) {
      return errorResponse('Endpoint is required', 400)
    }

    const { error } = await supabase
      .from('push_subscriptions')
      .delete()
      .eq('user_id', authUser.userId)
      .eq('endpoint', endpoint)

    if (error) {
      console.error('Push unsubscribe error:', error)
      return errorResponse('Failed to remove push subscription', 500)
    }

    return successResponse({ unsubscribed: true })
  } catch (error: any) {
    console.error('Push unsubscribe exception:', error)
    return errorResponse(error?.message || 'Internal server error', 500)
  }
}
