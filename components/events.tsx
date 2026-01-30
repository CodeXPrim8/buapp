'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Calendar, MapPin, Users, Plus, X } from 'lucide-react'

export interface Event {
  id: string
  name: string
  celebrantWalletId: string
  celebrantName: string
  vendorId: string
  vendorName: string
  status: 'active' | 'completed' | 'cancelled'
  createdAt: string
  eventDate: string
  location?: string
  totalBUReceived?: number
}

interface EventsProps {
  mode: 'guest' | 'vendor'
  onSelectEvent?: (event: Event) => void
  onCreateEvent?: (event: Omit<Event, 'id' | 'createdAt' | 'status'>) => void
}

export default function Events({ mode, onSelectEvent, onCreateEvent }: EventsProps) {
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  
  const [events, setEvents] = useState<Event[]>([
    {
      id: 'EVT-001',
      name: 'Chioma Adeyemi Wedding',
      celebrantWalletId: 'WALLET-001',
      celebrantName: 'Chioma Adeyemi',
      vendorId: 'VENDOR-001',
      vendorName: 'Event Masters Ltd',
      status: 'active',
      createdAt: '2024-01-15',
      eventDate: '2024-01-27',
      location: 'Lagos, Nigeria',
      totalBUReceived: 125000,
    },
    {
      id: 'EVT-002',
      name: 'Okonkwo Birthday Bash',
      celebrantWalletId: 'WALLET-002',
      celebrantName: 'Okonkwo Okafor',
      vendorId: 'VENDOR-002',
      vendorName: 'Celebration Services',
      status: 'active',
      createdAt: '2024-01-10',
      eventDate: '2024-02-05',
      location: 'Abuja, Nigeria',
      totalBUReceived: 45000,
    },
    {
      id: 'EVT-003',
      name: 'Graduation Party',
      celebrantWalletId: 'WALLET-003',
      celebrantName: 'Adekunle Johnson',
      vendorId: 'VENDOR-001',
      vendorName: 'Event Masters Ltd',
      status: 'active',
      createdAt: '2024-01-20',
      eventDate: '2024-02-15',
      location: 'Port Harcourt, Nigeria',
      totalBUReceived: 0,
    },
  ])

  const [newEvent, setNewEvent] = useState({
    name: '',
    celebrantWalletId: '',
    celebrantName: '',
    eventDate: '',
    location: '',
  })

  const filteredEvents = events.filter((event) => {
    if (event.status !== 'active') return false
    const query = searchQuery.toLowerCase()
    return (
      event.name.toLowerCase().includes(query) ||
      event.celebrantName.toLowerCase().includes(query) ||
      event.location?.toLowerCase().includes(query)
    )
  })

  const handleCreateEvent = () => {
    if (
      newEvent.name &&
      newEvent.celebrantWalletId &&
      newEvent.celebrantName &&
      newEvent.eventDate
    ) {
      const eventData: Omit<Event, 'id' | 'createdAt' | 'status'> = {
        name: newEvent.name,
        celebrantWalletId: newEvent.celebrantWalletId,
        celebrantName: newEvent.celebrantName,
        vendorId: 'VENDOR-CURRENT', // Would come from auth context
        vendorName: 'Current Vendor', // Would come from auth context
        eventDate: newEvent.eventDate,
        location: newEvent.location,
      }

      if (onCreateEvent) {
        onCreateEvent(eventData)
      }

      // Add to local state for demo
      const createdEvent: Event = {
        ...eventData,
        id: `EVT-${String(events.length + 1).padStart(3, '0')}`,
        createdAt: new Date().toISOString().split('T')[0],
        status: 'active',
      }
      setEvents([createdEvent, ...events])
      setNewEvent({
        name: '',
        celebrantWalletId: '',
        celebrantName: '',
        eventDate: '',
        location: '',
      })
      setShowCreateForm(false)
    }
  }

  if (mode === 'vendor') {
    return (
      <div className="space-y-6 pb-24 pt-4">
        <div className="px-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">Manage Events</h2>
            <Button
              onClick={() => setShowCreateForm(true)}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Event
            </Button>
          </div>

          {showCreateForm && (
            <Card className="border-primary/20 bg-card p-6 mb-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">Create New Event</h3>
                <Button
                  onClick={() => setShowCreateForm(false)}
                  variant="ghost"
                  size="sm"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-semibold">Event Name</label>
                  <Input
                    placeholder="e.g. Chioma's Wedding"
                    value={newEvent.name}
                    onChange={(e) =>
                      setNewEvent({ ...newEvent, name: e.target.value })
                    }
                    className="mt-2 bg-secondary text-foreground placeholder:text-muted-foreground"
                  />
                </div>

                <div>
                  <label className="text-sm font-semibold">Celebrant Name</label>
                  <Input
                    placeholder="Enter celebrant's full name"
                    value={newEvent.celebrantName}
                    onChange={(e) =>
                      setNewEvent({ ...newEvent, celebrantName: e.target.value })
                    }
                    className="mt-2 bg-secondary text-foreground placeholder:text-muted-foreground"
                  />
                </div>

                <div>
                  <label className="text-sm font-semibold">Celebrant Wallet ID</label>
                  <Input
                    placeholder="Enter celebrant's wallet ID"
                    value={newEvent.celebrantWalletId}
                    onChange={(e) =>
                      setNewEvent({ ...newEvent, celebrantWalletId: e.target.value })
                    }
                    className="mt-2 bg-secondary text-foreground placeholder:text-muted-foreground"
                  />
                  <p className="mt-1 text-xs text-muted-foreground">
                    Link the celebrant's wallet to receive ɃU transfers
                  </p>
                </div>

                <div>
                  <label className="text-sm font-semibold">Event Date</label>
                  <Input
                    type="date"
                    value={newEvent.eventDate}
                    onChange={(e) =>
                      setNewEvent({ ...newEvent, eventDate: e.target.value })
                    }
                    className="mt-2 bg-secondary text-foreground placeholder:text-muted-foreground"
                  />
                </div>

                <div>
                  <label className="text-sm font-semibold">Location (Optional)</label>
                  <Input
                    placeholder="e.g. Lagos, Nigeria"
                    value={newEvent.location}
                    onChange={(e) =>
                      setNewEvent({ ...newEvent, location: e.target.value })
                    }
                    className="mt-2 bg-secondary text-foreground placeholder:text-muted-foreground"
                  />
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={handleCreateEvent}
                    className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
                  >
                    Create Event
                  </Button>
                  <Button
                    onClick={() => setShowCreateForm(false)}
                    variant="outline"
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </Card>
          )}

          <div className="space-y-3">
            {events
              .filter((e) => e.vendorId === 'VENDOR-CURRENT' || e.vendorId === 'VENDOR-001')
              .map((event) => (
                <Card
                  key={event.id}
                  className="border-border/50 bg-card/50 p-4"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-semibold">{event.name}</h4>
                      <p className="text-sm text-muted-foreground mt-1">
                        Celebrant: {event.celebrantName}
                      </p>
                      <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {event.eventDate}
                        </span>
                        {event.location && (
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {event.location}
                          </span>
                        )}
                      </div>
                      <span
                        className={`mt-2 inline-block rounded-full px-2 py-1 text-xs font-semibold ${
                          event.status === 'active'
                            ? 'bg-green-400/20 text-green-400'
                            : event.status === 'completed'
                              ? 'bg-gray-400/20 text-gray-400'
                              : 'bg-red-400/20 text-red-400'
                        }`}
                      >
                        {event.status}
                      </span>
                    </div>
                    {event.totalBUReceived !== undefined && (
                      <div className="text-right">
                        <p className="font-bold text-primary">
                          Ƀ {event.totalBUReceived.toLocaleString()}
                        </p>
                        <p className="text-xs text-muted-foreground">Received</p>
                      </div>
                    )}
                  </div>
                </Card>
              ))}
          </div>
        </div>
      </div>
    )
  }

  // Guest mode - Event browser
  return (
    <div className="space-y-6 pb-24 pt-4">
      <div className="px-4">
        <h2 className="text-xl font-bold mb-4">Available Events</h2>

        {/* Search */}
        <div className="mb-4">
          <Input
            placeholder="Search events..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-secondary text-foreground placeholder:text-muted-foreground"
          />
        </div>

        {/* Events List */}
        <div className="space-y-3">
          {filteredEvents.length === 0 ? (
            <Card className="border-border/50 bg-card/50 p-8 text-center">
              <p className="text-muted-foreground">No active events found</p>
            </Card>
          ) : (
            filteredEvents.map((event) => (
              <Card
                key={event.id}
                onClick={() => onSelectEvent && onSelectEvent(event)}
                className="border-primary/20 cursor-pointer bg-card p-4 transition hover:bg-card/80 hover:border-primary/40"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="font-semibold">{event.name}</h4>
                    <p className="text-sm text-muted-foreground mt-1">
                      Celebrant: {event.celebrantName}
                    </p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {event.eventDate}
                      </span>
                      {event.location && (
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {event.location}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="rounded-full bg-primary/20 px-2 py-1 text-xs text-primary font-semibold">
                      Active
                    </span>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
