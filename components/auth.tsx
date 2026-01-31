'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { User, Lock, Phone, Mail } from 'lucide-react'
import { authApi } from '@/lib/api-client'

interface AuthProps {
  onAuthSuccess: (user: { id: string; role: 'user' | 'celebrant' | 'vendor' | 'both'; phoneNumber: string; name: string }) => void
}

export default function Auth({ onAuthSuccess }: AuthProps) {
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [userRole, setUserRole] = useState<'user' | 'vendor' | 'both' | null>(null)
  const [formData, setFormData] = useState({
    phoneNumber: '',
    firstName: '',
    lastName: '',
    email: '',
    pin: '',
    confirmPin: '',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Normalize phone number to +234 format
  const normalizePhoneNumber = (phone: string): string => {
    // Remove all non-digit characters except +
    let cleaned = phone.replace(/[^\d+]/g, '')
    
    // If starts with 0, replace with +234
    if (cleaned.startsWith('0')) {
      cleaned = '+234' + cleaned.substring(1)
    }
    // If starts with 234, add +
    else if (cleaned.startsWith('234') && !cleaned.startsWith('+234')) {
      cleaned = '+' + cleaned
    }
    // If doesn't start with +, add +234
    else if (!cleaned.startsWith('+')) {
      cleaned = '+234' + cleaned
    }
    
    return cleaned
  }

  const handleRegister = async () => {
    if (!userRole) {
      alert('Please select a role')
      return
    }

    if (!formData.phoneNumber || !formData.firstName || !formData.lastName || !formData.pin) {
      alert('Please fill in all required fields')
      return
    }

    // Normalize phone number
    const normalizedPhone = normalizePhoneNumber(formData.phoneNumber)
    
    // Validate phone number format
    if (!/^\+234\d{10}$/.test(normalizedPhone)) {
      alert('Please enter a valid Nigerian phone number (e.g., 08123456789 or +2348123456789)')
      return
    }

    if (formData.pin.length !== 6 || !/^\d+$/.test(formData.pin)) {
      alert('PIN must be 6 digits')
      return
    }

    if (formData.pin !== formData.confirmPin) {
      alert('PINs do not match')
      return
    }

    setIsSubmitting(true)

    try {
      const response = await authApi.register({
        phone_number: normalizedPhone,
        first_name: formData.firstName,
        last_name: formData.lastName,
        email: formData.email || undefined,
        role: userRole,
        pin: formData.pin,
      })

      if (!response.success || !response.data?.user) {
        alert(response.error || 'Registration failed. Please try again.')
        setIsSubmitting(false)
        return
      }

      const user = response.data.user
      const fullName = `${user.first_name} ${user.last_name}`.trim()

      // Store user data in localStorage for session management
      // Don't store sensitive data in localStorage
      // JWT token is stored in httpOnly cookie by server
      // Store only minimal non-sensitive data in sessionStorage (cleared on tab close)
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('userRole', user.role)
        sessionStorage.setItem('userName', fullName)
      }

      setIsSubmitting(false)
      onAuthSuccess({
        id: user.id,
        role: user.role,
        phoneNumber: user.phone_number,
        name: fullName,
      })
    } catch (error: any) {
      console.error('Registration error:', error)
      alert(error.message || 'Registration failed. Please try again.')
      setIsSubmitting(false)
    }
  }

  const handleLogin = async () => {
    if (!formData.phoneNumber || !formData.pin) {
      alert('Please enter phone number and PIN')
      return
    }

    // Normalize phone number
    const normalizedPhone = normalizePhoneNumber(formData.phoneNumber)

    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/5302d33a-07c7-4c7f-8d80-24b4192edc7b',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'auth.tsx:122',message:'Login attempt started',data:{originalPhone:formData.phoneNumber,normalizedPhone:normalizedPhone,pinLength:formData.pin.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    // #endregion

    setIsSubmitting(true)

    try {
      const response = await authApi.login({
        phone_number: normalizedPhone,
        pin: formData.pin,
      })

      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/5302d33a-07c7-4c7f-8d80-24b4192edc7b',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'auth.tsx:137',message:'Login API response received',data:{success:response.success,hasUser:!!response.data?.user,error:response.error},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
      // #endregion

      if (!response.success || !response.data?.user) {
        alert(response.error || 'Invalid phone number or PIN')
        setIsSubmitting(false)
        return
      }

      const user = response.data.user
      const fullName = `${user.first_name} ${user.last_name}`.trim()

      // Don't store sensitive data in localStorage
      // JWT token is stored in httpOnly cookie by server
      // Store only minimal non-sensitive data in sessionStorage (cleared on tab close)
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('userRole', user.role)
        sessionStorage.setItem('userName', fullName)
      }

      setIsSubmitting(false)
      onAuthSuccess({
        id: user.id,
        role: user.role,
        phoneNumber: user.phone_number,
        name: fullName,
      })
    } catch (error: any) {
      console.error('Login error:', error)
      alert(error.message || 'Login failed. Please try again.')
      setIsSubmitting(false)
    }
  }

  if (mode === 'register' && !userRole) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <Card className="w-full max-w-md border-primary/20 bg-card p-6">
          <h2 className="mb-6 text-2xl font-bold text-center">Register</h2>
          <p className="mb-6 text-center text-sm text-muted-foreground">
            Select your role to continue
          </p>

          <div className="space-y-3">
            <Card
              onClick={() => setUserRole('user')}
              className="cursor-pointer border-primary/20 bg-card p-6 transition hover:border-primary/40 hover:bg-card/80"
            >
              <div className="flex items-center gap-4">
                <div className="rounded-full bg-primary/20 p-3">
                  <User className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold">User</h3>
                  <p className="text-sm text-muted-foreground">Guest + Celebrant (Not Vendor)</p>
                </div>
              </div>
            </Card>

            <Card
              onClick={() => setUserRole('vendor')}
              className="cursor-pointer border-primary/20 bg-card p-6 transition hover:border-primary/40 hover:bg-card/80"
            >
              <div className="flex items-center gap-4">
                <div className="rounded-full bg-primary/20 p-3">
                  <User className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold">Vendor</h3>
                  <p className="text-sm text-muted-foreground">Set up payment gateways</p>
                </div>
              </div>
            </Card>

            <Card
              onClick={() => setUserRole('both')}
              className="cursor-pointer border-primary/20 bg-card p-6 transition hover:border-primary/40 hover:bg-card/80"
            >
              <div className="flex items-center gap-4">
                <div className="rounded-full bg-primary/20 p-3">
                  <User className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold">Both</h3>
                  <p className="text-sm text-muted-foreground">Guest + Celebrant + Vendor</p>
                </div>
              </div>
            </Card>
          </div>

          <div className="mt-6 text-center">
            <button
              onClick={() => setMode('login')}
              className="text-sm text-primary"
            >
              Already have an account? Login
            </button>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md border-primary/20 bg-card p-6">
        <h2 className="mb-6 text-2xl font-bold text-center">
          {mode === 'login' ? 'Login' : `Register as ${userRole === 'user' ? 'User' : userRole === 'vendor' ? 'Vendor' : 'Both'}`}
        </h2>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-semibold mb-2 block">Phone Number *</label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-primary" />
              <Input
                type="text"
                inputMode="tel"
                placeholder="08123456789 or +2348123456789"
                value={formData.phoneNumber}
                onChange={(e) => {
                  let value = e.target.value.replace(/\s+/g, '') // Remove spaces
                  setFormData({ ...formData, phoneNumber: value })
                }}
                className="bg-secondary pl-10 text-foreground placeholder:text-muted-foreground"
              />
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              Enter Nigerian phone number (with or without +234)
            </p>
          </div>

          {mode === 'register' && (
            <>
              <div>
                <label className="text-sm font-semibold mb-2 block">First Name *</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-primary" />
                  <Input
                    type="text"
                    placeholder="Enter your first name"
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    className="bg-secondary pl-10 text-foreground placeholder:text-muted-foreground"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-semibold mb-2 block">Last Name *</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-primary" />
                  <Input
                    type="text"
                    placeholder="Enter your last name"
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    className="bg-secondary pl-10 text-foreground placeholder:text-muted-foreground"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-semibold mb-2 block">Email (Optional)</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-primary" />
                  <Input
                    type="text"
                    inputMode="email"
                    placeholder="your@email.com (optional)"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="bg-secondary pl-10 text-foreground placeholder:text-muted-foreground"
                  />
                </div>
              </div>
            </>
          )}

          <div>
            <label className="text-sm font-semibold mb-2 block">PIN *</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-primary" />
              <Input
                type="password"
                placeholder={mode === 'register' ? '6-digit PIN' : 'Enter your PIN'}
                value={formData.pin}
                onChange={(e) => setFormData({ ...formData, pin: e.target.value })}
                maxLength={6}
                className="bg-secondary pl-10 text-foreground placeholder:text-muted-foreground"
              />
            </div>
            {mode === 'register' && (
              <p className="mt-1 text-xs text-muted-foreground">
                Create a 6-digit PIN for secure transactions
              </p>
            )}
          </div>

          {mode === 'register' && (
            <div>
              <label className="text-sm font-semibold mb-2 block">Confirm PIN *</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-primary" />
                <Input
                  type="password"
                  placeholder="Confirm 6-digit PIN"
                  value={formData.confirmPin}
                  onChange={(e) => setFormData({ ...formData, confirmPin: e.target.value })}
                  maxLength={6}
                  className="bg-secondary pl-10 text-foreground placeholder:text-muted-foreground"
                />
              </div>
            </div>
          )}

          <Button
            onClick={mode === 'login' ? handleLogin : handleRegister}
            disabled={isSubmitting}
            className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
          >
            {isSubmitting ? 'Processing...' : mode === 'login' ? 'Login' : 'Register'}
          </Button>

          <div className="text-center">
            <button
              onClick={() => {
                setMode(mode === 'login' ? 'register' : 'login')
                setFormData({
                  phoneNumber: '',
                  firstName: '',
                  lastName: '',
                  email: '',
                  pin: '',
                  confirmPin: '',
                })
                if (mode === 'register') {
                  setUserRole(null)
                }
              }}
              className="text-sm text-primary"
            >
              {mode === 'login' ? "Don't have an account? Register" : 'Already have an account? Login'}
            </button>
          </div>
        </div>
      </Card>
    </div>
  )
}
