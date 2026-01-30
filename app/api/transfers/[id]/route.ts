import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { successResponse, errorResponse, getAuthUser } from '@/lib/api-helpers'

// Get a single transfer by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authUser = await getAuthUser(request)
    if (!authUser) {
      return errorResponse('Unauthorized', 401)
    }

    const { id } = await params

    const { data: transfer, error } = await supabase
      .from('transfers')
      .select(`
        id,
        sender_id,
        receiver_id,
        amount,
        message,
        type,
        status,
        created_at,
        sender:users!transfers_sender_id_fkey(
          id,
          first_name,
          last_name,
          phone_number
        ),
        receiver:users!transfers_receiver_id_fkey(
          id,
          first_name,
          last_name,
          phone_number
        )
      `)
      .eq('id', id)
      .single()

    if (error || !transfer) {
      return errorResponse('Transfer not found', 404)
    }

    // Verify user has access to this transfer (must be sender or receiver)
    if (transfer.sender_id !== authUser.userId && transfer.receiver_id !== authUser.userId) {
      return errorResponse('Unauthorized', 403)
    }

    return successResponse({ transfer })
  } catch (error: any) {
    console.error('Get transfer error:', error)
    return errorResponse(error.message || 'Internal server error', 500)
  }
}
