'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ArrowRight, CheckCircle, AlertCircle } from 'lucide-react'

interface BuyBUProps {
  onComplete?: (amount: number) => void
}

export default function BuyBU({ onComplete }: BuyBUProps) {
  const [step, setStep] = useState<'conversion' | 'checkout' | 'success'>('conversion')
  const [nairaAmount, setNairaAmount] = useState('')
  const [buAmount, setBUAmount] = useState(0)
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'bank' | 'wallet'>('card')

  const conversionRate = 1 // 1 ɃU = ₦1

  const handleConvert = () => {
    if (nairaAmount && !isNaN(Number(nairaAmount)) && Number(nairaAmount) > 0) {
      const naira = Number(nairaAmount)
      const bu = Math.floor(naira / conversionRate)
      setBUAmount(bu)
      setStep('checkout')
    }
  }

  const handleCheckout = async () => {
    try {
      // TODO: Implement payment processing API
      // For now, show message that feature is coming soon
      alert('Payment processing feature is coming soon. API integration pending.')
      // setStep('success')
      // if (onComplete) {
      //   onComplete(buAmount)
      // }
    } catch (error: any) {
      console.error('Payment processing failed:', error)
      alert('Payment processing failed. Please try again.')
    }
  }

  if (step === 'conversion') {
    return (
      <div className="space-y-6 pb-24 pt-4">
        <div className="px-4">
          <h2 className="text-xl font-bold mb-4">Buy ɃU</h2>
          
          {/* Conversion Rate Info */}
          <Card className="border-primary/20 bg-gradient-to-br from-primary/10 to-primary/5 p-6 mb-4">
            <div className="space-y-2">
              <h3 className="font-semibold">Conversion Rate</h3>
              <p className="text-2xl font-bold text-primary">1 Ƀ = ₦1</p>
              <p className="text-sm text-muted-foreground">
                Enter the amount in Naira you want to convert to ɃU
              </p>
            </div>
          </Card>

          {/* Conversion Form */}
          <Card className="border-primary/20 bg-card p-6">
            <div className="space-y-4">
              <div>
                <label className="text-sm font-semibold">Amount in Naira (₦)</label>
                <Input
                  type="number"
                  placeholder="Enter amount"
                  value={nairaAmount}
                  onChange={(e) => setNairaAmount(e.target.value)}
                  className="mt-2 bg-secondary text-foreground placeholder:text-muted-foreground"
                />
              </div>

              {nairaAmount && !isNaN(Number(nairaAmount)) && Number(nairaAmount) > 0 && (
                <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-muted-foreground">You will receive:</span>
                    <span className="text-xl font-bold text-primary">
                      Ƀ {Math.floor(Number(nairaAmount) / conversionRate).toLocaleString()}
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    ₦{Number(nairaAmount).toLocaleString()} ÷ {conversionRate} = Ƀ {Math.floor(Number(nairaAmount) / conversionRate).toLocaleString()}
                  </div>
                </div>
              )}

              <Button
                onClick={handleConvert}
                disabled={!nairaAmount || isNaN(Number(nairaAmount)) || Number(nairaAmount) <= 0}
                className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
              >
                Proceed to Checkout
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </Card>
        </div>
      </div>
    )
  }

  if (step === 'checkout') {
    return (
      <div className="space-y-6 pb-24 pt-4">
        <div className="px-4">
          <div className="mb-4">
            <Button
              onClick={() => setStep('conversion')}
              variant="outline"
              className="w-full"
            >
              ← Back
            </Button>
          </div>

          <h2 className="text-xl font-bold mb-4">Checkout</h2>

          {/* Order Summary */}
          <Card className="border-primary/20 bg-card p-6 mb-4">
            <h3 className="font-semibold mb-4">Order Summary</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Amount:</span>
                <span className="font-semibold">₦{Number(nairaAmount).toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Bison Units:</span>
                <span className="font-bold text-primary">Ƀ {buAmount.toLocaleString()}</span>
              </div>
              <div className="border-t border-border pt-3 flex justify-between">
                <span className="font-semibold">Total:</span>
                <span className="text-xl font-bold text-primary">₦{Number(nairaAmount).toLocaleString()}</span>
              </div>
            </div>
          </Card>

          {/* Payment Method */}
          <Card className="border-primary/20 bg-card p-6 mb-4">
            <h3 className="font-semibold mb-4">Payment Method</h3>
            <div className="space-y-2">
              {[
                { id: 'card', label: '💳 Debit/Credit Card', value: 'card' },
                { id: 'bank', label: '🏦 Bank Transfer', value: 'bank' },
                { id: 'wallet', label: '💰 Wallet Balance', value: 'wallet' },
              ].map((method) => (
                <button
                  key={method.id}
                  onClick={() => setPaymentMethod(method.value as 'card' | 'bank' | 'wallet')}
                  className={`w-full text-left p-3 rounded-lg border transition ${
                    paymentMethod === method.value
                      ? 'border-primary bg-primary/10'
                      : 'border-border bg-card'
                  }`}
                >
                  {method.label}
                </button>
              ))}
            </div>
          </Card>

          {/* Payment Button */}
          <Button
            onClick={handleCheckout}
            className="w-full bg-primary py-6 text-primary-foreground hover:bg-primary/90"
          >
            Confirm Payment
          </Button>
        </div>
      </div>
    )
  }

  if (step === 'success') {
    return (
      <div className="space-y-6 pb-24 pt-4">
        <div className="px-4">
          <Card className="border-green-400/30 bg-green-400/10 p-8 text-center">
            <CheckCircle className="h-16 w-16 text-green-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Payment Successful!</h2>
            <p className="text-muted-foreground mb-4">
              Your ɃU balance has been updated
            </p>
            <div className="bg-background/50 rounded-lg p-4 mb-4">
              <p className="text-sm text-muted-foreground">Bison Units Added</p>
              <p className="text-3xl font-bold text-primary">Ƀ {buAmount.toLocaleString()}</p>
            </div>
            <Button
              onClick={() => {
                setStep('conversion')
                setNairaAmount('')
                setBUAmount(0)
              }}
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
            >
              Buy More ɃU
            </Button>
          </Card>
        </div>
      </div>
    )
  }

  return null
}
