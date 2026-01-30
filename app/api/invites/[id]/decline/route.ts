import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { successResponse, errorResponse, getAuthUser } from '@/lib/api-helpers'

// Decline an invite
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authUser = await getAuthUser(request)
    if (!authUser) {
      return errorResponse('Authentication required', 401)
    }

    const { id: inviteId } = await params

    // Get invite and verify it belongs to the user
    const { data: invite, error: inviteError } = await supabase
      .from('invites')
      .select('*')
      .eq('id', inviteId)
      .eq('guest_id', authUser.userId)
      .single()

    if (inviteError || !invite) {
      return errorResponse('Invite not found or access denied', 404)
    }

    if (invite.status !== 'pending') {
      return errorResponse(`Invite already ${invite.status}`, 400)
    }

    // Update invite status
    const { data: updatedInvite, error: updateError } = await supabase
      .from('invites')
      .update({ status: 'declined' })
      .eq('id', inviteId)
      .select()
      .single()

    if (updateError) {
      return errorResponse('Failed to decline invite: ' + updateError.message, 500)
    }

    return successResponse({
      invite: updatedInvite,
      message: 'Invite declined',
    })
  } catch (error: any) {
    console.error('Decline invite error:', error)
    return errorResponse('Internal server error', 500)
  }
}
