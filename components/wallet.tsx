'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ArrowUp, ArrowDown, Plus } from 'lucide-react'
import { walletApi } from '@/lib/api-client'

interface Transaction {
  id: string
  type: 'topup' | 'purchase' | 'withdrawal' | 'refund' | 'bu_transfer'
  amount: number
  date: string
  description: string
  status?: string
  message?: string
}

interface WalletProps {
  onNavigate?: (page: string) => void
}

export default function Wallet({ onNavigate }: WalletProps = {}) {
  const [balance, setBalance] = useState<number>(0)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [showTopup, setShowTopup] = useState(false)
  const [topupAmount, setTopupAmount] = useState('')
  const [topupLoading, setTopupLoading] = useState(false)

  useEffect(() => {
    fetchWalletData()
  }, [])

  const fetchWalletData = async () => {
    try {
      setLoading(true)
      
      // Fetch wallet balance
      const walletResponse = await walletApi.getMe()
      if (walletResponse.success && walletResponse.data?.wallet) {
        setBalance(parseFloat(walletResponse.data.wallet.balance || '0'))
      }

      // Fetch transactions
      const transactionsResponse = await walletApi.getTransactions(50, 0)
      if (transactionsResponse.success && transactionsResponse.data?.transactions) {
        setTransactions(transactionsResponse.data.transactions)
      }
    } catch (error) {
      console.error('Failed to fetch wallet data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleTopup = async () => {
    if (!topupAmount || isNaN(Number(topupAmount)) || Number(topupAmount) <= 0) {
      alert('Please enter a valid amount')
      return
    }

    try {
      setTopupLoading(true)
      const amount = Number(topupAmount)
      
      const response = await walletApi.topup(amount)
      if (response.success) {
        // Refresh wallet data
        await fetchWalletData()
        setTopupAmount('')
        setShowTopup(false)
        alert('Wallet topped up successfully!')
      } else {
        alert(response.error || 'Failed to top up wallet')
      }
    } catch (error: any) {
      console.error('Topup error:', error)
      alert(error.message || 'Failed to top up wallet')
    } finally {
      setTopupLoading(false)
    }
  }

  return (
    <div className="space-y-6 pb-24 pt-4">
      {/* Wallet Balance */}
      <Card className="border-primary/20 bg-card p-6">
        <p className="text-sm text-muted-foreground">Total Balance</p>
        <h2 className="mt-2 text-4xl font-bold text-primary">
          {loading ? (
            <span className="text-lg">Loading...</span>
          ) : (
            `₦${balance.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
          )}
        </h2>
        <p className="mt-4 text-sm">
          <span className="font-semibold">
            {loading ? 'Loading...' : `Ƀ ${balance.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          </span> Available
        </p>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-3">
        <Button
          onClick={() => {
            if (onNavigate) {
              onNavigate('paystack-payment')
            } else {
              setShowTopup(true)
            }
          }}
          className="h-20 flex-col gap-2 bg-primary text-primary-foreground hover:bg-primary/90"
        >
          <Plus className="h-5 w-5" />
          <span>Fund Wallet</span>
        </Button>
        <Button
          onClick={() => {
            if (onNavigate) {
              onNavigate('receive-bu')
            }
          }}
          className="h-20 flex-col gap-2 bg-primary text-primary-foreground hover:bg-primary/90"
        >
          <ArrowDown className="h-5 w-5" />
          <span>Receive ɃU</span>
        </Button>
      </div>

      {/* Topup Form */}
      {showTopup && (
        <Card className="border-primary/20 bg-card p-4">
          <h3 className="mb-4 font-semibold">Fund Your Wallet</h3>
          <div className="space-y-3">
            <Input
              type="number"
              placeholder="Enter amount in Naira"
              value={topupAmount}
              onChange={(e) => setTopupAmount(e.target.value)}
              className="bg-secondary text-foreground placeholder:text-muted-foreground"
            />
            <div className="flex gap-2">
            <Button
              onClick={handleTopup}
              disabled={topupLoading}
              className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {topupLoading ? 'Processing...' : 'Top Up'}
            </Button>
              <Button
                onClick={() => setShowTopup(false)}
                variant="outline"
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Transaction History */}
      <div>
        <h3 className="mb-4 font-semibold">Transaction History</h3>
        {loading ? (
          <div className="text-center py-8 text-muted-foreground">Loading transactions...</div>
        ) : transactions.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">No transactions yet</div>
        ) : (
          <div className="space-y-3">
            {transactions.map((tx) => {
              // Determine if transaction is a credit (money coming in) or debit (money going out)
              const isCredit = () => {
                // Top-ups are always credits
                if (tx.type === 'topup') return true
                
                // Withdrawals are always debits
                if (tx.type === 'withdrawal') return false
                
                // Purchases are always debits (money going out)
                if (tx.type === 'purchase') return false
                
                // For transfers, check the description
                // "Received from" = credit, "Sent to" = debit
                if (tx.type === 'bu_transfer') {
                  return tx.description.toLowerCase().includes('received from')
                }
                
                // Refunds are credits
                if (tx.type === 'refund') return true
                
                // Default: check description
                return tx.description.toLowerCase().includes('received')
              }
              
              const credit = isCredit()
              
              return (
                <Card
                  key={tx.id}
                  className="border-border/50 flex items-center justify-between bg-card/50 p-4"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`rounded-full p-2 ${
                        credit
                          ? 'bg-green-400/20'
                          : 'bg-red-400/20'
                      }`}
                    >
                      {credit ? (
                        <ArrowDown className="h-4 w-4 text-green-400" />
                      ) : (
                        <ArrowUp className="h-4 w-4 text-red-400" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium">{tx.description}</p>
                      <p className="text-xs text-muted-foreground">{tx.date}</p>
                    </div>
                  </div>
                  <span
                    className={`font-semibold ${
                      credit
                        ? 'text-green-400'
                        : 'text-red-400'
                    }`}
                  >
                    {credit ? '+' : '-'}₦
                    {tx.amount.toLocaleString()}
                  </span>
                </Card>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
