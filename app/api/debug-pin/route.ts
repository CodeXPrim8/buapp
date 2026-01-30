import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { verifyPin, hashPin } from '@/lib/auth'
import { successResponse, errorResponse, getAuthUser } from '@/lib/api-helpers'

// Debug endpoint to test PIN verification - ADMIN ONLY
// Disabled in production by default
export async function POST(request: NextRequest) {
  // Disable in production unless explicitly enabled
  if (process.env.NODE_ENV === 'production' && process.env.ENABLE_DEBUG_ENDPOINTS !== 'true') {
    return errorResponse('Debug endpoints are disabled in production', 404)
  }

  try {
    // Require admin authentication
    const authUser = await getAuthUser(request)
    if (!authUser) {
      return errorResponse('Authentication required', 401)
    }

    // Check if user is admin or superadmin
    if (authUser.role !== 'admin' && authUser.role !== 'superadmin' && authUser.role !== 'super_admin') {
      return errorResponse('Admin access required', 403)
    }

    const body = await request.json()
    const { pin, testPin, userId: targetUserId } = body

    // Use authenticated user's ID or provided target user ID (admin can test other users)
    const userId = targetUserId || authUser.userId

    // Get user's PIN hash
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, phone_number, pin_hash')
      .eq('id', userId)
      .single()

    if (userError || !user) {
      return errorResponse('User not found', 404)
    }

    const results: any = {
      userId: user.id,
      phoneNumber: user.phone_number,
      hasPinHash: !!user.pin_hash,
      pinHashLength: user.pin_hash?.length || 0,
      pinHashPrefix: user.pin_hash?.substring(0, 20) || 'N/A',
    }

    // Test PIN verification if provided
    if (testPin) {
      try {
        const isValid = await verifyPin(testPin, user.pin_hash)
        results.pinVerification = {
          testPin: testPin,
          isValid: isValid,
          error: null,
        }
      } catch (error: any) {
        results.pinVerification = {
          testPin: testPin,
          isValid: false,
          error: error.message,
        }
      }
    }

    // Test creating a new hash if PIN provided
    if (pin) {
      try {
        const newHash = await hashPin(pin)
        results.newHashTest = {
          success: true,
          hashLength: newHash.length,
          hashPrefix: newHash.substring(0, 20),
        }
      } catch (error: any) {
        results.newHashTest = {
          success: false,
          error: error.message,
        }
      }
    }

    return successResponse(results)
  } catch (error: any) {
    console.error('Debug PIN error:', error)
    return errorResponse('Internal server error', 500)
  }
}
