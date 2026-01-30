'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowDown, ArrowUp, Filter } from 'lucide-react'
import { walletApi, transferApi } from '@/lib/api-client'

interface Transaction {
  id: string
  type: 'topup' | 'purchase' | 'withdrawal' | 'bu_transfer' | 'ticket_purchase'
  amount: number
  date: string
  description: string
  status: 'completed' | 'pending' | 'failed'
}

export default function History() {
  const [filter, setFilter] = useState<'all' | 'topup' | 'purchase' | 'withdrawal' | 'bu_transfer'>('all')
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        setLoading(true)
        const response = await walletApi.getTransactions(100, 0)
        if (response.success && response.data?.transactions) {
          const formatted = response.data.transactions.map((t: any) => ({
            id: t.id,
            type: t.type,
            amount: parseFloat(t.amount?.toString() || '0'),
            date: new Date(t.date).toLocaleDateString(),
            description: t.description,
            status: t.status || 'completed',
          }))
          setTransactions(formatted)
        }
      } catch (error) {
        console.error('Failed to fetch transactions:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchTransactions()
  }, [])

  const filteredTransactions = filter === 'all'
    ? transactions
    : transactions.filter((tx) => tx.type === filter)

  // Determine if transaction is a credit (money coming in) or debit (money going out)
  const isCredit = (tx: Transaction) => {
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
    
    // Default: check description
    return tx.description.toLowerCase().includes('received')
  }

  const getTransactionIcon = (tx: Transaction) => {
    return isCredit(tx)
      ? <ArrowDown className="h-4 w-4 text-green-400" />
      : <ArrowUp className="h-4 w-4 text-red-400" />
  }

  const getTransactionColor = (tx: Transaction) => {
    return isCredit(tx)
      ? 'bg-green-400/20'
      : 'bg-red-400/20'
  }

  return (
    <div className="space-y-6 pb-24 pt-4">
      <div className="px-4">
        <h2 className="text-xl font-bold mb-4">Transaction History</h2>

        {/* Filter Buttons */}
        <div className="flex gap-2 overflow-x-auto mb-4 pb-2">
          {[
            { id: 'all', label: 'All' },
            { id: 'topup', label: 'Top-ups' },
            { id: 'purchase', label: 'Purchases' },
            { id: 'bu_transfer', label: 'Transfers' },
            { id: 'withdrawal', label: 'Withdrawals' },
          ].map((f) => (
            <Button
              key={f.id}
              onClick={() => setFilter(f.id as any)}
              variant={filter === f.id ? 'default' : 'outline'}
              size="sm"
              className="flex-shrink-0"
            >
              {f.label}
            </Button>
          ))}
        </div>

        {/* Transactions List */}
        <div className="space-y-3">
          {loading ? (
            <Card className="border-border/50 bg-card/50 p-8 text-center">
              <p className="text-muted-foreground">Loading transactions...</p>
            </Card>
          ) : filteredTransactions.length === 0 ? (
            <Card className="border-border/50 bg-card/50 p-8 text-center">
              <p className="text-muted-foreground">No transactions found</p>
            </Card>
          ) : (
            filteredTransactions.map((tx) => (
              <Card
                key={tx.id}
                className="border-border/50 bg-card/50 p-4"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`rounded-full p-2 ${getTransactionColor(tx)}`}>
                      {getTransactionIcon(tx)}
                    </div>
                    <div>
                      <p className="font-medium">{tx.description}</p>
                      <p className="text-xs text-muted-foreground">{tx.date}</p>
                      <span
                        className={`mt-1 inline-block rounded-full px-2 py-1 text-xs font-semibold ${
                          tx.status === 'completed'
                            ? 'bg-green-400/20 text-green-400'
                            : tx.status === 'pending'
                              ? 'bg-yellow-400/20 text-yellow-400'
                              : 'bg-red-400/20 text-red-400'
                        }`}
                      >
                        {tx.status}
                      </span>
                    </div>
                  </div>
                  <span
                    className={`font-semibold ${
                      isCredit(tx)
                        ? 'text-green-400'
                        : 'text-red-400'
                    }`}
                  >
                    {isCredit(tx) ? '+' : '-'}₦
                    {tx.amount.toLocaleString()}
                  </span>
                </div>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
