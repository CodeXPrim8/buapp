'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { adminApi } from '@/lib/admin-api'
import { 
  LayoutDashboard, 
  Users, 
  Calendar, 
  CreditCard, 
  ArrowLeftRight, 
  Wallet, 
  Settings,
  LogOut,
  QrCode,
  MapPin
} from 'lucide-react'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const pathname = usePathname()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      const response = await adminApi.getMe()
      if (response.success && response.data?.user) {
        setUser(response.data.user)
        setLoading(false)
      } else {
        console.log('[Dashboard Layout] Auth check failed, redirecting to login:', response.error)
        // Use replace to avoid adding to history
        router.replace('/login')
        // Fallback redirect if router doesn't work
        setTimeout(() => {
          if (typeof window !== 'undefined') {
            window.location.href = '/login'
          }
        }, 100)
      }
    } catch (error: any) {
      console.error('[Dashboard Layout] Auth check error:', error)
      router.replace('/login')
      // Fallback redirect if router doesn't work
      setTimeout(() => {
        if (typeof window !== 'undefined') {
          window.location.href = '/login'
        }
      }, 100)
    }
  }

  const handleLogout = async () => {
    await adminApi.logout()
    router.push('/login')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50 dark:from-gray-900 dark:to-slate-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-600 border-t-transparent mx-auto mb-4"></div>
          <p className="text-lg font-semibold text-gray-700 dark:text-gray-300">Loading dashboard...</p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Checking authentication</p>
        </div>
      </div>
    )
  }

  // If no user after loading, show redirect message
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50 dark:from-gray-900 dark:to-slate-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-600 border-t-transparent mx-auto mb-4"></div>
          <p className="text-lg font-semibold text-gray-700 dark:text-gray-300">Redirecting to login...</p>
        </div>
      </div>
    )
  }

  const navItems = [
    { href: '/dashboard', icon: LayoutDashboard, label: 'Overview' },
    { href: '/dashboard/users', icon: Users, label: 'Users' },
    { href: '/dashboard/events', icon: Calendar, label: 'Events' },
    { href: '/dashboard/events-around-me', icon: MapPin, label: 'Create Shows & Parties Around Me' },
    { href: '/dashboard/transactions', icon: ArrowLeftRight, label: 'Transactions' },
    { href: '/dashboard/withdrawals', icon: Wallet, label: 'Withdrawals' },
    { href: '/dashboard/payments', icon: CreditCard, label: 'Payments' },
    { href: '/dashboard/gateways', icon: QrCode, label: 'Gateways' },
    { href: '/dashboard/settings', icon: Settings, label: 'Settings' },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-gray-900 dark:to-slate-900">
      {/* Sidebar */}
      <div className="fixed inset-y-0 left-0 w-64 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-r border-gray-200/50 dark:border-gray-800 shadow-xl">
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-6 border-b border-gray-200/50 dark:border-gray-800 bg-gradient-to-r from-blue-600 to-indigo-600">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">BU Admin</h1>
                <p className="text-xs text-blue-100">Super Admin</p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-all ${
                    isActive
                      ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/50'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100/50 dark:hover:bg-gray-800/50 hover:text-blue-600 dark:hover:text-blue-400'
                  }`}
                >
                  <Icon className={`w-5 h-5 ${isActive ? 'text-white' : ''}`} />
                  <span className="font-medium">{item.label}</span>
                </Link>
              )
            })}
          </nav>

          {/* User Info & Logout */}
          <div className="p-4 border-t border-gray-200/50 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50">
            {user && (
              <div className="mb-4 p-3 bg-white/50 dark:bg-gray-800/50 rounded-xl">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{user.name}</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400 truncate">{user.phoneNumber}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-200 capitalize">
                    {user.role.replace('_', ' ')}
                  </span>
                </div>
              </div>
            )}
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center space-x-2 px-4 py-3 text-white bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 rounded-xl transition-all transform hover:scale-[1.02] shadow-lg"
            >
              <LogOut className="w-4 h-4" />
              <span className="text-sm font-semibold">Logout</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="ml-64">
        <main className="p-8 max-w-7xl mx-auto">{children}</main>
      </div>
    </div>
  )
}
