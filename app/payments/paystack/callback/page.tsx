'use client'

import { Suspense, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { apiCall } from '@/lib/api-client'

type Status = 'idle' | 'verifying' | 'success' | 'error'

function PaystackCallbackContent() {
  const searchParams = useSearchParams()
  const reference = useMemo(() => {
    return searchParams.get('reference') || searchParams.get('trxref') || ''
  }, [searchParams])
  const [status, setStatus] = useState<Status>('idle')
  const [message, setMessage] = useState<string>('')

  useEffect(() => {
    if (!reference) {
      setStatus('error')
      setMessage('Missing payment reference. Please try again or contact support.')
      return
    }

    let cancelled = false
    const verify = async () => {
      setStatus('verifying')
      try {
        const verifyResponse = await apiCall('/payments/paystack/verify', {
          method: 'POST',
          body: JSON.stringify({ reference }),
        })

        if (cancelled) return

        if (!verifyResponse.success) {
          setStatus('error')
          setMessage(verifyResponse.error || 'Payment verification failed.')
          return
        }

        const walletBalance = verifyResponse.data?.wallet?.balance
        if (walletBalance != null && typeof window !== 'undefined') {
          const balanceStr = String(walletBalance)
          sessionStorage.setItem('cached_balance', balanceStr)
          sessionStorage.setItem('balance_updated_at', Date.now().toString())
          window.dispatchEvent(new CustomEvent('balance-updated', { detail: { balance: balanceStr } }))
        }

        setStatus('success')
        setMessage(verifyResponse.data?.message || 'Payment verified successfully.')
      } catch (error: any) {
        if (cancelled) return
        setStatus('error')
        setMessage(error?.message || 'Payment verification failed.')
      }
    }

    verify()
    return () => {
      cancelled = true
    }
  }, [reference])

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-gray-900 dark:to-slate-900">
      <div className="mx-auto max-w-xl px-6 py-12 text-center">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Paystack Payment
        </h1>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
          {status === 'verifying' && 'Verifying your payment...'}
          {status === 'success' && (message || 'Payment verified.')}
          {status === 'error' && (message || 'Payment verification failed.')}
        </p>

        <div className="mt-6 flex items-center justify-center gap-3">
          <Link
            href="/?page=wallet"
            className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
          >
            Go to Wallet
          </Link>
          <Link
            href="/"
            className="rounded-lg border border-border px-4 py-2 text-sm font-semibold text-foreground hover:bg-secondary"
          >
            Back Home
          </Link>
        </div>
      </div>
    </div>
  )
}

export default function PaystackCallbackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-gray-900 dark:to-slate-900 flex items-center justify-center">
        <p className="text-gray-600 dark:text-gray-300">Loading...</p>
      </div>
    }>
      <PaystackCallbackContent />
    </Suspense>
  )
}
