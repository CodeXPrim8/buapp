'use client'

import { useState, useEffect } from 'react'
import Dashboard from '@/components/dashboard'
import Profile from '@/components/profile'
import Notifications from '@/components/notifications'
import Wallet from '@/components/wallet'
import PaystackPayment from '@/components/paystack-payment'
import Spraying from '@/components/spraying'
import Redemption from '@/components/redemption'
import VendorDashboard from '@/components/vendor-dashboard'
import VendorPOS from '@/components/vendor-pos'
import QRScanner from '@/components/qr-scanner'
import Navigation from '@/components/navigation'
import ModeSwitcher from '@/components/mode-switcher'
import ThemeSelector from '@/components/theme-selector'
import NotificationBell from '@/components/notification-bell'
import CelebrantDashboard from '@/components/celebrant-dashboard'
import BuyBU from '@/components/buy-bu'
import History from '@/components/history'
import Invites from '@/components/invites'
import EventsTickets from '@/components/events-tickets'
import SendBU from '@/components/send-bu'
import ReceiveBU from '@/components/receive-bu'
import Contacts from '@/components/contacts'
import EventInfo from '@/components/event-info'
import CelebrantEventInfo from '@/components/celebrant-event-info'
import CelebrantCreateEvent from '@/components/celebrant-create-event'
import VendorCreateEvent from '@/components/vendor-create-event'
import CelebrantSendInvites from '@/components/celebrant-send-invites'
import VendorGatewaySetup from '@/components/vendor-gateway-setup'
import BULoading from '@/components/bu-loading'
import VendorBuyback from '@/components/vendor-buyback'
import Auth from '@/components/auth'

