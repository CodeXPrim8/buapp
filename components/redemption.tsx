'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Banknote, CheckCircle, AlertCircle, Wallet, Building2, Clock, Loader2 } from 'lucide-react'
import { withdrawalsApi } from '@/lib/api-client'
import PinVerification from '@/components/pin-verification'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'

const NIGERIAN_BANKS = [
  'Access Bank Plc',
  'Citibank Nigeria Limited',
  'Ecobank Nigeria Plc',
  'Fidelity Bank Plc',
  'First Bank of Nigeria Limited',
  'First City Monument Bank Plc',
  'Globus Bank Limited',
  'Guaranty Trust Bank Plc',
  'Keystone Bank Limited',
  'Nova Commercial Bank Limited',
  'Optimus Bank Limited',
  'Parallex Bank Limited',
  'Polaris Bank Limited',
  'Premium Trust Bank Limited',
  'Providus Bank Limited',
  'Signature Bank Limited',
  'Stanbic IBTC Bank Plc',
  'Standard Chartered Bank Nigeria Limited',
  'Sterling Bank Plc',
  'SunTrust Bank Nigeria Limited',
  'Titan Trust Bank Limited',
  'Union Bank of Nigeria Plc',
  'Unity Bank Plc',
  'Wema Bank Plc',
  'Zenith Bank Plc',
]

interface WithdrawalRequest {
  id: string
  buAmount: number
  nairaAmount: number
  type: 'wallet' | 'bank'
  bankName?: string
  accountNumber?: string
  accountName?: string
  walletAddress?: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  date: string
  completedDate?: string
}

interface RedemptionProps {
  allowWalletWithdrawal?: boolean // Only true when accessed from celebrant-event-info
  eventId?: string // Event ID if withdrawing from specific event
  eventName?: string // Event name
  eventBalance?: number // Event balance to withdraw
  eventWithdrawn?: boolean // Whether event has already been withdrawn
}

