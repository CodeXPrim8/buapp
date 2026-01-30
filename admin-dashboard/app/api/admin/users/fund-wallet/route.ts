import { NextRequest, NextResponse } from 'next/server'
import { getAdminUser } from '@/lib/api-helpers'
import { supabase } from '@/lib/supabase'
import { successResponse, errorResponse, validateBody } from '@/lib/api-helpers'

// Fund user wallet (admin action)
export async function POST(request: NextRequest) {
  try {
    const adminUser = await getAdminUser(request)
    if (!adminUser) {
      return errorResponse('Authentication required', 401)
    }

    const body = await request.json()
    const validation = validateBody(body, {
      user_id: (val) => typeof val === 'string' && val.length > 0,
      amount: (val) => typeof val === 'number' && val > 0,
    })

    if (!validation.valid) {
      return errorResponse('User ID and amount are required', 400, validation.errors)
    }

    const { user_id, amount } = body

    // Get user
    const { data: user } = await supabase
      .from('users')
      .select('id, first_name, last_name, phone_number')
      .eq('id', user_id)
      .single()

    if (!user) {
      return errorResponse('User not found', 404)
    }

    // Get or create wallet
    let { data: wallet, error: walletError } = await supabase
      .from('wallets')
      .select('*')
      .eq('user_id', user_id)
      .single()

    const currentBalance = wallet ? parseFloat(wallet.balance || '0') : 0
    const newBalance = currentBalance + amount

    if (!wallet) {
      // Create wallet
      const { data: newWallet, error: createError } = await supabase
        .from('wallets')
        .insert([{
          user_id: user_id,
          balance: newBalance.toString(),
          naira_balance: newBalance.toString(),
        }])
        .select()
        .single()

      if (createError) {
        return errorResponse('Failed to create wallet: ' + createError.message, 500)
      }

      // Create transfer record
      await supabase.from('transfers').insert([{
        sender_id: user_id,
        receiver_id: user_id,
        amount: amount,
        type: 'transfer',
        status: 'completed',
        message: `Admin wallet funding - ${adminUser.userId}`,
      }])

      return successResponse({
        message: `Wallet funded successfully. New balance: Ƀ ${newBalance.toLocaleString()}`,
        user: {
          name: `${user.first_name} ${user.last_name}`,
          phoneNumber: user.phone_number,
        },
        wallet: {
          balance: newBalance,
          previousBalance: 0,
          amountAdded: amount,
        },
      })
    } else {
      // Update wallet
      const { data: updatedWallet, error: updateError } = await supabase
        .from('wallets')
        .update({
          balance: newBalance.toString(),
          naira_balance: newBalance.toString(),
        })
        .eq('user_id', user_id)
        .select()
        .single()

      if (updateError) {
        return errorResponse('Failed to update wallet: ' + updateError.message, 500)
      }

      // Create transfer record
      await supabase.from('transfers').insert([{
        sender_id: user_id,
        receiver_id: user_id,
        amount: amount,
        type: 'transfer',
        status: 'completed',
        message: `Admin wallet funding - ${adminUser.userId}`,
      }])

      return successResponse({
        message: `Wallet funded successfully. New balance: Ƀ ${newBalance.toLocaleString()}`,
        user: {
          name: `${user.first_name} ${user.last_name}`,
          phoneNumber: user.phone_number,
        },
        wallet: {
          balance: newBalance,
          previousBalance: currentBalance,
          amountAdded: amount,
        },
      })
    }
  } catch (error: any) {
    console.error('Fund wallet error:', error)
    return errorResponse('Internal server error: ' + error.message, 500)
  }
}
