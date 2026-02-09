import { NextRequest, NextResponse } from 'next/server'
import { getAdminUser } from '@/lib/api-helpers'
import { supabase } from '@/lib/supabase'
import { successResponse, errorResponse } from '@/lib/api-helpers'

// PATCH: Update "Shows & Parties Around Me" event (super admin only) — e.g. update max_tickets
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const adminUser = await getAdminUser(request)
    if (!adminUser) {
      return errorResponse('Authentication required', 401)
    }
    const role = adminUser.role
    if (role !== 'superadmin' && role !== 'super_admin' && role !== 'admin') {
      return errorResponse('Only super admin can edit Shows & Parties Around Me', 403)
    }

    const { id: eventId } = await params
    if (!eventId) {
      return errorResponse('Event ID is required', 400)
    }

    const body = await request.json()
    const {
      name,
      date,
      location,
      city,
      state,
      category,
      description,
      ticket_price_bu,
      max_tickets,
    } = body

    const { data: event, error: fetchError } = await supabase
      .from('events')
      .select('id, is_around_me, tickets_sold, max_tickets')
      .eq('id', eventId)
      .single()

    if (fetchError || !event) {
      return errorResponse('Event not found', 404)
    }
    if (!event.is_around_me) {
      return errorResponse('Only Shows & Parties Around Me events can be edited here', 403)
    }

    const ticketsSold = Number(event.tickets_sold ?? 0)
    const updates: Record<string, unknown> = {}

    if (max_tickets !== undefined && max_tickets !== null) {
      const newMax = parseInt(String(max_tickets), 10)
      if (isNaN(newMax) || newMax < 0) {
        return errorResponse('Max tickets must be a non-negative number', 400)
      }
      if (newMax > 0 && newMax < ticketsSold) {
        return errorResponse(
          `Max tickets cannot be less than already sold (${ticketsSold}). Set to at least ${ticketsSold}.`,
          400
        )
      }
      updates.max_tickets = newMax === 0 ? null : newMax
    }
    if (name !== undefined && typeof name === 'string' && name.trim()) {
      updates.name = name.trim().substring(0, 200)
    }
    if (date !== undefined && typeof date === 'string' && date.trim()) {
      updates.date = date.trim()
    }
    if (location !== undefined) {
      updates.location = location ? String(location).trim().substring(0, 500) : null
    }
    if (city !== undefined && typeof city === 'string' && city.trim()) {
      updates.city = city.trim().substring(0, 100)
    }
    if (state !== undefined) {
      updates.state = state ? String(state).trim().substring(0, 100) : null
    }
    if (category !== undefined) {
      updates.category = category ? String(category).trim().substring(0, 100) : null
    }
    if (description !== undefined) {
      updates.description = description ? String(description).trim().substring(0, 2000) : null
    }
    if (ticket_price_bu !== undefined && ticket_price_bu !== null) {
      const price = parseFloat(String(ticket_price_bu))
      if (!isNaN(price) && price >= 0) {
        updates.ticket_price_bu = price
      }
    }

    if (Object.keys(updates).length === 0) {
      return errorResponse('No valid fields to update', 400)
    }

    const { data: updated, error: updateError } = await supabase
      .from('events')
      .update(updates)
      .eq('id', eventId)
      .select()
      .single()

    if (updateError) {
      console.error('Update event error:', updateError)
      return errorResponse('Failed to update event: ' + updateError.message, 500)
    }

    return successResponse({ event: updated })
  } catch (error: any) {
    console.error('PATCH event error:', error)
    return errorResponse(error?.message || 'Internal server error', 500)
  }
}
