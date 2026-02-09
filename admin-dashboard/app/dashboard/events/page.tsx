'use client'

import { useEffect, useState } from 'react'
import { adminApi } from '@/lib/admin-api'
import BULoading from '@/components/bu-loading'

export default function EventsPage() {
  const [events, setEvents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    fetchEvents()
  }, [search])

  const fetchEvents = async () => {
    setLoading(true)
    try {
      const response = await adminApi.getEvents({
        search: search || undefined,
        limit: 100,
      })
      if (response.success) {
        setEvents(response.data?.events || [])
      }
    } catch (error) {
      console.error('Failed to fetch events:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
          Events
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">View all events</p>
      </div>

      {/* Search */}
      <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl shadow-lg p-4 border border-gray-200/50 dark:border-gray-700/50">
        <input
          type="text"
          placeholder="Search events..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
        />
      </div>

      {/* Events Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full flex justify-center py-12"><BULoading /></div>
        ) : events.length === 0 ? (
          <div className="col-span-full text-center py-12 text-gray-500">No events found</div>
        ) : (
          events.map((event) => (
            <div
              key={event.id}
              className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl shadow-lg p-6 border border-gray-200/50 dark:border-gray-700/50 hover:shadow-xl transition-all transform hover:scale-[1.02]"
            >
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">{event.name}</h3>
              <div className="space-y-2 text-sm">
                <p className="text-gray-600 dark:text-gray-400">
                  <span className="font-medium">Date:</span> {new Date(event.date).toLocaleDateString()}
                </p>
                {event.location && (
                  <p className="text-gray-600 dark:text-gray-400">
                    <span className="font-medium">Location:</span> {event.location}
                  </p>
                )}
                <p className="text-gray-600 dark:text-gray-400">
                  <span className="font-medium">Celebrant:</span> {event.celebrant?.name}
                </p>
                <p className="text-lg font-bold text-green-600 dark:text-green-400">
                  Ƀ {event.totalBUReceived.toLocaleString()} received
                </p>
                <span className={`inline-block px-2 py-1 text-xs font-semibold rounded-full ${
                  event.withdrawn
                    ? 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                    : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                }`}>
                  {event.withdrawn ? 'Withdrawn' : 'Active'}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
