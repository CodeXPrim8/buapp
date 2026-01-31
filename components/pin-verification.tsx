'use client'

import { useState, useRef, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Lock, X } from 'lucide-react'

interface PinVerificationProps {
  onVerify: (pin: string) => void
  onCancel: () => void
  title?: string
  description?: string
}

export default function PinVerification({ 
  onVerify, 
  onCancel, 
  title = 'Enter PIN',
  description = 'Enter your 6-digit PIN to confirm this transaction'
}: PinVerificationProps) {
  const [pin, setPin] = useState<string[]>(['', '', '', '', '', ''])
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])
  const [isVerifying, setIsVerifying] = useState(false)

  useEffect(() => {
    inputRefs.current[0]?.focus()
  }, [])

  const handlePinChange = (index: number, value: string) => {
    if (value.length > 1) {
      // Handle paste
      const pastedPin = value.slice(0, 6).split('')
      const newPin = [...pin]
      pastedPin.forEach((digit, i) => {
        if (index + i < 6 && /^\d$/.test(digit)) {
          newPin[index + i] = digit
        }
      })
      setPin(newPin)
      const nextIndex = Math.min(index + pastedPin.length, 5)
      inputRefs.current[nextIndex]?.focus()
      return
    }

    if (!/^\d$/.test(value) && value !== '') return

    const newPin = [...pin]
    newPin[index] = value
    setPin(newPin)

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus()
    }

    // Auto-submit when all 6 digits are entered (with small delay to prevent double submission)
    if (newPin.every(digit => digit !== '') && index === 5) {
      setTimeout(() => {
        handleVerify(newPin.join(''))
      }, 100)
    }
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !pin[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  const handleVerify = (pinValue?: string) => {
    const pinToVerify = pinValue || pin.join('')
    if (pinToVerify.length === 6 && !isVerifying) {
      // Prevent double submission
      setIsVerifying(true)
      
      // PIN verification happens on the backend
      // Just pass the PIN to the callback - the API will verify it
      onVerify(pinToVerify)
      // Reset after a delay to allow for error handling
      setTimeout(() => {
        setIsVerifying(false)
      }, 2000)
    }
  }

  const handleClear = () => {
    setPin(['', '', '', '', '', ''])
    inputRefs.current[0]?.focus()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <Card className="w-full max-w-md border-primary/20 bg-card p-6">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-primary/20 p-2">
              <Lock className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold">{title}</h3>
              <p className="text-xs text-muted-foreground">{description}</p>
            </div>
          </div>
          <button
            onClick={onCancel}
            className="rounded-full p-1 hover:bg-secondary"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mb-6 flex justify-center gap-2">
          {pin.map((digit, index) => (
            <input
              key={index}
              ref={(el) => (inputRefs.current[index] = el)}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handlePinChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              className="h-14 w-14 rounded-lg border-2 border-primary/30 bg-secondary text-center text-2xl font-bold text-foreground focus:border-primary focus:outline-none"
            />
          ))}
        </div>

        <div className="flex gap-2">
          <Button
            onClick={handleClear}
            variant="outline"
            className="flex-1"
          >
            Clear
          </Button>
          <Button
            onClick={() => handleVerify()}
            disabled={pin.some(digit => digit === '') || isVerifying}
            className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
          >
            {isVerifying ? 'Verifying...' : 'Verify'}
          </Button>
        </div>
      </Card>
    </div>
  )
}
