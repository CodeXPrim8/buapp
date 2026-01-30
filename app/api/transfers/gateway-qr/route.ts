import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { successResponse, errorResponse, validateBody, getAuthUser } from '@/lib/api-helpers'
import { getUserByPhone } from '@/lib/auth'

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

    // Get sender wallet
    const { data: senderWallet, error: senderWalletError } = await supabase
      .from('wallets')
      .select('*')
      .eq('user_id', authUser.userId)
      .single()

    if (senderWalletError || !senderWallet) {
      return errorResponse('Sender wallet not found', 404)
    }

    // Check balance (convert to number for comparison)
    const senderBalance = parseFloat(senderWallet.balance || '0')
    if (senderBalance < amount) {
      return errorResponse('Insufficient balance', 400)
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
      return errorResponse('Failed to create transfer', 500)
    }

    // Update sender wallet balance
    const newSenderBalance = senderBalance - amount
    await supabase
      .from('wallets')
      .update({ 
        balance: newSenderBalance.toString(),
        naira_balance: newSenderBalance.toString(),
      })
      .eq('user_id', authUser.userId)

    // Get or create receiver wallet
    let { data: receiverWallet } = await supabase
      .from('wallets')
      .select('*')
      .eq('user_id', celebrant.id)
      .single()

    const receiverBalance = receiverWallet ? parseFloat(receiverWallet.balance || '0') : 0
    const newReceiverBalance = receiverBalance + amount

    if (!receiverWallet) {
      await supabase
        .from('wallets')
        .insert([{
          user_id: celebrant.id,
          balance: newReceiverBalance.toString(),
          naira_balance: newReceiverBalance.toString(),
        }])
    } else {
      await supabase
        .from('wallets')
        .update({
          balance: newReceiverBalance.toString(),
          naira_balance: newReceiverBalance.toString(),
        })
        .eq('user_id', celebrant.id)
    }

    // Update event balance
    const currentEventBalance = parseFloat(event.total_bu_received?.toString() || '0')
    await supabase
      .from('events')
      .update({ total_bu_received: (currentEventBalance + amount).toString() })
      .eq('id', event.id)

    // Create pending sale for vendor
    const { data: pendingSale, error: saleError } = await supabase
      .from('vendor_pending_sales')
      .insert([{
        transfer_id: transfer.id,
        gateway_id: gateway_id,
        vendor_id: gateway.vendor_id,
        guest_name: guest_name || senderName,
        guest_phone: guest_phone || senderUser?.phone_number || '',
        amount: amount,
        status: 'pending',
      }])
      .select()
      .single()

    // Create notifications
    const { data: senderUser } = await supabase
      .from('users')
      .select('first_name, last_name, phone_number')
      .eq('id', authUser.userId)
      .single()

    const senderName = senderUser ? `${senderUser.first_name} ${senderUser.last_name}` : 'Guest'

    // Notification for celebrant
    await supabase
      .from('notifications')
      .insert([{
        user_id: celebrant.id,
        type: 'transfer_received',
        title: 'ɃU Received from Event',
        message: `You received Ƀ ${amount.toLocaleString()} from ${senderName} via ${gateway.event_name}`,
        amount: amount,
        metadata: { transfer_id: transfer.id, gateway_id: gateway_id },
      }])

    // Notification for sender
    await supabase
      .from('notifications')
      .insert([{
        user_id: authUser.userId,
        type: 'transfer_sent',
        title: 'ɃU Sent',
        message: `You sent Ƀ ${amount.toLocaleString()} to ${gateway.event_name}`,
        amount: amount,
        metadata: { transfer_id: transfer.id },
      }])

    // Notification for vendor
    await supabase
      .from('notifications')
      .insert([{
        user_id: gateway.vendor_id,
        type: 'transfer_received',
        title: 'New BU Transfer from Guest',
        message: `Guest ${senderName} sent Ƀ ${amount.toLocaleString()} via gateway QR. Please confirm and issue physical note.`,
        amount: amount,
        metadata: { transfer_id: transfer.id, sale_id: pendingSale?.id },
      }])

    return successResponse({
      transfer,
      message: 'Transfer completed successfully',
    }, 201)
  } catch (error: any) {
    console.error('Gateway QR transfer error:', error)
    return errorResponse(error.message || 'Internal server error', 500)
  }
}
