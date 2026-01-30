import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { successResponse, errorResponse, getAuthUser } from '@/lib/api-helpers'

// Accept, decline, block, or cancel friend request
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
    const body = await request.json()
    const { action } = body // 'accept', 'decline', 'block', 'cancel'

    if (!['accept', 'decline', 'block', 'cancel'].includes(action)) {
      return errorResponse('Invalid action', 400)
    }

    // Get the friend request
    const { data: friendRequest, error: fetchError } = await supabase
      .from('friend_requests')
      .select('*')
      .eq('id', id)
      .single()

    if (fetchError || !friendRequest) {
      return errorResponse('Friend request not found', 404)
    }

    // Verify permissions
    if (action === 'accept' || action === 'decline' || action === 'block') {
      // Only receiver can accept/decline/block
      if (friendRequest.receiver_id !== authUser.userId) {
        return errorResponse('Unauthorized', 403)
      }
    } else if (action === 'cancel') {
      // Only sender can cancel
      if (friendRequest.sender_id !== authUser.userId) {
        return errorResponse('Unauthorized', 403)
      }
    }

    if (friendRequest.status !== 'pending') {
      return errorResponse('Friend request is no longer pending', 400)
    }

    // Update friend request status
    const newStatus = action === 'accept' ? 'accepted' : action === 'cancel' ? 'cancelled' : action

    const { data: updatedRequest, error: updateError } = await supabase
      .from('friend_requests')
      .update({
        status: newStatus,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single()

    if (updateError) {
      console.error('Failed to update friend request:', updateError)
      return errorResponse('Failed to update friend request: ' + updateError.message, 500)
    }

    // If accepted, create notification for sender
    if (action === 'accept') {
      // Get receiver's (accepter's) name for notification
      const { data: receiver } = await supabase
        .from('users')
        .select('first_name, last_name')
        .eq('id', authUser.userId)
        .single()

      const receiverName = receiver
        ? `${receiver.first_name || ''} ${receiver.last_name || ''}`.trim() || 'Someone'
        : 'Someone'

      await supabase.from('notifications').insert({
        user_id: friendRequest.sender_id,
        type: 'friend_request_accepted',
        title: 'Friend Request Accepted',
        message: `${receiverName} accepted your friend request`,
        metadata: { friend_request_id: id, contact_id: authUser.userId },
      })
    }

    return successResponse({ friend_request: updatedRequest })
  } catch (error: any) {
    console.error('Update friend request error:', error)
    return errorResponse('Internal server error', 500)
  }
}
