'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Calendar, MapPin, Ticket, Users, Clock } from 'lucide-react'

interface Event {
  id: string
  name: string
  date: string
  time?: string
  location?: string
  price: number
  ticketsAvailable: number
  description?: string
  category?: string
  organizer?: string
}

interface EventInfoProps {
  eventId?: string
  onNavigate?: (page: string, data?: any) => void
}

export default function EventInfo({ eventId, onNavigate }: EventInfoProps) {
  const [event, setEvent] = useState<Event | null>(null)
  const [similarEvents, setSimilarEvents] = useState<Event[]>([])
  const [eventsAroundMe, setEventsAroundMe] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // This component is for public events (not celebrant events)
    // For now, show empty state - can be implemented later if needed
    setLoading(false)
    setEvent(null)
    setSimilarEvents([])
    setEventsAroundMe([])
  }, [eventId])

  if (!event) {
    return (
      <div className="space-y-6 pb-24 pt-4 px-4">
        <p className="text-muted-foreground">Loading event details...</p>
      </div>
    )
  }

  const handleBuyTickets = () => {
    if (onNavigate && event) {
      // Navigate to events page with buy action and event data
      onNavigate('events', { action: 'buy', eventId: event.id })
    }
  }

  const handleEventClick = (clickedEventId: string) => {
    if (onNavigate) {
      onNavigate('event-info', clickedEventId)
    }
  }

  return (
    <div className="space-y-6 pb-24 pt-4">
      {/* Event Details */}
      <div className="px-4">
        <Card className="border-primary/20 bg-gradient-to-br from-primary/10 to-primary/5 p-6">
          <h1 className="text-2xl font-bold mb-4">{event.name}</h1>
          
          {event.description && (
            <p className="text-muted-foreground mb-4">{event.description}</p>
          )}

          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <Calendar className="h-5 w-5 text-primary" />
              <div>
                <p className="font-semibold">{event.date}</p>
                {event.time && <p className="text-sm text-muted-foreground">{event.time}</p>}
              </div>
            </div>

            {event.location && (
              <div className="flex items-center gap-3">
                <MapPin className="h-5 w-5 text-primary" />
                <p className="font-semibold">{event.location}</p>
              </div>
            )}

            <div className="flex items-center gap-3">
              <Ticket className="h-5 w-5 text-primary" />
              <div className="flex-1">
                <p className="font-semibold">₦{event.price.toLocaleString()} per ticket</p>
                <p className="text-sm text-muted-foreground">{event.ticketsAvailable} tickets available</p>
              </div>
            </div>

            {event.organizer && (
              <div className="flex items-center gap-3">
                <Users className="h-5 w-5 text-primary" />
                <p className="text-sm text-muted-foreground">Organized by {event.organizer}</p>
              </div>
            )}

            {event.category && (
              <div>
                <span className="rounded-full bg-primary/20 px-3 py-1 text-xs font-semibold text-primary">
                  {event.category}
                </span>
              </div>
            )}
          </div>

          <Button
            onClick={handleBuyTickets}
            className="w-full mt-6 bg-primary text-primary-foreground hover:bg-primary/90"
          >
            Buy Tickets
          </Button>
        </Card>
      </div>

      {/* Similar Upcoming Events */}
      {similarEvents.length > 0 && (
        <div className="px-4">
          <h3 className="text-lg font-bold mb-4">Similar Upcoming Events</h3>
          <div className="space-y-3">
            {similarEvents.map((similarEvent) => (
              <Card
                key={similarEvent.id}
                onClick={() => handleEventClick(similarEvent.id)}
                className="border-border/50 cursor-pointer bg-card/50 p-4 transition hover:bg-card/80"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="font-semibold">{similarEvent.name}</h4>
                    {similarEvent.description && (
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                        {similarEvent.description}
                      </p>
                    )}
                    <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {similarEvent.date}
                      </span>
                      {similarEvent.location && (
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {similarEvent.location}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-right ml-4">
                    <p className="font-bold text-primary">₦{similarEvent.price.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">
                      {similarEvent.ticketsAvailable} available
                    </p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Events Around Me */}
      {eventsAroundMe.length > 0 && (
        <div className="px-4">
          <h3 className="text-lg font-bold mb-4">Events Around Me</h3>
          <div className="space-y-3">
            {eventsAroundMe.map((nearbyEvent) => (
              <Card
                key={nearbyEvent.id}
                onClick={() => handleEventClick(nearbyEvent.id)}
                className="border-border/50 cursor-pointer bg-card/50 p-4 transition hover:bg-card/80"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="font-semibold">{nearbyEvent.name}</h4>
                    {nearbyEvent.description && (
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                        {nearbyEvent.description}
                      </p>
                    )}
                    <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {nearbyEvent.date}
                      </span>
                      {nearbyEvent.time && (
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {nearbyEvent.time}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-right ml-4">
                    <p className="font-bold text-primary">₦{nearbyEvent.price.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">
                      {nearbyEvent.ticketsAvailable} available
                    </p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
