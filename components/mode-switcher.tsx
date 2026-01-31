'use client'

import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { User, Store, PartyPopper, Lock } from 'lucide-react'

interface ModeSwitcherProps {
  currentMode: 'user' | 'celebrant' | 'vendor'
  onModeChange: (mode: 'user' | 'celebrant' | 'vendor') => void
  userRole?: 'user' | 'celebrant' | 'vendor' | 'both' | 'admin' | 'superadmin'
}

export default function ModeSwitcher({
  currentMode,
  onModeChange,
  userRole,
}: ModeSwitcherProps) {
  const isVendor = userRole === 'vendor' || userRole === 'both' || userRole === 'admin' || userRole === 'superadmin'

  const handleVendorClick = () => {
    if (!isVendor) {
      alert('🔒 Vendor Mode Locked\n\nRegister as a Vendor to unlock this feature and start making money! Sign up with a Vendor account to access vendor features.')
      return
    }
    onModeChange('vendor')
  }

  return (
    <Card className="border-border bg-card p-4">
      <p className="mb-3 text-sm font-semibold text-muted-foreground">Select Mode</p>
      <div className="grid grid-cols-3 gap-2">
        <Button
          onClick={() => onModeChange('user')}
          variant={currentMode === 'user' ? 'default' : 'outline'}
          className="h-16 flex-col gap-2"
        >
          <User className="h-5 w-5" />
          <span className="text-xs">Guest</span>
        </Button>
        <Button
          onClick={() => onModeChange('celebrant')}
          variant={currentMode === 'celebrant' ? 'default' : 'outline'}
          className="h-16 flex-col gap-2"
        >
          <PartyPopper className="h-5 w-5" />
          <span className="text-xs">Celebrant</span>
        </Button>
        <Button
          onClick={handleVendorClick}
          variant={currentMode === 'vendor' ? 'default' : 'outline'}
          disabled={!isVendor}
          className={`h-16 flex-col gap-2 ${!isVendor ? 'opacity-60 cursor-not-allowed' : ''}`}
          title={!isVendor ? 'Register as Vendor to unlock' : 'Vendor Mode'}
        >
          {!isVendor ? (
            <>
              <Lock className="h-5 w-5" />
              <span className="text-xs">Vendor</span>
            </>
          ) : (
            <>
              <Store className="h-5 w-5" />
              <span className="text-xs">Vendor</span>
            </>
          )}
        </Button>
      </div>
      {!isVendor && (
        <p className="mt-2 text-xs text-muted-foreground text-center">
          💰 Register as Vendor to unlock and make money
        </p>
      )}
    </Card>
  )
}
