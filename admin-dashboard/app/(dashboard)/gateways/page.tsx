'use client'

import { useEffect, useState } from 'react'
import { adminApi } from '@/lib/admin-api'
import BULoading from '@/components/bu-loading'

export default function GatewaysPage() {
  const [gateways, setGateways] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchGateways()
  }, [])

  const fetchGateways = async () => {
    setLoading(true)
    try {
      const response = await adminApi.getGateways({ limit: 100 })
      if (response.success) {
        setGateways(response.data?.gateways || [])
      }
    } catch (error) {
      console.error('Failed to fetch gateways:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
          Gateways
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">View all QR gateways</p>
      </div>

      {/* Gateways Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full flex justify-center py-12"><BULoading /></div>
        ) : gateways.length === 0 ? (
          <div className="col-span-full text-center py-12 text-gray-500">No gateways found</div>
        ) : (
          gateways.map((gateway) => (
            <div
              key={gateway.id}
              className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl shadow-lg p-6 border border-gray-200/50 dark:border-gray-700/50 hover:shadow-xl transition-all transform hover:scale-[1.02]"
            >
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">{gateway.eventName}</h3>
              <div className="space-y-2 text-sm">
                <p className="text-gray-600 dark:text-gray-400">
                  <span className="font-medium">Date:</span> {new Date(gateway.eventDate).toLocaleDateString()}
                </p>
                {gateway.eventTime && (
                  <p className="text-gray-600 dark:text-gray-400">
                    <span className="font-medium">Time:</span> {gateway.eventTime}
                  </p>
                )}
                {gateway.eventLocation && (
                  <p className="text-gray-600 dark:text-gray-400">
                    <span className="font-medium">Location:</span> {gateway.eventLocation}
                  </p>
                )}
                <p className="text-gray-600 dark:text-gray-400">
                  <span className="font-medium">Vendor:</span> {gateway.vendor?.name}
                </p>
                <p className="text-gray-600 dark:text-gray-400">
                  <span className="font-medium">Celebrant:</span> {gateway.celebrantName}
                </p>
                <span className={`inline-block px-2 py-1 text-xs font-semibold rounded-full ${
                  gateway.status === 'active'
                    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                    : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                }`}>
                  {gateway.status}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
