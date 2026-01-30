import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { successResponse, errorResponse, getAuthUser } from '@/lib/api-helpers'

// Delete event (only if balance is 0)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authUser = await getAuthUser(request)
    if (!authUser) {
      return errorResponse('Unauthorized', 401)
    }

    const { id } = await params

    // Get event and verify ownership
    const { data: event, error: fetchError } = await supabase
      .from('events')
      .select('id, celebrant_id, total_bu_received')
      .eq('id', id)
      .single()

    if (fetchError || !event) {
      return errorResponse('Event not found', 404)
    }

    // Verify user is the celebrant
    if (event.celebrant_id !== authUser.userId) {
      return errorResponse('Unauthorized: Only the event creator can delete it', 403)
    }

    // Calculate current event balance from transfers
    const { data: transfers } = await supabase
      .from('transfers')
      .select('amount')
      .eq('event_id', id)

    const totalReceived = transfers?.reduce((sum, t) => sum + parseFloat(t.amount.toString()), 0) || 0

    // Check if there are any withdrawals for this event
    const { data: withdrawals } = await supabase
      .from('withdrawals')
      .select('bu_amount')
      .eq('event_id', id)

    const totalWithdrawn = withdrawals?.reduce((sum, w) => sum + parseFloat(w.bu_amount.toString()), 0) || 0

    // Calculate remaining balance
    const remainingBalance = totalReceived - totalWithdrawn

    // Only allow deletion if balance is 0
    if (remainingBalance > 0) {
      return errorResponse(
        `Cannot delete event. There is still Ƀ ${remainingBalance.toLocaleString()} remaining. Please withdraw all BU before deleting.`,
        400
      )
    }

    // Delete event (cascade will handle related records)
    const { error: deleteError } = await supabase
      .from('events')
      .delete()
      .eq('id', id)

    if (deleteError) {
      console.error('Failed to delete event:', deleteError)
      return errorResponse('Failed to delete event', 500)
    }

    return successResponse({ message: 'Event deleted successfully' })
  } catch (error: any) {
    console.error('Delete event error:', error)
    return errorResponse(error.message || 'Internal server error', 500)
  }
}
