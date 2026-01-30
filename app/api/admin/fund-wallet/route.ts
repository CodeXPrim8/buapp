import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { successResponse, errorResponse } from '@/lib/api-helpers'
import { getUserByPhone } from '@/lib/auth'

// Admin endpoint to fund a user's wallet (for testing)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { phone_number, amount } = body

    if (!phone_number || !amount) {
      return errorResponse('Phone number and amount are required', 400)
    }

    // Get user by phone number
    const user = await getUserByPhone(phone_number)
    if (!user) {
      return errorResponse('User not found', 404)
    }

    // Get or create wallet
    let { data: wallet, error: walletError } = await supabase
      .from('wallets')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (walletError && walletError.code !== 'PGRST116') {
      return errorResponse('Failed to fetch wallet: ' + walletError.message, 500)
    }

    const currentBalance = wallet ? parseFloat(wallet.balance || '0') : 0
    const newBalance = currentBalance + amount

    if (!wallet) {
      // Create wallet with the new balance
      const { data: newWallet, error: createError } = await supabase
        .from('wallets')
        .insert([{
          user_id: user.id,
          balance: newBalance.toString(),
          naira_balance: newBalance.toString(),
        }])
        .select()
        .single()

      if (createError) {
        return errorResponse('Failed to create wallet: ' + createError.message, 500)
      }

      return successResponse({
        message: `Wallet funded successfully. New balance: Ƀ ${newBalance.toLocaleString()}`,
        user: {
          name: `${user.first_name} ${user.last_name}`,
          phone_number: user.phone_number,
        },
        wallet: {
          balance: newBalance,
          previous_balance: 0,
          amount_added: amount,
        },
      })
    } else {
      // Update existing wallet
      const { data: updatedWallet, error: updateError } = await supabase
        .from('wallets')
        .update({
          balance: newBalance.toString(),
          naira_balance: newBalance.toString(),
        })
        .eq('user_id', user.id)
        .select()
        .single()

      if (updateError) {
        return errorResponse('Failed to update wallet: ' + updateError.message, 500)
      }

      return successResponse({
        message: `Wallet funded successfully. New balance: Ƀ ${newBalance.toLocaleString()}`,
        user: {
          name: `${user.first_name} ${user.last_name}`,
          phone_number: user.phone_number,
        },
        wallet: {
          balance: newBalance,
          previous_balance: currentBalance,
          amount_added: amount,
        },
      })
    }
  } catch (error: any) {
    console.error('Fund wallet error:', error)
    return errorResponse('Internal server error: ' + error.message, 500)
  }
}
