'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Calendar, MapPin, Clock, Users } from 'lucide-react'
import { eventsApi } from '@/lib/api-client'

interface CelebrantCreateEventProps {
  onNavigate?: (page: string, data?: any) => void
  onEventCreated?: (event: any) => void
}

export default function CelebrantCreateEvent({ onNavigate, onEventCreated }: CelebrantCreateEventProps) {
  const [formData, setFormData] = useState({
    name: '',
    date: '',
    time: '',
    location: '',
    description: '',
    maxGuests: '',
    strictlyByInvitation: false,
  })

  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      // Create event via API
      const response = await eventsApi.create({
        name: formData.name,
        date: formData.date,
        location: formData.location || undefined,
        max_guests: formData.maxGuests ? parseInt(formData.maxGuests) : undefined,
        strictly_by_invitation: formData.strictlyByInvitation,
      })

      if (response.success && response.data?.event) {
        const newEvent = response.data.event
        console.log('Event created successfully:', newEvent)

        if (onEventCreated) {
          onEventCreated(newEvent)
        }

        setIsSubmitting(false)
        if (onNavigate) {
          // Pass the real event ID from the database
          console.log('Navigating to send invites with event ID:', newEvent.id)
          onNavigate('celebrant-send-invites', newEvent.id)
        }
      } else {
        console.error('Failed to create event:', response.error)
        alert(response.error || 'Failed to create event. Please try again.')
        setIsSubmitting(false)
      }
    } catch (error: any) {
      console.error('Create event error:', error)
      alert(error.message || 'Failed to create event. Please try again.')
      setIsSubmitting(false)
    }
  }

  const handleChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  return (
    <div className="space-y-6 pb-24 pt-4">
      <div className="px-4">
        <div className="mb-4">
          <Button
            onClick={() => onNavigate?.('dashboard')}
            variant="outline"
            className="w-full"
          >
            ← Back to Dashboard
          </Button>
        </div>

        <h2 className="text-xl font-bold mb-4">Create New Event</h2>
        <p className="text-sm text-muted-foreground mb-6">
          Create your event and send invites to guests. You'll be able to link with a vendor later to set up the payment gateway.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Card className="border-primary/20 bg-card p-6">
            <div className="space-y-4">
              <div>
                <label className="text-sm font-semibold mb-2 block">Event Name *</label>
                <Input
                  type="text"
                  placeholder="e.g., Chioma Adeyemi Wedding"
                  value={formData.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  required
                  className="bg-secondary text-foreground placeholder:text-muted-foreground"
                />
              </div>

              <div>
                <label className="text-sm font-semibold mb-2 block">Date *</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-primary" />
                  <Input
                    type="date"
                    value={formData.date}
                    onChange={(e) => handleChange('date', e.target.value)}
                    required
                    className="bg-secondary pl-10 text-foreground"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-semibold mb-2 block">Time</label>
                <div className="relative">
                  <Clock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-primary" />
                  <Input
                    type="time"
                    value={formData.time}
                    onChange={(e) => handleChange('time', e.target.value)}
                    className="bg-secondary pl-10 text-foreground"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-semibold mb-2 block">Location</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-primary" />
                  <Input
                    type="text"
                    placeholder="e.g., Lagos, Nigeria"
                    value={formData.location}
                    onChange={(e) => handleChange('location', e.target.value)}
                    className="bg-secondary pl-10 text-foreground placeholder:text-muted-foreground"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-semibold mb-2 block">Description</label>
                <textarea
                  placeholder="Tell your guests about your event..."
                  value={formData.description}
                  onChange={(e) => handleChange('description', e.target.value)}
                  rows={4}
                  className="w-full rounded-lg border border-border bg-secondary px-3 py-2 text-foreground placeholder:text-muted-foreground"
                />
              </div>

              <div className="flex items-center gap-2 pt-2 border-t border-border">
                <input
                  type="checkbox"
                  id="strictlyByInvitation"
                  checked={Boolean(formData.strictlyByInvitation)}
                  onChange={(e) => {
                    setFormData(prev => ({
                      ...prev,
                      strictlyByInvitation: e.target.checked
                    }))
                  }}
                  className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
                />
                <label htmlFor="strictlyByInvitation" className="text-sm font-semibold cursor-pointer">
                  Strictly by invitation only
                </label>
              </div>

              {formData.strictlyByInvitation && (
                <div>
                  <label className="text-sm font-semibold mb-2 block">Maximum Number of Guests</label>
                  <Input
                    type="number"
                    placeholder="e.g., 100"
                    value={formData.maxGuests}
                    onChange={(e) => handleChange('maxGuests', e.target.value)}
                    min="1"
                    className="bg-secondary text-foreground placeholder:text-muted-foreground"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Set the maximum number of guests you expect for this event
                  </p>
                </div>
              )}
            </div>
          </Card>

          <div className="flex gap-2">
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
              disabled={!formData.name || !formData.date || isSubmitting}
              className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {isSubmitting ? 'Creating...' : 'Create Event & Send Invites'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
