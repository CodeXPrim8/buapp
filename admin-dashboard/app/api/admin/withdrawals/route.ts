import { NextRequest, NextResponse } from 'next/server'
import { getAdminUser } from '@/lib/api-helpers'
import { supabase } from '@/lib/supabase'
import { successResponse, errorResponse } from '@/lib/api-helpers'

// Get all withdrawals
export async function GET(request: NextRequest) {
  try {
    const adminUser = await getAdminUser(request)
    if (!adminUser) {
      return errorResponse('Authentication required', 401)
    }

    const searchParams = request.nextUrl.searchParams
    const status = searchParams.get('status') || ''
    const limit = parseInt(searchParams.get('limit') || '100')
    const offset = parseInt(searchParams.get('offset') || '0')

    let query = supabase
      .from('withdrawals')
      .select(`
        *,
        user:users!withdrawals_user_id_fkey(id, first_name, last_name, phone_number),
        event:events(id, name)
      `)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (status) {
      query = query.eq('status', status)
    }

    const { data: withdrawals, error } = await query

    if (error) {
      return errorResponse('Failed to fetch withdrawals: ' + error.message, 500)
    }

    const formattedWithdrawals = withdrawals?.map((w: any) => ({
      id: w.id,
      user: w.user ? {
        id: w.user.id,
        name: `${w.user.first_name} ${w.user.last_name}`,
        phoneNumber: w.user.phone_number,
      } : null,
      event: w.event ? {
        id: w.event.id,
        name: w.event.name,
      } : null,
      buAmount: parseFloat(w.bu_amount || '0'),
      nairaAmount: parseFloat(w.naira_amount || '0'),
      type: w.type,
      bankName: w.bank_name,
      accountNumber: w.account_number,
      accountName: w.account_name,
      walletAddress: w.wallet_address,
      status: w.status,
      createdAt: w.created_at,
      completedAt: w.completed_at,
    })) || []

    // Get total count
    let countQuery = supabase.from('withdrawals').select('*', { count: 'exact', head: true })
    if (status) countQuery = countQuery.eq('status', status)
    const { count } = await countQuery

    return successResponse({
      withdrawals: formattedWithdrawals,
      total: count || 0,
      limit,
      offset,
    })
  } catch (error: any) {
    console.error('Get withdrawals error:', error)
    return errorResponse('Internal server error', 500)
  }
}
