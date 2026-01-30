import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { successResponse, errorResponse, getAuthUser } from '@/lib/api-helpers'

// Get pending sales for vendor
export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url)
    const gatewayId = searchParams.get('gateway_id')

    let query = supabase
      .from('vendor_pending_sales')
      .select(`
        *,
        transfers (*),
        gateways (*)
      `)
      .eq('vendor_id', dbUserId)
      .eq('status', 'pending')
      .order('created_at', { ascending: false })

    if (gatewayId && gatewayId !== 'all') {
      query = query.eq('gateway_id', gatewayId)
    }

    const { data: sales, error } = await query

    if (error) {
      return errorResponse('Failed to fetch pending sales', 500)
    }

    return successResponse({ sales })
  } catch (error: any) {
    console.error('Get pending sales error:', error)
    return errorResponse(error.message || 'Internal server error', 500)
  }
}
