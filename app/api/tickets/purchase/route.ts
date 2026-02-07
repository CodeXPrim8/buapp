import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { successResponse, errorResponse, getAuthUser } from '@/lib/api-helpers'
import { verifyPin } from '@/lib/auth'

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

  // Get buyer's wallet balance
  const { data: wallet, error: walletError } = await supabase
    .from('wallets')
    .select('balance, naira_balance')
    .eq('user_id', buyerId)
    .single()

  if (walletError || !wallet) {
    return errorResponse('Wallet not found. Please contact support.', 404)
  }

  const buyerBalance = parseFloat(wallet.balance || '0')
  const buyerNaira = parseFloat(wallet.naira_balance || '0')

  if (buyerBalance < totalPrice) {
    return errorResponse(
      `Insufficient balance. You have Ƀ${buyerBalance.toLocaleString()}, but need Ƀ${totalPrice.toLocaleString()}`,
      400
    )
  }

  // 1. Deduct from buyer's wallet (balance + naira_balance for consistency with transfers)
  const buyerNewBalance = parseFloat((buyerBalance - totalPrice).toFixed(2))
  const buyerNewNaira = parseFloat((buyerNaira - totalPrice).toFixed(2))
  const { error: buyerWalletError } = await supabase
    .from('wallets')
    .update({
      balance: buyerNewBalance.toString(),
      naira_balance: buyerNewNaira.toString(),
    })
    .eq('user_id', buyerId)

  if (buyerWalletError) {
    console.error('Buyer wallet update error:', buyerWalletError)
    return errorResponse('Failed to deduct from your wallet. Please try again.', 500)
  }

  // 2. Credit super admin wallet (get or create, then add)
  let { data: superAdminWallet } = await supabase
    .from('wallets')
    .select('balance, naira_balance')
    .eq('user_id', superAdminId)
    .single()

  if (!superAdminWallet) {
    const { data: newWallet, error: createErr } = await supabase
      .from('wallets')
      .insert({
        user_id: superAdminId,
        balance: '0',
        naira_balance: '0',
      })
      .select()
      .single()
    if (createErr || !newWallet) {
      // Refund buyer
      await supabase
        .from('wallets')
        .update({
          balance: buyerBalance.toString(),
          naira_balance: buyerNaira.toString(),
        })
        .eq('user_id', buyerId)
      return errorResponse('Failed to credit ticket payment. Your balance was not charged.', 500)
    }
    superAdminWallet = newWallet
  }

  const superBalance = parseFloat(superAdminWallet.balance || '0')
  const superNaira = parseFloat(superAdminWallet.naira_balance || '0')
  const superNewBalance = parseFloat((superBalance + totalPrice).toFixed(2))
  const superNewNaira = parseFloat((superNaira + totalPrice).toFixed(2))
  const { error: superWalletError } = await supabase
    .from('wallets')
    .update({
      balance: superNewBalance.toString(),
      naira_balance: superNewNaira.toString(),
    })
    .eq('user_id', superAdminId)

  if (superWalletError) {
    console.error('Super admin wallet update error:', superWalletError)
    // Refund buyer
    await supabase
      .from('wallets')
      .update({
        balance: buyerBalance.toString(),
        naira_balance: buyerNaira.toString(),
      })
      .eq('user_id', buyerId)
    return errorResponse('Failed to process payment. Your balance was not charged.', 500)
  }

  // 3. Create transfer record (buyer -> super admin)
  const { data: transfer, error: transferError } = await supabase
    .from('transfers')
    .insert({
      sender_id: buyerId,
      receiver_id: superAdminId,
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
    // Refund buyer and reverse super admin credit
    await supabase
      .from('wallets')
      .update({
        balance: buyerBalance.toString(),
        naira_balance: buyerNaira.toString(),
      })
      .eq('user_id', buyerId)
    await supabase
      .from('wallets')
      .update({
        balance: superBalance.toString(),
        naira_balance: superNaira.toString(),
      })
      .eq('user_id', superAdminId)
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
    await supabase
      .from('wallets')
      .update({
        balance: buyerBalance.toString(),
        naira_balance: buyerNaira.toString(),
      })
      .eq('user_id', buyerId)
    await supabase
      .from('wallets')
      .update({
        balance: superBalance.toString(),
        naira_balance: superNaira.toString(),
      })
      .eq('user_id', superAdminId)
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

  const successMessage = `Transaction successful. Ƀ${totalPrice.toLocaleString()} deducted from your balance. You purchased ${quantity} ticket(s) for ${event.name}.`
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
  }, 201)
}
