import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { successResponse, errorResponse } from '@/lib/api-helpers'

// Withdraw BU from event to main wallet
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const celebrantId = request.headers.get('x-user-id')
    const role = request.headers.get('x-user-role')
    
    if (!celebrantId) {
      return errorResponse('User ID required', 401)
    }

    if (role !== 'celebrant') {
      return errorResponse('Only celebrants can withdraw from events', 403)
    }

    const { id: eventId } = await params

    // Get event
    const { data: event, error: eventError } = await supabase
      .from('events')
      .select('*')
      .eq('id', eventId)
      .eq('celebrant_id', celebrantId)
      .single()

    if (eventError || !event) {
      return errorResponse('Event not found', 404)
    }

    if (event.withdrawn) {
      return errorResponse('Event balance already withdrawn', 400)
    }

    // Calculate total BU received
    const { data: transfers } = await supabase
      .from('transfers')
      .select('amount')
      .eq('event_id', eventId)
      .eq('status', 'completed')

    const totalBU = transfers?.reduce((sum, t) => sum + parseFloat(t.amount.toString()), 0) || 0

    if (totalBU === 0) {
      return errorResponse('No BU to withdraw', 400)
    }

    // Get celebrant's wallet
    const { data: wallet, error: walletError } = await supabase
      .from('wallets')
      .select('*')
      .eq('user_id', celebrantId)
      .single()

    if (walletError || !wallet) {
      return errorResponse('Wallet not found', 404)
    }

    // Update wallet balance
    const newBalance = parseFloat(wallet.balance) + totalBU
    const { error: updateError } = await supabase
      .from('wallets')
      .update({
        balance: newBalance.toString(),
        naira_balance: newBalance.toString(),
      })
      .eq('user_id', celebrantId)

    if (updateError) {
      return errorResponse('Failed to update wallet', 500)
    }

    // Mark event as withdrawn
    const { error: markError } = await supabase
      .from('events')
      .update({ withdrawn: true })
      .eq('id', eventId)

    if (markError) {
      console.error('Failed to mark event as withdrawn:', markError)
      // Don't fail, wallet is already updated
    }

    return successResponse({
      message: 'BU withdrawn successfully',
      amount: totalBU,
      new_balance: newBalance,
    })
  } catch (error: any) {
    console.error('Withdraw error:', error)
    return errorResponse('Internal server error', 500)
  }
}
