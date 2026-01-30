import { NextRequest, NextResponse } from 'next/server'
import { getAdminUser } from '@/lib/api-helpers'
import { supabase } from '@/lib/supabase'
import { successResponse, errorResponse } from '@/lib/api-helpers'

// Get user details
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const adminUser = await getAdminUser(request)
    if (!adminUser) {
      return errorResponse('Authentication required', 401)
    }

    const { id } = params

    // Get user
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single()

    if (userError || !user) {
      return errorResponse('User not found', 404)
    }

    // Get wallet
    const { data: wallet } = await supabase
      .from('wallets')
      .select('*')
      .eq('user_id', id)
      .single()

    // Get user's events
    const { data: events } = await supabase
      .from('events')
      .select('id, name, date, total_bu_received, withdrawn')
      .eq('celebrant_id', id)
      .order('created_at', { ascending: false })

    // Get user's transfers (sent and received)
    const { data: transfers } = await supabase
      .from('transfers')
      .select('*')
      .or(`sender_id.eq.${id},receiver_id.eq.${id}`)
      .order('created_at', { ascending: false })
      .limit(50)

    // Get user's withdrawals
    const { data: withdrawals } = await supabase
      .from('withdrawals')
      .select('*')
      .eq('user_id', id)
      .order('created_at', { ascending: false })

    return successResponse({
      user: {
        id: user.id,
        phoneNumber: user.phone_number,
        name: `${user.first_name} ${user.last_name}`,
        firstName: user.first_name,
        lastName: user.last_name,
        email: user.email,
        role: user.role,
        createdAt: user.created_at,
        updatedAt: user.updated_at,
      },
      wallet: wallet ? {
        balance: parseFloat(wallet.balance || '0'),
        nairaBalance: parseFloat(wallet.naira_balance || '0'),
        createdAt: wallet.created_at,
      } : null,
      events: events || [],
      transfers: transfers || [],
      withdrawals: withdrawals || [],
    })
  } catch (error: any) {
    console.error('Get user error:', error)
    return errorResponse('Internal server error', 500)
  }
}

// Update user
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

    const updateData: any = {}
    if (body.first_name) updateData.first_name = body.first_name
    if (body.last_name) updateData.last_name = body.last_name
    if (body.email !== undefined) updateData.email = body.email
    if (body.role) updateData.role = body.role

    const { data: updatedUser, error } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      return errorResponse('Failed to update user: ' + error.message, 500)
    }

    return successResponse({
      user: {
        id: updatedUser.id,
        phoneNumber: updatedUser.phone_number,
        name: `${updatedUser.first_name} ${updatedUser.last_name}`,
        firstName: updatedUser.first_name,
        lastName: updatedUser.last_name,
        email: updatedUser.email,
        role: updatedUser.role,
      },
    })
  } catch (error: any) {
    console.error('Update user error:', error)
    return errorResponse('Internal server error', 500)
  }
}
