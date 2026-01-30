'use client'

import { useEffect, useState } from 'react'
import { adminApi } from '@/lib/admin-api'

export default function PaymentsPage() {
  const [payments, setPayments] = useState<any[]>([])
  const [totals, setTotals] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchPayments()
  }, [])

  const fetchPayments = async () => {
    setLoading(true)
    try {
      const response = await adminApi.getPayments({ limit: 100 })
      if (response.success) {
        setPayments(response.data?.payments || [])
        setTotals(response.data?.totals)
      }
    } catch (error) {
      console.error('Failed to fetch payments:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
          Payments
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">Monitor Paystack payment transactions</p>
      </div>

      {/* Totals */}
      {totals && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl shadow-lg p-6 border border-gray-200/50 dark:border-gray-700/50">
            <p className="text-sm text-gray-600 dark:text-gray-400">Total Amount</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              ₦{totals.totalAmount.toLocaleString()}
            </p>
          </div>
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl shadow-lg p-6 border border-gray-200/50 dark:border-gray-700/50">
            <p className="text-sm text-gray-600 dark:text-gray-400">Completed</p>
            <p className="text-2xl font-bold text-green-600 dark:text-green-400">
              ₦{totals.completedAmount.toLocaleString()}
            </p>
          </div>
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl shadow-lg p-6 border border-gray-200/50 dark:border-gray-700/50">
            <p className="text-sm text-gray-600 dark:text-gray-400">Pending</p>
            <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
              ₦{totals.pendingAmount.toLocaleString()}
            </p>
          </div>
        </div>
      )}

      {/* Payments Table */}
      <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl shadow-lg border border-gray-200/50 dark:border-gray-700/50 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">Loading payments...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">User</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Reference</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {payments.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">{p.user?.name || 'N/A'}</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">{p.user?.phoneNumber}</div>
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">
                      ₦{p.amountNaira.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400 font-mono text-xs">
                      {p.reference || 'N/A'}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        p.status === 'completed' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                        'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                      }`}>
                        {p.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                      {new Date(p.createdAt).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {payments.length === 0 && (
              <div className="p-8 text-center text-gray-500">No payments found</div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
