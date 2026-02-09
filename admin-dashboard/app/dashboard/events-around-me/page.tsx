'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { adminApi } from '@/lib/admin-api'
import { ArrowLeft, Pencil } from 'lucide-react'
import BULoading from '@/components/bu-loading'

type AroundMeEvent = {
  id: string
  name: string
  date: string
  location?: string
  city?: string
  state?: string
  max_tickets?: number | null
  tickets_sold?: number
  ticket_price_bu?: number
  category?: string
  description?: string
}

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

  const [aroundMeEvents, setAroundMeEvents] = useState<AroundMeEvent[]>([])
  const [loadingAroundMe, setLoadingAroundMe] = useState(true)
  const [editEvent, setEditEvent] = useState<AroundMeEvent | null>(null)
  const [editForm, setEditForm] = useState({ max_tickets: '', name: '', date: '', location: '', city: '', state: '', category: '', description: '', ticket_price_bu: '' })
  const [editSubmitting, setEditSubmitting] = useState(false)
  const [editMessage, setEditMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => {
    const fetch = async () => {
      setLoadingAroundMe(true)
      try {
        const res = await adminApi.getEvents({ around_me: true, limit: 100 })
        if (res.success && res.data?.events) setAroundMeEvents(res.data.events)
      } catch (_) {}
      setLoadingAroundMe(false)
    }
    fetch()
  }, [])

  const openEdit = (event: AroundMeEvent) => {
    setEditEvent(event)
    setEditForm({
      max_tickets: event.max_tickets != null ? String(event.max_tickets) : '',
      name: event.name || '',
      date: event.date || '',
      location: event.location || '',
      city: event.city || '',
      state: event.state || '',
      category: event.category || '',
      description: event.description || '',
      ticket_price_bu: event.ticket_price_bu != null ? String(event.ticket_price_bu) : '',
    })
    setEditMessage(null)
  }

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editEvent) return
    setEditMessage(null)
    const ticketsSold = editEvent.tickets_sold ?? 0
    const maxVal = editForm.max_tickets.trim() ? parseInt(editForm.max_tickets, 10) : null
    if (maxVal !== null && (isNaN(maxVal) || maxVal < 0)) {
      setEditMessage({ type: 'error', text: 'Max tickets must be a non-negative number' })
      return
    }
    if (maxVal !== null && maxVal < ticketsSold) {
      setEditMessage({ type: 'error', text: `Max tickets cannot be less than already sold (${ticketsSold})` })
      return
    }
    setEditSubmitting(true)
    try {
      const res = await adminApi.updateEvent(editEvent.id, {
        max_tickets: editForm.max_tickets.trim() ? (maxVal as number) : null,
        name: editForm.name.trim() || undefined,
        date: editForm.date.trim() || undefined,
        location: editForm.location.trim() || undefined,
        city: editForm.city.trim() || undefined,
        state: editForm.state.trim() || undefined,
        category: editForm.category.trim() || undefined,
        description: editForm.description.trim() || undefined,
        ticket_price_bu: editForm.ticket_price_bu.trim() ? parseFloat(editForm.ticket_price_bu) : undefined,
      })
      if (res.success && res.data?.event) {
        setEditMessage({ type: 'success', text: 'Event updated successfully.' })
        setAroundMeEvents(prev => prev.map(ev => ev.id === editEvent.id ? { ...ev, ...res.data.event } : ev))
        setTimeout(() => {
          setEditEvent(null)
        }, 1500)
      } else {
        setEditMessage({ type: 'error', text: (res as any).error || 'Failed to update event' })
      }
    } catch (err: any) {
      setEditMessage({ type: 'error', text: err?.message || 'Network error' })
    } finally {
      setEditSubmitting(false)
    }
  }

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
        const listRes = await adminApi.getEvents({ around_me: true, limit: 100 })
        if (listRes.success && listRes.data?.events) setAroundMeEvents(listRes.data.events)
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

      {/* Your Shows & Parties Around Me — edit max tickets and other fields */}
      <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-gray-200/50 dark:border-gray-700/50">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Your Shows & Parties Around Me</h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">Edit an event to update the number of tickets or other details.</p>
        {loadingAroundMe ? (
          <div className="flex justify-center py-8"><BULoading /></div>
        ) : aroundMeEvents.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400 py-4">No Shows & Parties Around Me yet. Create one below.</p>
        ) : (
          <div className="space-y-3">
            {aroundMeEvents.map((ev) => (
              <div
                key={ev.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-gray-200 dark:border-gray-700 p-4"
              >
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white">{ev.name}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {ev.date} {ev.city ? `· ${ev.city}` : ''}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                    Tickets: {ev.tickets_sold ?? 0} sold
                    {ev.max_tickets != null ? ` / ${ev.max_tickets} max` : ' (unlimited)'}
                    {ev.ticket_price_bu != null ? ` · Ƀ${ev.ticket_price_bu} each` : ''}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => openEdit(ev)}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium"
                >
                  <Pencil className="h-4 w-4" />
                  Edit
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Edit modal */}
      {editEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => !editSubmitting && setEditEvent(null)}>
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Edit: {editEvent.name}</h3>
            {editMessage && (
              <div
                className={`rounded-lg p-3 mb-4 text-sm ${
                  editMessage.type === 'success' ? 'bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-200' : 'bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200'
                }`}
              >
                {editMessage.text}
              </div>
            )}
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Max tickets *</label>
                <input
                  type="number"
                  min={editEvent.tickets_sold ?? 0}
                  value={editForm.max_tickets}
                  onChange={e => setEditForm(prev => ({ ...prev, max_tickets: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                  placeholder="Leave empty for unlimited"
                />
                <p className="text-xs text-gray-500 mt-1">Already sold: {editEvent.tickets_sold ?? 0}. New max must be ≥ this.</p>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Event name</label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={e => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Date</label>
                  <input
                    type="date"
                    value={editForm.date}
                    onChange={e => setEditForm(prev => ({ ...prev, date: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Ticket price (ɃU)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={editForm.ticket_price_bu}
                    onChange={e => setEditForm(prev => ({ ...prev, ticket_price_bu: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Location / Venue</label>
                <input
                  type="text"
                  value={editForm.location}
                  onChange={e => setEditForm(prev => ({ ...prev, location: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">City</label>
                  <input
                    type="text"
                    value={editForm.city}
                    onChange={e => setEditForm(prev => ({ ...prev, city: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">State</label>
                  <input
                    type="text"
                    value={editForm.state}
                    onChange={e => setEditForm(prev => ({ ...prev, state: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                  />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={editSubmitting}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold disabled:opacity-50"
                >
                  {editSubmitting ? 'Saving...' : 'Save changes'}
                </button>
                <button
                  type="button"
                  onClick={() => setEditEvent(null)}
                  disabled={editSubmitting}
                  className="px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
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
