import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { successResponse, errorResponse, getAuthUser } from '@/lib/api-helpers'
import { verifyPin } from '@/lib/auth'
import { debitMainBalance, creditMainBalance } from '@/lib/wallet-balance'
import { sendPushToUser } from '@/lib/push'

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
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/5302d33a-07c7-4c7f-8d80-24b4192edc7b', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ location: 'api/tickets/purchase:POST', message: 'user lookup failed, trying phone', data: { authUserId: authUser.userId, hasPhoneHeader: !!phoneNumber }, timestamp: Date.now(), hypothesisId: 'H1' }) }).catch(() => {})
      // #endregion
      if (phoneNumber) {
        const { data: userByPhone } = await supabase
          .from('users')
          .select('id')
          .eq('phone_number', phoneNumber)
          .single()
        
        if (!userByPhone) {
          return errorResponse('User not found. Please login again.', 401)
        }
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/5302d33a-07c7-4c7f-8d80-24b4192edc7b', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ location: 'api/tickets/purchase:POST', message: 'buyerId from phone', data: { buyerId: userByPhone.id, authUserId: authUser.userId }, timestamp: Date.now(), hypothesisId: 'H1' }) }).catch(() => {})
        // #endregion
        return await processTicketPurchase(request, userByPhone.id, authUser)
      }
      return errorResponse('User not found. Please login again.', 401)
    }
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/5302d33a-07c7-4c7f-8d80-24b4192edc7b', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ location: 'api/tickets/purchase:POST', message: 'buyerId from dbUser', data: { buyerId: dbUser.id, authUserId: authUser.userId }, timestamp: Date.now(), hypothesisId: 'H1' }) }).catch(() => {})
    // #endregion
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
  const { event_id, quantity, pin } = body

  if (!event_id || !quantity || quantity < 1) {
    return errorResponse('Event ID and quantity (minimum 1) are required', 400)
  }

  if (typeof pin !== 'string' || pin.length !== 6) {
    return errorResponse('PIN is required (6 digits)', 400)
  }

  // Verify PIN before processing
  const { data: user, error: userError } = await supabase
    .from('users')
    .select('pin_hash')
    .eq('id', buyerId)
    .single()

  if (userError || !user) {
    console.error('User lookup error:', userError)
    return errorResponse('User not found', 404)
  }

  if (!user.pin_hash) {
    return errorResponse('PIN verification failed. Please contact support.', 500)
  }

  try {
    const pinValid = await verifyPin(pin, user.pin_hash)
    if (!pinValid) {
      return errorResponse('Invalid PIN. Please check and try again.', 401)
    }
  } catch (pinError: any) {
    console.error('PIN verification error:', pinError)
    return errorResponse('PIN verification failed. Please try again.', 500)
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

  // Resolve super admin user (ticket revenue goes to super admin wallet)
  const superAdminIdFromEnv = process.env.SUPER_ADMIN_USER_ID?.trim()
  let superAdminId: string | null = null
  if (superAdminIdFromEnv) {
    const { data: u } = await supabase.from('users').select('id').eq('id', superAdminIdFromEnv).single()
    if (u) superAdminId = u.id
  }
  if (!superAdminId) {
    const { data: superAdmin } = await supabase
      .from('users')
      .select('id')
      .eq('role', 'superadmin')
      .limit(1)
      .maybeSingle()
    superAdminId = superAdmin?.id ?? null
  }
  if (!superAdminId) {
    console.error('Super admin user not found (no SUPER_ADMIN_USER_ID env or user with role=superadmin)')
    return errorResponse('Ticket payment recipient not configured. Please contact support.', 500)
  }
  const recipientId = superAdminId
  const isSelfRecipient = recipientId === buyerId

  // 1. Debit BU from buyer's main balance (atomic: subtracts from balance + naira_balance)
  const debitResult = await debitMainBalance(supabase, buyerId, totalPrice)

  if (!debitResult.success) {
    const msg = debitResult.errorMessage === 'Insufficient balance'
      ? `Insufficient balance. You have Ƀ${(debitResult.balanceBefore ?? 0).toLocaleString()}, but need Ƀ${totalPrice.toLocaleString()}`
      : debitResult.errorMessage || 'Failed to deduct from your wallet.'
    return errorResponse(msg, 400)
  }

  const expectedNewBalance = Math.round((debitResult.balanceBefore - totalPrice) * 100) / 100

  // 2. Credit super admin wallet (atomic: creates wallet if missing, then adds BU)
  const creditResult = await creditMainBalance(supabase, recipientId, totalPrice)

  if (!creditResult.success) {
    // Rollback: refund buyer
    await creditMainBalance(supabase, buyerId, totalPrice)
    return errorResponse(
      creditResult.errorMessage || 'Failed to process ticket payment. Your balance was not charged.',
      500
    )
  }

  // 3. Create transfer record (buyer -> super admin)
  const { data: transfer, error: transferError } = await supabase
    .from('transfers')
    .insert({
      sender_id: buyerId,
      receiver_id: recipientId,
      event_id: event_id,
      amount: totalPrice,
      type: 'transfer',
      status: 'completed',
      source: 'direct',
      message: `Ticket purchase: ${quantity} ticket(s) for ${event.name}`,
    })
    .select()
    .single()

  if (transferError || !transfer) {
    console.error('Transfer creation error:', transferError)
    // Rollback: refund buyer, reverse super admin credit
    await creditMainBalance(supabase, buyerId, totalPrice)
    await debitMainBalance(supabase, recipientId, totalPrice)
    return errorResponse('Failed to record payment: ' + (transferError?.message || 'Unknown error'), 500)
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
    // Rollback: refund buyer, reverse super admin credit, remove transfer
    await creditMainBalance(supabase, buyerId, totalPrice)
    await debitMainBalance(supabase, recipientId, totalPrice)
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

  const buyerNotificationMessage = `You successfully purchased ${quantity} ticket(s) for ${event.name}`
  await supabase.from('notifications').insert({
    user_id: buyerId,
    type: 'ticket_purchased',
    title: 'Tickets Purchased',
    message: buyerNotificationMessage,
    amount: totalPrice,
    metadata: {
      event_id: event_id,
      ticket_id: ticket.id,
      quantity: quantity,
    },
  })

  void sendPushToUser(buyerId, {
    title: 'Tickets Purchased',
    body: buyerNotificationMessage,
    data: { url: '/?page=notifications' },
  })

  if (recipientId !== buyerId) {
    const buyerName = buyer ? `${buyer.first_name} ${buyer.last_name}` : 'A user'
    const recipientMessage = `${buyerName} bought ${quantity} ticket(s) for ${event.name}.`
    await supabase.from('notifications').insert({
      user_id: recipientId,
      type: 'transfer_received',
      title: 'Ticket Purchase',
      message: recipientMessage,
      amount: totalPrice,
      metadata: {
        transfer_id: transfer.id,
        event_id: event_id,
        from_user_name: buyerName,
      },
    })
    void sendPushToUser(recipientId, {
      title: 'Ticket Purchase',
      body: recipientMessage,
      data: { url: '/?page=notifications' },
    })
  }

  // Use computed post-debit balance; post-SELECT can be stale (replica/connection). Logs showed SELECT returned pre-debit value.
  const newBalanceForClient = isSelfRecipient ? debitResult.balanceBefore : expectedNewBalance
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/5302d33a-07c7-4c7f-8d80-24b4192edc7b', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ location: 'api/tickets/purchase:response', message: 'new_balance returned (computed)', data: { buyerId, newBalanceForClient, balanceBefore: debitResult.balanceBefore, totalPrice, runId: 'post-fix' }, timestamp: Date.now(), hypothesisId: 'H2' }) }).catch(() => {})
  // #endregion

  const successMessage = isSelfRecipient
    ? `Transaction successful. You purchased ${quantity} ticket(s) for ${event.name}.`
    : `Transaction successful. Ƀ${totalPrice.toLocaleString()} deducted from your balance. You purchased ${quantity} ticket(s) for ${event.name}.`
  return successResponse({
    ticket: {
      ...ticket,
      qr_code_data: {
        ...qrCodeData,
        ticket_id: ticket.id,
      },
    },
    transfer: transfer,
    message: successMessage,
    new_balance: newBalanceForClient,
  }, 201)
}
