import { NextRequest, NextResponse } from 'next/server'
import { getAdminUser } from '@/lib/api-helpers'
import { supabase } from '@/lib/supabase'
import { successResponse, errorResponse, validateBody } from '@/lib/api-helpers'

// Update withdrawal status
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const adminUser = await getAdminUser(request)
    if (!adminUser) {
      return errorResponse('Authentication required', 401)
    }

    const { id } = params
    const body = await request.json()

    const validation = validateBody(body, {
      status: (val) => ['pending', 'processing', 'completed', 'failed'].includes(val),
    })

    if (!validation.valid) {
      return errorResponse('Valid status is required', 400, validation.errors)
    }

    const { status } = body

    const updateData: any = { status }
    if (status === 'completed' || status === 'failed') {
      updateData.completed_at = new Date().toISOString()
    }

    const { data: withdrawal, error } = await supabase
      .from('withdrawals')
      .update(updateData)
      .eq('id', id)
      .select(`
        *,
        user:users!withdrawals_user_id_fkey(id, first_name, last_name, phone_number)
      `)
      .single()

    if (error) {
      return errorResponse('Failed to update withdrawal: ' + error.message, 500)
    }

    // If status is completed, deduct from wallet
    if (status === 'completed' && withdrawal) {
      const { data: wallet } = await supabase
        .from('wallets')
        .select('balance, naira_balance')
        .eq('user_id', withdrawal.user_id)
        .single()

      if (wallet) {
        const newBalance = parseFloat(wallet.balance || '0') - parseFloat(withdrawal.bu_amount || '0')
        const newNairaBalance = parseFloat(wallet.naira_balance || '0') - parseFloat(withdrawal.naira_amount || '0')

        await supabase
          .from('wallets')
          .update({
            balance: Math.max(0, newBalance).toString(),
            naira_balance: Math.max(0, newNairaBalance).toString(),
          })
          .eq('user_id', withdrawal.user_id)
      }
    }

    return successResponse({
      withdrawal: {
        id: withdrawal.id,
        status: withdrawal.status,
        completedAt: withdrawal.completed_at,
      },
    })
  } catch (error: any) {
    console.error('Update withdrawal error:', error)
    return errorResponse('Internal server error', 500)
  }
}
