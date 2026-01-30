import { NextRequest, NextResponse } from 'next/server'
import { successResponse } from '@/lib/api-helpers'

// Debug endpoint to check which Paystack keys are loaded
export async function GET(request: NextRequest) {
  const secretKey = process.env.PAYSTACK_SECRET_KEY || 'NOT SET'
  const publicKey = process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY || 'NOT SET'
  
  return successResponse({
    secretKeyPrefix: secretKey.substring(0, 10) + '...',
    publicKeyPrefix: publicKey.substring(0, 10) + '...',
    isLiveSecret: secretKey.startsWith('sk_live_'),
    isLivePublic: publicKey.startsWith('pk_live_'),
    isTestSecret: secretKey.startsWith('sk_test_'),
    isTestPublic: publicKey.startsWith('pk_test_'),
  })
}
