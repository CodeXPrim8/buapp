import { NextRequest, NextResponse } from 'next/server'
import { getAdminUser } from '@/lib/api-helpers'
import { supabase } from '@/lib/supabase'
import { successResponse, errorResponse } from '@/lib/api-helpers'
import { sendPushToUser } from '@/lib/push'

const PAYSTACK_BANKS_URL = 'https://api.paystack.co/bank?country=nigeria'
const PAYSTACK_RECIPIENT_URL = 'https://api.paystack.co/transferrecipient'
const PAYSTACK_TRANSFER_URL = 'https://api.paystack.co/transfer'

function normalizeBankName(name: string): string {
  return name
    .toLowerCase()
    .replace(/\b(plc|limited|ltd|nigeria|ng|bank)\b/gi, '')
    .replace(/[\s.-]+/g, ' ')
    .trim()
}

function findBankCode(bankName: string, banks: { name: string; code: string }[]): string | null {
  if (!bankName || !banks?.length) return null
  const normalized = normalizeBankName(bankName)
  const normalizedUser = bankName.toLowerCase().replace(/[\s.-]+/g, ' ')
  for (const bank of banks) {
    const n = normalizeBankName(bank.name)
    const b = bank.name.toLowerCase()
    if (
      n.includes(normalized) ||
      normalized.includes(n) ||
      b.includes(normalizedUser) ||
      normalizedUser.includes(b)
    ) {
      return bank.code
    }
  }
  return null
}

// Send Naira to user's bank account via Paystack Transfer
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const adminUser = await getAdminUser(request)
    if (!adminUser) {
      return errorResponse('Authentication required', 401)
    }

    const secretKey = process.env.PAYSTACK_SECRET_KEY
    if (!secretKey) {
      return errorResponse('Paystack is not configured. Set PAYSTACK_SECRET_KEY.', 500)
    }

    const { id } = params

    const { data: withdrawal, error: fetchError } = await supabase
      .from('withdrawals')
      .select('*')
      .eq('id', id)
      .single()

    if (fetchError || !withdrawal) {
      return errorResponse('Withdrawal not found', 404)
    }

    if (withdrawal.type !== 'bank') {
      return errorResponse('Paystack transfer is only for bank withdrawals', 400)
    }

    if (withdrawal.status !== 'pending' && withdrawal.status !== 'processing') {
      return errorResponse('Withdrawal is not pending or processing', 400)
    }

    const accountNumber = (withdrawal.account_number || '').toString().replace(/\s/g, '')
    const accountName = (withdrawal.account_name || '').trim()
    const bankName = (withdrawal.bank_name || '').trim()
    const nairaAmount = parseFloat(withdrawal.naira_amount?.toString() || '0')

    if (!accountNumber || !accountName || !bankName || nairaAmount <= 0) {
      return errorResponse('Invalid withdrawal bank details or amount', 400)
    }

    const amountKobo = Math.round(nairaAmount * 100)
    if (amountKobo < 100) {
      return errorResponse('Minimum transfer amount is ₦1', 400)
    }

    // 1. Fetch Paystack banks and resolve bank code
    const banksRes = await fetch(PAYSTACK_BANKS_URL)
    const banksData = await banksRes.json()
    const banksList: { name: string; code: string }[] = banksData.data || []
    const bankCode = findBankCode(bankName, banksList)

    if (!bankCode) {
      return errorResponse(
        `Bank "${bankName}" could not be matched to Paystack. Use manual transfer and mark as Complete.`,
        400
      )
    }

    // 2. Create transfer recipient
    const recipientRes = await fetch(PAYSTACK_RECIPIENT_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${secretKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: 'nuban',
        name: accountName,
        account_number: accountNumber,
        bank_code: bankCode,
        currency: 'NGN',
      }),
    })

    const recipientJson = await recipientRes.json()
    if (!recipientJson.status || !recipientJson.data?.recipient_code) {
      const msg =
        recipientJson.message || recipientJson.error || 'Failed to create transfer recipient'
      return errorResponse(
        `Paystack recipient error: ${msg}. Check account number and bank.`,
        400
      )
    }

    const recipientCode = recipientJson.data.recipient_code

    // 3. Initiate transfer
    const reference = `BU-WD-${id}-${Date.now()}`
    const transferRes = await fetch(PAYSTACK_TRANSFER_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${secretKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        source: 'balance',
        amount: amountKobo,
        recipient: recipientCode,
        reference,
        reason: `Bison Note withdrawal ${id}`,
      }),
    })

    const transferJson = await transferRes.json()
    if (!transferJson.status) {
      const msg = transferJson.message || transferJson.error || 'Transfer failed'
      return errorResponse(`Paystack transfer failed: ${msg}`, 400)
    }

    // 4. Mark withdrawal as completed and notify user
    const updateData = {
      status: 'completed',
      completed_at: new Date().toISOString(),
    }

    await supabase.from('withdrawals').update(updateData).eq('id', id)

    const notificationMessage = `Your withdrawal of Ƀ ${parseFloat(withdrawal.bu_amount || '0').toLocaleString()} has been completed.`
    await supabase.from('notifications').insert({
      user_id: withdrawal.user_id,
      type: 'withdrawal_completed',
      title: 'Withdrawal Completed',
      message: notificationMessage,
      amount: parseFloat(withdrawal.bu_amount || '0'),
      metadata: { withdrawal_id: withdrawal.id },
    })

    void sendPushToUser(withdrawal.user_id, {
      title: 'Withdrawal Completed',
      body: notificationMessage,
      data: { url: '/?page=notifications' },
    })

    return successResponse({
      message: 'Naira sent successfully via Paystack',
      withdrawalId: id,
      reference: transferJson.data?.reference || reference,
    })
  } catch (error: any) {
    console.error('Paystack transfer error:', error)
    return errorResponse(error?.message || 'Internal server error', 500)
  }
}
