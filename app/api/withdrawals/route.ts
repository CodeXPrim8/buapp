import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { successResponse, errorResponse, validateBody } from '@/lib/api-helpers'
import { verifyPin } from '@/lib/auth'
import { withCSRFProtection } from '@/lib/api-middleware'

// Create withdrawal request
export const POST = withCSRFProtection(async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id')
    
    if (!userId) {
      return errorResponse('User ID required', 401)
    }

    const body = await request.json()
    const validation = validateBody(body, {
      bu_amount: (val) => typeof val === 'number' && val > 0,
      naira_amount: (val) => typeof val === 'number' && val > 0,
      type: (val) => ['bank', 'wallet'].includes(val),
      pin: (val) => typeof val === 'string' && val.length === 6 && /^\d+$/.test(val),
    })

    if (!validation.valid) {
      return errorResponse('Validation failed', 400, validation.errors)
    }

    const { bu_amount, naira_amount, type, bank_name, account_number, account_name, wallet_address, event_id, pin } = body

    // Verify PIN
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('pin_hash')
      .eq('id', userId)
      .single()

    if (userError || !user) {
      return errorResponse('User not found', 404)
    }

    const pinValid = await verifyPin(pin, user.pin_hash)
    if (!pinValid) {
      return errorResponse('Invalid PIN', 401)
    }

    // Get wallet balance
    const { data: wallet, error: walletError } = await supabase
      .from('wallets')
      .select('balance')
      .eq('user_id', userId)
      .single()

    if (walletError || !wallet) {
      return errorResponse('Wallet not found', 404)
    }

    const walletBalance = parseFloat(wallet.balance || '0')
    if (walletBalance < bu_amount) {
      return errorResponse('Insufficient balance', 400)
    }

    // If withdrawing from event, check event balance
    if (event_id) {
      const { data: event, error: eventError } = await supabase
        .from('events')
        .select('total_bu_received, withdrawn')
        .eq('id', event_id)
        .eq('celebrant_id', userId)
        .single()

      if (eventError || !event) {
        return errorResponse('Event not found', 404)
      }

      if (event.withdrawn) {
        return errorResponse('Event balance already withdrawn', 400)
      }

      const eventBalance = parseFloat(event.total_bu_received?.toString() || '0')
      if (eventBalance < bu_amount) {
        return errorResponse('Insufficient event balance', 400)
      }
    }

    // Create withdrawal request
    const { data: withdrawal, error: withdrawalError } = await supabase
      .from('withdrawals')
      .insert([{
        user_id: userId,
        event_id: event_id || null,
        bu_amount,
        naira_amount,
        type,
        bank_name: type === 'bank' ? bank_name : null,
        account_number: type === 'bank' ? account_number : null,
        account_name: type === 'bank' ? account_name : null,
        wallet_address: type === 'wallet' ? wallet_address : null,
        status: 'pending',
      }])
      .select()
      .single()

    if (withdrawalError) {
      return errorResponse('Failed to create withdrawal request: ' + withdrawalError.message, 500)
    }

    // In production, this would integrate with payment processor
    // For now, we'll mark it as processing
    // The actual transfer would happen via webhook or admin approval

    return successResponse({
      withdrawal,
      message: 'Withdrawal request created successfully. It will be processed shortly.',
    }, 201)
  } catch (error: any) {
    console.error('Create withdrawal error:', error)
    return errorResponse('Internal server error', 500)
  }
})

// Get withdrawal history
export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id')
    const searchParams = request.nextUrl.searchParams
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    if (!userId) {
      return errorResponse('User ID required', 401)
    }

    const { data: withdrawals, error } = await supabase
      .from('withdrawals')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      return errorResponse('Failed to fetch withdrawals: ' + error.message, 500)
    }

    return successResponse({ withdrawals, total: withdrawals?.length || 0 })
  } catch (error: any) {
    console.error('Get withdrawals error:', error)
    return errorResponse('Internal server error', 500)
  }
}
