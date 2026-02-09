'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Bell, CheckCircle, ArrowDown, ArrowUp, Sparkles, X, UserPlus, UserCheck, AlertCircle } from 'lucide-react'
import { notificationApi, transferApi } from '@/lib/api-client'
import { ReceiptModal } from '@/components/receipt-modal'

interface Notification {
  id: string
  type: 'transfer_received' | 'transfer_sent' | 'event_invite' | 'ticket_purchased' | 'withdrawal_completed' | 'withdrawal_requested' | 'friend_request' | 'friend_request_accepted'
  title: string
  message: string
  amount?: number
  fromUser?: string
  toUser?: string
  timestamp: string
  read: boolean
  metadata?: any
}

interface NotificationsProps {
  onNavigate?: (page: string, data?: any) => void
}

export default function Notifications({ onNavigate }: NotificationsProps = {}) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [selectedReceipt, setSelectedReceipt] = useState<any>(null)
  const [showReceipt, setShowReceipt] = useState(false)

  useEffect(() => {
    const loadNotifications = async () => {
      try {
        const response = await notificationApi.list()
        if (response.success && response.data?.notifications) {
          // Transform API notifications to match component format
          const transformed = response.data.notifications.map((n: any) => ({
            id: n.id,
            type: n.type,
            title: n.title,
            message: n.message,
            amount: n.amount,
            fromUser: n.metadata?.fromUser,
            toUser: n.metadata?.toUser,
            timestamp: n.created_at ? new Date(n.created_at).toLocaleString('en-US', {
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            }) : '',
            metadata: n.metadata,
            read: n.read,
          }))
          setNotifications(transformed)
          
          // Dispatch custom event to update dashboard badge
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new Event('notifications-updated'))
          }
        }
      } catch (error) {
        console.error('Failed to load notifications:', error)
        // Fallback to localStorage for backward compatibility
        const storedNotifications = localStorage.getItem('notifications')
        if (storedNotifications) {
          setNotifications(JSON.parse(storedNotifications))
        }
      }
    }

    const markAllAsReadOnOpen = async () => {
      // Mark all notifications as read when the page is opened
      try {
        await notificationApi.markAllAsRead()
        // Reload notifications to get updated read status
        await loadNotifications()
      } catch (error) {
        console.error('Failed to mark all notifications as read:', error)
      }
    }

    // Mark all as read when component mounts (user opens notifications page)
    markAllAsReadOnOpen()
    
    // Poll for new notifications every 5 seconds
    const interval = setInterval(loadNotifications, 5000)

    return () => {
      clearInterval(interval)
    }
  }, [])

  const markAsRead = async (id: string) => {
    // Optimistically update UI
    const updated = notifications.map(n => n.id === id ? { ...n, read: true } : n)
    setNotifications(updated)
    
    // Update via API
    try {
      await notificationApi.markAsRead(id)
    } catch (error) {
      console.error('Failed to mark notification as read:', error)
      // Revert on error
      setNotifications(notifications)
    }
  }

  const markAllAsRead = async () => {
    try {
      // Optimistically update UI
      const updated = notifications.map(n => ({ ...n, read: true }))
      setNotifications(updated)
      
      // Update via API
      await notificationApi.markAllAsRead()
      
      // Reload notifications to ensure sync
      const response = await notificationApi.list()
      if (response.success && response.data?.notifications) {
        const transformed = response.data.notifications.map((n: any) => ({
          id: n.id,
          type: n.type,
          title: n.title,
          message: n.message,
          amount: n.amount,
          fromUser: n.metadata?.fromUser,
          toUser: n.metadata?.toUser,
          timestamp: n.created_at ? new Date(n.created_at).toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          }) : '',
          metadata: n.metadata,
          read: n.read,
        }))
        setNotifications(transformed)
      }
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error)
    }
  }

  const deleteNotification = (id: string) => {
    const updated = notifications.filter(n => n.id !== id)
    setNotifications(updated)
    localStorage.setItem('notifications', JSON.stringify(updated))
  }

  const unreadCount = notifications.filter(n => !n.read).length

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'transfer_received':
        return <ArrowDown className="h-5 w-5 text-green-400" />
      case 'transfer_sent':
        return <ArrowUp className="h-5 w-5 text-primary" />
      case 'event_invite':
        return <Bell className="h-5 w-5 text-yellow-400" />
      case 'ticket_purchased':
        return <CheckCircle className="h-5 w-5 text-blue-400" />
      case 'withdrawal_completed':
        return <CheckCircle className="h-5 w-5 text-green-400" />
      case 'withdrawal_requested':
        return <AlertCircle className="h-5 w-5 text-orange-400" />
      case 'friend_request':
        return <UserPlus className="h-5 w-5 text-primary" />
      case 'friend_request_accepted':
        return <UserCheck className="h-5 w-5 text-green-400" />
      default:
        return <Bell className="h-5 w-5 text-primary" />
    }
  }

  return (
    <div className="space-y-6 pb-24 pt-4">
      <div className="px-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold">Notifications</h2>
            {unreadCount > 0 && (
              <p className="text-sm text-muted-foreground">
                {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
              </p>
            )}
          </div>
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="text-sm text-primary font-semibold"
            >
              Mark all as read
            </button>
          )}
        </div>

        {notifications.length === 0 ? (
          <Card className="border-border/50 bg-card/50 p-8 text-center">
            <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No notifications yet</p>
          </Card>
        ) : (
          <div className="space-y-3">
            {notifications.map((notification) => {
              // Determine if notification should be clickable
              const isClickable = notification.type === 'friend_request' || notification.type === 'friend_request_accepted'
              
              const handleNotificationClick = () => {
                if (isClickable && onNavigate) {
                  // Navigate to contacts page with requests tab active
                  onNavigate('contacts', { tab: 'requests' })
                }
              }

              return (
                <Card
                  key={notification.id}
                  className={`border-border/50 bg-card/50 p-4 ${
                    !notification.read ? 'border-primary/30 bg-primary/5' : ''
                  } ${
                    isClickable ? 'cursor-pointer hover:bg-card/80 transition' : ''
                  }`}
                  onClick={isClickable ? handleNotificationClick : undefined}
                >
                  <div className="flex items-start gap-3">
                    <div className={`rounded-full p-2 ${
                      !notification.read ? 'bg-primary/20' : 'bg-secondary'
                    }`}>
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className={`font-semibold ${!notification.read ? 'text-primary' : ''}`}>
                            {notification.title}
                          </h4>
                          <p className="text-sm text-muted-foreground mt-1">
                            {notification.message}
                          </p>
                          {notification.amount && (
                            <p className="text-sm font-bold text-primary mt-1">
                              Ƀ {notification.amount.toLocaleString()}
                            </p>
                          )}
                          {(notification.type === 'transfer_received' || notification.type === 'transfer_sent') && (
                            <div className="mt-2">
                              <button
                                onClick={async (e) => {
                                  e.stopPropagation()
                                  const transferId = notification.metadata?.transfer_id
                                  if (transferId) {
                                    try {
                                      const response = await transferApi.get(transferId)
                                      if (response.success && response.data?.transfer) {
                                        const transfer = response.data.transfer
                                        const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}')
                                        const isSent = transfer.sender_id === currentUser.id
                                        
                                        setSelectedReceipt({
                                          id: transfer.id,
                                          type: isSent ? 'sent' : 'received',
                                          amount: parseFloat(transfer.amount?.toString() || '0'),
                                          senderName: transfer.sender ? `${transfer.sender.first_name} ${transfer.sender.last_name}` : 'User',
                                          senderPhone: transfer.sender?.phone_number || '',
                                          receiverName: transfer.receiver ? `${transfer.receiver.first_name} ${transfer.receiver.last_name}` : 'User',
                                          receiverPhone: transfer.receiver?.phone_number || '',
                                          message: transfer.message || undefined,
                                          date: new Date(transfer.created_at).toLocaleDateString('en-US', { 
                                            year: 'numeric', 
                                            month: 'long', 
                                            day: 'numeric' 
                                          }),
                                          time: new Date(transfer.created_at).toLocaleTimeString('en-US', {
                                            hour: '2-digit',
                                            minute: '2-digit'
                                          }),
                                          status: transfer.status || 'completed',
                                        })
                                        setShowReceipt(true)
                                      }
                                    } catch (error) {
                                      console.error('Failed to fetch transfer:', error)
                                    }
                                  }
                                }}
                                className="text-xs text-primary underline hover:text-primary/80 font-semibold"
                              >
                                View Receipt →
                              </button>
                            </div>
                          )}
                          {(notification.type === 'friend_request' || notification.type === 'friend_request_accepted') && (
                            <div className="mt-2">
                              <span className="text-xs text-primary font-semibold">
                                Tap to view requests →
                              </span>
                            </div>
                          )}
                          {notification.type === 'event_invite' && (
                            <div className="mt-2">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  if (onNavigate && notification.metadata?.event_id) {
                                    onNavigate('event-info', notification.metadata.event_id)
                                  }
                                }}
                                className="text-xs text-primary underline hover:text-primary/80 font-semibold"
                              >
                                View Event →
                              </button>
                            </div>
                          )}
                          <p className="text-xs text-muted-foreground mt-2">
                            {notification.timestamp}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          {!notification.read && (
                            <div className="h-2 w-2 rounded-full bg-primary" />
                          )}
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              deleteNotification(notification.id)
                            }}
                            className="rounded-full p-1 hover:bg-secondary"
                          >
                            <X className="h-4 w-4 text-muted-foreground" />
                          </button>
                        </div>
                      </div>
                      {!notification.read && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            markAsRead(notification.id)
                          }}
                          className="mt-2 text-xs text-primary"
                        >
                          Mark as read
                        </button>
                      )}
                    </div>
                  </div>
                </Card>
              )
            })}
          </div>
        )}
      </div>

      {/* Receipt Modal */}
      <ReceiptModal
        open={showReceipt}
        onOpenChange={setShowReceipt}
        receipt={selectedReceipt}
      />
    </div>
  )
}

// Helper function to create notifications (can be called from other components)
export function createNotification(notification: Omit<Notification, 'id' | 'read' | 'timestamp'>) {
  const newNotification: Notification = {
    ...notification,
    id: `NOTIF-${Date.now()}`,
    read: false,
    timestamp: new Date().toLocaleString(),
  }

  const existingNotifications = JSON.parse(localStorage.getItem('notifications') || '[]')
  const updated = [newNotification, ...existingNotifications]
  localStorage.setItem('notifications', JSON.stringify(updated))
  
  // Trigger storage event for other tabs/components
  window.dispatchEvent(new Event('storage'))
  
  return newNotification
}
