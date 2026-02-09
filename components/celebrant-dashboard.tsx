'use client'

import { useState, useRef, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowDown, Banknote, TrendingUp, Calendar, Plus, Bell } from 'lucide-react'
import { eventsApi, walletApi, transferApi } from '@/lib/api-client'
import BULoading from '@/components/bu-loading'

interface Event {
  id: string
  name: string
  date: string
  totalBUReceived: number
  vendorName: string
  withdrawn?: boolean // Track if this event's balance has been withdrawn
}

interface BUTransfer {
  id: string
  eventId: string
  eventName: string
  amount: number
  fromGuest: string
  timestamp: string
}

interface CelebrantDashboardProps {
  onNavigate?: (page: string, data?: any) => void
}

export default function CelebrantDashboard({ onNavigate }: CelebrantDashboardProps) {
  const eventsSectionRef = useRef<HTMLDivElement>(null)
  const [events, setEvents] = useState<Event[]>([])
  // Initialize balance from cache if available, otherwise null to show loading
  const [mainBalance, setMainBalance] = useState<number | null>(() => {
    if (typeof window !== 'undefined') {
      const cached = sessionStorage.getItem('cached_balance')
      return cached ? parseFloat(cached) : null
    }
    return null
  })
  const [recentTransfers, setRecentTransfers] = useState<BUTransfer[]>([])
  const [loading, setLoading] = useState(true)
  const [greeting, setGreeting] = useState<string>('Good Evening')

  // Get time-based greeting
  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour >= 5 && hour < 12) {
      return 'Good Morning'
    } else if (hour >= 12 && hour < 17) {
      return 'Good Afternoon'
    } else {
      return 'Good Evening'
    }
  }

  // Update greeting in real-time
  useEffect(() => {
    // Set initial greeting
    setGreeting(getGreeting())

    // Update greeting every minute to ensure it's always correct
    const greetingInterval = setInterval(() => {
      setGreeting(getGreeting())
    }, 60000) // Update every minute

    return () => {
      clearInterval(greetingInterval)
    }
  }, [])

  // Fetch data from API
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        
        // Fetch wallet balance
        const walletResponse = await walletApi.getMe()
        if (walletResponse.success && walletResponse.data?.wallet) {
          const newBalance = parseFloat(walletResponse.data.wallet.balance || '0')
          setMainBalance(newBalance)
          // Cache balance for faster loading on next visit
          if (typeof window !== 'undefined') {
            sessionStorage.setItem('cached_balance', newBalance.toString())
            sessionStorage.setItem('balance_updated_at', Date.now().toString())
            window.dispatchEvent(new CustomEvent('balance-updated', { detail: { balance: newBalance.toString() } }))
          }
        }

        // Fetch events - only events created by this user (no public filter)
        const eventsResponse = await eventsApi.list({ my_events: true })
        console.log('Events API response:', eventsResponse)
        if (eventsResponse.success && eventsResponse.data?.events) {
          const formattedEvents = eventsResponse.data.events.map((e: any) => ({
            id: e.id,
            name: e.name,
            date: e.date,
            totalBUReceived: parseFloat(e.total_bu_received?.toString() || '0'),
            vendorName: e.vendor_name || 'Vendor',
            withdrawn: e.withdrawn || false,
          }))
          setEvents(formattedEvents)
        } else {
          console.error('Failed to fetch events:', {
            success: eventsResponse?.success,
            error: eventsResponse?.error,
            data: eventsResponse?.data,
            response: eventsResponse,
          })
          // Don't show error to user, just log it - events list will be empty
        }

        // Fetch recent transfers
        const transfersResponse = await transferApi.list(10, 0)
        if (transfersResponse.success && transfersResponse.data?.transfers) {
          const formattedTransfers = transfersResponse.data.transfers
            .filter((t: any) => t.receiver_id) // Only received transfers
            .slice(0, 5)
            .map((t: any) => ({
              id: t.id,
              eventId: t.event_id || '',
              eventName: t.event_id ? 'Event Transfer' : 'Direct Transfer',
              amount: parseFloat(t.amount?.toString() || '0'),
              fromGuest: t.sender ? `${t.sender.first_name} ${t.sender.last_name}` : 'User',
              timestamp: t.created_at,
            }))
          setRecentTransfers(formattedTransfers)
        }
      } catch (error) {
        console.error('Failed to fetch celebrant data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
    
    // Refresh balance when page becomes visible (user returns to app)
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        // Refresh balance when user returns to the app
        const refreshBalance = async () => {
          try {
            const walletResponse = await walletApi.getMe()
            if (walletResponse.success && walletResponse.data?.wallet) {
              const newBalance = parseFloat(walletResponse.data.wallet.balance || '0')
              setMainBalance(newBalance)
              if (typeof window !== 'undefined') {
                sessionStorage.setItem('cached_balance', newBalance.toString())
                sessionStorage.setItem('balance_updated_at', Date.now().toString())
                window.dispatchEvent(new CustomEvent('balance-updated', { detail: { balance: newBalance.toString() } }))
              }
            }
          } catch (error) {
            console.error('Failed to refresh balance:', error)
          }
        }
        refreshBalance()
      }
    }
    
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', handleVisibilityChange)
    }
    
    // Refresh every 5 seconds
    const interval = setInterval(fetchData, 5000)
    return () => {
      clearInterval(interval)
      if (typeof document !== 'undefined') {
        document.removeEventListener('visibilitychange', handleVisibilityChange)
      }
    }
  }, [])

  // Calculate total available in events (not yet withdrawn)
  const totalAvailableInEvents = events
    .filter(event => !event.withdrawn)
    .reduce((sum, event) => sum + event.totalBUReceived, 0)

  return (
    <div className="space-y-6 pb-24 pt-4">
      {/* Header Section */}
      <div className="space-y-4 bg-gradient-to-b from-primary to-primary/80 px-4 py-8 text-primary-foreground">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm opacity-90">{greeting}</p>
            <h2 className="text-2xl font-bold">Celebrant Dashboard</h2>
          </div>
          <button 
            onClick={() => onNavigate?.('notifications')}
            className="rounded-full bg-primary-foreground/20 p-2 backdrop-blur hover:bg-primary-foreground/30 transition"
          >
            <Bell size={20} />
          </button>
        </div>

        {/* Main Balance */}
        <div className="space-y-3 rounded-2xl bg-primary-foreground/10 p-4 backdrop-blur">
          <p className="text-sm opacity-90">Main Balance</p>
          <div className="flex items-center justify-between">
            <div className="text-3xl font-bold">
              {mainBalance === null ? (
                <BULoading size="compact" className="py-1" />
              ) : (
                `Ƀ ${mainBalance.toLocaleString()}`
              )}
            </div>
            <div className="rounded-full bg-primary-foreground/20 p-2">
              <TrendingUp size={20} />
            </div>
          </div>
          <div className="text-sm opacity-90">
            {mainBalance === null ? (
              <BULoading size="compact" className="py-1" />
            ) : (
              `≈ ₦${mainBalance.toLocaleString()}`
            )}
          </div>
          {totalAvailableInEvents > 0 && (
            <div className="text-xs opacity-75 pt-2 border-t border-primary-foreground/20">
              Ƀ {totalAvailableInEvents.toLocaleString()} available in events
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="px-4">
        <div className="grid grid-cols-2 gap-3 mb-3">
          <Button
            onClick={() => onNavigate?.('redemption')}
            className="h-20 flex-col gap-2 bg-primary text-primary-foreground hover:bg-primary/90"
          >
            <Banknote className="h-5 w-5" />
            <span>Withdraw ɃU</span>
          </Button>
          <Button
            onClick={() => {
              eventsSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
            }}
            variant="outline"
            className="h-20 flex-col gap-2"
          >
            <Calendar className="h-5 w-5" />
            <span>My Event</span>
          </Button>
        </div>
        <Button
          onClick={() => {
            // #region agent log
            fetch('http://127.0.0.1:7242/ingest/5302d33a-07c7-4c7f-8d80-24b4192edc7b',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'components/celebrant-dashboard.tsx:195',message:'Create Event button clicked',data:{hasOnNavigate:!!onNavigate},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
            // #endregion agent log
            onNavigate?.('celebrant-create-event')
          }}
          className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
        >
          <Plus className="h-4 w-4 mr-2" />
          Create New Event
        </Button>
      </div>

      {/* Active Events */}
      <div className="px-4" ref={eventsSectionRef}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold">My Event</h3>
          <Button
            onClick={() => onNavigate?.('celebrant-create-event')}
            variant="outline"
            size="sm"
          >
            <Plus className="h-4 w-4 mr-1" />
            New
          </Button>
        </div>
        <div className="space-y-3">
          {events.map((event) => (
            <Card
              key={event.id}
              onClick={() => onNavigate?.('celebrant-event-info', event.id)}
              className="border-primary/20 cursor-pointer bg-card p-4 transition hover:bg-card/80 hover:border-primary/40"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h4 className="font-semibold">{event.name}</h4>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {event.date} · {event.vendorName}
                  </p>
                  <div className="mt-2 flex items-center gap-2">
                    <span className="rounded-full bg-green-400/20 px-2 py-1 text-xs text-green-400">
                      Active
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-primary">
                    Ƀ {event.totalBUReceived.toLocaleString()}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {event.withdrawn ? 'Withdrawn' : 'Available'}
                  </p>
                  {event.withdrawn && (
                    <span className="inline-block mt-1 rounded-full bg-blue-400/20 px-2 py-0.5 text-xs text-blue-400">
                      In Main Wallet
                    </span>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Recent ɃU Transfers */}
      <div className="px-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold">Recent ɃU Transfers</h3>
          <button
            onClick={() => onNavigate?.('history')}
            className="text-sm text-primary font-semibold"
          >
            View All
          </button>
        </div>
        <div className="space-y-3">
          {recentTransfers.map((transfer) => (
            <Card
              key={transfer.id}
              onClick={() => onNavigate?.('history', { filter: 'transfers' })}
              className="border-border/50 cursor-pointer bg-card/50 p-4 transition hover:bg-card/80"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div className="rounded-full bg-primary/20 p-2">
                    <ArrowDown className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold">{transfer.eventName}</h4>
                    <p className="text-xs text-muted-foreground mt-1">
                      From: {transfer.fromGuest}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {transfer.timestamp}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-primary">
                    +Ƀ {transfer.amount.toLocaleString()}
                  </p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Info Card */}
      <div className="px-4">
        <Card className="border-primary/20 bg-gradient-to-br from-primary/10 to-primary/5 p-6">
          <div className="space-y-2">
            <h3 className="font-semibold">How It Works</h3>
            <p className="text-sm text-muted-foreground">
              Guests send ɃU directly to your wallet through events. All value is transferred digitally before physical notes are issued. You can withdraw your ɃU to your bank account at any time.
            </p>
          </div>
        </Card>
      </div>
    </div>
  )
}
