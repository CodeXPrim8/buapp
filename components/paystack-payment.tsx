'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { apiCall } from '@/lib/api-client'

interface PaystackPaymentProps {
  amount?: number
  onSuccess?: () => void
  onCancel?: () => void
}

declare global {
  interface Window {
    PaystackPop: {
      setup: (options: {
        key: string
        email: string
        amount: number
        ref: string
        callback: (response: any) => void
        onClose: () => void
      }) => {
        openIframe: () => void
      }
    }
  }
}

export default function PaystackPayment({ amount: initialAmount, onSuccess, onCancel }: PaystackPaymentProps) {
  const [amount, setAmount] = useState(initialAmount?.toString() || '')
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [initializing, setInitializing] = useState(false)
  const [error, setError] = useState('')
  const [scriptLoaded, setScriptLoaded] = useState(false)

  useEffect(() => {
    // Check if Paystack is already loaded
    if (window.PaystackPop) {
      setScriptLoaded(true)
      return
    }

    // Check if script is already in the document
    const existingScript = document.querySelector('script[src="https://js.paystack.co/v1/inline.js"]')
    if (existingScript) {
      // Script exists, wait for it to load
      let checkCount = 0
      const maxChecks = 50 // 5 seconds
      const checkPaystack = setInterval(() => {
        checkCount++
        if (window.PaystackPop) {
          setScriptLoaded(true)
          clearInterval(checkPaystack)
        } else if (checkCount >= maxChecks) {
          clearInterval(checkPaystack)
          console.error('Paystack script failed to load after timeout')
          setError('Payment gateway failed to load. Please refresh the page.')
        }
      }, 100)

      return () => clearInterval(checkPaystack)
    }

    // Load Paystack inline JS
    const script = document.createElement('script')
    script.src = 'https://js.paystack.co/v1/inline.js'
    script.async = true
    
    let checkCount = 0
    const maxChecks = 50 // 5 seconds
    
    script.onload = () => {
      // Wait for PaystackPop to be available
      const checkPaystack = setInterval(() => {
        checkCount++
        if (window.PaystackPop) {
          setScriptLoaded(true)
          clearInterval(checkPaystack)
        } else if (checkCount >= maxChecks) {
          clearInterval(checkPaystack)
          console.error('PaystackPop not available after script load')
          setError('Payment gateway failed to initialize. Please refresh the page.')
        }
      }, 100)
    }

    script.onerror = () => {
      console.error('Failed to load Paystack script')
      setError('Failed to load payment gateway. Please check your internet connection and try again.')
    }

    document.body.appendChild(script)
  }, [])

  const handlePayment = async () => {
    // Validate inputs
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      setError('Please enter a valid amount (minimum ₦100)')
      return
    }

    if (Number(amount) < 100) {
      setError('Minimum top-up amount is ₦100')
      return
    }

    if (!email || !email.includes('@')) {
      setError('Please enter a valid email address')
      return
    }

    try {
      setLoading(true)
      setError('')

      // Initialize Paystack payment
      const response = await apiCall('/payments/paystack/initialize', {
        method: 'POST',
        body: JSON.stringify({
          amount: Number(amount) * 100, // Convert to kobo (Paystack uses kobo)
          email: email,
        }),
      })

      if (!response.success || !response.data?.reference || !response.data?.public_key) {
        setError(response.error || 'Failed to initialize payment. Please try again.')
        setLoading(false)
        return
      }

      // Wait for Paystack script to be loaded
      setInitializing(true)
      
      console.log('Waiting for Paystack script to load...')
      
      // Wait for script to be loaded (with retries)
      let retries = 0
      const maxRetries = 50 // 5 seconds total
      while (!window.PaystackPop && retries < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, 100))
        retries++
        if (retries % 10 === 0) {
          console.log(`Still waiting for PaystackPop... (${retries}/${maxRetries})`)
        }
      }

      if (!window.PaystackPop) {
        console.error('PaystackPop not available after initialization')
        console.log('Checking script tag:', document.querySelector('script[src*="paystack"]'))
        setError('Payment gateway failed to load. Please refresh the page and try again.')
        setInitializing(false)
        setLoading(false)
        return
      }

      console.log('PaystackPop is available, opening payment gateway...')
      // Clear initializing state before opening payment
      setInitializing(false)

      // Define callback function separately (Paystack doesn't support async callbacks directly)
      const handlePaymentCallback = (paymentResponse: any) => {
        // Handle payment verification asynchronously
        ;(async () => {
          try {
            setLoading(true)
            // Verify payment on server
            const verifyResponse = await apiCall('/payments/paystack/verify', {
              method: 'POST',
              body: JSON.stringify({
                reference: paymentResponse.reference,
              }),
            })

            if (verifyResponse.success) {
              // Payment successful
              setLoading(false)
              setInitializing(false)
              if (onSuccess) {
                onSuccess()
              } else {
                // Redirect to wallet page
                window.location.href = '/?page=wallet'
              }
            } else {
              setError(verifyResponse.error || 'Payment verification failed. Please contact support.')
              setLoading(false)
              setInitializing(false)
            }
          } catch (verifyError: any) {
            console.error('Payment verification error:', verifyError)
            setError('Payment verification failed. Please contact support.')
            setLoading(false)
            setInitializing(false)
          }
        })()
      }

      try {
        const handler = window.PaystackPop.setup({
          key: response.data.public_key, // Paystack public key
          email: email,
          amount: Number(amount) * 100, // Amount in kobo
          ref: response.data.reference,
          callback: handlePaymentCallback, // Pass function reference, not async function
          onClose: () => {
            setLoading(false)
            setInitializing(false)
            if (onCancel) {
              onCancel()
            }
          },
        })

        handler.openIframe()
        // Clear loading state since payment popup is opening
        setLoading(false)
      } catch (setupError: any) {
        console.error('Paystack setup error:', setupError)
        setError('Failed to open payment gateway. Please try again.')
        setLoading(false)
        setInitializing(false)
      }
    } catch (error: any) {
      console.error('Payment initialization error:', error)
      setError(error.message || 'Failed to initialize payment. Please try again.')
      setLoading(false)
      setInitializing(false)
    }
  }

  return (
    <div className="space-y-6 pb-24 pt-4">
      {/* Header */}
      <div className="flex items-center gap-4">
        {onCancel && (
          <button
            onClick={onCancel}
            className="text-xl text-foreground transition hover:text-primary"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
        )}
        <h1 className="text-lg font-bold text-primary">Fund Wallet with Paystack</h1>
      </div>

      {/* Payment Form */}
      <Card className="border-primary/20 bg-card p-6">
        <div className="space-y-4">
          <div>
            <label className="mb-2 block text-sm font-semibold">Amount (₦)</label>
            <Input
              type="number"
              placeholder="Enter amount (minimum ₦100)"
              value={amount}
              onChange={(e) => {
                setAmount(e.target.value)
                setError('')
              }}
              min="100"
              step="1"
              className="bg-secondary text-foreground placeholder:text-muted-foreground"
              disabled={loading || initializing}
            />
            <p className="mt-1 text-xs text-muted-foreground">
              Minimum top-up amount is ₦100
            </p>
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold">Email Address</label>
            <Input
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value)
                setError('')
              }}
              className="bg-secondary text-foreground placeholder:text-muted-foreground"
              disabled={loading || initializing}
            />
            <p className="mt-1 text-xs text-muted-foreground">
              We'll send your payment receipt to this email
            </p>
          </div>

          {error && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          <Button
            onClick={handlePayment}
            disabled={loading || initializing || !amount || !email}
            className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
          >
            {loading || initializing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {initializing ? 'Opening Payment Gateway...' : 'Processing...'}
              </>
            ) : (
              `Pay ₦${amount ? Number(amount).toLocaleString() : '0'}`
            )}
          </Button>

          <p className="text-center text-xs text-muted-foreground">
            Secure payment powered by Paystack
          </p>
        </div>
      </Card>

      {/* Payment Info */}
      <Card className="border-border/50 bg-card/50 p-4">
        <h3 className="mb-2 font-semibold">Payment Information</h3>
        <ul className="space-y-1 text-sm text-muted-foreground">
          <li>• Secure payment processing</li>
          <li>• Instant wallet credit</li>
          <li>• Payment receipt via email</li>
          <li>• Support for cards, bank transfers, and mobile money</li>
        </ul>
      </Card>
    </div>
  )
}