export default function Home() {
  const [currentPage, setCurrentPage] = useState('dashboard')
  const [pageData, setPageData] = useState<any>(null)
  const [theme, setTheme] = useState('theme-pink')
  const [mode, setMode] = useState<'user' | 'celebrant' | 'vendor'>('user')
  const [mounted, setMounted] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [currentUser, setCurrentUser] = useState<{ id: string; role: 'user' | 'celebrant' | 'vendor' | 'both' | 'admin' | 'superadmin'; phoneNumber: string; name: string } | null>(null)

  const handleNavigate = (page: string, data?: any) => {
    setCurrentPage(page)
    setPageData(data)
  }

  useEffect(() => {
    setMounted(true)
    
    // Only access localStorage on client side
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('bison-theme') || 'theme-pink'
      setTheme(savedTheme)
      
      // Check authentication via API (JWT cookie)
      const checkAuth = async () => {
        try {
          const { userApi } = await import('@/lib/api-client')
          const response = await userApi.getMe()
          
          if (response.success && response.data?.user) {
            const user = response.data.user
            setIsAuthenticated(true)
            setCurrentUser({
              id: user.id || '',
              role: user.role,
              phoneNumber: user.phoneNumber,
              name: user.name,
            })
            // Set initial mode: Guest for 'user', 'celebrant', 'admin', 'superadmin' roles, Vendor for 'vendor' and 'both' roles
            setMode(user.role === 'vendor' || user.role === 'both' ? 'vendor' : 'user')
          } else {
            // Not authenticated (401 or other error) - clear any stale sessionStorage
            // This is expected when user is not logged in, so we handle it silently
            sessionStorage.removeItem('userRole')
            sessionStorage.removeItem('userName')
          }
        } catch (error: any) {
          // Not authenticated or error - handle silently
          // 401 errors are expected when user is not logged in
          if (error?.status !== 401) {
            console.error('Auth check error:', error)
          }
          sessionStorage.removeItem('userRole')
          sessionStorage.removeItem('userName')
        }
      }
      
      checkAuth()
    }
  }, [])
  
  const handleAuthSuccess = (user: { id: string; role: 'user' | 'celebrant' | 'vendor' | 'both' | 'admin' | 'superadmin'; phoneNumber: string; name: string }) => {
    setIsAuthenticated(true)
    setCurrentUser(user)
            // Set initial mode: Guest for 'user', 'celebrant', 'admin', 'superadmin' roles, Vendor for 'vendor' and 'both' roles
            setMode(user.role === 'vendor' || user.role === 'both' ? 'vendor' : 'user')
    setCurrentPage('dashboard')
  }
  
  const handleLogout = async () => {
    try {
      // Call logout API to clear httpOnly cookie
      const { authApi } = await import('@/lib/api-client')
      await authApi.logout()
    } catch (error) {
      console.error('Logout error:', error)
    }
    
    // Clear sessionStorage
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('userRole')
      sessionStorage.removeItem('userName')
    }
    
    setIsAuthenticated(false)
    setCurrentUser(null)
    setCurrentPage('dashboard')
  }

  useEffect(() => {
    if (mounted && typeof window !== 'undefined') {
      localStorage.setItem('bison-theme', theme)
      document.documentElement.className = theme
    }
  }, [theme, mounted])

  // Role-based access control function (must be defined before hooks)
  const canAccessPage = (page: string) => {
    if (page === 'dashboard' || page === 'profile' || page === 'notifications') return true
    
    // Guest and Celebrant modes are accessible to 'user', 'celebrant', 'both', 'admin', and 'superadmin' registered roles
    if (mode === 'user') {
      // Guest mode accessible to 'user', 'celebrant', 'both', 'admin', and 'superadmin' roles
      if (currentUser?.role === 'user' || currentUser?.role === 'celebrant' || currentUser?.role === 'both' || currentUser?.role === 'admin' || currentUser?.role === 'superadmin') {
        return ['wallet', 'spraying', 'redemption', 'buy-bu', 'history', 'invites', 'events', 'event-info', 'send-bu', 'receive-bu', 'contacts', 'paystack-payment'].includes(page)
      }
      return false
    } else if (mode === 'celebrant') {
      // Celebrant mode accessible to 'user', 'celebrant', 'both', 'admin', and 'superadmin' roles
      if (currentUser?.role === 'user' || currentUser?.role === 'celebrant' || currentUser?.role === 'both' || currentUser?.role === 'admin' || currentUser?.role === 'superadmin') {
        return ['wallet', 'redemption', 'history', 'celebrant-event-info', 'celebrant-create-event', 'celebrant-send-invites'].includes(page)
      }
      return false
    } else if (mode === 'vendor') {
      // Vendor mode accessible if registered as vendor, both, admin, or superadmin
      if (currentUser?.role === 'vendor' || currentUser?.role === 'both' || currentUser?.role === 'admin' || currentUser?.role === 'superadmin') {
        return ['wallet', 'spraying', 'vendor-gateway-setup', 'vendor-buyback', 'vendor-create-event', 'invites'].includes(page)
      }
      return false
    }
    return false
  }

  // Redirect to dashboard if trying to access unauthorized page
  // This hook MUST be called before any early returns
  useEffect(() => {
    if (mounted && isAuthenticated && currentUser) {
      // If trying to access vendor mode but not registered as vendor, both, admin, or superadmin, switch to user mode
      if (mode === 'vendor' && currentUser.role !== 'vendor' && currentUser.role !== 'both' && currentUser.role !== 'admin' && currentUser.role !== 'superadmin') {
        setMode('user')
        setCurrentPage('dashboard')
      } else if (!canAccessPage(currentPage)) {
        setCurrentPage('dashboard')
      }
    }
  }, [currentPage, mounted, isAuthenticated, mode, currentUser])

  // Show loading state instead of null to avoid hydration mismatch
  if (!mounted) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <BULoading />
      </div>
    )
  }

  // Show auth screen if not authenticated
  if (!isAuthenticated) {
    return <Auth onAuthSuccess={handleAuthSuccess} />
  }

  return (
    <div className={`${theme} min-h-screen bg-background text-foreground`}>
      <div className="mx-auto max-w-md">
        {/* Header */}
        <div className="sticky top-0 z-40 flex items-center justify-between border-b border-border bg-background/95 px-4 py-3 backdrop-blur">
          {currentPage !== 'dashboard' && (
            <button
              onClick={() => setCurrentPage('dashboard')}
              className="text-xl text-foreground transition hover:text-primary"
            >
              ←
            </button>
          )}
          {currentPage === 'dashboard' && <div />}
          <h1 className="text-lg font-bold capitalize text-primary">
            {currentPage === 'dashboard' && mode === 'user' ? 'Celebrate' : currentPage === 'dashboard' && mode === 'celebrant' ? 'Celebrant' : currentPage === 'dashboard' && mode === 'vendor' ? 'Vendor' : currentPage}
          </h1>
          <div className="flex items-center gap-2">
            <NotificationBell onNavigate={handleNavigate} />
            <ThemeSelector theme={theme} onThemeChange={setTheme} />
          </div>
        </div>

        {/* Mode Switcher */}
        {currentPage === 'dashboard' && <ModeSwitcher currentMode={mode} onModeChange={setMode} userRole={currentUser?.role} />}

        {/* Content */}
        <div>
          {mode === 'user' ? (
            <>
              {currentPage === 'dashboard' && <Dashboard onNavigate={handleNavigate} />}
              {currentPage === 'wallet' && <Wallet onNavigate={handleNavigate} />}
              {currentPage === 'spraying' && <Spraying />}
              {currentPage === 'redemption' && <Redemption 
                allowWalletWithdrawal={pageData?.allowWalletWithdrawal || false}
                eventId={pageData?.eventId}
                eventName={pageData?.eventName}
                eventBalance={pageData?.eventBalance}
                eventWithdrawn={pageData?.eventWithdrawn}
              />}
              {currentPage === 'profile' && <Profile onNavigate={handleNavigate} onLogout={handleLogout} theme={theme} />}
              {currentPage === 'notifications' && <Notifications onNavigate={handleNavigate} />}
              {currentPage === 'buy-bu' && <BuyBU />}
              {currentPage === 'history' && <History />}
              {currentPage === 'invites' && <Invites onNavigate={handleNavigate} />}
              {currentPage === 'events' && <EventsTickets onNavigate={handleNavigate} initialData={pageData} />}
              {currentPage === 'event-info' && <EventInfo eventId={pageData} onNavigate={handleNavigate} />}
              {currentPage === 'send-bu' && <SendBU initialData={pageData} onNavigate={handleNavigate} />}
              {currentPage === 'receive-bu' && <ReceiveBU />}
              {currentPage === 'contacts' && <Contacts onNavigate={handleNavigate} initialData={pageData} />}
              {currentPage === 'paystack-payment' && (
                <PaystackPayment
                  onSuccess={() => {
                    console.log('[PAYSTACK] Success callback fired, navigating to wallet')
                    handleNavigate('wallet')
                    // Small delay to ensure navigation happens, then reload to refresh wallet
                    setTimeout(() => {
                      window.location.reload()
                    }, 100)
                  }}
                  onCancel={() => {
                    console.log('[PAYSTACK] Cancel callback fired')
                    handleNavigate('wallet')
                  }}
                />
              )}
            </>
          ) : mode === 'celebrant' ? (
            <>
              {currentPage === 'dashboard' && <CelebrantDashboard onNavigate={handleNavigate} />}
              {currentPage === 'wallet' && <Wallet onNavigate={handleNavigate} />}
              {currentPage === 'redemption' && <Redemption 
                allowWalletWithdrawal={pageData?.allowWalletWithdrawal || false}
                eventId={pageData?.eventId}
                eventName={pageData?.eventName}
                eventBalance={pageData?.eventBalance}
                eventWithdrawn={pageData?.eventWithdrawn}
              />}
              {currentPage === 'history' && <History />}
              {currentPage === 'notifications' && <Notifications onNavigate={handleNavigate} />}
              {currentPage === 'celebrant-event-info' && <CelebrantEventInfo eventId={pageData} onNavigate={handleNavigate} />}
              {currentPage === 'celebrant-create-event' && <CelebrantCreateEvent onNavigate={handleNavigate} />}
              {currentPage === 'celebrant-send-invites' && <CelebrantSendInvites eventId={pageData} onNavigate={handleNavigate} />}
              {currentPage === 'profile' && <Profile onNavigate={handleNavigate} onLogout={handleLogout} theme={theme} />}
            </>
          ) : (
            <>
              {currentPage === 'dashboard' && <VendorDashboard onNavigate={handleNavigate} />}
              {currentPage === 'wallet' && <VendorPOS onNavigate={handleNavigate} />}
              {currentPage === 'spraying' && <QRScanner mode={mode} />}
              {currentPage === 'notifications' && <Notifications onNavigate={handleNavigate} />}
              {currentPage === 'vendor-gateway-setup' && <VendorGatewaySetup onNavigate={handleNavigate} initialEventId={pageData?.eventId} />}
              {currentPage === 'invites' && <Invites onNavigate={handleNavigate} />}
              {currentPage === 'vendor-buyback' && <VendorBuyback onNavigate={handleNavigate} />}
              {currentPage === 'vendor-create-event' && <VendorCreateEvent onNavigate={handleNavigate} />}
              {currentPage === 'profile' && <Profile onNavigate={handleNavigate} onLogout={handleLogout} theme={theme} />}
            </>
          )}
        </div>

        {/* Navigation */}
        <Navigation currentPage={currentPage} onNavigate={handleNavigate} mode={mode} />
      </div>
    </div>
  )
}
