import { NextRequest, NextResponse } from 'next/server'
import { getAdminUser } from '@/lib/api-helpers'
import { supabase } from '@/lib/supabase'
import { successResponse, errorResponse } from '@/lib/api-helpers'

// Get payment transactions (from transfers with Paystack reference)
export async function GET(request: NextRequest) {
  try {
    const adminUser = await getAdminUser(request)
    if (!adminUser) {
      return errorResponse('Authentication required', 401)
    }

    const searchParams = request.nextUrl.searchParams
    const limit = parseInt(searchParams.get('limit') || '100')
    const offset = parseInt(searchParams.get('offset') || '0')
    const startDate = searchParams.get('start_date') || ''
    const endDate = searchParams.get('end_date') || ''

    // Get transfers that are wallet top-ups (have Paystack reference in message)
    let query = supabase
      .from('transfers')
      .select(`
        *,
        sender:users!transfers_sender_id_fkey(id, first_name, last_name, phone_number)
      `)
      .ilike('message', '%Wallet top-up%')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (startDate) {
      query = query.gte('created_at', startDate)
    }

    if (endDate) {
      query = query.lte('created_at', endDate)
    }

    const { data: transfers, error } = await query

    if (error) {
      return errorResponse('Failed to fetch payments: ' + error.message, 500)
    }

    const payments = transfers?.map((t: any) => {
      // Extract Paystack reference from message
      const referenceMatch = t.message?.match(/Wallet top-up - (.+)/)
      const reference = referenceMatch ? referenceMatch[1] : null

      return {
        id: t.id,
        reference,
        user: t.sender ? {
          id: t.sender.id,
          name: `${t.sender.first_name} ${t.sender.last_name}`,
          phoneNumber: t.sender.phone_number,
        } : null,
        amount: parseFloat(t.amount || '0'),
        amountNaira: parseFloat(t.amount || '0'), // BU = Naira (1:1)
        status: t.status,
        createdAt: t.created_at,
        message: t.message,
      }
    }) || []

    // Get total count
    let countQuery = supabase
      .from('transfers')
      .select('*', { count: 'exact', head: true })
      .ilike('message', '%Wallet top-up%')
    if (startDate) countQuery = countQuery.gte('created_at', startDate)
    if (endDate) countQuery = countQuery.lte('created_at', endDate)
    const { count } = await countQuery

    // Calculate totals
    const totalAmount = payments.reduce((sum, p) => sum + p.amount, 0)
    const completedAmount = payments
      .filter(p => p.status === 'completed')
      .reduce((sum, p) => sum + p.amount, 0)

    return successResponse({
      payments,
      total: count || 0,
      totals: {
        totalAmount,
        completedAmount,
        pendingAmount: totalAmount - completedAmount,
      },
      limit,
      offset,
    })
  } catch (error: any) {
    console.error('Get payments error:', error)
    return errorResponse('Internal server error', 500)
  }
}
