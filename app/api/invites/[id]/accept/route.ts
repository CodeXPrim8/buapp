import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { successResponse, errorResponse, getAuthUser } from '@/lib/api-helpers'

// Accept an invite
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const authUser = await getAuthUser(request)
    if (!authUser || !authUser.userId) {
      return errorResponse('Authentication required', 401)
    }

    // Handle Next.js 16 async params
    const resolvedParams = params instanceof Promise ? await params : params
    const inviteId = resolvedParams.id

    // Verify user exists in database to get correct UUID format
    const { data: dbUser, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('id', authUser.userId.trim())
      .single()

    let dbUserId = authUser.userId
    let userByPhone: any = null
    if (userError || !dbUser) {
      // Try by phone number as fallback
      const phoneNumber = request.headers.get('x-user-phone')
      if (phoneNumber) {
        const { data: phoneUser } = await supabase
          .from('users')
          .select('id')
          .eq('phone_number', phoneNumber)
          .single()
        
        if (phoneUser) {
          userByPhone = phoneUser
          dbUserId = phoneUser.id
        }
      }
      
      if (!dbUser && !userByPhone) {
        return errorResponse('User not found. Please login again.', 401)
      }
    } else {
      dbUserId = dbUser.id
    }

    // Get invite and verify it belongs to the user - use database user ID
    const { data: invite, error: inviteError } = await supabase
      .from('invites')
      .select('*')
      .eq('id', inviteId)
      .eq('guest_id', dbUserId)
      .single()

    if (inviteError || !invite) {
      return errorResponse('Invite not found or access denied', 404)
    }

    if (invite.status !== 'pending') {
      return errorResponse(`Invite already ${invite.status}`, 400)
    }

    // Get event and guest details for QR code
    const { data: eventData } = await supabase
      .from('events')
      .select('name, date, location')
      .eq('id', invite.event_id)
      .single()

    const { data: guestData } = await supabase
      .from('users')
      .select('first_name, last_name, phone_number')
      .eq('id', dbUserId)
      .single()

    // Generate QR code data for gate entry
    const qrCodeData = {
      invite_id: inviteId,
      event_id: invite.event_id,
      event_name: eventData?.name || 'Event',
      guest_id: dbUserId,
      guest_name: guestData ? `${guestData.first_name} ${guestData.last_name}` : 'Guest',
      guest_phone: guestData?.phone_number || '',
      gate: invite.gate || null,
      seat: invite.seat || null,
      seat_category: invite.seat_category || null,
      status: 'accepted',
      timestamp: new Date().toISOString(),
    }

    // Generate QR code URL
    const qrDataString = JSON.stringify(qrCodeData)
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qrDataString)}`

    const qrCodeDataWithUrl = {
      ...qrCodeData,
      url: qrCodeUrl,
    }

    // Update invite status and store QR code
    const { data: updatedInvite, error: updateError } = await supabase
      .from('invites')
      .update({ 
        status: 'accepted',
        qr_code_data: qrCodeDataWithUrl,
      })
      .eq('id', inviteId)
      .select()
      .single()

    if (updateError) {
      return errorResponse('Failed to accept invite: ' + updateError.message, 500)
    }

    return successResponse({
      invite: updatedInvite,
      message: 'Invite accepted successfully',
    })
  } catch (error: any) {
    console.error('Accept invite error:', error)
    return errorResponse('Internal server error', 500)
  }
}
