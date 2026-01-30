'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { adminApi } from '@/lib/admin-api'
import { 
  Users, 
  Calendar, 
  ArrowLeftRight, 
  Wallet, 
  CreditCard, 
  QrCode, 
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Clock,
  DollarSign,
  Activity,
  BarChart3,
  RefreshCw,
  ChevronRight
} from 'lucide-react'

interface DashboardStats {
  users: {
    total: number
    byRole: {
      user: number
      celebrant: number
      vendor: number
      both: number
      admin: number
      super_admin: number
    }
  }
  bu: {
    totalInCirculation: number
    totalWithdrawn: number
  }
  transactions: {
    total: number
    recent: number
  }
  events: {
    total: number
    active: number
  }
  withdrawals: {
    pending: number
    totalCompleted: number
  }
  gateways: {
    total: number
    active: number
  }
}

export default function DashboardPage() {
  const router = useRouter()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  const fetchStats = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true)
      } else {
        setLoading(true)
      }
      setError(null)

      console.log('[Dashboard] Fetching stats...')
      const response = await adminApi.getStats()
      console.log('[Dashboard] Stats response:', { success: response.success, error: response.error })
      
      if (response.success && response.data) {
        setStats(response.data as DashboardStats)
        setLastUpdated(new Date())
      } else {
        const errorMsg = response.error || 'Failed to load statistics'
        console.error('[Dashboard] Stats fetch failed:', errorMsg)
        setError(errorMsg)
      }
    } catch (err: any) {
      console.error('[Dashboard] Failed to fetch stats:', err)
      setError(err.message || 'Network error occurred')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    fetchStats()
    // Auto-refresh every 30 seconds
    const interval = setInterval(() => {
      fetchStats(true)
    }, 30000)

    return () => clearInterval(interval)
  }, [])

  const handleRefresh = () => {
    fetchStats(true)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-600 border-t-transparent mx-auto mb-4"></div>
          <p className="text-lg font-semibold text-gray-700 dark:text-gray-300">Loading dashboard...</p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Fetching system statistics</p>
        </div>
      </div>
    )
  }

  if (error && !stats) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-8">
          <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Failed to Load Dashboard</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">{error}</p>
          <button
            onClick={() => fetchStats()}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-all transform hover:scale-105 shadow-lg"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  if (!stats) {
    return null
  }

  const statCards = [
    {
      title: 'Total Users',
      value: stats.users?.total || 0,
      icon: Users,
      color: 'blue',
      gradient: 'from-blue-500 to-blue-600',
      bgGradient: 'from-blue-50 to-blue-100/50 dark:from-blue-900/20 dark:to-blue-800/20',
      borderColor: 'border-blue-200/50 dark:border-blue-800/50',
      subtitle: `${stats.users?.byRole?.user || 0} users, ${stats.users?.byRole?.celebrant || 0} celebrants, ${stats.users?.byRole?.vendor || 0} vendors`,
      link: '/dashboard/users',
      trend: '+12%'
    },
    {
      title: 'Total BU in Circulation',
      value: `Ƀ ${(stats.bu?.totalInCirculation || 0).toLocaleString()}`,
      icon: TrendingUp,
      color: 'green',
      gradient: 'from-green-500 to-green-600',
      bgGradient: 'from-green-50 to-green-100/50 dark:from-green-900/20 dark:to-green-800/20',
      borderColor: 'border-green-200/50 dark:border-green-800/50',
      subtitle: `₦${(stats.bu?.totalInCirculation || 0).toLocaleString()} equivalent`,
      link: '/dashboard/transactions',
      trend: '+5.2%'
    },
    {
      title: 'Total Transactions',
      value: (stats.transactions?.total || 0).toLocaleString(),
      icon: ArrowLeftRight,
      color: 'purple',
      gradient: 'from-purple-500 to-purple-600',
      bgGradient: 'from-purple-50 to-purple-100/50 dark:from-purple-900/20 dark:to-purple-800/20',
      borderColor: 'border-purple-200/50 dark:border-purple-800/50',
      subtitle: `${stats.transactions?.recent || 0} in last 7 days`,
      link: '/dashboard/transactions',
      trend: '+8.1%'
    },
    {
      title: 'Active Events',
      value: stats.events?.active || 0,
      icon: Calendar,
      color: 'orange',
      gradient: 'from-orange-500 to-orange-600',
      bgGradient: 'from-orange-50 to-orange-100/50 dark:from-orange-900/20 dark:to-orange-800/20',
      borderColor: 'border-orange-200/50 dark:border-orange-800/50',
      subtitle: `${stats.events?.total || 0} total events`,
      link: '/dashboard/events',
      trend: '+3.4%'
    },
    {
      title: 'Pending Withdrawals',
      value: stats.withdrawals?.pending || 0,
      icon: Wallet,
      color: 'yellow',
      gradient: 'from-yellow-500 to-yellow-600',
      bgGradient: 'from-yellow-50 to-yellow-100/50 dark:from-yellow-900/20 dark:to-yellow-800/20',
      borderColor: 'border-yellow-200/50 dark:border-yellow-800/50',
      subtitle: `₦${(stats.withdrawals?.totalCompleted || 0).toLocaleString()} completed`,
      link: '/dashboard/withdrawals',
      trend: stats.withdrawals?.pending > 0 ? 'Action Required' : 'All Clear',
      urgent: stats.withdrawals?.pending > 0
    },
    {
      title: 'Active Gateways',
      value: stats.gateways?.active || 0,
      icon: QrCode,
      color: 'indigo',
      gradient: 'from-indigo-500 to-indigo-600',
      bgGradient: 'from-indigo-50 to-indigo-100/50 dark:from-indigo-900/20 dark:to-indigo-800/20',
      borderColor: 'border-indigo-200/50 dark:border-indigo-800/50',
      subtitle: `${stats.gateways?.total || 0} total gateways`,
      link: '/dashboard/gateways',
      trend: 'Active'
    },
  ]

  const quickActions = [
    {
      title: 'Manage Users',
      description: 'View and edit user accounts',
      icon: Users,
      href: '/dashboard/users',
      color: 'blue',
      gradient: 'from-blue-500 to-blue-600',
      bgGradient: 'from-blue-50 to-blue-100/50 dark:from-blue-900/20 dark:to-blue-800/20',
      borderColor: 'border-blue-200/50 dark:border-blue-800/50'
    },
    {
      title: 'Process Withdrawals',
      description: 'Approve pending withdrawal requests',
      icon: Wallet,
      href: '/dashboard/withdrawals',
      color: 'green',
      gradient: 'from-green-500 to-green-600',
      bgGradient: 'from-green-50 to-green-100/50 dark:from-green-900/20 dark:to-green-800/20',
      borderColor: 'border-green-200/50 dark:border-green-800/50',
      badge: stats.withdrawals?.pending > 0 ? stats.withdrawals.pending : undefined
    },
    {
      title: 'View Transactions',
      description: 'Monitor all BU transfers and activity',
      icon: ArrowLeftRight,
      href: '/dashboard/transactions',
      color: 'purple',
      gradient: 'from-purple-500 to-purple-600',
      bgGradient: 'from-purple-50 to-purple-100/50 dark:from-purple-900/20 dark:to-purple-800/20',
      borderColor: 'border-purple-200/50 dark:border-purple-800/50'
    },
    {
      title: 'Manage Events',
      description: 'View and manage all events',
      icon: Calendar,
      href: '/dashboard/events',
      color: 'orange',
      gradient: 'from-orange-500 to-orange-600',
      bgGradient: 'from-orange-50 to-orange-100/50 dark:from-orange-900/20 dark:to-orange-800/20',
      borderColor: 'border-orange-200/50 dark:border-orange-800/50'
    },
    {
      title: 'Payment History',
      description: 'View all payment transactions',
      icon: CreditCard,
      href: '/dashboard/payments',
      color: 'pink',
      gradient: 'from-pink-500 to-pink-600',
      bgGradient: 'from-pink-50 to-pink-100/50 dark:from-pink-900/20 dark:to-pink-800/20',
      borderColor: 'border-pink-200/50 dark:border-pink-800/50'
    },
    {
      title: 'Gateway Management',
      description: 'Manage payment gateways',
      icon: QrCode,
      href: '/dashboard/gateways',
      color: 'indigo',
      gradient: 'from-indigo-500 to-indigo-600',
      bgGradient: 'from-indigo-50 to-indigo-100/50 dark:from-indigo-900/20 dark:to-indigo-800/20',
      borderColor: 'border-indigo-200/50 dark:border-indigo-800/50'
    },
  ]

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-indigo-900 dark:from-white dark:via-blue-200 dark:to-indigo-200 bg-clip-text text-transparent">
            Dashboard Overview
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2 flex items-center gap-2">
            <Activity className="w-4 h-4" />
            System statistics and key metrics
            {lastUpdated && (
              <span className="text-xs text-gray-500 dark:text-gray-500">
                • Updated {lastUpdated.toLocaleTimeString()}
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <div className="text-sm font-semibold text-gray-900 dark:text-white">
              {new Date().toLocaleDateString('en-US', { weekday: 'long' })}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
            </div>
          </div>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-all transform hover:scale-105 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            title="Refresh data"
          >
            <RefreshCw className={`w-5 h-5 text-gray-600 dark:text-gray-400 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Error Banner */}
      {error && stats && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl p-4 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-yellow-800 dark:text-yellow-200">Warning</p>
            <p className="text-xs text-yellow-700 dark:text-yellow-300">{error}</p>
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {statCards.map((stat, index) => {
          const Icon = stat.icon
          const isUrgent = stat.urgent
          return (
            <Link
              key={index}
              href={stat.link}
              className="group relative bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-2xl shadow-lg hover:shadow-2xl p-6 border border-gray-200/50 dark:border-gray-700/50 transition-all transform hover:scale-[1.02] hover:border-blue-300 dark:hover:border-blue-600 overflow-hidden"
            >
              {isUrgent && (
                <div className="absolute top-0 right-0 w-0 h-0 border-l-[20px] border-l-transparent border-t-[20px] border-t-red-500"></div>
              )}
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-1">{stat.title}</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white mb-2">{stat.value}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-500 line-clamp-2">{stat.subtitle}</p>
                </div>
                <div className={`bg-gradient-to-br ${stat.gradient} p-4 rounded-2xl shadow-lg group-hover:scale-110 transition-transform flex-shrink-0 ml-4`}>
                  <Icon className="w-7 h-7 text-white" />
                </div>
              </div>
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200/50 dark:border-gray-700/50">
                <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                  isUrgent 
                    ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
                    : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                }`}>
                  {stat.trend}
                </span>
                <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors" />
              </div>
            </Link>
          )
        })}
      </div>

      {/* Quick Actions */}
      <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-gray-200/50 dark:border-gray-700/50">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <BarChart3 className="w-6 h-6" />
              Quick Actions
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Access frequently used features</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {quickActions.map((action, index) => {
            const Icon = action.icon
            return (
              <Link
                key={index}
                href={action.href}
                className={`group relative p-6 bg-gradient-to-br ${action.bgGradient} border ${action.borderColor} rounded-xl hover:shadow-xl transition-all transform hover:scale-[1.02] overflow-hidden`}
              >
                <div className="relative z-10">
                  <div className={`w-12 h-12 bg-gradient-to-br ${action.gradient} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-lg`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900 dark:text-white mb-1 flex items-center gap-2">
                        {action.title}
                        {action.badge && (
                          <span className="px-2 py-0.5 text-xs font-bold bg-red-500 text-white rounded-full">
                            {action.badge}
                          </span>
                        )}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{action.description}</p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors flex-shrink-0 ml-2" />
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      </div>

      {/* System Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Financial Summary */}
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-2xl shadow-lg p-6 border border-blue-200/50 dark:border-blue-800/50">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            Financial Summary
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-white/50 dark:bg-gray-800/50 rounded-xl">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Total BU in Circulation</span>
              <span className="text-lg font-bold text-gray-900 dark:text-white">
                Ƀ {(stats.bu?.totalInCirculation || 0).toLocaleString()}
              </span>
            </div>
            <div className="flex items-center justify-between p-4 bg-white/50 dark:bg-gray-800/50 rounded-xl">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Total Withdrawn</span>
              <span className="text-lg font-bold text-gray-900 dark:text-white">
                ₦ {(stats.bu?.totalWithdrawn || 0).toLocaleString()}
              </span>
            </div>
            <div className="flex items-center justify-between p-4 bg-white/50 dark:bg-gray-800/50 rounded-xl">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Pending Withdrawals</span>
              <span className={`text-lg font-bold ${stats.withdrawals?.pending > 0 ? 'text-red-600 dark:text-red-400' : 'text-gray-900 dark:text-white'}`}>
                {stats.withdrawals?.pending || 0}
              </span>
            </div>
          </div>
        </div>

        {/* Activity Summary */}
        <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-2xl shadow-lg p-6 border border-purple-200/50 dark:border-purple-800/50">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Activity className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            Activity Summary
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-white/50 dark:bg-gray-800/50 rounded-xl">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Total Transactions</span>
              <span className="text-lg font-bold text-gray-900 dark:text-white">
                {(stats.transactions?.total || 0).toLocaleString()}
              </span>
            </div>
            <div className="flex items-center justify-between p-4 bg-white/50 dark:bg-gray-800/50 rounded-xl">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Last 7 Days</span>
              <span className="text-lg font-bold text-gray-900 dark:text-white">
                {(stats.transactions?.recent || 0).toLocaleString()}
              </span>
            </div>
            <div className="flex items-center justify-between p-4 bg-white/50 dark:bg-gray-800/50 rounded-xl">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Active Events</span>
              <span className="text-lg font-bold text-gray-900 dark:text-white">
                {stats.events?.active || 0} / {stats.events?.total || 0}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
