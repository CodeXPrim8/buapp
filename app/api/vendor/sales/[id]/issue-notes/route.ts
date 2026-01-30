import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { successResponse, errorResponse, getAuthUser } from '@/lib/api-helpers'

// Issue physical notes (mark sale as completed)
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

    // Get sale
    const { data: sale, error: saleError } = await supabase
      .from('vendor_pending_sales')
      .select('*, transfers (*), gateways (*)')
      .eq('id', id)
      .eq('vendor_id', dbUserId)
      .single()

    if (saleError || !sale) {
      return errorResponse('Sale not found', 404)
    }

    if (sale.status !== 'confirmed') {
      return errorResponse('Sale must be confirmed before issuing notes', 400)
    }

    // Update sale status to notes_issued
    const { data: updatedSale, error: updateError } = await supabase
      .from('vendor_pending_sales')
      .update({ status: 'notes_issued' })
      .eq('id', id)
      .select()
      .single()

    if (updateError || !updatedSale) {
      return errorResponse('Failed to update sale', 500)
    }

    // Note: BU is already routed to celebrant wallet when transfer was created
    // This endpoint just marks the physical notes as issued

    return successResponse({ 
      sale: updatedSale, 
      message: 'Physical notes issued successfully' 
    })
  } catch (error: any) {
    console.error('Issue notes error:', error)
    return errorResponse(error.message || 'Internal server error', 500)
  }
}