export default function Redemption({ 
  allowWalletWithdrawal = false,
  eventId,
  eventName,
  eventBalance,
  eventWithdrawn = false
}: RedemptionProps) {
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [receiptWithdrawal, setReceiptWithdrawal] = useState<WithdrawalRequest | null>(null)

  // Fetch withdrawals from API
  useEffect(() => {
    const fetchWithdrawals = async () => {
      try {
        setLoading(true)
        const response = await withdrawalsApi.list(50, 0)
        if (response.success && response.data?.withdrawals) {
          const formattedWithdrawals: WithdrawalRequest[] = response.data.withdrawals.map((w: any) => ({
            id: w.id,
            buAmount: parseFloat(w.bu_amount?.toString() || '0'),
            nairaAmount: parseFloat(w.naira_amount?.toString() || '0'),
            type: w.type,
            bankName: w.bank_name || undefined,
            accountNumber: w.account_number ? `****${w.account_number.slice(-4)}` : undefined,
            accountName: w.account_name || undefined,
            walletAddress: w.wallet_address || undefined,
            status: w.status,
            date: new Date(w.created_at).toISOString().split('T')[0],
            completedDate: w.completed_at ? new Date(w.completed_at).toISOString().split('T')[0] : undefined,
          }))
          setWithdrawals(formattedWithdrawals)
        }
      } catch (error) {
        console.error('Failed to fetch withdrawals:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchWithdrawals()
  }, [])

  const [withdrawalType, setWithdrawalType] = useState<'wallet' | 'bank' | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [showPinVerification, setShowPinVerification] = useState(false)
  const [pendingWithdrawal, setPendingWithdrawal] = useState<any>(null)
  const [form, setForm] = useState({
    buAmount: '',
    bankName: 'GTBank',
    accountNumber: '',
    accountName: '',
    walletAddress: '',
  })

  const handleWithdraw = () => {
    if (!withdrawalType) return

    const isValid =
      form.buAmount &&
      !isNaN(Number(form.buAmount)) &&
      Number(form.buAmount) > 0 &&
      (withdrawalType === 'bank'
        ? form.accountNumber && form.accountName
        : form.walletAddress)

    if (!isValid) return

    const buAmount = Number(form.buAmount)
    
    // If withdrawing from event, validate amount doesn't exceed event balance
    if (eventId && eventBalance !== undefined) {
      if (buAmount > eventBalance) {
        alert(`Cannot withdraw more than event balance (Ƀ ${eventBalance.toLocaleString()})`)
        return
      }
      if (eventWithdrawn) {
        alert('This event has already been withdrawn')
        return
      }
    }

    // Store withdrawal data and show PIN verification
    setPendingWithdrawal({
      bu_amount: buAmount,
      naira_amount: buAmount, // 1 ɃU = ₦1
      type: withdrawalType,
      ...(eventId && { event_id: eventId }),
      ...(withdrawalType === 'bank' ? {
        bank_name: form.bankName,
        account_number: form.accountNumber,
        account_name: form.accountName,
      } : {
        wallet_address: form.walletAddress,
      }),
    })
    setShowPinVerification(true)
  }

  const mapApiWithdrawal = (w: any): WithdrawalRequest => ({
    id: w.id,
    buAmount: parseFloat(w.bu_amount?.toString() || '0'),
    nairaAmount: parseFloat(w.naira_amount?.toString() || '0'),
    type: w.type,
    bankName: w.bank_name || undefined,
    accountNumber: w.account_number ? `****${w.account_number.slice(-4)}` : undefined,
    accountName: w.account_name || undefined,
    walletAddress: w.wallet_address || undefined,
    status: w.status,
    date: new Date(w.created_at).toISOString().split('T')[0],
    completedDate: w.completed_at ? new Date(w.completed_at).toISOString().split('T')[0] : undefined,
  })

  const handlePinVerified = async (pin: string) => {
    if (!pendingWithdrawal) return

    setShowPinVerification(false)

    try {
      const response = await withdrawalsApi.create({
        ...pendingWithdrawal,
        pin,
      })
      
      if (response.success) {
        // Show receipt from API response
        const created = response.data?.withdrawal
        if (created) {
          setReceiptWithdrawal(mapApiWithdrawal(created))
        }
        // Update balance cache after withdrawal (balance will decrease)
        try {
          const { walletApi } = await import('@/lib/api-client')
          const balanceResponse = await walletApi.getMe()
          if (balanceResponse.success && balanceResponse.data?.wallet) {
            const newBalance = parseFloat(balanceResponse.data.wallet.balance || '0')
            if (typeof window !== 'undefined') {
              sessionStorage.setItem('cached_balance', newBalance.toString())
              sessionStorage.setItem('balance_updated_at', Date.now().toString())
              window.dispatchEvent(new CustomEvent('balance-updated', { detail: { balance: newBalance.toString() } }))
            }
          }
        } catch (error) {
          console.error('Failed to update balance cache:', error)
        }
        
        // Refresh withdrawals list
        const withdrawalsResponse = await withdrawalsApi.list(50, 0)
        if (withdrawalsResponse.success && withdrawalsResponse.data?.withdrawals) {
          const formattedWithdrawals: WithdrawalRequest[] = withdrawalsResponse.data.withdrawals.map((w: any) => mapApiWithdrawal(w))
          setWithdrawals(formattedWithdrawals)
        }

        setForm({
          buAmount: '',
          bankName: '',
          accountNumber: '',
          accountName: '',
          walletAddress: '',
        })
        setShowForm(false)
        setWithdrawalType(null)
        setPendingWithdrawal(null)
      } else {
        alert(response.error || 'Failed to create withdrawal request')
        setPendingWithdrawal(null)
      }
    } catch (error: any) {
      console.error('Failed to create withdrawal:', error)
      alert('Failed to create withdrawal request. Please try again.')
      setPendingWithdrawal(null)
    }
  }

  const handleSelectType = (type: 'wallet' | 'bank') => {
    setWithdrawalType(type)
    setShowForm(true)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-green-400'
      case 'processing':
        return 'text-yellow-400'
      default:
        return 'text-gray-400'
    }
  }

  const getStatusBg = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-400/10'
      case 'processing':
        return 'bg-yellow-400/10'
      default:
        return 'bg-gray-400/10'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-400" />
      case 'processing':
        return <Loader2 className="h-4 w-4 text-yellow-400 animate-spin" />
      default:
        return <Clock className="h-4 w-4 text-gray-400" />
    }
  }

  return (
    <div className="space-y-6 pb-24 pt-4">
      {/* Info Card */}
      <Card className="border-primary/20 bg-gradient-to-br from-primary/10 to-primary/5 p-6">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-semibold">Withdraw ɃU</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              {eventId 
                ? `Withdraw ɃU from this event to your ɃU wallet or bank account. This will add the amount to your main balance.`
                : 'Withdraw your ɃU to your ɃU wallet or bank account. Physical Bison Notes are ceremonial tokens and cannot be redeemed.'}
            </p>
            {eventId && eventBalance !== undefined && (
              <div className="mt-4 rounded-lg border border-green-400/30 bg-green-400/10 p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">Event Balance</p>
                    <p className="text-lg font-bold text-green-400">
                      Ƀ {eventBalance.toLocaleString()}
                    </p>
                  </div>
                  {eventWithdrawn && (
                    <span className="rounded-full bg-blue-400/20 px-3 py-1 text-xs text-blue-400">
                      Already Withdrawn
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
          <Banknote className="h-6 w-6 text-primary" />
        </div>
        <div className="mt-4 rounded-lg bg-background/50 p-3">
          <p className="text-xs text-muted-foreground">Conversion Rate</p>
          <p className="mt-1 text-lg font-bold text-primary">1 Ƀ = ₦1</p>
        </div>
        <div className="mt-4 rounded-lg border border-yellow-400/30 bg-yellow-400/10 p-3">
          <div className="flex items-start gap-2">
            <AlertCircle className="h-4 w-4 text-yellow-400 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-yellow-400">
              Note: Physical Bison Notes are ceremonial tokens with zero monetary value. Only ɃU in your wallet can be withdrawn.
            </p>
          </div>
        </div>
      </Card>

      {/* Withdrawal Type Selection */}
      {!withdrawalType && !showForm && (
        <div className={allowWalletWithdrawal ? "grid grid-cols-2 gap-3" : "grid grid-cols-1 gap-3"}>
          {allowWalletWithdrawal && (
            <Card
              onClick={() => handleSelectType('wallet')}
              className="cursor-pointer border-primary/20 bg-card p-6 transition hover:border-primary/40 hover:bg-card/80"
            >
              <div className="flex flex-col items-center text-center">
                <div className="mb-3 rounded-full bg-primary/20 p-3">
                  <Wallet className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold mb-1">To ɃU Wallet</h3>
                <p className="text-xs text-muted-foreground">
                  Instant transfer to your ɃU wallet
                </p>
              </div>
            </Card>
          )}

          <Card
            onClick={() => handleSelectType('bank')}
            className="cursor-pointer border-primary/20 bg-card p-6 transition hover:border-primary/40 hover:bg-card/80"
          >
            <div className="flex flex-col items-center text-center">
              <div className="mb-3 rounded-full bg-primary/20 p-3">
                <Building2 className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold mb-1">To Bank Account</h3>
              <p className="text-xs text-muted-foreground">
                Transfer to your bank account
              </p>
            </div>
          </Card>
        </div>
      )}

      {/* Withdrawal Form */}
      {showForm && withdrawalType && (
        <Card className="border-primary/20 space-y-4 bg-card p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold">
              Withdraw to {withdrawalType === 'wallet' ? 'ɃU Wallet' : 'Bank Account'}
            </h3>
            <Button
              onClick={() => {
                setShowForm(false)
                setWithdrawalType(null)
              }}
              variant="ghost"
              size="sm"
            >
              ← Back
            </Button>
          </div>

          <div>
            <label className="text-sm font-semibold">Amount to Withdraw (ɃU) *</label>
            <Input
              type="number"
              placeholder={eventBalance !== undefined ? `Max: Ƀ ${eventBalance.toLocaleString()}` : "Enter ɃU amount"}
              value={form.buAmount}
              onChange={(e) => setForm({ ...form, buAmount: e.target.value })}
              max={eventBalance !== undefined ? eventBalance : undefined}
              className="mt-2 bg-secondary text-foreground placeholder:text-muted-foreground"
            />
            {eventBalance !== undefined && (
              <div className="mt-2 flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setForm({ ...form, buAmount: String(eventBalance) })}
                  className="text-xs"
                >
                  Use Full Balance
                </Button>
              </div>
            )}
            {form.buAmount && !isNaN(Number(form.buAmount)) && (
              <p className="mt-1 text-xs text-muted-foreground">
                You will receive: ₦{Number(form.buAmount).toLocaleString('en-NG')}
                {eventId && eventBalance !== undefined && (
                  <span className="block mt-1">
                    {Number(form.buAmount) === eventBalance 
                      ? 'This will mark the event as fully withdrawn'
                      : `Remaining in event: Ƀ ${(eventBalance - Number(form.buAmount)).toLocaleString()}`
                    }
                  </span>
                )}
              </p>
            )}
          </div>

          {withdrawalType === 'wallet' ? (
            <>
              <div>
                <label className="text-sm font-semibold">ɃU Wallet Address *</label>
                <Input
                  placeholder="Enter ɃU wallet address"
                  value={form.walletAddress}
                  onChange={(e) => setForm({ ...form, walletAddress: e.target.value })}
                  className="mt-2 bg-secondary text-foreground placeholder:text-muted-foreground"
                />
                <p className="mt-1 text-xs text-muted-foreground">
                  Transfer will be instant to your ɃU wallet
                </p>
              </div>
            </>
          ) : (
            <>
              <div>
                <label className="text-sm font-semibold">Full Name *</label>
                <Input
                  placeholder="Enter your full name"
                  value={form.accountName}
                  onChange={(e) => setForm({ ...form, accountName: e.target.value })}
                  className="mt-2 bg-secondary text-foreground placeholder:text-muted-foreground"
                />
              </div>

              <div>
                <label className="text-sm font-semibold">Bank Name *</label>
                <Input
                  list="nigerian-banks"
                  placeholder="Start typing to search or enter bank name"
                  value={form.bankName}
                  onChange={(e) => setForm({ ...form, bankName: e.target.value })}
                  className="mt-2 bg-secondary text-foreground placeholder:text-muted-foreground"
                />
                <datalist id="nigerian-banks">
                  {NIGERIAN_BANKS.map((bank) => (
                    <option key={bank} value={bank} />
                  ))}
                </datalist>
              </div>

              <div>
                <label className="text-sm font-semibold">Account Number *</label>
                <Input
                  type="number"
                  placeholder="Enter account number"
                  value={form.accountNumber}
                  onChange={(e) => setForm({ ...form, accountNumber: e.target.value })}
                  className="mt-2 bg-secondary text-foreground placeholder:text-muted-foreground"
                />
              </div>

              <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-3">
                <p className="text-xs text-destructive">
                  Please verify your bank details carefully. Incorrect details may result in
                  failed transactions.
                </p>
              </div>
            </>
          )}

          <div className="flex gap-2">
            <Button
              onClick={handleWithdraw}
              disabled={
                !form.buAmount ||
                isNaN(Number(form.buAmount)) ||
                Number(form.buAmount) <= 0 ||
                (withdrawalType === 'bank'
                  ? !form.accountNumber || !form.accountName
                  : !form.walletAddress)
              }
              className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {withdrawalType === 'wallet' ? 'Transfer to Wallet' : 'Confirm Withdrawal'}
            </Button>
            <Button
              onClick={() => {
                setShowForm(false)
                setWithdrawalType(null)
              }}
              variant="outline"
              className="flex-1"
            >
              Cancel
            </Button>
          </div>
        </Card>
      )}

      {/* Withdrawal History */}
      <div>
        <h3 className="mb-4 font-semibold">Withdrawal History</h3>
        <div className="space-y-3">
          {withdrawals.length === 0 ? (
            <Card className="border-border/50 bg-card/50 p-8 text-center">
              <p className="text-muted-foreground">No withdrawals yet</p>
            </Card>
          ) : (
            withdrawals.map((withdrawal) => (
            <Card
                key={withdrawal.id}
                role="button"
                tabIndex={0}
                onClick={() => setReceiptWithdrawal(withdrawal)}
                onKeyDown={(e) => e.key === 'Enter' && setReceiptWithdrawal(withdrawal)}
                className={`cursor-pointer border-border/50 ${getStatusBg(withdrawal.status)} bg-card/50 p-4 transition hover:border-primary/30`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold">
                      {withdrawal.type === 'wallet' ? (
                        <span className="flex items-center gap-2">
                          <Wallet className="h-4 w-4" />
                          ɃU Wallet
                        </span>
                      ) : (
                        <span className="flex items-center gap-2">
                          <Building2 className="h-4 w-4" />
                          {withdrawal.bankName}
                        </span>
                      )}
                    </h3>
                    <span
                        className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold capitalize ${getStatusColor(withdrawal.status)} ${getStatusBg(withdrawal.status)} border-current/20`}
                    >
                        {getStatusIcon(withdrawal.status)}
                        {withdrawal.status === 'completed' ? 'Completed' : withdrawal.status === 'processing' ? 'Processing' : 'Pending'}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {withdrawal.type === 'wallet' 
                      ? withdrawal.walletAddress 
                      : `${withdrawal.accountNumber} · ${withdrawal.accountName}`}
                  </p>
                  <p className="text-xs text-muted-foreground">
                      {withdrawal.date}
                      {withdrawal.completedDate && ` · Completed ${withdrawal.completedDate}`}
                  </p>
                </div>
                <div className="text-right">
                    {withdrawal.status === 'completed' && (
                    <CheckCircle className="mb-2 h-5 w-5 text-green-400" />
                  )}
                  <p className="font-bold">₦{withdrawal.nairaAmount.toLocaleString('en-NG')}</p>
                  <p className="text-xs text-muted-foreground">Ƀ {withdrawal.buAmount.toLocaleString()}</p>
                </div>
              </div>
            </Card>
            ))
          )}
        </div>
      </div>

      {/* PIN Verification Modal */}
      {showPinVerification && (
        <PinVerification
          onVerify={handlePinVerified}
          onCancel={() => {
            setShowPinVerification(false)
            setPendingWithdrawal(null)
          }}
          title="Confirm Withdrawal"
          description="Enter your PIN to confirm this withdrawal request"
        />
      )}

      {/* Withdrawal receipt (after confirm) - mobile-first bottom sheet */}
      <Sheet open={!!receiptWithdrawal} onOpenChange={(open) => !open && setReceiptWithdrawal(null)}>
        <SheetContent
          side="bottom"
          className="left-0 right-0 w-full max-w-[100vw] rounded-t-2xl border-t border-border bg-background p-0 pb-[max(1.5rem,env(safe-area-inset-bottom))] max-h-[92dvh] overflow-hidden flex flex-col sm:left-1/2 sm:right-auto sm:max-w-[400px] sm:-translate-x-1/2 sm:rounded-t-2xl"
        >
          <div className="flex flex-col overflow-y-auto flex-1 min-h-0">
            {/* Drag handle for mobile bottom sheet */}
            <div className="flex justify-center pt-2 pb-1">
              <span className="h-1 w-10 rounded-full bg-muted-foreground/30" aria-hidden />
            </div>
            <SheetHeader className="px-4 pt-2 pb-2">
              <SheetTitle className="text-center text-lg">Withdrawal Receipt</SheetTitle>
            </SheetHeader>
            {receiptWithdrawal && (
            <div className="px-4 mt-4 space-y-5 pb-6">
              <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 text-center">
                <p className="text-sm text-muted-foreground">Amount</p>
                <p className="mt-1 text-2xl font-bold text-primary">Ƀ {receiptWithdrawal.buAmount.toLocaleString()}</p>
                <p className="text-lg font-semibold">₦{receiptWithdrawal.nairaAmount.toLocaleString('en-NG')}</p>
              </div>
              <div className="space-y-3 rounded-xl border border-border bg-card p-4">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Status</span>
                  <span className={`inline-flex items-center gap-1.5 font-semibold capitalize ${getStatusColor(receiptWithdrawal.status)}`}>
                    {getStatusIcon(receiptWithdrawal.status)}
                    {receiptWithdrawal.status === 'completed' ? 'Completed' : receiptWithdrawal.status === 'processing' ? 'Processing' : 'Pending'}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Date</span>
                  <span>{receiptWithdrawal.date}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Type</span>
                  <span>{receiptWithdrawal.type === 'wallet' ? 'ɃU Wallet' : 'Bank Account'}</span>
                </div>
                {receiptWithdrawal.type === 'bank' && (
                  <>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Bank</span>
                      <span>{receiptWithdrawal.bankName}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Account</span>
                      <span>{receiptWithdrawal.accountNumber} · {receiptWithdrawal.accountName}</span>
                    </div>
                  </>
                )}
                {receiptWithdrawal.type === 'wallet' && receiptWithdrawal.walletAddress && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Wallet</span>
                    <span className="truncate max-w-[180px]">{receiptWithdrawal.walletAddress}</span>
                  </div>
                )}
              </div>
              <p className="text-center text-xs text-muted-foreground">
                {receiptWithdrawal.status === 'pending' || receiptWithdrawal.status === 'processing'
                  ? 'Your withdrawal will be processed shortly. You can track it in Withdrawal History.'
                  : 'This withdrawal has been completed.'}
              </p>
            </div>
            )}
            {/* Sticky Done button - mobile safe area */}
            {receiptWithdrawal && (
              <div className="mt-auto px-4 pt-4 pb-[max(0.5rem,env(safe-area-inset-bottom))] bg-background border-t border-border">
                <Button
                  onClick={() => setReceiptWithdrawal(null)}
                  className="w-full bg-primary text-primary-foreground hover:bg-primary/90 h-12 rounded-xl font-semibold"
                >
                  Done
                </Button>
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}
