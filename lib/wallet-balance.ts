/**
 * Professional wallet balance service: debit and credit BU from main balance.
 * Uses atomic DB functions when available; falls back to table updates otherwise.
 */

import type { SupabaseClient } from '@supabase/supabase-js'

export interface DebitResult {
  success: boolean
  newBalance: number
  balanceBefore: number
  errorMessage: string | null
}

export interface CreditResult {
  success: boolean
  newBalance: number
  balanceBefore: number
  errorMessage: string | null
}

function isRpcNotFoundError(error: { message?: string } | null): boolean {
  const msg = (error?.message || '').toLowerCase()
  return msg.includes('could not find the function') || msg.includes('schema cache')
}

/**
 * Debit (subtract) BU from a user's main balance.
 * Tries RPC debit_wallet first; if DB functions are not deployed, uses table update.
 *
 * @param supabase - Supabase client (server-side, service role recommended)
 * @param userId - User ID whose wallet to debit
 * @param amountBu - Amount of BU to subtract (must be > 0)
 * @returns DebitResult with success, newBalance, balanceBefore, or errorMessage
 */
export async function debitMainBalance(
  supabase: SupabaseClient,
  userId: string,
  amountBu: number
): Promise<DebitResult> {
  if (amountBu <= 0 || !Number.isFinite(amountBu)) {
    return {
      success: false,
      newBalance: 0,
      balanceBefore: 0,
      errorMessage: 'Amount must be a positive number',
    }
  }

  const amountRounded = Math.round(amountBu * 100) / 100

  const { data, error } = await supabase.rpc('debit_wallet', {
    p_user_id: userId,
    p_amount: amountRounded,
  })

  if (error && !isRpcNotFoundError(error)) {
    console.error('[wallet-balance] debit_wallet RPC error:', error)
    return {
      success: false,
      newBalance: 0,
      balanceBefore: 0,
      errorMessage: error.message || 'Failed to debit wallet',
    }
  }

  if (!error && data) {
    const row = Array.isArray(data) ? data[0] : data
    if (row) {
      const success = row.success === true
      let newBalance = Number(row.new_balance) ?? 0
      const balanceBefore = Number(row.balance_before) ?? 0
      const errorMessage = row.error_message ?? null
      // After debit, new_balance must be balance_before - amount. If RPC/driver swapped columns, use computed value.
      const expectedNew = Math.round((balanceBefore - amountRounded) * 100) / 100
      if (success && balanceBefore >= amountRounded && (newBalance >= balanceBefore || Math.abs(newBalance - expectedNew) > 0.01)) {
        newBalance = expectedNew
      }
      return { success, newBalance, balanceBefore, errorMessage }
    }
  }

  // Fallback: DB functions not deployed — debit via table read/update
  const { data: wallet, error: walletError } = await supabase
    .from('wallets')
    .select('balance, naira_balance')
    .eq('user_id', userId)
    .single()

  if (walletError || !wallet) {
    return {
      success: false,
      newBalance: 0,
      balanceBefore: 0,
      errorMessage: 'Wallet not found',
    }
  }

  const balanceBefore = parseFloat(wallet.balance || '0')
  const nairaBefore = parseFloat(wallet.naira_balance || '0')

  if (balanceBefore < amountRounded) {
    return {
      success: false,
      newBalance: 0,
      balanceBefore,
      errorMessage: 'Insufficient balance',
    }
  }

  const newBalance = Math.round((balanceBefore - amountRounded) * 100) / 100
  const newNaira = Math.round((nairaBefore - amountRounded) * 100) / 100

  const { error: updateError } = await supabase
    .from('wallets')
    .update({
      balance: newBalance.toString(),
      naira_balance: newNaira.toString(),
    })
    .eq('user_id', userId)

  if (updateError) {
    console.error('[wallet-balance] debit fallback update error:', updateError)
    return {
      success: false,
      newBalance: 0,
      balanceBefore,
      errorMessage: updateError.message || 'Failed to deduct from wallet',
    }
  }

  return {
    success: true,
    newBalance,
    balanceBefore,
    errorMessage: null,
  }
}

/**
 * Credit (add) BU to a user's main balance.
 * Tries RPC credit_wallet first; if DB functions are not deployed, uses table update/create.
 *
 * @param supabase - Supabase client (server-side)
 * @param userId - User ID whose wallet to credit
 * @param amountBu - Amount of BU to add (must be > 0)
 * @returns CreditResult with success, newBalance, balanceBefore, or errorMessage
 */
export async function creditMainBalance(
  supabase: SupabaseClient,
  userId: string,
  amountBu: number
): Promise<CreditResult> {
  if (amountBu <= 0 || !Number.isFinite(amountBu)) {
    return {
      success: false,
      newBalance: 0,
      balanceBefore: 0,
      errorMessage: 'Amount must be a positive number',
    }
  }

  const amountRounded = Math.round(amountBu * 100) / 100

  const { data, error } = await supabase.rpc('credit_wallet', {
    p_user_id: userId,
    p_amount: amountRounded,
  })

  if (error && !isRpcNotFoundError(error)) {
    console.error('[wallet-balance] credit_wallet RPC error:', error)
    return {
      success: false,
      newBalance: 0,
      balanceBefore: 0,
      errorMessage: error.message || 'Failed to credit wallet',
    }
  }

  if (!error && data) {
    const row = Array.isArray(data) ? data[0] : data
    if (row) {
      const success = row.success === true
      const newBalance = Number(row.new_balance) || 0
      const balanceBefore = Number(row.balance_before) ?? 0
      const errorMessage = row.error_message ?? null
      return { success, newBalance, balanceBefore, errorMessage }
    }
  }

  // Fallback: DB functions not deployed — ensure wallet exists, then credit
  let { data: wallet, error: walletError } = await supabase
    .from('wallets')
    .select('balance, naira_balance')
    .eq('user_id', userId)
    .single()

  if (!wallet && (walletError?.code === 'PGRST116' || !wallet)) {
    const { error: insertError } = await supabase.from('wallets').insert({
      user_id: userId,
      balance: '0',
      naira_balance: '0',
    })
    if (insertError) {
      return {
        success: false,
        newBalance: 0,
        balanceBefore: 0,
        errorMessage: insertError.message || 'Failed to create wallet',
      }
    }
    const { data: newWallet, error: fetchError } = await supabase
      .from('wallets')
      .select('balance, naira_balance')
      .eq('user_id', userId)
      .single()
    wallet = newWallet
    walletError = fetchError
  }

  if (walletError || !wallet) {
    return {
      success: false,
      newBalance: 0,
      balanceBefore: 0,
      errorMessage: 'Wallet not found',
    }
  }

  const balanceBefore = parseFloat(wallet.balance || '0')
  const nairaBefore = parseFloat(wallet.naira_balance || '0')
  const newBalance = Math.round((balanceBefore + amountRounded) * 100) / 100
  const newNaira = Math.round((nairaBefore + amountRounded) * 100) / 100

  const { error: updateError } = await supabase
    .from('wallets')
    .update({
      balance: newBalance.toString(),
      naira_balance: newNaira.toString(),
    })
    .eq('user_id', userId)

  if (updateError) {
    console.error('[wallet-balance] credit fallback update error:', updateError)
    return {
      success: false,
      newBalance: 0,
      balanceBefore,
      errorMessage: updateError.message || 'Failed to credit wallet',
    }
  }

  return {
    success: true,
    newBalance,
    balanceBefore,
    errorMessage: null,
  }
}
