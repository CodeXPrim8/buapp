import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { successResponse, errorResponse, getAuthUser } from '@/lib/api-helpers'

// Confirm pending sale
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authUser = await getAuthUser(request)
    if (!authUser || (authUser.role !== 'vendor' && authUser.role !== 'both')) {
      return errorResponse('Unauthorized. Only vendors can access this endpoint.', 401)
    }

    // Verify user exists in database to get correct UUID format
    const { data: dbUser, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('id', authUser.userId.trim())
      .single()

    let dbUserId = authUser.userId
    if (userError || !dbUser) {
      // Try by phone number as fallback
      const phoneNumber = request.headers.get('x-user-phone')
      if (phoneNumber) {
        const { data: userByPhone } = await supabase
          .from('users')
          .select('id')
          .eq('phone_number', phoneNumber)
          .single()
        
        if (userByPhone) {
          dbUserId = userByPhone.id
        } else {
          return errorResponse('User not found. Please login again.', 401)
        }
      } else {
        return errorResponse('User not found. Please login again.', 401)
      }
    } else {
      dbUserId = dbUser.id
    }

    const { id } = await params

    // Update sale status to confirmed
    const { data: sale, error } = await supabase
      .from('vendor_pending_sales')
      .update({ status: 'confirmed' })
      .eq('id', id)
      .eq('vendor_id', dbUserId)
      .select()
      .single()

    if (error || !sale) {
      return errorResponse('Sale not found or already processed', 404)
    }

    return successResponse({ sale, message: 'Sale confirmed successfully' })
  } catch (error: any) {
    console.error('Confirm sale error:', error)
    return errorResponse(error.message || 'Internal server error', 500)
  }
}
