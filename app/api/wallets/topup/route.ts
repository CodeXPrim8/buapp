import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { successResponse, errorResponse, validateBody, getAuthUser } from '@/lib/api-helpers'
import { withCSRFProtection } from '@/lib/api-middleware'
import { sendPushToUser } from '@/lib/push'

// Top up wallet (in production, this would integrate with payment gateway)
export const POST = withCSRFProtection(async function POST(request: NextRequest) {
  try {
    const authUser = await getAuthUser(request)
    if (!authUser) {
      return errorResponse('Authentication required', 401)
    }
    
    const userId = authUser.userId

    const body = await request.json()
    const validation = validateBody(body, {
      amount: (val) => typeof val === 'number' && val > 0,
    })

    if (!validation.valid) {
      return errorResponse('Validation failed', 400, validation.errors)
    }

    const { amount } = body

    // Get current wallet
    const { data: wallet, error: walletError } = await supabase
      .from('wallets')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (walletError) {
      return errorResponse('Wallet not found', 404)
    }

    // Update wallet balance
    const { data: updatedWallet, error: updateError } = await supabase
      .from('wallets')
      .update({
        balance: (parseFloat(wallet.balance) + amount).toString(),
        naira_balance: (parseFloat(wallet.naira_balance) + amount).toString(),
      })
      .eq('user_id', userId)
      .select()
      .single()

    if (updateError) {
      return errorResponse('Failed to update wallet: ' + updateError.message, 500)
    }

    // Create a transfer record for the topup
    // For topups, the user is the receiver (money coming in)
    const { error: transferError } = await supabase
      .from('transfers')
      .insert([{
        receiver_id: userId,
        amount: amount,
        type: 'transfer',
        status: 'completed',
        message: 'Wallet top-up',
      }])

    if (transferError) {
      console.error('Failed to create transfer record:', transferError)
      // Don't fail the request, just log the error
    }

    const topupMessage = `Your wallet was topped up with ₦${amount.toLocaleString()}.`
    await supabase.from('notifications').insert({
      user_id: userId,
      type: 'transfer_received',
      title: 'Wallet Top-up',
      message: topupMessage,
      amount: amount,
      metadata: { source: 'manual_topup' },
    })

    void sendPushToUser(userId, {
      title: 'Wallet Top-up',
      body: topupMessage,
      data: { url: '/?page=notifications' },
    })

    return successResponse({
      wallet: updatedWallet,
      message: 'Wallet topped up successfully',
    })
  } catch (error: any) {
    console.error('Top up error:', error)
    return errorResponse('Internal server error', 500)
  }
})
