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
    const subscription = body?.subscription
    const endpoint = subscription?.endpoint
    const keys = subscription?.keys || {}

    if (!endpoint || !keys?.p256dh || !keys?.auth) {
      return errorResponse('Invalid push subscription', 400)
    }

    const userAgent = body?.user_agent || request.headers.get('user-agent') || null

    const { error } = await supabase
      .from('push_subscriptions')
      .upsert({
        user_id: authUser.userId,
        endpoint,
        p256dh: keys.p256dh,
        auth: keys.auth,
        user_agent: userAgent,
      }, { onConflict: 'user_id,endpoint' })

    if (error) {
      console.error('Push subscribe error:', error)
      return errorResponse('Failed to save push subscription', 500)
    }

    return successResponse({ subscribed: true })
  } catch (error: any) {
    console.error('Push subscribe exception:', error)
    return errorResponse(error?.message || 'Internal server error', 500)
  }
}
