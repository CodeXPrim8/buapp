import { NextRequest, NextResponse } from 'next/server'
import { successResponse, errorResponse, getAuthUser } from '@/lib/api-helpers'
import { supabase } from '@/lib/supabase'

// Verify Paystack payment and credit wallet
export async function POST(request: NextRequest) {
  try {
    const authUser = await getAuthUser(request)
    if (!authUser) {
      return errorResponse('Authentication required', 401)
    }

    const body = await request.json()
    const { reference } = body

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

    if (!verifyResponse.ok || !verifyData.status) {
      console.error('Paystack verification error:', verifyData)
      return errorResponse(
        verifyData.message || 'Payment verification failed',
        400
      )
    }

    // Check if payment was successful
    if (verifyData.data.status !== 'success') {
      return errorResponse(`Payment ${verifyData.data.status}. Please try again.`, 400)
    }

    // Check if payment was already processed (prevent duplicate credits)
    const { data: existingTransfer } = await supabase
      .from('transfers')
      .select('id')
      .eq('message', `Wallet top-up - ${reference}`)
      .single()

    if (existingTransfer) {
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

    // Get current wallet
    const { data: wallet, error: walletError } = await supabase
      .from('wallets')
      .select('*')
      .eq('user_id', authUser.userId)
      .single()

    if (walletError) {
      console.error('Wallet fetch error:', walletError)
      return errorResponse('Wallet not found', 404)
    }

    // Update wallet balance
    const { data: updatedWallet, error: updateError } = await supabase
      .from('wallets')
      .update({
        balance: (parseFloat(wallet.balance) + amountInNaira).toString(),
        naira_balance: (parseFloat(wallet.naira_balance) + amountInNaira).toString(),
      })
      .eq('user_id', authUser.userId)
      .select()
      .single()

    if (updateError) {
      console.error('Wallet update error:', updateError)
      return errorResponse('Failed to update wallet: ' + updateError.message, 500)
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

    if (transferError) {
      console.error('Transfer record creation error:', transferError)
      // Don't fail the request, just log the error
    }

    return successResponse({
      wallet: updatedWallet,
      amount: amountInNaira,
      reference: reference,
      message: 'Payment verified and wallet credited successfully',
    })
  } catch (error: any) {
    console.error('Payment verification error:', error)
    return errorResponse('Failed to verify payment: ' + error.message, 500)
  }
}
