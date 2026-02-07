'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Calendar, MapPin, Clock, Users, Ticket, DollarSign, Image as ImageIcon } from 'lucide-react'
import { eventsApi } from '@/lib/api-client'

interface VendorCreateEventProps {
  onNavigate?: (page: string, data?: any) => void
  onEventCreated?: (event: any) => void
}

export default function VendorCreateEvent({ onNavigate, onEventCreated }: VendorCreateEventProps) {
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
    image_url: '',
    // Ticket vending fields
    tickets_enabled: false,
    ticket_price_bu: '',
    max_tickets: '',
  })

  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      // Validate required fields
      if (!formData.name || !formData.date) {
        alert('Event name and date are required')
        setIsSubmitting(false)
        return
      }

      if (formData.tickets_enabled) {
        if (!formData.ticket_price_bu || parseFloat(formData.ticket_price_bu) <= 0) {
          alert('Ticket price is required when tickets are enabled')
          setIsSubmitting(false)
          return
        }
        if (!formData.city) {
          alert('City is required when tickets are enabled')
          setIsSubmitting(false)
          return
        }
      }

      // Create event via API
      const eventData: any = {
        name: formData.name,
        date: formData.date,
        location: formData.location || undefined,
        city: formData.city || undefined,
        state: formData.state || undefined,
        country: formData.country || 'Nigeria',
        category: formData.category || undefined,
        description: formData.description || undefined,
        image_url: formData.image_url || undefined,
        tickets_enabled: formData.tickets_enabled,
      }

      if (formData.tickets_enabled) {
        eventData.ticket_price_bu = parseFloat(formData.ticket_price_bu)
        if (formData.max_tickets) {
          eventData.max_tickets = parseInt(formData.max_tickets)
        }
      }

      const response = await eventsApi.create(eventData)

      if (response.success && response.data?.event) {
        const newEvent = response.data.event
        console.log('Event created successfully:', newEvent)

        if (onEventCreated) {
          onEventCreated(newEvent)
        }

        alert('Event created successfully!')
        
        // Reset form
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
          image_url: '',
          tickets_enabled: false,
          ticket_price_bu: '',
          max_tickets: '',
        })

        if (onNavigate) {
          onNavigate('dashboard')
        }
      } else {
        alert(response.error || 'Failed to create event')
      }
    } catch (error: any) {
      console.error('Create event error:', error)
      alert(error.message || 'Failed to create event')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6 pb-24 pt-4">
      <div className="px-4">
        <h2 className="text-xl font-bold mb-4">Create Event & Sell Tickets</h2>
        <p className="text-sm text-muted-foreground mb-6">
          Create an event and enable ticket sales. Users can discover and purchase tickets using ɃU.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Basic Event Info */}
          <Card className="border-primary/20 bg-card p-4">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              Event Details
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="text-sm font-semibold mb-2 block">Event Name *</label>
                <Input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  className="bg-secondary text-foreground"
                  placeholder="e.g., Summer Music Festival"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-semibold mb-2 block">Date *</label>
                  <Input
                    type="date"
                    value={formData.date}
                    onChange={(e) => handleChange('date', e.target.value)}
                    className="bg-secondary text-foreground"
                    min={new Date().toISOString().split('T')[0]}
                    required
                  />
                </div>
                <div>
                  <label className="text-sm font-semibold mb-2 block">Time</label>
                  <Input
                    type="time"
                    value={formData.time}
                    onChange={(e) => handleChange('time', e.target.value)}
                    className="bg-secondary text-foreground"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-semibold mb-2 block">Location</label>
                <Input
                  type="text"
                  value={formData.location}
                  onChange={(e) => handleChange('location', e.target.value)}
                  className="bg-secondary text-foreground"
                  placeholder="e.g., Tafawa Balewa Square, Lagos"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-sm font-semibold mb-2 block">City</label>
                  <Input
                    type="text"
                    value={formData.city}
                    onChange={(e) => handleChange('city', e.target.value)}
                    className="bg-secondary text-foreground"
                    placeholder="Lagos"
                  />
                </div>
                <div>
                  <label className="text-sm font-semibold mb-2 block">State</label>
                  <Input
                    type="text"
                    value={formData.state}
                    onChange={(e) => handleChange('state', e.target.value)}
                    className="bg-secondary text-foreground"
                    placeholder="Lagos"
                  />
                </div>
                <div>
                  <label className="text-sm font-semibold mb-2 block">Country</label>
                  <Input
                    type="text"
                    value={formData.country}
                    onChange={(e) => handleChange('country', e.target.value)}
                    className="bg-secondary text-foreground"
                    placeholder="Nigeria"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-semibold mb-2 block">Category</label>
                <select
                  value={formData.category}
                  onChange={(e) => handleChange('category', e.target.value)}
                  className="w-full rounded-lg border border-border bg-secondary px-3 py-2 text-foreground"
                >
                  <option value="">Select category</option>
                  <option value="Music">Music</option>
                  <option value="Sports">Sports</option>
                  <option value="Food & Drink">Food & Drink</option>
                  <option value="Technology">Technology</option>
                  <option value="Arts & Culture">Arts & Culture</option>
                  <option value="Business">Business</option>
                  <option value="Education">Education</option>
                  <option value="Celebration">Celebration</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="text-sm font-semibold mb-2 block">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => handleChange('description', e.target.value)}
                  className="w-full rounded-lg border border-border bg-secondary px-3 py-2 text-foreground min-h-[100px]"
                  placeholder="Describe your event..."
                />
              </div>

              <div>
                <label className="text-sm font-semibold mb-2 block">Image URL (Optional)</label>
                <Input
                  type="url"
                  value={formData.image_url}
                  onChange={(e) => handleChange('image_url', e.target.value)}
                  className="bg-secondary text-foreground"
                  placeholder="https://example.com/image.jpg"
                />
              </div>
            </div>
          </Card>

          {/* Ticket Vending */}
          <Card className="border-primary/20 bg-card p-4">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <Ticket className="h-5 w-5 text-primary" />
              Ticket Sales
            </h3>

            <div className="space-y-4">
              <div className="flex items-center gap-2 pt-2 border-t border-border">
                <input
                  type="checkbox"
                  id="tickets_enabled"
                  checked={formData.tickets_enabled}
                  onChange={(e) => handleChange('tickets_enabled', e.target.checked)}
                  className="h-4 w-4 rounded border-border"
                />
                <label htmlFor="tickets_enabled" className="text-sm font-semibold cursor-pointer">
                  Enable ticket sales for this event
                </label>
              </div>

              {formData.tickets_enabled && (
                <>
                  <div>
                    <label className="text-sm font-semibold mb-2 block">
                      Ticket Price (ɃU) *
                    </label>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.ticket_price_bu}
                      onChange={(e) => handleChange('ticket_price_bu', e.target.value)}
                      className="bg-secondary text-foreground"
                      placeholder="100"
                      required={formData.tickets_enabled}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Price per ticket in ɃU (1 ɃU = ₦1)
                    </p>
                  </div>

                  <div>
                    <label className="text-sm font-semibold mb-2 block">
                      Maximum Tickets (Optional)
                    </label>
                    <Input
                      type="number"
                      min="1"
                      value={formData.max_tickets}
                      onChange={(e) => handleChange('max_tickets', e.target.value)}
                      className="bg-secondary text-foreground"
                      placeholder="Leave empty for unlimited"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Maximum number of tickets available. Leave empty for unlimited tickets.
                    </p>
                  </div>

                  {!formData.city && (
                    <div className="rounded-lg border border-yellow-400/30 bg-yellow-400/10 p-3">
                      <p className="text-xs text-yellow-400">
                        ⚠️ City is required when ticket sales are enabled.
                      </p>
                    </div>
                  )}
                </>
              )}
            </div>
          </Card>

          <div className="flex gap-2 pt-2">
            <Button
              type="button"
              onClick={() => onNavigate?.('dashboard')}
              variant="outline"
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || !formData.name || !formData.date}
              className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {isSubmitting ? 'Creating...' : 'Create Event'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
