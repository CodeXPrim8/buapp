import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { successResponse, errorResponse, getAuthUser } from '@/lib/api-helpers'

// Validate invite QR code (for vendors scanning guest invites)
export async function POST(request: NextRequest) {
  try {
    const authUser = await getAuthUser(request)
    if (!authUser || authUser.role !== 'vendor' && authUser.role !== 'both') {
      return errorResponse('Unauthorized. Only vendors can validate invites.', 401)
    }

    const body = await request.json()
    const { qr_data } = body

    if (!qr_data) {
      return errorResponse('QR code data is required', 400)
    }

    // Parse QR code data (it should be a JSON string)
    let qrCodeData: any
    try {
      qrCodeData = typeof qr_data === 'string' ? JSON.parse(qr_data) : qr_data
    } catch (e) {
      return errorResponse('Invalid QR code format', 400)
    }

    const { invite_id, event_id, guest_id, status } = qrCodeData

    if (!invite_id || !event_id || !guest_id) {
      return errorResponse('Invalid QR code: missing required fields', 400)
    }

    // Verify user exists in database
    const { data: dbUser } = await supabase
      .from('users')
      .select('id')
      .eq('id', authUser.userId.trim())
      .single()

    if (!dbUser) {
      return errorResponse('User not found. Please login again.', 401)
    }

    // Get the invite from database
    const { data: invite, error: inviteError } = await supabase
      .from('invites')
      .select(`
        *,
        event:events(id, name, date, location, celebrant_id),
        guest:users!invites_guest_id_fkey(id, first_name, last_name, phone_number)
      `)
      .eq('id', invite_id)
      .single()

    if (inviteError || !invite) {
      return errorResponse('Invite not found', 404)
    }

    // Use event_id from invite if not provided in QR code
    const actualEventId = event_id || invite.event_id

    // Verify invite belongs to the event in QR code (if event_id is provided in QR)
    if (event_id && invite.event_id !== event_id) {
      return errorResponse('QR code does not match invite event', 400)
    }

    // Verify invite is accepted
    if (invite.status !== 'accepted') {
      return errorResponse(`Invite is ${invite.status}. Only accepted invites can be used for entry.`, 400)
    }

    // Verify vendor is linked to this event via a gateway
    const { data: gateway, error: gatewayError } = await supabase
      .from('gateways')
      .select('id, event_id, vendor_id, status')
      .eq('event_id', actualEventId)
      .eq('vendor_id', dbUser.id)
      .eq('status', 'active')
      .single()

    if (gatewayError || !gateway) {
      return errorResponse('You are not authorized to validate invites for this event. Please link your gateway to this event first.', 403)
    }

    // Check if invite has already been used (optional: add a scanned_at field)
    // For now, we'll just return success if invite is valid and accepted

    return successResponse({
      valid: true,
      invite: {
        id: invite.id,
        event_name: invite.event?.name || 'Event',
        event_date: invite.event?.date || '',
        event_location: invite.event?.location || '',
        guest_name: invite.guest ? `${invite.guest.first_name} ${invite.guest.last_name}` : invite.guest_name,
        guest_phone: invite.guest?.phone_number || invite.guest_phone,
        gate: invite.gate || null,
        seat: invite.seat || null,
        seat_category: invite.seat_category || null,
        status: invite.status,
      },
      message: 'Invite validated successfully. Guest can enter.',
    })
  } catch (error: any) {
    console.error('Validate invite error:', error)
    return errorResponse('Internal server error: ' + error.message, 500)
  }
}
