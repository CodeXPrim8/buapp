import { NextRequest, NextResponse } from 'next/server'
import { getAdminUser } from '@/lib/api-helpers'
import { supabase } from '@/lib/supabase'
import { successResponse, errorResponse } from '@/lib/api-helpers'

// Get all events
export async function GET(request: NextRequest) {
  try {
    const adminUser = await getAdminUser(request)
    if (!adminUser) {
      return errorResponse('Authentication required', 401)
    }

    const searchParams = request.nextUrl.searchParams
    const search = searchParams.get('search') || ''
    const aroundMe = searchParams.get('around_me') === 'true'
    const limit = parseInt(searchParams.get('limit') || '100')
    const offset = parseInt(searchParams.get('offset') || '0')

    let query = supabase
      .from('events')
      .select(`
        *,
        celebrant:users!events_celebrant_id_fkey(id, first_name, last_name, phone_number)
      `)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (search) {
      query = query.ilike('name', `%${search}%`)
    }
    if (aroundMe) {
      query = query.eq('is_around_me', true)
    }

    const { data: events, error } = await query

    if (error) {
      return errorResponse('Failed to fetch events: ' + error.message, 500)
    }

    // Calculate total BU received from transfers for each event
    const eventsWithTotals = await Promise.all(
      (events || []).map(async (event) => {
        const { data: transfers } = await supabase
          .from('transfers')
          .select('amount')
          .eq('event_id', event.id)
          .eq('status', 'completed')

        const totalBU = transfers?.reduce((sum, t) => sum + parseFloat(t.amount.toString()), 0) || 0

        return {
          id: event.id,
          name: event.name,
          date: event.date,
          location: event.location,
          city: event.city,
          state: event.state,
          is_around_me: event.is_around_me,
          max_tickets: event.max_tickets,
          tickets_sold: event.tickets_sold ?? 0,
          ticket_price_bu: event.ticket_price_bu,
          category: event.category,
          description: event.description,
          celebrant: event.celebrant ? {
            id: event.celebrant.id,
            name: `${event.celebrant.first_name} ${event.celebrant.last_name}`,
            phoneNumber: event.celebrant.phone_number,
          } : null,
          totalBUReceived: totalBU,
          withdrawn: event.withdrawn,
          createdAt: event.created_at,
        }
      })
    )

    // Get total count
    let countQuery = supabase.from('events').select('*', { count: 'exact', head: true })
    if (search) countQuery = countQuery.ilike('name', `%${search}%`)
    if (aroundMe) countQuery = countQuery.eq('is_around_me', true)
    const { count } = await countQuery

    return successResponse({
      events: eventsWithTotals,
      total: count || 0,
      limit,
      offset,
    })
  } catch (error: any) {
    console.error('Get events error:', error)
    return errorResponse('Internal server error', 500)
  }
}
