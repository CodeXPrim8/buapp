import { NextRequest, NextResponse } from 'next/server'
import { successResponse, errorResponse, getAuthUser } from '@/lib/api-helpers'
import { supabase } from '@/lib/supabase'
import { creditMainBalance } from '@/lib/wallet-balance'
import { sendPushToUser } from '@/lib/push'

// Verify Paystack payment and credit wallet
export async function POST(request: NextRequest) {
  console.log('[PAYSTACK VERIFY] Endpoint called')
  try {
    const authUser = await getAuthUser(request)
    console.log('[PAYSTACK VERIFY] Auth check:', { hasAuth: !!authUser, userId: authUser?.userId })
    if (!authUser) {
      return errorResponse('Authentication required', 401)
    }

    const body = await request.json()
    const { reference } = body
    console.log('[PAYSTACK VERIFY] Reference received:', reference)

    if (!reference || typeof reference !== 'string') {
      return errorResponse('Payment reference is required', 400)
    }

    // Get Paystack secret key
    const paystackSecretKey = process.env.PAYSTACK_SECRET_KEY
    if (!paystackSecretKey) {
      console.error('Paystack secret key not configured')
      return errorResponse('Payment gateway not configured', 500)
    }

    // Verify payment with Paystack API
    const verifyResponse = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${paystackSecretKey}`,
        'Content-Type': 'application/json',
      },
    })

    const verifyData = await verifyResponse.json()
    console.log('[PAYSTACK VERIFY] Paystack API response:', { 
      ok: verifyResponse.ok, 
      status: verifyData.status, 
      paymentStatus: verifyData.data?.status,
      amount: verifyData.data?.amount 
    })

    if (!verifyResponse.ok || !verifyData.status) {
      console.error('[PAYSTACK VERIFY] Paystack verification error:', verifyData)
      return errorResponse(
        verifyData.message || 'Payment verification failed',
        400
      )
    }

    // Check if payment was successful
    if (verifyData.data.status !== 'success') {
      console.error('[PAYSTACK VERIFY] Payment not successful:', verifyData.data.status)
      return errorResponse(`Payment ${verifyData.data.status}. Please try again.`, 400)
    }

    // Check if payment was already processed (prevent duplicate credits)
    const { data: existingTransfer } = await supabase
      .from('transfers')
      .select('id')
      .eq('message', `Wallet top-up - ${reference}`)
      .single()
    console.log('[PAYSTACK VERIFY] Duplicate check:', { hasExistingTransfer: !!existingTransfer, reference })

    if (existingTransfer) {
      console.log('[PAYSTACK VERIFY] Payment already processed')
      return errorResponse('This payment has already been processed', 400)
    }

    // Get amount from Paystack response (in kobo, convert to naira)
    const amountInKobo = verifyData.data.amount
    const amountInNaira = amountInKobo / 100

    // Verify the payment belongs to the authenticated user
    const paymentUserId = verifyData.data.metadata?.user_id
    if (paymentUserId && paymentUserId !== authUser.userId) {
      return errorResponse('Payment verification failed: User mismatch', 403)
    }

    // Credit wallet balance using atomic helper
    const creditResult = await creditMainBalance(supabase, authUser.userId, amountInNaira)
    console.log('[PAYSTACK VERIFY] Wallet credit result:', {
      success: creditResult.success,
      balanceBefore: creditResult.balanceBefore,
      newBalance: creditResult.newBalance,
      errorMessage: creditResult.errorMessage,
    })

    if (!creditResult.success) {
      return errorResponse(creditResult.errorMessage || 'Failed to update wallet', 500)
    }

    const { data: updatedWallet, error: walletFetchError } = await supabase
      .from('wallets')
      .select('*')
      .eq('user_id', authUser.userId)
      .single()

    if (walletFetchError) {
      console.error('[PAYSTACK VERIFY] Wallet fetch after credit error:', walletFetchError)
    }

    // Create transfer record for the topup
    const { error: transferError } = await supabase
      .from('transfers')
      .insert([{
        sender_id: authUser.userId,
        receiver_id: authUser.userId, // Self-transfer for topup
        amount: amountInNaira,
        type: 'transfer',
        status: 'completed',
        message: `Wallet top-up - ${reference}`,
      }])
    console.log('[PAYSTACK VERIFY] Transfer record creation:', { 
      hasError: !!transferError, 
      errorMessage: transferError?.message,
      amount: amountInNaira, 
      reference 
    })

    if (transferError) {
      console.error('[PAYSTACK VERIFY] Transfer record creation error:', transferError)
      // Don't fail the request, just log the error
    }

    const topupMessage = `Your wallet was topped up with ₦${amountInNaira.toLocaleString()}.`
    await supabase.from('notifications').insert({
      user_id: authUser.userId,
      type: 'transfer_received',
      title: 'Wallet Top-up',
      message: topupMessage,
      amount: amountInNaira,
      metadata: { reference },
    })

    void sendPushToUser(authUser.userId, {
      title: 'Wallet Top-up',
      body: topupMessage,
      data: { url: '/?page=notifications' },
    })

    console.log('[PAYSTACK VERIFY] Verification successful:', { amount: amountInNaira, reference })
    return successResponse({
      wallet: updatedWallet,
      amount: amountInNaira,
      reference: reference,
      message: 'Payment verified and wallet credited successfully',
    })
  } catch (error: any) {
    console.error('[PAYSTACK VERIFY] Exception:', error)
    return errorResponse('Failed to verify payment: ' + error.message, 500)
  }
}
