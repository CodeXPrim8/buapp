'use client';

import { useState, useEffect } from 'react'
import { Bell, Settings, Eye, EyeOff } from 'lucide-react'
import { userApi, walletApi, invitesApi, eventsApi, notificationApi } from '@/lib/api-client'
import BULoading from '@/components/bu-loading'

interface DashboardProps {
  onNavigate: (page: string, data?: any) => void
}

export default function Dashboard({ onNavigate }: DashboardProps) {
  const [balanceVisible, setBalanceVisible] = useState(true)
  const [userName, setUserName] = useState<string>('User')
  const [greeting, setGreeting] = useState<string>('Good Evening')
  // Initialize balance from cache if available, otherwise null to show loading
  const [balance, setBalance] = useState<number | null>(() => {
    if (typeof window !== 'undefined') {
      const cached = sessionStorage.getItem('cached_balance')
      return cached ? parseFloat(cached) : null
    }
    return null
  })
  const [loading, setLoading] = useState(true)
  const [invites, setInvites] = useState<any[]>([])
  const [invitesLoading, setInvitesLoading] = useState(true)
  const [events, setEvents] = useState<any[]>([])
  const [eventsLoading, setEventsLoading] = useState(true)
  const [unreadNotifications, setUnreadNotifications] = useState(0)

  useEffect(() => {
    // #region agent log
    const cachedOnMount = typeof window !== 'undefined' ? sessionStorage.getItem('cached_balance') : null
    fetch('http://127.0.0.1:7242/ingest/5302d33a-07c7-4c7f-8d80-24b4192edc7b',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'dashboard.tsx:useEffect-mount',message:'Dashboard mounted',data:{cachedOnMount},timestamp:Date.now(),hypothesisId:'H5'})}).catch(()=>{});
    // #endregion
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

    // Set initial greeting
    setGreeting(getGreeting())

    // Update greeting every minute to ensure it's always correct
    const greetingInterval = setInterval(() => {
      setGreeting(getGreeting())
    }, 60000) // Update every minute

    // Fetch user data and wallet balance
    const fetchData = async () => {
      try {
        setLoading(true)
        
        // Get user info
        const userResponse = await userApi.getMe()
        if (userResponse.success && userResponse.data?.user) {
          const user = userResponse.data.user
          const firstName = user.first_name?.trim().split(/\s+/)[0] || 'User'
          setUserName(firstName)
        }

        // Get wallet balance; after getMe() re-check: if recent purchase cache exists, prefer it (getMe() can be stale)
        const walletResponse = await walletApi.getMe()
        if (walletResponse.success && walletResponse.data?.wallet) {
          const wallet = walletResponse.data.wallet
          let newBalance = parseFloat(wallet.balance || '0')
          const balanceUpdatedAt = typeof window !== 'undefined' ? sessionStorage.getItem('balance_updated_at') : null
          const cached = typeof window !== 'undefined' ? sessionStorage.getItem('cached_balance') : null
          const cachedNum = cached != null && cached !== '' ? parseFloat(cached) : NaN
          const recentPurchase = balanceUpdatedAt && (Date.now() - parseInt(balanceUpdatedAt, 10)) < 30000
          if (recentPurchase && Number.isFinite(cachedNum)) newBalance = cachedNum
          // #region agent log
          if (typeof window !== 'undefined') {
            fetch('http://127.0.0.1:7242/ingest/5302d33a-07c7-4c7f-8d80-24b4192edc7b', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ location: 'dashboard:fetchData:balance', message: 'balance set', data: { newBalance, fromCache: recentPurchase && Number.isFinite(cachedNum), getMeBalance: parseFloat(wallet.balance || '0') }, timestamp: Date.now(), hypothesisId: 'H2' }) }).catch(() => {})
          }
          // #endregion
          setBalance(newBalance)
          if (typeof window !== 'undefined') {
            sessionStorage.setItem('cached_balance', newBalance.toString())
          }
        }
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error)
        // Fallback to localStorage
        const storedUser = localStorage.getItem('currentUser')
        if (storedUser) {
          const user = JSON.parse(storedUser)
          if (user.name) {
            const firstName = user.name.trim().split(/\s+/)[0]
            setUserName(firstName || 'User')
          }
        }
      } finally {
        setLoading(false)
      }
    }

    const fetchInvites = async () => {
      try {
        setInvitesLoading(true)
        const response = await invitesApi.list('received')
        if (response.success && response.data?.invites) {
          // Get only the first 2 invites for the dashboard preview
          const recentInvites = response.data.invites.slice(0, 2).map((inv: any) => ({
            id: inv.id,
            icon: '💒', // Default icon, can be customized based on event type
            title: inv.event?.name || 'Event',
            date: inv.event?.date ? new Date(inv.event.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '',
            gate: inv.gate || 'TBD',
            seat: inv.seat_category ? `${inv.seat_category}${inv.seat ? ` - ${inv.seat}` : ''}` : 'TBD',
            status: inv.status === 'accepted' ? 'Accepted' : inv.status === 'declined' ? 'Declined' : 'Pending',
          }))
          setInvites(recentInvites)
        } else {
          // Don't log auth errors (session may not be ready or expired)
          const isAuthError = response.error && /authentication required|unauthorized|401/i.test(String(response.error))
          if (!isAuthError) {
            console.error('Failed to fetch invites:', response.error)
          }
          setInvites([])
        }
      } catch (error: any) {
        const isAuthError = error?.status === 401 || (error?.message && /authentication required|unauthorized/i.test(String(error.message)))
        if (!isAuthError) {
          console.error('Failed to fetch invites:', error)
        }
        setInvites([])
      } finally {
        setInvitesLoading(false)
      }
    }

    const fetchEvents = async () => {
      try {
        setEventsLoading(true)
        const userCity = typeof window !== 'undefined' ? localStorage.getItem('user_city') || '' : ''
        const userState = typeof window !== 'undefined' ? localStorage.getItem('user_state') || '' : ''
        const response = await eventsApi.list({ around_me: true, user_city: userCity || undefined, user_state: userState || undefined })
        if (response.success && response.data?.events) {
          const upcomingEvents = response.data.events
            .filter((e: any) => e.is_around_me)
            .slice(0, 2)
            .map((e: any) => ({
              id: e.id,
              icon: '🎊', // Default icon, can be customized based on category
              title: e.name,
              date: e.date ? new Date(e.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '',
              price: e.ticket_price_bu ? `Ƀ${parseFloat(e.ticket_price_bu.toString()).toLocaleString()}` : 'Free',
              tickets: e.max_tickets 
                ? (e.max_tickets - (e.tickets_sold || 0) > 0 ? 'Available' : 'Sold Out')
                : 'Available',
            }))
          setEvents(upcomingEvents)
        } else {
          const isAuthError = response.error && /authentication required|unauthorized|401/i.test(String(response.error))
          if (!isAuthError) {
            console.error('Failed to fetch events:', response.error)
          }
          setEvents([])
        }
      } catch (error: any) {
        const isAuthError = error?.status === 401 || (error?.message && /authentication required|unauthorized/i.test(String(error.message)))
        if (!isAuthError) {
          console.error('Failed to fetch events:', error)
        }
        setEvents([])
      } finally {
        setEventsLoading(false)
      }
    }

    const fetchNotifications = async () => {
      try {
        const response = await notificationApi.list()
        if (response.success && response.data) {
          const unreadCount = response.data.unreadCount ?? 0
          setUnreadNotifications(unreadCount)
        } else if (response.error && /failed to fetch|network/i.test(String(response.error).toLowerCase())) {
          setUnreadNotifications(0)
        }
      } catch (error: any) {
        const isAuthError = error?.status === 401 || (error?.message && /authentication required|unauthorized/i.test(String(error.message)))
        if (!isAuthError) {
          setUnreadNotifications(0)
        }
      }
    }

    fetchData()
    fetchInvites()
    fetchEvents()
    fetchNotifications()

    // Poll for notifications every 10 seconds
    const notificationInterval = setInterval(fetchNotifications, 10000)
    
    // Refresh balance when page becomes visible (user returns to app)
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        // Refresh balance when user returns to the app
        const refreshBalance = async () => {
          try {
            const walletResponse = await walletApi.getMe()
            if (walletResponse.success && walletResponse.data?.wallet) {
              let newBalance = parseFloat(walletResponse.data.wallet.balance || '0')
              const balanceUpdatedAt = typeof window !== 'undefined' ? sessionStorage.getItem('balance_updated_at') : null
              const cached = typeof window !== 'undefined' ? sessionStorage.getItem('cached_balance') : null
              const cachedNum = cached != null && cached !== '' ? parseFloat(cached) : NaN
              const recentPurchase = balanceUpdatedAt && (Date.now() - parseInt(balanceUpdatedAt, 10)) < 30000
              if (recentPurchase && Number.isFinite(cachedNum)) newBalance = cachedNum
              setBalance(newBalance)
              if (typeof window !== 'undefined') {
                sessionStorage.setItem('cached_balance', newBalance.toString())
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

    // Listen for storage events (when notifications are marked as read)
    const handleStorageChange = () => {
      fetchNotifications()
    }
    window.addEventListener('storage', handleStorageChange)

    // Also listen for custom event when notifications are updated
    const handleNotificationUpdate = () => {
      fetchNotifications()
    }
    window.addEventListener('notifications-updated', handleNotificationUpdate)

    // When balance is updated (e.g. after ticket purchase), sync state so UI reflects deduction
    const handleBalanceUpdated = (e: CustomEvent<{ balance?: string }>) => {
      const val = e.detail?.balance ?? sessionStorage.getItem('cached_balance')
      if (val != null) {
        const num = parseFloat(val)
        if (!isNaN(num)) {
          // #region agent log
          fetch('http://127.0.0.1:7242/ingest/5302d33a-07c7-4c7f-8d80-24b4192edc7b',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'dashboard.tsx:balance-updated',message:'setBalance from balance-updated event',data:{num,val},timestamp:Date.now(),hypothesisId:'H4'})}).catch(()=>{});
          // #endregion
          setBalance(num)
        }
      }
    }
    window.addEventListener('balance-updated', handleBalanceUpdated as EventListener)

    // Cleanup interval on unmount
    return () => {
      clearInterval(greetingInterval)
      clearInterval(notificationInterval)
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('notifications-updated', handleNotificationUpdate)
      window.removeEventListener('balance-updated', handleBalanceUpdated as EventListener)
      if (typeof document !== 'undefined') {
        document.removeEventListener('visibilitychange', handleVisibilityChange)
      }
    }
  }, [])

  return (
    <div className="space-y-6 pb-24">
      {/* Header Section */}
      <div className="space-y-4 bg-gradient-to-b from-primary to-primary/80 px-4 py-8 text-primary-foreground">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm opacity-90">{greeting}</p>
            <h2 className="text-2xl font-bold">{userName}</h2>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={() => onNavigate('notifications')}
              className="relative rounded-full bg-primary-foreground/20 p-2 backdrop-blur hover:bg-primary-foreground/30 transition"
            >
              <Bell size={20} />
              {unreadNotifications > 0 && (
                <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white">
                  {unreadNotifications > 9 ? '9+' : unreadNotifications}
                </span>
              )}
            </button>
            <button 
              onClick={() => onNavigate('profile')}
              className="rounded-full bg-primary-foreground/20 p-2 backdrop-blur hover:bg-primary-foreground/30 transition"
            >
              <Settings size={20} />
            </button>
          </div>
        </div>

        {/* Account Balance */}
        <div className="space-y-3 rounded-2xl bg-primary-foreground/10 p-4 backdrop-blur">
          <p className="text-sm opacity-90">ɃU Balance</p>
          <div className="flex items-center justify-between">
            <div className="text-3xl font-bold">
              {loading && balance === null ? (
                <BULoading size="compact" className="py-1" />
              ) : balanceVisible ? (
                `Ƀ ${(balance || 0).toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
              ) : (
                'Ƀ ••••••'
              )}
            </div>
            <button 
              onClick={() => setBalanceVisible(!balanceVisible)}
              className="rounded-full bg-primary-foreground/20 p-2 hover:bg-primary-foreground/30 transition"
            >
              {balanceVisible ? (
                <Eye className="h-5 w-5 text-foreground" />
              ) : (
                <EyeOff className="h-5 w-5 text-foreground" />
              )}
            </button>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="font-mono">
              {loading && balance === null ? (
                <BULoading size="compact" className="py-1" />
              ) : balanceVisible ? (
                `≈ ₦${(balance || 0).toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
              ) : (
                '≈ ₦••••••'
              )}
            </span>
            <button
              onClick={() => onNavigate('history')}
              className="rounded-full bg-green-400/20 px-3 py-1 text-green-300 hover:bg-green-400/30 transition"
            >
              History
            </button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button 
            onClick={() => onNavigate('wallet')}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-primary-foreground/20 py-3 backdrop-blur transition hover:bg-primary-foreground/30"
          >
            <span>➕</span>
            <span className="font-semibold">Fund Wallet</span>
          </button>
          <button 
            onClick={() => onNavigate('send-bu')}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-primary-foreground/20 py-3 backdrop-blur transition hover:bg-primary-foreground/30"
          >
            <span>✨</span>
            <span className="font-semibold">Send ɃU</span>
          </button>
        </div>
      </div>

      {/* Quick Access - Moved before events */}
      <div className="px-4">
        <h3 className="mb-4 text-lg font-bold">Quick Actions</h3>
        <div className="grid grid-cols-3 gap-3">
          {[
            { icon: '✨', label: 'Spray', action: 'spraying' },
            { icon: '💳', label: 'Receive ɃU', action: 'receive-bu' },
            { icon: '💰', label: 'Withdraw', action: 'redemption' },
          ].map((item, idx) => (
            <button
              key={idx}
              onClick={() => onNavigate(item.action)}
              className="flex flex-col items-center gap-2 rounded-xl bg-card p-4 transition hover:bg-card/80"
            >
              <div className="text-3xl">{item.icon}</div>
              <span className="text-xs font-medium text-center">{item.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Invites Section */}
      <div className="px-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold">Invites</h3>
          <button
            onClick={() => onNavigate('invites')}
            className="text-sm text-primary font-semibold"
          >
            View All
          </button>
        </div>
        <div className="space-y-3">
          {invitesLoading ? (
            <div className="rounded-xl bg-card p-3 text-center">
              <BULoading className="py-2" />
            </div>
          ) : invites.length === 0 ? (
            <div className="rounded-xl bg-card p-3 text-center">
              <p className="text-sm text-muted-foreground">No invites received yet</p>
            </div>
          ) : (
            invites.map((item) => (
              <div
                key={item.id}
                onClick={() => onNavigate('invites')}
                className="flex gap-3 rounded-xl bg-card p-3 cursor-pointer transition hover:bg-card/80"
              >
                <div className="text-3xl">{item.icon}</div>
                <div className="flex-1">
                  <div className="flex items-start justify-between">
                    <h4 className="font-semibold">{item.title}</h4>
                    {item.date && (
                      <span className="rounded-full bg-primary/20 px-2 py-1 text-xs text-primary">
                        {item.date}
                      </span>
                    )}
                  </div>
                  <div className="mt-1 space-y-1">
                    {item.gate && item.gate !== 'TBD' && (
                      <p className="text-xs text-muted-foreground">🚪 {item.gate}</p>
                    )}
                    {item.seat && item.seat !== 'TBD' && (
                      <p className="text-xs text-muted-foreground">🪑 {item.seat}</p>
                    )}
                  </div>
                  <span className={`mt-2 inline-block rounded-full px-2 py-1 text-xs font-semibold ${
                    item.status === 'Accepted' 
                      ? 'bg-green-400/20 text-green-400' 
                      : item.status === 'Declined'
                      ? 'bg-red-400/20 text-red-400'
                      : 'bg-yellow-400/20 text-yellow-400'
                  }`}>
                    {item.status}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Shows & Parties Around Me Section */}
        <div className="px-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold">Shows & Parties Around Me</h3>
          <button
            onClick={() => onNavigate('events')}
            className="text-sm text-primary font-semibold"
          >
            View All
          </button>
        </div>
        <div className="space-y-3">
          {eventsLoading ? (
            <div className="rounded-xl bg-card p-3 text-center">
              <BULoading className="py-2" />
            </div>
          ) : events.length === 0 ? (
            <div className="rounded-xl bg-card p-3 text-center">
              <p className="text-sm text-muted-foreground">No events/parties in your area yet</p>
            </div>
          ) : (
            events.map((item) => (
              <div
                key={item.id}
                onClick={() => onNavigate('event-info', item.id)}
                className="flex gap-3 rounded-xl bg-card p-3 cursor-pointer transition hover:bg-card/80"
              >
                <div className="text-3xl">{item.icon}</div>
                <div className="flex-1">
                  <div className="flex items-start justify-between">
                    <h4 className="font-semibold">{item.title}</h4>
                    {item.date && (
                      <span className="rounded-full bg-primary/20 px-2 py-1 text-xs text-primary">
                        {item.date}
                      </span>
                    )}
                  </div>
                  <div className="mt-1 flex items-center justify-between">
                    <p className="text-xs text-muted-foreground">🎫 {item.price} per ticket</p>
                    <span className={`rounded-full px-2 py-1 text-xs ${
                      item.tickets === 'Available'
                        ? 'bg-green-400/20 text-green-400'
                        : 'bg-red-400/20 text-red-400'
                    }`}>
                      {item.tickets}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Updates Section */}
      <div className="px-4">
        <h3 className="mb-4 text-lg font-bold">Campaign Updates</h3>
        <div className="relative h-48 overflow-hidden rounded-xl bg-gradient-to-r from-primary to-primary/60 p-4">
          <div className="absolute inset-0 flex items-center justify-center opacity-20">
            <div className="text-6xl">🎉</div>
          </div>
          <div className="relative space-y-2">
            <h4 className="text-xl font-bold">Celebrate Better</h4>
            <p className="text-sm opacity-90">Send ɃU to events - Receive ceremonial notes for spraying</p>
            <div className="flex gap-2 pt-2">
              <span className="rounded-full bg-primary-foreground/30 px-3 py-1 text-xs">
                💚 Digital
              </span>
              <span className="rounded-full bg-primary-foreground/30 px-3 py-1 text-xs">
                📱 Mobile
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
