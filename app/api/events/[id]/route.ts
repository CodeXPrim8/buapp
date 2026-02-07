import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { successResponse, errorResponse, getAuthUser } from '@/lib/api-helpers'

// Get event details (auth from JWT cookie, not headers)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const authUser = await getAuthUser(request)
    if (!authUser) {
      return errorResponse('Authentication required. Please log in.', 401)
    }

    const resolvedParams = params instanceof Promise ? await params : params
    const eventId = resolvedParams.id

    if (!eventId) {
      return errorResponse('Event ID is required', 400)
    }

    const userId = authUser.userId

    // Verify user exists in DB to get correct UUID format
    const userResult = await supabase
      .from('users')
      .select('id')
      .eq('id', userId.trim())
      .single()

    if (!userResult.data) {
      return errorResponse('User not found. Please login again.', 401)
    }

    const dbUserId = userResult.data.id
    console.log('Looking up event:', eventId, 'for user:', dbUserId)

    const { data: event, error } = await supabase
      .from('events')
      .select('*')
      .eq('id', eventId)
      .single()

    if (error) {
      console.error('Event lookup error:', error)
      console.error('Error code:', error.code)
      console.error('Error message:', error.message)
      console.error('Event ID:', eventId)
      console.error('User ID:', userId)
      
      // Check if event exists at all
      const { data: eventExists } = await supabase
        .from('events')
        .select('id, celebrant_id')
        .eq('id', eventId)
        .maybeSingle()
      
      if (!eventExists) {
        return errorResponse('Event not found. It may have been deleted.', 404)
      }
      
      return errorResponse('Event not found: ' + error.message, 404)
    }

    if (!event) {
      console.error('Event query returned null. Event ID:', eventId)
      return errorResponse('Event not found', 404)
    }

    console.log('Event found:', event.id, event.name)

    // My Event visibility (non-negotiable): only celebrant OR users who were sent an invite AND have accepted. No one else.
    // Shows & Parties Around Me (is_around_me): any user can view.
    const isCelebrant = event.celebrant_id === dbUserId
    const isAroundMe = event.is_around_me === true

    const { data: userInvite } = await supabase
      .from('invites')
      .select('id, status')
      .eq('event_id', eventId)
      .eq('guest_id', dbUserId)
      .maybeSingle()
    const isInvitedAndAccepted = userInvite?.status === 'accepted'

    if (!isCelebrant && !isAroundMe && !isInvitedAndAccepted) {
      return errorResponse('You do not have access to this event. You must be invited and have accepted to view this event.', 403)
    }

    // Get transfers for this event
    const { data: transfers } = await supabase
      .from('transfers')
      .select(`
        *,
        sender:users!transfers_sender_id_fkey(first_name, last_name, phone_number)
      `)
      .eq('event_id', eventId)
      .order('created_at', { ascending: false })

    const totalBU = transfers?.reduce((sum, t) => sum + parseFloat(t.amount.toString()), 0) || 0

    // Get withdrawals for this event to calculate remaining balance
    const { data: withdrawals } = await supabase
      .from('withdrawals')
      .select('bu_amount')
      .eq('event_id', eventId)

    const totalWithdrawn = withdrawals?.reduce((sum, w) => sum + parseFloat(w.bu_amount.toString()), 0) || 0
    const remainingBalance = totalBU - totalWithdrawn

    // Get invites for this event
    const { data: invites } = await supabase
      .from('invites')
      .select(`
        *,
        guest:users!invites_guest_id_fkey(id, first_name, last_name, phone_number)
      `)
      .eq('event_id', eventId)
      .order('created_at', { ascending: false })

    return successResponse({
      event: {
        ...event,
        total_bu_received: totalBU,
        remaining_balance: remainingBalance,
        total_withdrawn: totalWithdrawn,
      },
      transfers: transfers || [],
      invites: invites || [],
    })
  } catch (error: any) {
    console.error('Get event error:', error)
    return errorResponse('Internal server error', 500)
  }
}
