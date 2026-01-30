import { NextRequest, NextResponse } from 'next/server'
import { getAdminUser } from '@/lib/api-helpers'
import { supabase } from '@/lib/supabase'
import { successResponse, errorResponse } from '@/lib/api-helpers'

// Get dashboard statistics
export async function GET(request: NextRequest) {
  try {
    const adminUser = await getAdminUser(request)
    
    if (!adminUser) {
      return errorResponse('Authentication required', 401)
    }

    // Get total users by role
    const { data: usersByRole } = await supabase
      .from('users')
      .select('role')
    
    const userCounts = {
      user: 0,
      celebrant: 0,
      vendor: 0,
      both: 0,
      admin: 0,
      super_admin: 0,
      total: 0,
    }

    usersByRole?.forEach((u: any) => {
      userCounts.total++
      if (userCounts[u.role as keyof typeof userCounts] !== undefined) {
        userCounts[u.role as keyof typeof userCounts]++
      }
    })

    // Get total BU in circulation (sum of all wallet balances)
    const { data: wallets } = await supabase
      .from('wallets')
      .select('balance')
    
    const totalBU = wallets?.reduce((sum, w) => sum + parseFloat(w.balance || '0'), 0) || 0

    // Get total transactions
    const { count: totalTransactions } = await supabase
      .from('transfers')
      .select('*', { count: 'exact', head: true })

    // Get active events (not withdrawn, future dates)
    const today = new Date().toISOString().split('T')[0]
    const { count: activeEvents } = await supabase
      .from('events')
      .select('*', { count: 'exact', head: true })
      .eq('withdrawn', false)
      .gte('date', today)

    // Get pending withdrawals
    const { count: pendingWithdrawals } = await supabase
      .from('withdrawals')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending')

    // Get total withdrawals amount
    const { data: withdrawals } = await supabase
      .from('withdrawals')
      .select('naira_amount')
      .eq('status', 'completed')
    
    const totalWithdrawn = withdrawals?.reduce((sum, w) => sum + parseFloat(w.naira_amount?.toString() || '0'), 0) || 0

    // Get recent transactions (last 7 days)
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
    const { count: recentTransactions } = await supabase
      .from('transfers')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', sevenDaysAgo.toISOString())

    // Get total events
    const { count: totalEvents } = await supabase
      .from('events')
      .select('*', { count: 'exact', head: true })

    // Get total gateways
    const { count: totalGateways } = await supabase
      .from('gateways')
      .select('*', { count: 'exact', head: true })

    // Get active gateways
    const { count: activeGateways } = await supabase
      .from('gateways')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'active')

    return successResponse({
      users: {
        total: userCounts.total,
        byRole: {
          user: userCounts.user,
          celebrant: userCounts.celebrant,
          vendor: userCounts.vendor,
          both: userCounts.both,
          admin: userCounts.admin,
          super_admin: userCounts.super_admin,
        },
      },
      bu: {
        totalInCirculation: totalBU,
        totalWithdrawn: totalWithdrawn,
      },
      transactions: {
        total: totalTransactions || 0,
        recent: recentTransactions || 0, // Last 7 days
      },
      events: {
        total: totalEvents || 0,
        active: activeEvents || 0,
      },
      withdrawals: {
        pending: pendingWithdrawals || 0,
        totalCompleted: totalWithdrawn,
      },
      gateways: {
        total: totalGateways || 0,
        active: activeGateways || 0,
      },
    })
  } catch (error: any) {
    console.error('Get stats error:', error)
    return errorResponse('Failed to fetch statistics: ' + error.message, 500)
  }
}
