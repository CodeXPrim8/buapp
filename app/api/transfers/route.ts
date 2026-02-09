import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { successResponse, errorResponse, validateBody } from '@/lib/api-helpers'
import { verifyPin } from '@/lib/auth'
import { withCSRFProtection } from '@/lib/api-middleware'
import { sendPushToUser } from '@/lib/push'

// Create direct transfer between users
export const POST = withCSRFProtection(async function POST(request: NextRequest) {
  try {
    // Verify authentication using JWT
    const { getAuthUser } = await import('@/lib/api-helpers')
    const { rateLimiters } = await import('@/lib/rate-limit')
    
    const authUser = await getAuthUser(request)
    
    if (!authUser) {
      return errorResponse('Authentication required', 401)
    }

    // Apply rate limiting
    const rateLimitResult = await rateLimiters.transfer(request)
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: 'Too many transfer requests. Please try again later.',
          retryAfter: Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000),
        },
        {
          status: 429,
          headers: {
            'Retry-After': String(Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000)),
            'X-RateLimit-Limit': '10',
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': String(rateLimitResult.resetTime),
          },
        }
      )
    }

    const senderId = authUser.userId

    const body = await request.json()
    const validation = validateBody(body, {
      receiver_id: (val) => typeof val === 'string' && val.length > 0,
      amount: (val) => typeof val === 'number' && val > 0,
      pin: (val) => typeof val === 'string' && val.length === 6, // Updated to 6 digits
    })

    if (!validation.valid) {
      return errorResponse('Validation failed', 400, validation.errors)
    }

    const { receiver_id, amount, message, pin, type = 'transfer' } = body

    // Verify PIN
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('pin_hash')
      .eq('id', senderId)
      .single()

    if (userError || !user) {
      console.error('User lookup error:', userError)
      return errorResponse('User not found', 404)
    }

    if (!user.pin_hash) {
      console.error('User PIN hash missing for user:', senderId)
      return errorResponse('PIN verification failed. Please contact support.', 500)
    }

    try {
      const pinValid = await verifyPin(pin, user.pin_hash)
      if (!pinValid) {
        console.error('PIN verification failed for user:', senderId)
        return errorResponse('Invalid PIN. Please check and try again.', 401)
      }
    } catch (pinError: any) {
      console.error('PIN verification error:', pinError)
      return errorResponse('PIN verification failed. Please try again.', 500)
    }

    // Check sender wallet balance
    const { data: senderWallet, error: walletError } = await supabase
      .from('wallets')
      .select('balance')
      .eq('user_id', senderId)
      .single()

    if (walletError || !senderWallet) {
      return errorResponse('Sender wallet not found', 404)
    }

    if (parseFloat(senderWallet.balance) < amount) {
      return errorResponse('Insufficient balance', 400)
    }

    // Get receiver wallet (create if doesn't exist)
    let { data: receiverWallet } = await supabase
      .from('wallets')
      .select('*')
      .eq('user_id', receiver_id)
      .single()

    if (!receiverWallet) {
      const { data: newWallet, error: createError } = await supabase
        .from('wallets')
        .insert([{
          user_id: receiver_id,
          balance: 0,
          naira_balance: 0,
        }])
        .select()
        .single()

      if (createError) {
        return errorResponse('Failed to create receiver wallet', 500)
      }
      receiverWallet = newWallet
    }

    // Start transaction: Update both wallets and create transfer record
    const senderNewBalance = parseFloat(senderWallet.balance) - amount
    const receiverNewBalance = parseFloat(receiverWallet.balance) + amount

    // Update sender wallet
    const { error: senderUpdateError } = await supabase
      .from('wallets')
      .update({
        balance: senderNewBalance.toString(),
        naira_balance: senderNewBalance.toString(),
      })
      .eq('user_id', senderId)

    if (senderUpdateError) {
      return errorResponse('Failed to update sender wallet', 500)
    }

    // Update receiver wallet
    const { error: receiverUpdateError } = await supabase
      .from('wallets')
      .update({
        balance: receiverNewBalance.toString(),
        naira_balance: receiverNewBalance.toString(),
      })
      .eq('user_id', receiver_id)

    if (receiverUpdateError) {
      // Rollback sender wallet
      await supabase
        .from('wallets')
        .update({
          balance: senderWallet.balance,
          naira_balance: senderWallet.balance,
        })
        .eq('user_id', senderId)
      return errorResponse('Failed to update receiver wallet', 500)
    }

    // Create transfer record
    const { data: transfer, error: transferError } = await supabase
      .from('transfers')
      .insert([{
        sender_id: senderId,
        receiver_id: receiver_id,
        amount: amount,
        message: message || null,
        type: type,
        status: 'completed',
      }])
      .select()
      .single()

    if (transferError) {
      console.error('Failed to create transfer record:', transferError)
      // Don't fail the request, wallets are already updated
    }

    // Create notifications
    const { data: senderUser } = await supabase
      .from('users')
      .select('first_name, last_name')
      .eq('id', senderId)
      .single()

    const { data: receiverUser } = await supabase
      .from('users')
      .select('first_name, last_name')
      .eq('id', receiver_id)
      .single()

    // Notification for receiver
    const receiverTitle = type === 'tip' ? 'Tip Received' : 'ɃU Received'
    const receiverMessage = `You received Ƀ ${amount.toLocaleString()} ${type === 'tip' ? 'as a tip' : ''} from ${senderUser ? `${senderUser.first_name} ${senderUser.last_name}` : 'User'}`
    await supabase.from('notifications').insert([{
      user_id: receiver_id,
      type: 'transfer_received',
      title: receiverTitle,
      message: receiverMessage,
      amount: amount,
      metadata: { transfer_id: transfer?.id, from_user_name: senderUser ? `${senderUser.first_name} ${senderUser.last_name}` : 'User' },
    }])

    // Notification for sender
    const senderTitle = type === 'tip' ? 'Tip Sent' : 'ɃU Sent'
    const senderMessage = `You sent Ƀ ${amount.toLocaleString()} ${type === 'tip' ? 'as a tip' : ''} to ${receiverUser ? `${receiverUser.first_name} ${receiverUser.last_name}` : 'User'}`
    await supabase.from('notifications').insert([{
      user_id: senderId,
      type: 'transfer_sent',
      title: senderTitle,
      message: senderMessage,
      amount: amount,
      metadata: { transfer_id: transfer?.id, to_user_name: receiverUser ? `${receiverUser.first_name} ${receiverUser.last_name}` : 'User' },
    }])

    void sendPushToUser(receiver_id, {
      title: receiverTitle,
      body: receiverMessage,
      data: { url: '/?page=notifications' },
    })
    void sendPushToUser(senderId, {
      title: senderTitle,
      body: senderMessage,
      data: { url: '/?page=notifications' },
    })

    return successResponse({
      transfer,
      message: 'Transfer completed successfully',
    })
  } catch (error: any) {
    console.error('Transfer error:', error)
    return errorResponse('Internal server error', 500)
  }
})

// Get transfer history
export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id')
    const searchParams = request.nextUrl.searchParams
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    if (!userId) {
      return errorResponse('User ID required', 401)
    }

    const { data: transfers, error } = await supabase
      .from('transfers')
      .select(`
        *,
        sender:users!transfers_sender_id_fkey(first_name, last_name, phone_number),
        receiver:users!transfers_receiver_id_fkey(first_name, last_name, phone_number)
      `)
      .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      return errorResponse('Failed to fetch transfers: ' + error.message, 500)
    }

    return successResponse({ transfers, total: transfers?.length || 0 })
  } catch (error: any) {
    console.error('Get transfers error:', error)
    return errorResponse('Internal server error', 500)
  }
}
