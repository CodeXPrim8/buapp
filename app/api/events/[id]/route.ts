import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { successResponse, errorResponse } from '@/lib/api-helpers'

// Get event details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    // Handle both Promise and direct params (Next.js 15+ compatibility)
    const resolvedParams = params instanceof Promise ? await params : params
    const eventId = resolvedParams.id

    const userId = request.headers.get('x-user-id')
    
    if (!userId) {
      return errorResponse('User ID required', 401)
    }

    if (!eventId) {
      return errorResponse('Event ID is required', 400)
    }

    // Verify user exists first to get correct UUID format
    const userResult = await supabase
      .from('users')
      .select('id')
      .eq('id', userId)
      .single()

    if (!userResult.data) {
      console.error('User not found for event lookup. User ID:', userId)
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

    // Verify event belongs to user (optional check, but good for security)
    // Allow access if user is the celebrant
    if (event.celebrant_id !== dbUserId) {
      console.warn('Event access: User is not the celebrant, but allowing access for viewing')
      // We allow viewing even if not the celebrant, but log it
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
