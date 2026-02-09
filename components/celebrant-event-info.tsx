'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Calendar, MapPin, Users, ArrowDown, TrendingUp, UserPlus, CheckCircle, Trash2 } from 'lucide-react'
import { eventsApi, transferApi } from '@/lib/api-client'
import { AlertPopup } from '@/components/ui/alert-popup'
import BULoading from '@/components/bu-loading'

interface Event {
  id: string
  name: string
  date: string
  time?: string
  location?: string
  totalBUReceived: number
  vendorName: string
  description?: string
  withdrawn?: boolean // Track if this event's balance has been withdrawn
}

interface BUTransfer {
  id: string
  eventId: string
  eventName: string
  amount: number
  fromGuest: string
  timestamp: string
}

interface Invite {
  id: string
  guest_id: string
  guest_name: string
  guest_phone: string
  status: 'pending' | 'accepted' | 'declined'
  seat_category?: string
  gate?: string
  seat?: string
  created_at: string
  guest?: {
    first_name: string
    last_name: string
    phone_number: string
  }
}

interface CelebrantEventInfoProps {
  eventId?: string
  onNavigate?: (page: string, data?: any) => void
}

export default function CelebrantEventInfo({ eventId, onNavigate }: CelebrantEventInfoProps) {
  const [event, setEvent] = useState<Event | null>(null)
  const [transfers, setTransfers] = useState<BUTransfer[]>([])
  const [invites, setInvites] = useState<Invite[]>([])
  const [loading, setLoading] = useState(true)
  const [isDone, setIsDone] = useState(false)
  const [remainingBalance, setRemainingBalance] = useState(0)
  const [alertPopup, setAlertPopup] = useState<{ open: boolean; title: string; message: string; type: 'success' | 'error' | 'info' }>({
    open: false,
    title: '',
    message: '',
    type: 'info',
  })

  useEffect(() => {
    const fetchEventData = async () => {
      // Handle both string eventId and object with eventId property
      const actualEventId = typeof eventId === 'string' ? eventId : eventId?.id || eventId?.eventId
      
      if (!actualEventId) {
        console.error('No event ID provided')
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        
        // Fetch event details from API
        let eventResponse: any = null
        try {
          eventResponse = await eventsApi.get(actualEventId)
        } catch (apiError: any) {
          console.error('API call error:', apiError)
          eventResponse = {
            success: false,
            error: apiError?.message || 'Failed to fetch event',
          }
        }
        
        // Validate response
        if (!eventResponse || typeof eventResponse !== 'object' || Object.keys(eventResponse).length === 0) {
          console.error('Invalid API response')
          setLoading(false)
          return
        }
        
        if (eventResponse.success && eventResponse.data?.event) {
          const eventData = eventResponse.data.event
          const formattedEvent: Event = {
            id: eventData.id,
            name: eventData.name,
            date: eventData.date,
            time: eventData.time || undefined,
            location: eventData.location || undefined,
            description: eventData.description || undefined,
            totalBUReceived: parseFloat(eventData.total_bu_received?.toString() || '0'),
            vendorName: eventData.vendor_name || 'Not linked',
            withdrawn: eventData.withdrawn || false,
          }
          setEvent(formattedEvent)

          // Use transfers from API response
          if (eventResponse.data?.transfers && Array.isArray(eventResponse.data.transfers)) {
            const eventTransfers = eventResponse.data.transfers.map((t: any) => ({
              id: t.id,
              eventId: t.event_id,
              eventName: formattedEvent.name,
              amount: parseFloat(t.amount?.toString() || '0'),
              fromGuest: t.sender ? `${t.sender.first_name} ${t.sender.last_name}` : 'Guest',
              timestamp: new Date(t.created_at).toLocaleString(),
            }))
            setTransfers(eventTransfers)
          }

          // Use invites from API response
          if (eventResponse.data?.invites && Array.isArray(eventResponse.data.invites)) {
            const formattedInvites = eventResponse.data.invites.map((inv: any) => ({
              id: inv.id,
              guest_id: inv.guest_id,
              guest_name: inv.guest_name || (inv.guest ? `${inv.guest.first_name} ${inv.guest.last_name}` : 'Unknown'),
              guest_phone: inv.guest_phone || inv.guest?.phone_number || '',
              status: inv.status,
              seat_category: inv.seat_category,
              gate: inv.gate,
              seat: inv.seat,
              created_at: inv.created_at,
              guest: inv.guest,
            }))
            setInvites(formattedInvites)
          }
        } else {
          console.error('Failed to fetch event:', eventResponse?.error)
          
          // Show user-friendly error message
          if (eventResponse?.error) {
          }
          // Don't set event, let it show "Event not found"
        }
      } catch (error) {
        console.error('Error fetching event data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchEventData()
  }, [eventId])

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center pb-24 pt-4 px-4">
        <BULoading />
      </div>
    )
  }

  if (!event) {
    return (
      <div className="space-y-6 pb-24 pt-4 px-4">
        <div className="mb-4">
          <Button
            onClick={() => onNavigate?.('dashboard')}
            variant="outline"
            className="w-full"
          >
            ← Back to Dashboard
          </Button>
        </div>
        <Card className="border-border/50 bg-card/50 p-8 text-center">
          <p className="text-muted-foreground mb-4">Event not found</p>
          <Button
            onClick={() => onNavigate?.('celebrant-create-event')}
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            Create New Event
          </Button>
        </Card>
      </div>
    )
  }

  const totalTransfers = transfers.reduce((sum, t) => sum + t.amount, 0)

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
              <Users className="h-5 w-5 text-primary" />
              <p className="text-sm text-muted-foreground">Vendor: {event.vendorName}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Total Received */}
      <div className="px-4">
        <Card className="border-green-400/20 bg-green-400/10 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Total ɃU Received</p>
              <p className="text-3xl font-bold text-green-400">
                Ƀ {event.totalBUReceived.toLocaleString()}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                ≈ ₦{event.totalBUReceived.toLocaleString()}
              </p>
            </div>
            <div className="rounded-full bg-green-400/20 p-3">
              <TrendingUp className="h-6 w-6 text-green-400" />
            </div>
          </div>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="px-4">
        <div className="grid grid-cols-2 gap-3 mb-3">
          <Button
            onClick={() => onNavigate?.('redemption', { 
              allowWalletWithdrawal: true, 
              eventId: event.id,
              eventName: event.name,
              eventBalance: event.totalBUReceived,
              eventWithdrawn: event.withdrawn || false
            })}
            disabled={event.withdrawn || event.totalBUReceived === 0}
            className="h-20 flex-col gap-2 bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span className="text-xl">💰</span>
            <span>{event.withdrawn ? 'Already Withdrawn' : 'Withdraw ɃU'}</span>
          </Button>
          <Button
            onClick={() => onNavigate?.('history', { filter: 'transfers', eventId: event.id })}
            variant="outline"
            className="h-20 flex-col gap-2"
          >
            <span className="text-xl">📊</span>
            <span>View History</span>
          </Button>
        </div>
        <Button
          onClick={() => onNavigate?.('celebrant-send-invites', event.id)}
          className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
        >
          <UserPlus className="h-4 w-4 mr-2" />
          Send Invites
        </Button>
      </div>

      {/* Recent Transfers */}
      <div className="px-4">
        <h3 className="text-lg font-bold mb-4">Recent ɃU Transfers</h3>
        {transfers.length === 0 ? (
          <Card className="border-border/50 bg-card/50 p-8 text-center">
            <p className="text-muted-foreground">No transfers yet for this event</p>
          </Card>
        ) : (
          <div className="space-y-3">
            {transfers.map((transfer) => (
              <Card
                key={transfer.id}
                onClick={() => onNavigate?.('history', { filter: 'transfers' })}
                className="border-border/50 cursor-pointer bg-card/50 p-4 transition hover:bg-card/80"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className="rounded-full bg-primary/20 p-2">
                      <ArrowDown className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold">{transfer.fromGuest}</h4>
                      <p className="text-xs text-muted-foreground mt-1">
                        {transfer.timestamp}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-primary">
                      +Ƀ {transfer.amount.toLocaleString()}
                    </p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Invited Guests */}
      <div className="px-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold">Invited Guests</h3>
          <span className="text-sm text-muted-foreground">
            {invites.length} {invites.length === 1 ? 'guest' : 'guests'}
          </span>
        </div>
        {invites.length === 0 ? (
          <Card className="border-border/50 bg-card/50 p-8 text-center">
            <p className="text-muted-foreground mb-4">No invites sent yet</p>
            <Button
              onClick={() => onNavigate?.('celebrant-send-invites', event.id)}
              variant="outline"
              size="sm"
            >
              <UserPlus className="h-4 w-4 mr-2" />
              Send Invites
            </Button>
          </Card>
        ) : (
          <div className="space-y-3">
            {invites.map((invite) => (
              <Card
                key={invite.id}
                className="border-border/50 bg-card/50 p-4"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold">{invite.guest_name}</h4>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        invite.status === 'accepted' 
                          ? 'bg-green-400/20 text-green-400' 
                          : invite.status === 'declined'
                          ? 'bg-red-400/20 text-red-400'
                          : 'bg-yellow-400/20 text-yellow-400'
                      }`}>
                        {invite.status}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">{invite.guest_phone}</p>
                    {invite.seat_category && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Seat: {invite.seat_category}
                        {invite.gate && ` • Gate: ${invite.gate}`}
                        {invite.seat && ` • Seat: ${invite.seat}`}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">
                      Invited: {new Date(invite.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Summary Stats */}
      <div className="px-4">
        <Card className="border-primary/20 bg-card p-4">
          <h4 className="font-semibold mb-3">Transfer Summary</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total Transfers:</span>
              <span className="font-semibold">{transfers.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total Amount:</span>
              <span className="font-bold text-primary">Ƀ {totalTransfers.toLocaleString()}</span>
            </div>
            <div className="flex justify-between pt-2 border-t border-border">
              <span className="text-muted-foreground">Total Invites:</span>
              <span className="font-semibold">{invites.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Accepted:</span>
              <span className="font-semibold text-green-400">
                {invites.filter(i => i.status === 'accepted').length}
              </span>
            </div>
            <div className="flex justify-between pt-2 border-t border-border">
              <span className="text-muted-foreground">Available to Withdraw:</span>
              <span className="font-bold text-green-400">Ƀ {remainingBalance.toLocaleString()}</span>
            </div>
          </div>
        </Card>
      </div>

      {/* Event Actions */}
      <div className="px-4">
        <div className="space-y-3">
          {!isDone && (
            <Button
              onClick={async () => {
                if (!confirm('Mark this event as done? This action cannot be undone.')) {
                  return
                }
                try {
                  const response = await eventsApi.markDone(event.id)
                  if (response.success) {
                    setIsDone(true)
                    setAlertPopup({
                      open: true,
                      title: 'Success',
                      message: 'Event marked as done!',
                      type: 'success',
                    })
                  } else {
                    setAlertPopup({
                      open: true,
                      title: 'Error',
                      message: response.error || 'Failed to mark event as done',
                      type: 'error',
                    })
                  }
                } catch (error: any) {
                  console.error('Mark event done error:', error)
                  setAlertPopup({
                    open: true,
                    title: 'Error',
                    message: error.message || 'Failed to mark event as done',
                    type: 'error',
                  })
                }
              }}
              variant="outline"
              className="w-full"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Mark Event as Done
            </Button>
          )}

          {isDone && (
            <Card className="border-green-400/20 bg-green-400/10 p-4">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-400" />
                <p className="text-sm font-semibold text-green-400">Event Marked as Done</p>
              </div>
            </Card>
          )}

            <Button
              onClick={async () => {
                if (remainingBalance > 0) {
                setAlertPopup({
                  open: true,
                  title: 'Cannot Delete Event',
                  message: `Cannot delete event. There is still Ƀ ${remainingBalance.toLocaleString()} remaining. Please withdraw all BU before deleting.`,
                  type: 'error',
                })
                return
              }

              if (!confirm('Are you sure you want to delete this event? This action cannot be undone and will delete all associated data.')) {
                return
              }

              try {
                const response = await eventsApi.delete(event.id)
                if (response.success) {
                  setAlertPopup({
                    open: true,
                    title: 'Success',
                    message: 'Event deleted successfully!',
                    type: 'success',
                  })
                  // Navigate back to dashboard after a short delay
                  setTimeout(() => {
                    onNavigate?.('dashboard')
                  }, 1500)
                } else {
                  setAlertPopup({
                    open: true,
                    title: 'Error',
                    message: response.error || 'Failed to delete event',
                    type: 'error',
                  })
                }
              } catch (error: any) {
                console.error('Delete event error:', error)
                setAlertPopup({
                  open: true,
                  title: 'Error',
                  message: error.message || 'Failed to delete event',
                  type: 'error',
                })
              }
            }}
            variant="outline"
            className="w-full text-red-400 border-red-400/20 hover:bg-red-400/10 hover:border-red-400/40"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Remove Event
          </Button>
        </div>
      </div>

      {/* Alert Popup */}
      <AlertPopup
        open={alertPopup.open}
        onOpenChange={(open) => setAlertPopup({ ...alertPopup, open })}
        title={alertPopup.title}
        message={alertPopup.message}
        type={alertPopup.type}
      />
    </div>
  )
}
