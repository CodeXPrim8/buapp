import { NextRequest, NextResponse } from 'next/server'
import { successResponse, errorResponse, getAuthUser, validateBody } from '@/lib/api-helpers'

// Initialize Paystack payment
export async function POST(request: NextRequest) {
  try {
    const authUser = await getAuthUser(request)
    if (!authUser) {
      return errorResponse('Authentication required', 401)
    }

    const body = await request.json()
    const validation = validateBody(body, {
      amount: (val) => typeof val === 'number' && val >= 10000, // Minimum ₦100 (10000 kobo)
      email: (val) => typeof val === 'string' && val.includes('@'),
    })

    if (!validation.valid) {
      return errorResponse('Invalid amount or email. Minimum amount is ₦100.', 400, validation.errors)
    }

    const { amount, email } = body

    // Get Paystack secret key from environment
    const paystackSecretKey = process.env.PAYSTACK_SECRET_KEY
    const paystackPublicKey = process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY

    if (!paystackSecretKey || !paystackPublicKey) {
      console.error('Paystack keys not configured')
      return errorResponse('Payment gateway not configured. Please contact support.', 500)
    }

    // Generate unique reference
    const reference = `BU_${authUser.userId}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`

    // Initialize payment with Paystack API
    const paystackResponse = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${paystackSecretKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: email,
        amount: amount, // Amount in kobo
        reference: reference,
        callback_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/payments/paystack/callback`,
        metadata: {
          user_id: authUser.userId,
          phone_number: authUser.phoneNumber,
          custom_fields: [
            {
              display_name: 'User ID',
              variable_name: 'user_id',
              value: authUser.userId,
            },
            {
              display_name: 'Phone Number',
              variable_name: 'phone_number',
              value: authUser.phoneNumber,
            },
          ],
        },
      }),
    })

    const paystackData = await paystackResponse.json()

    if (!paystackResponse.ok || !paystackData.status) {
      console.error('Paystack initialization error:', paystackData)
      return errorResponse(
        paystackData.message || 'Failed to initialize payment. Please try again.',
        500
      )
    }

    return successResponse({
      authorization_url: paystackData.data.authorization_url,
      access_code: paystackData.data.access_code,
      reference: paystackData.data.reference,
      public_key: paystackPublicKey,
    })
  } catch (error: any) {
    console.error('Payment initialization error:', error)
    return errorResponse('Failed to initialize payment: ' + error.message, 500)
  }
}
