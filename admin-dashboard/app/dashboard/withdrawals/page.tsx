'use client'

import { useEffect, useState } from 'react'
import { adminApi } from '@/lib/admin-api'
import BULoading from '@/components/bu-loading'

export default function WithdrawalsPage() {
  const [withdrawals, setWithdrawals] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('')
  const [sendingId, setSendingId] = useState<string | null>(null)
  const [statusUpdatingId, setStatusUpdatingId] = useState<string | null>(null)
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => {
    fetchWithdrawals()
  }, [statusFilter])

  const fetchWithdrawals = async () => {
    setLoading(true)
    try {
      const response = await adminApi.getWithdrawals({
        status: statusFilter || undefined,
        limit: 100,
      })
      if (response.success) {
        setWithdrawals(response.data?.withdrawals || [])
      }
    } catch (error) {
      console.error('Failed to fetch withdrawals:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateStatus = async (id: string, status: string) => {
    setActionMessage(null)
    setStatusUpdatingId(id)
    try {
      const response = await adminApi.updateWithdrawal(id, status)
      if (response.success) {
        setWithdrawals((prev) =>
          prev.map((w) =>
            w.id === id
              ? {
                  ...w,
                  status,
                  completedAt: status === 'completed' || status === 'failed' ? new Date().toISOString() : w.completedAt,
                }
              : w
          )
        )
        setActionMessage({ type: 'success', text: `Marked as ${status}.` })
        await fetchWithdrawals()
      } else {
        setActionMessage({ type: 'error', text: response.error || 'Failed to update withdrawal' })
      }
    } catch (error: any) {
      setActionMessage({ type: 'error', text: error.message || 'Failed to update withdrawal' })
    } finally {
      setStatusUpdatingId(null)
    }
  }

  const handleSendPaystack = async (id: string) => {
    setActionMessage(null)
    setSendingId(id)
    try {
      const response = await adminApi.sendWithdrawalPaystack(id)
      if (response.success) {
        setActionMessage({ type: 'success', text: 'Naira sent successfully. Withdrawal marked completed.' })
        await fetchWithdrawals()
      } else {
        setActionMessage({ type: 'error', text: response.error || 'Failed to send via Paystack' })
      }
    } catch (error: any) {
      setActionMessage({ type: 'error', text: error?.message || 'Failed to send via Paystack' })
    } finally {
      setSendingId(null)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
          Withdrawals
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">Manage withdrawal requests</p>
      </div>
      {actionMessage && (
        <div
          className={`rounded-lg border px-4 py-2 text-sm ${
            actionMessage.type === 'success'
              ? 'border-green-200 bg-green-50 text-green-700'
              : 'border-red-200 bg-red-50 text-red-700'
          }`}
        >
          {actionMessage.text}
        </div>
      )}

      {/* Filter */}
      <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl shadow-lg p-4 border border-gray-200/50 dark:border-gray-700/50">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
        >
          <option value="">All Status</option>
          <option value="pending">Pending</option>
          <option value="processing">Processing</option>
          <option value="completed">Completed</option>
          <option value="failed">Failed</option>
        </select>
      </div>

      {/* Withdrawals Table */}
      <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl shadow-lg border border-gray-200/50 dark:border-gray-700/50 overflow-hidden">
        {loading ? (
          <div className="p-8 flex justify-center"><BULoading /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">User</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Bank / Account</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Created</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {withdrawals.map((w) => (
                  <tr key={w.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">{w.user?.name}</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">{w.user?.phoneNumber}</div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                      Ƀ {w.buAmount.toLocaleString()} / ₦{w.nairaAmount.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 dark:text-white capitalize">{w.type}</td>
                    <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                      {w.type === 'bank' ? (
                        <div className="space-y-0.5">
                          <div><span className="text-gray-500 dark:text-gray-400">Bank:</span> {w.bankName || '—'}</div>
                          <div><span className="text-gray-500 dark:text-gray-400">Acct:</span> {w.accountNumber || '—'} · {w.accountName || '—'}</div>
                        </div>
                      ) : (
                        <span className="text-gray-500 dark:text-gray-400">{w.walletAddress ? `${w.walletAddress.slice(0, 12)}…` : '—'}</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        w.status === 'completed' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                        w.status === 'pending' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                        w.status === 'failed' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
                        'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                      }`}>
                        {w.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                      {new Date(w.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      {(w.status === 'pending' || w.status === 'processing') && (
                        <div className="flex flex-wrap gap-2">
                          {w.type === 'bank' && (
                            <button
                              onClick={() => handleSendPaystack(w.id)}
                              disabled={sendingId === w.id}
                              className="text-sm px-2 py-1 rounded bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50"
                            >
                              {sendingId === w.id ? 'Sending…' : 'Send Naira (Paystack)'}
                            </button>
                          )}
                          <button
                            onClick={() => handleUpdateStatus(w.id, 'processing')}
                            disabled={statusUpdatingId === w.id}
                            className="text-blue-600 hover:text-blue-900 dark:text-blue-400 text-sm disabled:opacity-50"
                          >
                            {statusUpdatingId === w.id ? 'Updating…' : 'Process'}
                          </button>
                          <button
                            onClick={() => handleUpdateStatus(w.id, 'completed')}
                            disabled={statusUpdatingId === w.id}
                            className="text-green-600 hover:text-green-900 dark:text-green-400 text-sm disabled:opacity-50"
                          >
                            {statusUpdatingId === w.id ? 'Updating…' : 'Complete'}
                          </button>
                          <button
                            onClick={() => handleUpdateStatus(w.id, 'failed')}
                            disabled={statusUpdatingId === w.id}
                            className="text-red-600 hover:text-red-900 dark:text-red-400 text-sm disabled:opacity-50"
                          >
                            {statusUpdatingId === w.id ? 'Updating…' : 'Reject'}
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {withdrawals.length === 0 && (
              <div className="p-8 text-center text-gray-500">No withdrawals found</div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
