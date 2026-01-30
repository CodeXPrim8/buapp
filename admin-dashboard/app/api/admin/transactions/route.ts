import { NextRequest, NextResponse } from 'next/server'
import { getAdminUser } from '@/lib/api-helpers'
import { supabase } from '@/lib/supabase'
import { successResponse, errorResponse } from '@/lib/api-helpers'

// Get all transactions
export async function GET(request: NextRequest) {
  try {
    const adminUser = await getAdminUser(request)
    if (!adminUser) {
      return errorResponse('Authentication required', 401)
    }

    const searchParams = request.nextUrl.searchParams
    const type = searchParams.get('type') || ''
    const status = searchParams.get('status') || ''
    const limit = parseInt(searchParams.get('limit') || '100')
    const offset = parseInt(searchParams.get('offset') || '0')
    const startDate = searchParams.get('start_date') || ''
    const endDate = searchParams.get('end_date') || ''

    let query = supabase
      .from('transfers')
      .select(`
        *,
        sender:users!transfers_sender_id_fkey(id, first_name, last_name, phone_number),
        receiver:users!transfers_receiver_id_fkey(id, first_name, last_name, phone_number),
        event:events(id, name)
      `)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (type) {
      query = query.eq('type', type)
    }

    if (status) {
      query = query.eq('status', status)
    }

    if (startDate) {
      query = query.gte('created_at', startDate)
    }

    if (endDate) {
      query = query.lte('created_at', endDate)
    }

    const { data: transfers, error } = await query

    if (error) {
      return errorResponse('Failed to fetch transactions: ' + error.message, 500)
    }

    const formattedTransactions = transfers?.map((t: any) => ({
      id: t.id,
      sender: t.sender ? {
        id: t.sender.id,
        name: `${t.sender.first_name} ${t.sender.last_name}`,
        phoneNumber: t.sender.phone_number,
      } : null,
      receiver: t.receiver ? {
        id: t.receiver.id,
        name: `${t.receiver.first_name} ${t.receiver.last_name}`,
        phoneNumber: t.receiver.phone_number,
      } : null,
      event: t.event ? {
        id: t.event.id,
        name: t.event.name,
      } : null,
      amount: parseFloat(t.amount || '0'),
      type: t.type,
      status: t.status,
      message: t.message,
      source: t.source,
      createdAt: t.created_at,
    })) || []

    // Get total count
    let countQuery = supabase.from('transfers').select('*', { count: 'exact', head: true })
    if (type) countQuery = countQuery.eq('type', type)
    if (status) countQuery = countQuery.eq('status', status)
    if (startDate) countQuery = countQuery.gte('created_at', startDate)
    if (endDate) countQuery = countQuery.lte('created_at', endDate)
    const { count } = await countQuery

    return successResponse({
      transactions: formattedTransactions,
      total: count || 0,
      limit,
      offset,
    })
  } catch (error: any) {
    console.error('Get transactions error:', error)
    return errorResponse('Internal server error', 500)
  }
}
