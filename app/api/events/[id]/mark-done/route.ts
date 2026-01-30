import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { successResponse, errorResponse, getAuthUser } from '@/lib/api-helpers'

// Mark event as done
export async function PUT(
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
      return errorResponse('Unauthorized: Only the event creator can mark it as done', 403)
    }

    // Update event status
    const { data: updatedEvent, error: updateError } = await supabase
      .from('events')
      .update({
        is_done: true,
        status: 'done',
      })
      .eq('id', id)
      .select()
      .single()

    if (updateError) {
      console.error('Failed to mark event as done:', updateError)
      return errorResponse('Failed to mark event as done', 500)
    }

    return successResponse({ event: updatedEvent })
  } catch (error: any) {
    console.error('Mark event done error:', error)
    return errorResponse(error.message || 'Internal server error', 500)
  }
}
