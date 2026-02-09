import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { successResponse, errorResponse, validateBody, getAuthUser } from '@/lib/api-helpers'
import { getUserByPhone } from '@/lib/auth'
import { debitMainBalance, creditMainBalance } from '@/lib/wallet-balance'
import { sendPushToUser } from '@/lib/push'

// Handle BU transfer from gateway QR scan
export async function POST(request: NextRequest) {
  try {
    const authUser = await getAuthUser(request)
    if (!authUser) {
      return errorResponse('Unauthorized', 401)
    }

    const body = await request.json()
    
    const validation = validateBody(body, {
      gateway_id: (val) => typeof val === 'string' && val.length > 0,
      amount: (val) => typeof val === 'number' && val > 0,
      pin: (val) => typeof val === 'string' && val.length === 4,
    })

    if (!validation.valid) {
      return errorResponse('Validation failed', 400, validation.errors)
    }

    const { gateway_id, amount, message, pin, guest_user_id, guest_name, guest_phone } = body

    // Verify PIN
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('pin_hash')
      .eq('id', authUser.userId)
      .single()

    if (userError || !user) {
      console.error('User lookup error:', userError)
      return errorResponse('User not found', 404)
    }

    if (!user.pin_hash) {
      console.error('User PIN hash missing for user:', authUser.userId)
      return errorResponse('PIN verification failed. Please contact support.', 500)
    }

    try {
      const { verifyPin } = await import('@/lib/auth')
      const pinValid = await verifyPin(pin, user.pin_hash)
      if (!pinValid) {
        console.error('PIN verification failed for user:', authUser.userId)
        return errorResponse('Invalid PIN. Please check and try again.', 401)
      }
    } catch (pinError: any) {
      console.error('PIN verification error:', pinError)
      return errorResponse('PIN verification failed. Please try again.', 500)
    }

    // Get gateway
    const { data: gateway, error: gatewayError } = await supabase
      .from('gateways')
      .select('*')
      .eq('id', gateway_id)
      .eq('status', 'active')
      .single()

    if (gatewayError || !gateway) {
      return errorResponse('Gateway not found or inactive', 404)
    }

    // Get celebrant user
    const celebrant = await getUserByPhone(gateway.celebrant_unique_id)
    if (!celebrant) {
      return errorResponse('Celebrant not found', 404)
    }

    // Get or create event for this gateway
    let { data: event } = await supabase
      .from('events')
      .select('*')
      .eq('gateway_id', gateway_id)
      .single()

    if (!event) {
      const { data: newEvent, error: eventError } = await supabase
        .from('events')
        .insert([{
          celebrant_id: celebrant.id,
          gateway_id: gateway_id,
          name: gateway.event_name,
          date: gateway.event_date,
          location: gateway.event_location,
          total_bu_received: 0,
          withdrawn: false,
          vendor_name: 'Vendor',
        }])
        .select()
        .single()

      if (eventError || !newEvent) {
        return errorResponse('Failed to create event', 500)
      }
      event = newEvent
    }

    // Debit sender and credit receiver
    const debitResult = await debitMainBalance(supabase, authUser.userId, amount)
    if (!debitResult.success) {
      const msg = debitResult.errorMessage === 'Insufficient balance'
        ? `Insufficient balance. You have Ƀ${(debitResult.balanceBefore ?? 0).toLocaleString()}, but need Ƀ${amount.toLocaleString()}`
        : debitResult.errorMessage || 'Failed to deduct from your wallet.'
      return errorResponse(msg, 400)
    }

    const creditResult = await creditMainBalance(supabase, celebrant.id, amount)
    if (!creditResult.success) {
      await creditMainBalance(supabase, authUser.userId, amount)
      return errorResponse(creditResult.errorMessage || 'Failed to credit receiver wallet.', 500)
    }

    // Create transfer
    const { data: transfer, error: transferError } = await supabase
      .from('transfers')
      .insert([{
        sender_id: authUser.userId,
        receiver_id: celebrant.id,
        event_id: event.id,
        gateway_id: gateway_id,
        amount: amount,
        message: message,
        type: 'gateway_qr',
        status: 'completed',
        source: 'gateway_qr_scan',
      }])
      .select()
      .single()

    if (transferError || !transfer) {
      await creditMainBalance(supabase, authUser.userId, amount)
      await debitMainBalance(supabase, celebrant.id, amount)
      return errorResponse('Failed to create transfer', 500)
    }

    // Update event balance
    const currentEventBalance = parseFloat(event.total_bu_received?.toString() || '0')
    const { error: eventUpdateError } = await supabase
      .from('events')
      .update({ total_bu_received: (currentEventBalance + amount).toString() })
      .eq('id', event.id)
    if (eventUpdateError) {
      await creditMainBalance(supabase, authUser.userId, amount)
      await debitMainBalance(supabase, celebrant.id, amount)
      await supabase.from('transfers').delete().eq('id', transfer.id)
      return errorResponse('Failed to update event balance: ' + eventUpdateError.message, 500)
    }

    // Fetch sender details for pending sale and notifications
    const { data: senderUser } = await supabase
      .from('users')
      .select('first_name, last_name, phone_number')
      .eq('id', authUser.userId)
      .single()

    const senderName = senderUser ? `${senderUser.first_name} ${senderUser.last_name}` : 'Guest'
    const senderPhone = senderUser?.phone_number || ''

    // Create pending sale for vendor
    const { data: pendingSale, error: saleError } = await supabase
      .from('vendor_pending_sales')
      .insert([{
        transfer_id: transfer.id,
        gateway_id: gateway_id,
        vendor_id: gateway.vendor_id,
        guest_name: guest_name || senderName,
        guest_phone: guest_phone || senderPhone,
        amount: amount,
        status: 'pending',
      }])
      .select()
      .single()

    if (saleError) {
      console.error('Failed to create pending sale:', saleError)
    }

    // Notification for celebrant
    const celebrantMessage = `You received Ƀ ${amount.toLocaleString()} from ${senderName} via ${gateway.event_name}`
    await supabase
      .from('notifications')
      .insert([{
        user_id: celebrant.id,
        type: 'transfer_received',
        title: 'ɃU Received from Event',
        message: celebrantMessage,
        amount: amount,
        metadata: { transfer_id: transfer.id, gateway_id: gateway_id },
      }])

    // Notification for sender
    const senderMessage = `You sent Ƀ ${amount.toLocaleString()} to ${gateway.event_name}`
    await supabase
      .from('notifications')
      .insert([{
        user_id: authUser.userId,
        type: 'transfer_sent',
        title: 'ɃU Sent',
        message: senderMessage,
        amount: amount,
        metadata: { transfer_id: transfer.id },
      }])

    // Notification for vendor
    const vendorMessage = `Guest ${senderName} sent Ƀ ${amount.toLocaleString()} via gateway QR. Please confirm and issue physical note.`
    await supabase
      .from('notifications')
      .insert([{
        user_id: gateway.vendor_id,
        type: 'transfer_received',
        title: 'New BU Transfer from Guest',
        message: vendorMessage,
        amount: amount,
        metadata: { transfer_id: transfer.id, sale_id: pendingSale?.id },
      }])

    void sendPushToUser(celebrant.id, {
      title: 'ɃU Received from Event',
      body: celebrantMessage,
      data: { url: '/?page=notifications' },
    })
    void sendPushToUser(authUser.userId, {
      title: 'ɃU Sent',
      body: senderMessage,
      data: { url: '/?page=notifications' },
    })
    void sendPushToUser(gateway.vendor_id, {
      title: 'New BU Transfer from Guest',
      body: vendorMessage,
      data: { url: '/?page=notifications' },
    })

    return successResponse({
      transfer,
      message: 'Transfer completed successfully',
    }, 201)
  } catch (error: any) {
    console.error('Gateway QR transfer error:', error)
    return errorResponse(error.message || 'Internal server error', 500)
  }
}
