import webpush from 'web-push'
import { supabase } from './supabase'

export interface PushPayload {
  title: string
  body: string
  data?: {
    url?: string
    notificationId?: string
    [key: string]: any
  }
}

let vapidInitialized = false

function ensureVapidConfigured(): boolean {
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
  const privateKey = process.env.VAPID_PRIVATE_KEY
  const subject = process.env.VAPID_SUBJECT || 'mailto:support@bisonnote.com'

  if (!publicKey || !privateKey) {
    return false
  }

  if (!vapidInitialized) {
    webpush.setVapidDetails(subject, publicKey, privateKey)
    vapidInitialized = true
  }

  return true
}

export async function sendPushToUser(userId: string, payload: PushPayload) {
  try {
    if (!ensureVapidConfigured()) {
      return { success: false, reason: 'vapid_not_configured' }
    }

    const { data: subscriptions, error } = await supabase
      .from('push_subscriptions')
      .select('id, endpoint, p256dh, auth')
      .eq('user_id', userId)

    if (error || !subscriptions || subscriptions.length === 0) {
      return { success: false, reason: 'no_subscriptions' }
    }

    const results = await Promise.all(subscriptions.map(async (sub) => {
      const subscription = {
        endpoint: sub.endpoint,
        keys: {
          p256dh: sub.p256dh,
          auth: sub.auth,
        },
      }

      try {
        await webpush.sendNotification(subscription, JSON.stringify(payload))
        return { ok: true }
      } catch (err: any) {
        const status = err?.statusCode || err?.status
        if (status === 404 || status === 410) {
          await supabase.from('push_subscriptions').delete().eq('id', sub.id)
        }
        return { ok: false, error: err?.message || 'send_failed' }
      }
    }))

    return {
      success: true,
      sent: results.filter((r) => r.ok).length,
      failed: results.filter((r) => !r.ok).length,
    }
  } catch (error: any) {
    console.error('[admin-push] sendPushToUser failed:', error)
    return { success: false, reason: error?.message || 'send_failed' }
  }
}
