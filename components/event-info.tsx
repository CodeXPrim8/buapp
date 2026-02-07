'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Calendar, MapPin, Ticket, Users, Clock, QrCode } from 'lucide-react'
import { eventsApi, invitesApi } from '@/lib/api-client'

interface Event {
  id: string
  name: string
  date: string
  time?: string
  location?: string
  city?: string
  state?: string
  price: number
  ticketsAvailable: number
  description?: string
  category?: string
  organizer?: string
  is_around_me?: boolean
  strictly_by_invitation?: boolean
}

interface MyInvite {
  id: string
  event_id: string
  status: string
  qr_code_data?: { url?: string } | null
}

interface EventInfoProps {
  eventId?: string
  onNavigate?: (page: string, data?: any) => void
}

export default function EventInfo({ eventId, onNavigate }: EventInfoProps) {
  const [event, setEvent] = useState<Event | null>(null)
  const [similarEvents, setSimilarEvents] = useState<Event[]>([])
  const [eventsAroundMe, setEventsAroundMe] = useState<Event[]>([])
  const [myInvite, setMyInvite] = useState<MyInvite | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const actualEventId = typeof eventId === 'string' ? eventId : eventId?.id ?? eventId?.eventId

  useEffect(() => {
    if (!actualEventId) {
      setLoading(false)
      setEvent(null)
      setError('No event selected')
      return
    }
    let cancelled = false
    setLoading(true)
    setError(null)
    eventsApi.get(actualEventId).then((res) => {
      if (cancelled) return
      if (res.success && res.data?.event) {
        const e = res.data.event
        const ticketsAvailable = e.max_tickets != null ? (e.max_tickets - (e.tickets_sold || 0)) : null
        setEvent({
          id: e.id,
          name: e.name,
          date: e.date,
          location: e.location,
          city: e.city,
          state: e.state,
          description: e.description,
          category: e.category,
          organizer: e.celebrant ? `${e.celebrant.first_name || ''} ${e.celebrant.last_name || ''}`.trim() : undefined,
          price: parseFloat(e.ticket_price_bu || '0'),
          ticketsAvailable: ticketsAvailable ?? 0,
          is_around_me: e.is_around_me,
          strictly_by_invitation: e.strictly_by_invitation === true,
        })
      } else {
        setEvent(null)
        setError(res?.error || 'Event not found')
      }
    }).catch(() => {
      if (!cancelled) {
        setEvent(null)
        setError('Failed to load event')
      }
    }).finally(() => {
      if (!cancelled) setLoading(false)
    })
    return () => { cancelled = true }
  }, [actualEventId])

  // When event is strictly by invitation, fetch current user's invite for this event (for gate QR)
  useEffect(() => {
    if (!event?.strictly_by_invitation || !event.id) {
      setMyInvite(null)
      return
    }
    let cancelled = false
    invitesApi.list('received', event.id).then((res) => {
      if (cancelled) return
      if (res.success && res.data?.invites?.length) {
        const accepted = res.data.invites.find((inv: any) => inv.status === 'accepted')
        if (accepted) {
          setMyInvite({
            id: accepted.id,
            event_id: accepted.event_id,
            status: accepted.status,
            qr_code_data: accepted.qr_code_data ?? null,
          })
        } else {
          setMyInvite(null)
        }
      } else {
        setMyInvite(null)
      }
    }).catch(() => {
      if (!cancelled) setMyInvite(null)
    })
    return () => { cancelled = true }
  }, [event?.id, event?.strictly_by_invitation])

  if (loading) {
    return (
      <div className="space-y-6 pb-24 pt-4 px-4">
        <p className="text-muted-foreground">Loading event details...</p>
      </div>
    )
  }
  if (error || !event) {
    return (
      <div className="space-y-6 pb-24 pt-4 px-4">
        <p className="text-muted-foreground">{error || 'Event not found.'}</p>
        {onNavigate && (
          <Button variant="outline" onClick={() => onNavigate('events')}>Back to Events</Button>
        )}
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
                <p className="font-semibold">Ƀ{event.price.toLocaleString()} per ticket (BU)</p>
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

            {event.strictly_by_invitation && (
              <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 mt-3">
                <p className="text-sm font-medium text-amber-700 dark:text-amber-400 flex items-center gap-2">
                  <Ticket className="h-4 w-4" />
                  This event is strictly by invitation. Entry at the gate requires invite verification.
                </p>
                {myInvite ? (
                  <div className="mt-4 flex flex-col items-center text-center">
                    <p className="text-sm font-semibold mb-2 flex items-center gap-2">
                      <QrCode className="h-5 w-5 text-primary" />
                      Gate entry – show this at the door
                    </p>
                    <p className="text-xs text-muted-foreground mb-2">
                      Staff will scan this QR to verify your invite before entry.
                    </p>
                    <div className="bg-white p-2 rounded-lg inline-block">
                      <img
                        src={myInvite.qr_code_data?.url || `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(JSON.stringify({ invite_id: myInvite.id, event_id: myInvite.event_id, status: 'accepted' }))}`}
                        alt="Gate entry QR code"
                        className="w-36 h-36"
                      />
                    </div>
                  </div>
                ) : (
                  <>
                    <p className="text-xs text-muted-foreground mt-2">
                      You need an invitation to attend. Check your invites or request one from the host.
                    </p>
                    {onNavigate && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-2"
                        onClick={() => onNavigate('invites')}
                      >
                        View my invites
                      </Button>
                    )}
                  </>
                )}
              </div>
            )}
          </div>

          {event.is_around_me ? (
            <Button
              onClick={handleBuyTickets}
              className="w-full mt-6 bg-primary text-primary-foreground hover:bg-primary/90"
            >
              Buy Tickets
            </Button>
          ) : (
            onNavigate && (
              <Button
                variant="outline"
                className="w-full mt-6"
                onClick={() => onNavigate('send-bu', { eventId: event.id, eventName: event.name })}
              >
                Send BU to this event
              </Button>
            )
          )}
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
                    <p className="font-bold text-primary">Ƀ{similarEvent.price.toLocaleString()} BU</p>
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

      {/* Shows & Parties Around Me */}
      {eventsAroundMe.length > 0 && (
        <div className="px-4">
          <h3 className="text-lg font-bold mb-4">Shows & Parties Around Me</h3>
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
                    <p className="font-bold text-primary">Ƀ{nearbyEvent.price.toLocaleString()} BU</p>
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
