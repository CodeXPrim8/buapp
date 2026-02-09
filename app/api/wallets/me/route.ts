import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { errorResponse, getAuthUser } from '@/lib/api-helpers'

const noCacheHeaders: HeadersInit = {
  'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
  'Pragma': 'no-cache',
}

// Bank-style: always read from DB, never cache (super admin and user see same source of truth)
export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(request: NextRequest) {
  try {
    const authUser = await getAuthUser(request)
    if (!authUser) {
      return errorResponse('Authentication required', 401)
    }

    let userId = authUser.userId.trim()
    const { data: dbUser, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('id', userId)
      .single()
    let resolvedSource: 'dbUser' | 'phone' = 'dbUser'
    if (userError || !dbUser) {
      const phoneNumber = request.headers.get('x-user-phone') || authUser.phoneNumber
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/5302d33a-07c7-4c7f-8d80-24b4192edc7b', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ location: 'api/wallets/me:resolve', message: 'user lookup failed, trying phone', data: { authUserId: authUser.userId, hasPhone: !!phoneNumber }, timestamp: Date.now(), hypothesisId: 'H1' }) }).catch(() => {})
      // #endregion
      if (phoneNumber) {
        const { data: userByPhone } = await supabase
          .from('users')
          .select('id')
          .eq('phone_number', phoneNumber)
          .single()
        if (userByPhone) {
          userId = userByPhone.id
          resolvedSource = 'phone'
        }
      }
    } else {
      userId = dbUser.id
    }
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/5302d33a-07c7-4c7f-8d80-24b4192edc7b', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ location: 'api/wallets/me:resolve', message: 'resolved userId', data: { resolvedUserId: userId, authUserId: authUser.userId, resolvedSource }, timestamp: Date.now(), hypothesisId: 'H1' }) }).catch(() => {})
    // #endregion

    const { data: wallet, error } = await supabase
      .from('wallets')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (!error && wallet) {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/5302d33a-07c7-4c7f-8d80-24b4192edc7b', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ location: 'api/wallets/me:GET', message: 'wallets/me returning balance', data: { balance: wallet.balance, resolvedUserId: userId, authUserId: authUser.userId }, timestamp: Date.now(), hypothesisId: 'H2' }) }).catch(() => {})
      // #endregion
    }

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

        return NextResponse.json({ success: true, data: { wallet: newWallet } }, { status: 200, headers: noCacheHeaders })
      }
      return errorResponse('Failed to fetch wallet: ' + error.message, 500)
    }

    const res = NextResponse.json({ success: true, data: { wallet } }, { status: 200, headers: noCacheHeaders })
    return res
  } catch (error: any) {
    console.error('Get wallet error:', error)
    return errorResponse('Internal server error', 500)
  }
}
