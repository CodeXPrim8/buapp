import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { successResponse, errorResponse, getAuthUser } from '@/lib/api-helpers'

// Purchase tickets for an event
export async function POST(request: NextRequest) {
  try {
    const authUser = await getAuthUser(request)
    if (!authUser || !authUser.userId) {
      return errorResponse('Authentication required', 401)
    }

    // Verify user exists in database
    const { data: dbUser, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('id', authUser.userId.trim())
      .single()

    if (userError || !dbUser) {
      const phoneNumber = request.headers.get('x-user-phone')
      if (phoneNumber) {
        const { data: userByPhone } = await supabase
          .from('users')
          .select('id')
          .eq('phone_number', phoneNumber)
          .single()
        
        if (!userByPhone) {
          return errorResponse('User not found. Please login again.', 401)
        }
        
        // Continue with purchase using userByPhone.id
        return await processTicketPurchase(request, userByPhone.id, authUser)
      }
      return errorResponse('User not found. Please login again.', 401)
    }

    return await processTicketPurchase(request, dbUser.id, authUser)
  } catch (error: any) {
    console.error('Purchase ticket error:', error)
    return errorResponse('Internal server error: ' + error.message, 500)
  }
}

async function processTicketPurchase(
  request: NextRequest,
  buyerId: string,
  authUser: { userId: string; role: string }
) {
  const body = await request.json()
  const { event_id, quantity } = body

  if (!event_id || !quantity || quantity < 1) {
    return errorResponse('Event ID and quantity (minimum 1) are required', 400)
  }

  // Get event details
  const { data: event, error: eventError } = await supabase
    .from('events')
    .select('*')
    .eq('id', event_id)
    .single()

  if (eventError || !event) {
    return errorResponse('Event not found', 404)
  }

  // Check if tickets are enabled
  if (!event.tickets_enabled) {
    return errorResponse('Tickets are not available for this event', 400)
  }

  // Check if event is public (for public ticket sales)
  if (!event.is_public) {
    return errorResponse('This event is not open for public ticket sales', 403)
  }

  // Check ticket availability
  const ticketsAvailable = event.max_tickets 
    ? event.max_tickets - (event.tickets_sold || 0)
    : null

  if (ticketsAvailable !== null && quantity > ticketsAvailable) {
    return errorResponse(
      `Only ${ticketsAvailable} ticket(s) available. You requested ${quantity}.`,
      400
    )
  }

  // Check ticket price
  if (!event.ticket_price_bu || event.ticket_price_bu <= 0) {
    return errorResponse('Ticket price not set for this event', 400)
  }

  const totalPrice = parseFloat((event.ticket_price_bu * quantity).toFixed(2))

  // Get buyer's wallet balance
  const { data: wallet, error: walletError } = await supabase
    .from('wallets')
    .select('balance')
    .eq('user_id', buyerId)
    .single()

  if (walletError || !wallet) {
    return errorResponse('Wallet not found. Please contact support.', 404)
  }

  const balance = parseFloat(wallet.balance || '0')

  if (balance < totalPrice) {
    return errorResponse(
      `Insufficient balance. You have Ƀ${balance.toLocaleString()}, but need Ƀ${totalPrice.toLocaleString()}`,
      400
    )
  }

  // Start transaction: Create transfer, update wallet, create ticket, update event
  // Create transfer from buyer to event celebrant
  const { data: transfer, error: transferError } = await supabase
    .from('transfers')
    .insert({
      sender_id: buyerId,
      receiver_id: event.celebrant_id,
      event_id: event_id,
      amount: totalPrice,
      type: 'transfer', // Use 'transfer' type as it's allowed in schema
      status: 'completed',
      source: 'direct',
      message: `Ticket purchase: ${quantity} ticket(s) for ${event.name}`,
    })
    .select()
    .single()

  if (transferError || !transfer) {
    console.error('Transfer creation error:', transferError)
    return errorResponse('Failed to process payment: ' + transferError?.message, 500)
  }

  // Update buyer's wallet (deduct)
  const { error: buyerWalletError } = await supabase
    .from('wallets')
    .update({ balance: (balance - totalPrice).toFixed(2) })
    .eq('user_id', buyerId)

  if (buyerWalletError) {
    console.error('Buyer wallet update error:', buyerWalletError)
    // Try to rollback transfer
    await supabase.from('transfers').delete().eq('id', transfer.id)
    return errorResponse('Failed to deduct from wallet', 500)
  }

  // Update celebrant's wallet (add)
  const { data: celebrantWallet } = await supabase
    .from('wallets')
    .select('balance')
    .eq('user_id', event.celebrant_id)
    .single()

  if (celebrantWallet) {
    const celebrantBalance = parseFloat(celebrantWallet.balance || '0')
    await supabase
      .from('wallets')
      .update({ balance: (celebrantBalance + totalPrice).toFixed(2) })
      .eq('user_id', event.celebrant_id)
  } else {
    // Create wallet if doesn't exist
    await supabase
      .from('wallets')
      .insert({
        user_id: event.celebrant_id,
        balance: totalPrice.toFixed(2),
      })
  }

  // Create ticket record
  const qrCodeData = {
    ticket_id: null, // Will be set after ticket creation
    event_id: event_id,
    event_name: event.name,
    buyer_id: buyerId,
    quantity: quantity,
    purchase_date: new Date().toISOString(),
  }

  const { data: ticket, error: ticketError } = await supabase
    .from('tickets')
    .insert({
      event_id: event_id,
      buyer_id: buyerId,
      quantity: quantity,
      total_price_bu: totalPrice,
      transfer_id: transfer.id,
      status: 'confirmed',
      qr_code_data: {
        ...qrCodeData,
        ticket_id: null, // Will update after creation
      },
    })
    .select()
    .single()

  if (ticketError || !ticket) {
    console.error('Ticket creation error:', ticketError)
    // Rollback: refund buyer, remove transfer
    await supabase.from('wallets').update({ balance: balance.toFixed(2) }).eq('user_id', buyerId)
    await supabase.from('transfers').delete().eq('id', transfer.id)
    return errorResponse('Failed to create ticket: ' + ticketError?.message, 500)
  }

  // Update ticket QR code with ticket ID
  await supabase
    .from('tickets')
    .update({
      qr_code_data: {
        ...qrCodeData,
        ticket_id: ticket.id,
      },
    })
    .eq('id', ticket.id)

  // Update event tickets_sold count
  const newTicketsSold = (event.tickets_sold || 0) + quantity
  await supabase
    .from('events')
    .update({ tickets_sold: newTicketsSold })
    .eq('id', event_id)

  // Update event total_bu_received
  const newTotalBU = parseFloat((parseFloat(event.total_bu_received || '0') + totalPrice).toFixed(2))
  await supabase
    .from('events')
    .update({ total_bu_received: newTotalBU })
    .eq('id', event_id)

  // Create notification for buyer
  const { data: buyer } = await supabase
    .from('users')
    .select('first_name, last_name')
    .eq('id', buyerId)
    .single()

  await supabase.from('notifications').insert({
    user_id: buyerId,
    type: 'ticket_purchased',
    title: 'Tickets Purchased',
    message: `You successfully purchased ${quantity} ticket(s) for ${event.name}`,
    metadata: {
      event_id: event_id,
      ticket_id: ticket.id,
      quantity: quantity,
    },
  })

  return successResponse({
    ticket: {
      ...ticket,
      qr_code_data: {
        ...qrCodeData,
        ticket_id: ticket.id,
      },
    },
    transfer: transfer,
    message: `Successfully purchased ${quantity} ticket(s)`,
  }, 201)
}
