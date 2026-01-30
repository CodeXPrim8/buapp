import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { successResponse, errorResponse, getAuthUser } from '@/lib/api-helpers'

// Get current user's wallet
export async function GET(request: NextRequest) {
  try {
    const authUser = await getAuthUser(request)
    if (!authUser) {
      return errorResponse('Authentication required', 401)
    }
    
    const userId = authUser.userId

    const { data: wallet, error } = await supabase
      .from('wallets')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        // Wallet doesn't exist, create one
        const { data: newWallet, error: createError } = await supabase
          .from('wallets')
          .insert([{
            user_id: userId,
            balance: 0,
            naira_balance: 0,
          }])
          .select()
          .single()

        if (createError) {
          return errorResponse('Failed to create wallet', 500)
        }

        return successResponse({ wallet: newWallet })
      }
      return errorResponse('Failed to fetch wallet: ' + error.message, 500)
    }

    return successResponse({ wallet })
  } catch (error: any) {
    console.error('Get wallet error:', error)
    return errorResponse('Internal server error', 500)
  }
}
