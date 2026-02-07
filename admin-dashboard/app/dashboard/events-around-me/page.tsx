'use client'

import { useState } from 'react'
import Link from 'next/link'
import { adminApi } from '@/lib/admin-api'
import { ArrowLeft } from 'lucide-react'

export default function CreateEventsAroundMePage() {
  const [formData, setFormData] = useState({
    name: '',
    date: '',
    time: '',
    location: '',
    city: '',
    state: '',
    country: 'Nigeria',
    category: '',
    description: '',
    ticket_price_bu: '',
    max_tickets: '',
  })
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    setMessage(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage(null)
    if (!formData.name.trim()) {
      setMessage({ type: 'error', text: 'Event name is required' })
      return
    }
    if (!formData.date.trim()) {
      setMessage({ type: 'error', text: 'Date is required' })
      return
    }
    if (!formData.city.trim()) {
      setMessage({ type: 'error', text: 'City is required' })
      return
    }
    const price = parseFloat(formData.ticket_price_bu)
    if (isNaN(price) || price <= 0) {
      setMessage({ type: 'error', text: 'Ticket price (ɃU) is required and must be greater than 0' })
      return
    }
    setSubmitting(true)
    try {
      const response = await fetch('/api/admin/events/around-me', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          name: formData.name.trim(),
          date: formData.date,
          location: formData.location.trim() || undefined,
          city: formData.city.trim(),
          state: formData.state.trim() || undefined,
          country: formData.country.trim() || 'Nigeria',
          category: formData.category.trim() || undefined,
          description: formData.description.trim() || undefined,
          ticket_price_bu: price,
          max_tickets: formData.max_tickets ? parseInt(formData.max_tickets, 10) : undefined,
        }),
      })
      const data = await response.json()
      if (data.success && data.data?.event) {
        setMessage({ type: 'success', text: 'Shows & Parties Around Me created successfully. It will appear for all BU app users, sorted by location.' })
        setFormData({
          name: '',
          date: '',
          time: '',
          location: '',
          city: '',
          state: '',
          country: 'Nigeria',
          category: '',
          description: '',
          ticket_price_bu: '',
          max_tickets: '',
        })
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to create event' })
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err?.message || 'Network error' })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <Link
          href="/dashboard"
          className="p-2 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
        </Link>
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-indigo-900 dark:from-white dark:via-blue-200 dark:to-indigo-200 bg-clip-text text-transparent">
            Create Shows & Parties Around Me
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            These events appear for all BU app users on the Guest page (Shows & Parties Around Me), sorted by location (e.g. Lagos first for Lagos users).
          </p>
        </div>
      </div>

      {message && (
        <div
          className={`rounded-xl p-4 ${
            message.type === 'success'
              ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-800 dark:text-green-200'
              : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200'
          }`}
        >
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-gray-200/50 dark:border-gray-700/50">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Event name *</label>
            <input
              type="text"
              value={formData.name}
              onChange={e => handleChange('name', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
              placeholder="e.g. Lagos Music Festival"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Date *</label>
            <input
              type="date"
              value={formData.date}
              onChange={e => handleChange('date', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">City *</label>
            <input
              type="text"
              value={formData.city}
              onChange={e => handleChange('city', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
              placeholder="e.g. Lagos"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">State</label>
            <input
              type="text"
              value={formData.state}
              onChange={e => handleChange('state', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
              placeholder="e.g. Lagos"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Location / Venue</label>
            <input
              type="text"
              value={formData.location}
              onChange={e => handleChange('location', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
              placeholder="Venue or address"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Ticket price (ɃU) * — Billed in BU</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={formData.ticket_price_bu}
              onChange={e => handleChange('ticket_price_bu', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
              placeholder="100"
              required
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Users pay in BU from their ɃU balance.</p>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Max tickets (optional)</label>
            <input
              type="number"
              min="1"
              value={formData.max_tickets}
              onChange={e => handleChange('max_tickets', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
              placeholder="Leave empty for unlimited"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Category</label>
            <input
              type="text"
              value={formData.category}
              onChange={e => handleChange('category', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
              placeholder="e.g. Concert, Wedding"
            />
          </div>
        </div>
        <div className="mt-6">
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Description</label>
          <textarea
            value={formData.description}
            onChange={e => handleChange('description', e.target.value)}
            rows={4}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
            placeholder="Short description of the event"
          />
        </div>
        <div className="mt-6 flex gap-3">
          <button
            type="submit"
            disabled={submitting}
            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold rounded-xl shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? 'Creating...' : 'Create Shows & Parties Around Me'}
          </button>
          <Link
            href="/dashboard/events"
            className="px-6 py-3 border border-gray-300 dark:border-gray-600 rounded-xl font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            View all events
          </Link>
        </div>
      </form>
    </div>
  )
}
