'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { Bell } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { apiCall, notificationApi } from '@/lib/api-client'

type NotificationItem = {
  id: string
  type: string
  title: string
  message: string
  amount?: number
  created_at?: string
  read?: boolean
}

interface NotificationBellProps {
  onNavigate?: (page: string, data?: any) => void
}

export default function NotificationBell({ onNavigate }: NotificationBellProps) {
  const [open, setOpen] = useState(false)
  const [notifications, setNotifications] = useState<NotificationItem[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [permission, setPermission] = useState<'default' | 'granted' | 'denied' | 'unsupported'>('default')
  const containerRef = useRef<HTMLDivElement>(null)
  const seenIdsRef = useRef<Set<string>>(new Set())
  const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || ''

  const recentNotifications = useMemo(() => notifications.slice(0, 5), [notifications])

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (!('Notification' in window)) {
      setPermission('unsupported')
      return
    }
    setPermission(Notification.permission)
  }, [])

  useEffect(() => {
    if (permission === 'granted') {
      ensurePushSubscription()
    }
  }, [permission])

  const urlBase64ToUint8Array = (base64String: string) => {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
    const rawData = window.atob(base64)
    const outputArray = new Uint8Array(rawData.length)
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i)
    }
    return outputArray
  }

  const ensurePushSubscription = async () => {
    if (!vapidPublicKey) return
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return
    try {
      const registration = await navigator.serviceWorker.register('/sw.js')
      let subscription = await registration.pushManager.getSubscription()
      if (!subscription) {
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
        })
      }
      await apiCall('/push/subscribe', {
        method: 'POST',
        body: JSON.stringify({
          subscription: subscription.toJSON(),
          user_agent: navigator.userAgent,
        }),
      })
    } catch (error) {
      // Ignore subscription errors (e.g., unsupported browser)
    }
  }

  useEffect(() => {
    const loadNotifications = async () => {
      try {
        const response = await notificationApi.list()
        if (response.success && response.data?.notifications) {
          const list = response.data.notifications as NotificationItem[]
          setNotifications(list)
          setUnreadCount(response.data.unreadCount ?? list.filter((n) => !n.read).length)

          const newItems = list.filter((n) => !seenIdsRef.current.has(n.id))
          if (newItems.length > 0 && permission === 'granted' && typeof window !== 'undefined') {
            newItems.forEach((n) => {
              try {
                new Notification(n.title || 'New Notification', {
                  body: n.message || '',
                })
              } catch {
                // Ignore notification errors (e.g., blocked by browser)
              }
            })
          }
          newItems.forEach((n) => seenIdsRef.current.add(n.id))
        }
      } catch {
        // ignore
      }
    }

    loadNotifications()
    const interval = setInterval(loadNotifications, 10000)
    const handleUpdated = () => loadNotifications()
    window.addEventListener('notifications-updated', handleUpdated)
    return () => {
      clearInterval(interval)
      window.removeEventListener('notifications-updated', handleUpdated)
    }
  }, [permission])

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleOutsideClick)
    return () => document.removeEventListener('mousedown', handleOutsideClick)
  }, [])

  const requestPermission = async () => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      setPermission('unsupported')
      return
    }
    const result = await Notification.requestPermission()
    setPermission(result)
    if (result === 'granted') {
      await ensurePushSubscription()
    }
  }

  const handleViewAll = () => {
    setOpen(false)
    onNavigate?.('notifications')
  }

  return (
    <div className="relative" ref={containerRef}>
      <button
        onClick={() => setOpen((prev) => !prev)}
        className="relative rounded-full p-2 text-foreground transition hover:bg-secondary"
        aria-label="Notifications"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-semibold text-primary-foreground">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <Card className="absolute right-0 mt-2 w-72 border-border/70 bg-card/95 p-3 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold">Notifications</span>
            <button
              onClick={handleViewAll}
              className="text-xs font-semibold text-primary"
            >
              View all
            </button>
          </div>

          {permission === 'default' && (
            <div className="mt-2 rounded-md border border-border/60 bg-background/60 p-2 text-xs text-muted-foreground">
              <p>Enable notifications to receive alerts on your device.</p>
              <button
                onClick={requestPermission}
                className="mt-2 rounded-md bg-primary px-2 py-1 text-xs font-semibold text-primary-foreground"
              >
                Enable notifications
              </button>
            </div>
          )}
          {permission === 'denied' && (
            <p className="mt-2 text-xs text-muted-foreground">
              Notifications are blocked. Enable them in your browser settings.
            </p>
          )}

          <div className="mt-3 space-y-2">
            {recentNotifications.length === 0 ? (
              <p className="text-xs text-muted-foreground">No notifications yet</p>
            ) : (
              recentNotifications.map((n) => (
                <div key={n.id} className="rounded-md border border-border/60 p-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-xs font-semibold">{n.title}</p>
                      <p className="text-xs text-muted-foreground">{n.message}</p>
                      {n.amount != null && (
                        <p className="text-xs font-semibold text-primary">
                          Ƀ {Number(n.amount).toLocaleString()}
                        </p>
                      )}
                    </div>
                    {!n.read && <span className="mt-1 h-2 w-2 rounded-full bg-primary" />}
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      )}
    </div>
  )
}
