'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Calendar, MapPin, Ticket } from 'lucide-react'
import { eventsApi } from '@/lib/api-client'

interface CreateEventsAroundMeProps {
  onNavigate?: (page: string, data?: any) => void
}

export default function CreateEventsAroundMe({ onNavigate }: CreateEventsAroundMeProps) {
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

  const handleChange = (field: string, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name || !formData.date || !formData.city) {
      alert('Name, date, and city are required')
      return
    }
    if (!formData.ticket_price_bu || parseFloat(formData.ticket_price_bu) <= 0) {
      alert('Ticket price (ɃU) is required and must be greater than 0')
      return
    }
    setSubmitting(true)
    try {
      const response = await eventsApi.create({
        name: formData.name,
        date: formData.date,
        location: formData.location || undefined,
        city: formData.city,
        state: formData.state || undefined,
        country: formData.country,
        category: formData.category || undefined,
        description: formData.description || undefined,
        ticket_price_bu: parseFloat(formData.ticket_price_bu),
        max_tickets: formData.max_tickets ? parseInt(formData.max_tickets) : undefined,
        is_around_me: true,
      })
      if (response.success && response.data?.event) {
        alert('Shows & Parties Around Me created successfully. It will appear for all users in that location.')
        setFormData({ name: '', date: '', time: '', location: '', city: '', state: '', country: 'Nigeria', category: '', description: '', ticket_price_bu: '', max_tickets: '' })
        if (onNavigate) onNavigate('events')
      } else {
        alert(response.error || 'Failed to create event')
      }
    } catch (err: any) {
      alert(err?.message || 'Failed to create event')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-6 pb-24 pt-4 px-4">
      <h2 className="text-xl font-bold">Create Shows & Parties Around Me</h2>
      <p className="text-sm text-muted-foreground">
        Only super admins can create these. They appear for all BU app users, sorted by location (e.g. Lagos first for Lagos users). Include location, time, and ticket price.
      </p>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Card className="p-4 space-y-4">
          <div>
            <label className="text-sm font-semibold block mb-1">Event name *</label>
            <Input value={formData.name} onChange={e => handleChange('name', e.target.value)} placeholder="Event name" required />
          </div>
          <div>
            <label className="text-sm font-semibold block mb-1">Date *</label>
            <Input type="date" value={formData.date} onChange={e => handleChange('date', e.target.value)} required />
          </div>
          <div>
            <label className="text-sm font-semibold block mb-1">Time (optional)</label>
            <Input type="time" value={formData.time} onChange={e => handleChange('time', e.target.value)} />
          </div>
          <div>
            <label className="text-sm font-semibold block mb-1">Location / Venue</label>
            <Input value={formData.location} onChange={e => handleChange('location', e.target.value)} placeholder="Venue or address" />
          </div>
          <div>
            <label className="text-sm font-semibold block mb-1">City *</label>
            <Input value={formData.city} onChange={e => handleChange('city', e.target.value)} placeholder="e.g. Lagos" required />
          </div>
          <div>
            <label className="text-sm font-semibold block mb-1">State</label>
            <Input value={formData.state} onChange={e => handleChange('state', e.target.value)} placeholder="e.g. Lagos" />
          </div>
          <div>
            <label className="text-sm font-semibold block mb-1">Ticket price (ɃU) *</label>
            <Input type="number" min="0" step="0.01" value={formData.ticket_price_bu} onChange={e => handleChange('ticket_price_bu', e.target.value)} placeholder="100" required />
            <p className="text-xs text-muted-foreground mt-1">Shows & Parties Around Me are billed in BU; users pay from their ɃU balance.</p>
          </div>
          <div>
            <label className="text-sm font-semibold block mb-1">Max tickets (optional)</label>
            <Input type="number" min="1" value={formData.max_tickets} onChange={e => handleChange('max_tickets', e.target.value)} placeholder="Unlimited if empty" />
          </div>
          <div>
            <label className="text-sm font-semibold block mb-1">Category</label>
            <Input value={formData.category} onChange={e => handleChange('category', e.target.value)} placeholder="e.g. Concert, Wedding" />
          </div>
          <div>
            <label className="text-sm font-semibold block mb-1">Description</label>
            <textarea className="w-full min-h-[80px] rounded-md border border-input bg-background px-3 py-2 text-sm" value={formData.description} onChange={e => handleChange('description', e.target.value)} placeholder="Short description" />
          </div>
        </Card>
        <div className="flex gap-2">
          <Button type="submit" disabled={submitting} className="flex-1">
            {submitting ? 'Creating...' : 'Create Shows & Parties Around Me'}
          </Button>
          {onNavigate && (
            <Button type="button" variant="outline" onClick={() => onNavigate('events')}>Cancel</Button>
          )}
        </div>
      </form>
    </div>
  )
}
