import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { successResponse, errorResponse, getAuthUser } from '@/lib/api-helpers'
import { creditMainBalance } from '@/lib/wallet-balance'
import { sendPushToUser } from '@/lib/push'

// Withdraw BU from event to main wallet
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authUser = await getAuthUser(request)
    if (!authUser) {
      return errorResponse('Authentication required', 401)
    }

    const role = authUser.role
    if (!['celebrant', 'both', 'superadmin'].includes(role)) {
      return errorResponse('Only celebrants can withdraw from events', 403)
    }

    let celebrantId = authUser.userId.trim()
    const { data: dbUser, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('id', celebrantId)
      .single()

    if (userError || !dbUser) {
      const phoneNumber = request.headers.get('x-user-phone') || authUser.phoneNumber
      if (phoneNumber) {
        const { data: userByPhone } = await supabase
          .from('users')
          .select('id')
          .eq('phone_number', phoneNumber)
          .single()
        if (userByPhone) {
          celebrantId = userByPhone.id
        } else {
          return errorResponse('User not found', 404)
        }
      } else {
        return errorResponse('User not found', 404)
      }
    }

    const { id: eventId } = await params

    // Get event
    const { data: event, error: eventError } = await supabase
      .from('events')
      .select('*')
      .eq('id', eventId)
      .eq('celebrant_id', celebrantId)
      .single()

    if (eventError || !event) {
      return errorResponse('Event not found', 404)
    }

    if (event.withdrawn) {
      return errorResponse('Event balance already withdrawn', 400)
    }

    // Calculate total BU received
    const { data: transfers } = await supabase
      .from('transfers')
      .select('amount')
      .eq('event_id', eventId)
      .eq('status', 'completed')

    const totalBU = transfers?.reduce((sum, t) => sum + parseFloat(t.amount.toString()), 0) || 0

    if (totalBU === 0) {
      return errorResponse('No BU to withdraw', 400)
    }

    const creditResult = await creditMainBalance(supabase, celebrantId, totalBU)
    if (!creditResult.success) {
      return errorResponse(creditResult.errorMessage || 'Failed to update wallet', 500)
    }

    // Mark event as withdrawn
    const { error: markError } = await supabase
      .from('events')
      .update({ withdrawn: true })
      .eq('id', eventId)

    if (markError) {
      console.error('Failed to mark event as withdrawn:', markError)
      // Don't fail, wallet is already updated
    }

    const withdrawalMessage = `You withdrew Ƀ ${totalBU.toLocaleString()} from ${event.name} to your wallet.`
    await supabase.from('notifications').insert({
      user_id: celebrantId,
      type: 'withdrawal_completed',
      title: 'Event Withdrawal',
      message: withdrawalMessage,
      amount: totalBU,
      metadata: { event_id: eventId },
    })
    void sendPushToUser(celebrantId, {
      title: 'Event Withdrawal',
      body: withdrawalMessage,
      data: { url: '/?page=notifications' },
    })

    return successResponse({
      message: 'BU withdrawn successfully',
      amount: totalBU,
      new_balance: creditResult.newBalance,
    })
  } catch (error: any) {
    console.error('Withdraw error:', error)
    return errorResponse('Internal server error', 500)
  }
}
