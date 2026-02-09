'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Calendar, MapPin, Ticket, CheckCircle, Search, Filter } from 'lucide-react'
import { eventsApi, ticketsApi, walletApi } from '@/lib/api-client'
import PinVerification from '@/components/pin-verification'
import BULoading from '@/components/bu-loading'
import { TicketPurchaseReceipt, type TicketPurchaseReceiptData } from '@/components/ticket-purchase-receipt'

interface Event {
  id: string
  name: string
  date: string
  location?: string
  city?: string
  state?: string
  country?: string
  ticket_price_bu?: number
  max_tickets?: number
  tickets_sold?: number
  ticketsAvailable?: number
  description?: string
  category?: string
  image_url?: string
  tickets_enabled?: boolean
  is_around_me?: boolean
}

interface EventsTicketsProps {
  onNavigate?: (page: string, data?: any) => void
  initialData?: any
}

export default function EventsTickets({ onNavigate, initialData }: EventsTicketsProps) {
  const [allEvents, setAllEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [cityFilter, setCityFilter] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [userCity, setUserCity] = useState<string>('')
  const [events, setEvents] = useState<Event[]>([])
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null)
  const [ticketQuantity, setTicketQuantity] = useState('1')
  const [showCheckout, setShowCheckout] = useState(false)
  const [purchasing, setPurchasing] = useState(false)
  const [showPinModal, setShowPinModal] = useState(false)
  const [purchaseSuccessReceipt, setPurchaseSuccessReceipt] = useState<TicketPurchaseReceiptData | null>(null)

  // Fetch events from API
  useEffect(() => {
    fetchEvents()
  }, [])

  // Get user's city from localStorage or prompt
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedCity = localStorage.getItem('user_city')
      if (savedCity) {
        setUserCity(savedCity)
        setCityFilter(savedCity) // Auto-filter by user's city
      } else {
        // Prompt user for their city
        const city = prompt('Enter your city to see nearby events:')
        if (city) {
          setUserCity(city)
          setCityFilter(city)
          localStorage.setItem('user_city', city)
        }
      }
    }
  }, [])

  const fetchEvents = async () => {
    try {
      setLoading(true)
      const userState = typeof window !== 'undefined' ? localStorage.getItem('user_state') || '' : ''
      const response = await eventsApi.list({
        around_me: true,
        user_city: userCity || undefined,
        user_state: userState || undefined,
        city: cityFilter || undefined,
        category: categoryFilter || undefined,
        search: searchQuery || undefined,
      })
      if (response.success && response.data?.events) {
        const publicEvents = response.data.events
          .filter((e: any) => e.is_around_me && (e.ticket_price_bu ?? 0) >= 0)
          .map((e: any) => {
            const ticketsAvailable = e.max_tickets 
              ? e.max_tickets - (e.tickets_sold || 0)
              : null
            
            return {
              id: e.id,
              name: e.name,
              date: e.date,
              location: e.location,
              city: e.city,
              state: e.state,
              country: e.country,
              ticket_price_bu: parseFloat(e.ticket_price_bu || '0'),
              max_tickets: e.max_tickets,
              tickets_sold: e.tickets_sold || 0,
              ticketsAvailable: ticketsAvailable,
              description: e.description,
              category: e.category,
              image_url: e.image_url,
              tickets_enabled: e.tickets_enabled,
              is_around_me: e.is_around_me,
            }
          })
        
        // Apply client-side filters
        let filtered = publicEvents
        
        if (cityFilter) {
          filtered = filtered.filter((e: Event) => 
            e.city?.toLowerCase().includes(cityFilter.toLowerCase())
          )
        }
        
        if (categoryFilter) {
          filtered = filtered.filter((e: Event) => e.category === categoryFilter)
        }
        
        if (searchQuery) {
          const query = searchQuery.toLowerCase()
          filtered = filtered.filter((e: Event) =>
            e.name.toLowerCase().includes(query) ||
            e.description?.toLowerCase().includes(query) ||
            e.location?.toLowerCase().includes(query) ||
            e.city?.toLowerCase().includes(query) ||
            e.category?.toLowerCase().includes(query)
          )
        }
        
        // Sort by date (upcoming first)
        filtered.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
        
        setAllEvents(publicEvents)
        setEvents(filtered)
      }
    } catch (error) {
      console.error('Failed to fetch events:', error)
    } finally {
      setLoading(false)
    }
  }

  // Refetch when filters change
  useEffect(() => {
    fetchEvents()
  }, [cityFilter, categoryFilter])

  // Filter by search query
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setEvents(allEvents)
    } else {
      const query = searchQuery.toLowerCase()
      const filtered = allEvents.filter(
        (event) =>
          event.name.toLowerCase().includes(query) ||
          event.description?.toLowerCase().includes(query) ||
          event.location?.toLowerCase().includes(query) ||
          event.city?.toLowerCase().includes(query) ||
          event.category?.toLowerCase().includes(query)
      )
      setEvents(filtered)
    }
  }, [searchQuery, allEvents])

  // Handle initial data (from event-info "Buy Tickets"): show ticket purchase (image 2) immediately
  useEffect(() => {
    if (!initialData || initialData.action !== 'buy' || !initialData.eventId) return
    const eventId = initialData.eventId as string

    // Prefer event from list if already loaded
    const fromList = allEvents.find((e) => e.id === eventId)
    if (fromList) {
      setSelectedEvent(fromList)
      setShowCheckout(true)
      return
    }

    // List not ready or event not in list (e.g. filters) — fetch event by ID so checkout shows right away
    let cancelled = false
    eventsApi.get(eventId).then((res) => {
      if (cancelled) return
      if (res.success && res.data?.event) {
        const e = res.data.event
        const ticketsAvailable =
          e.max_tickets != null ? (e.max_tickets - (e.tickets_sold || 0)) : null
        setSelectedEvent({
          id: e.id,
          name: e.name,
          date: e.date,
          location: e.location,
          city: e.city,
          state: e.state,
          country: e.country,
          ticket_price_bu: parseFloat(e.ticket_price_bu || '0'),
          max_tickets: e.max_tickets,
          tickets_sold: e.tickets_sold || 0,
          ticketsAvailable,
          description: e.description,
          category: e.category,
          image_url: e.image_url,
          tickets_enabled: e.tickets_enabled,
          is_around_me: e.is_around_me,
        })
        setShowCheckout(true)
      }
    })
    return () => {
      cancelled = true
    }
  }, [initialData, initialData?.eventId, allEvents])

  const handleEventClick = (event: Event) => {
    if (onNavigate) {
      onNavigate('event-info', event.id)
    }
  }

  const handleBuyTickets = (event: Event) => {
    setSelectedEvent(event)
    setShowCheckout(true)
  }

  const handleCheckout = () => {
    if (!selectedEvent || !ticketQuantity || isNaN(Number(ticketQuantity)) || Number(ticketQuantity) < 1) {
      alert('Please enter a valid quantity')
      return
    }

    const quantity = Number(ticketQuantity)

    // Check ticket availability
    if (selectedEvent.ticketsAvailable !== null && quantity > selectedEvent.ticketsAvailable) {
      alert(`Only ${selectedEvent.ticketsAvailable} ticket(s) available`)
      return
    }

    setShowPinModal(true)
  }

  const handlePinVerify = async (pin: string) => {
    if (!selectedEvent) return
    const quantity = Number(ticketQuantity) || 1
    const pricePerTicket = selectedEvent.ticket_price_bu || 0
    const total = pricePerTicket * quantity

    try {
      setPurchasing(true)
      const response = await ticketsApi.purchase(selectedEvent.id, quantity, pin)

      if (response.success && response.data?.ticket) {
        setShowPinModal(false)
        // Backend returns actual balance from DB as new_balance. Use it; never overwrite with getMe() here.
        const raw = response.data?.new_balance ?? (response.data as any)?.data?.new_balance
        const num = typeof raw === 'number' && Number.isFinite(raw) ? raw : parseFloat(String(raw ?? ''))
        const useNum = Number.isFinite(num) && num >= 0
        if (typeof window !== 'undefined') {
          const balanceStr = useNum ? num.toFixed(2) : (() => {
            const cached = sessionStorage.getItem('cached_balance')
            const prev = cached ? parseFloat(cached) : 0
            return Math.max(0, prev - total).toFixed(2)
          })()
          sessionStorage.setItem('cached_balance', balanceStr)
          sessionStorage.setItem('balance_updated_at', Date.now().toString())
          window.dispatchEvent(new CustomEvent('balance-updated', { detail: { balance: balanceStr } }))
        }
        const now = new Date()
        const receiptData: TicketPurchaseReceiptData = {
          eventName: selectedEvent.name,
          eventDate: selectedEvent.date,
          eventLocation: selectedEvent.location,
          quantity,
          pricePerTicket,
          total,
          ticketId: response.data.ticket.id || `tx-${Date.now()}`,
          purchaseDate: now.toLocaleDateString('en-NG', { dateStyle: 'medium' }),
          purchaseTime: now.toLocaleTimeString('en-NG', { hour: '2-digit', minute: '2-digit' }),
        }
        setPurchaseSuccessReceipt(receiptData)
        fetchEvents()
      } else {
        alert(response.error || 'Failed to purchase tickets')
      }
    } catch (error: any) {
      console.error('Purchase error:', error)
      alert(error.message || 'Failed to purchase tickets')
    } finally {
      setPurchasing(false)
    }
  }

  const handlePurchaseDone = () => {
    setPurchaseSuccessReceipt(null)
    setShowCheckout(false)
    setSelectedEvent(null)
    setTicketQuantity('1')
    fetchEvents()
  }

  // Success: show "Ticket purchased" with downloadable receipt
  if (purchaseSuccessReceipt) {
    return (
      <TicketPurchaseReceipt
        receipt={purchaseSuccessReceipt}
        onDone={handlePurchaseDone}
      />
    )
  }

  if (showCheckout && selectedEvent) {
    const quantity = Number(ticketQuantity) || 1
    const pricePerTicket = selectedEvent.ticket_price_bu || 0
    const total = pricePerTicket * quantity

    return (
      <div className="space-y-6 pb-24 pt-4">
        <div className="px-4">
          <div className="mb-4">
            <Button
              onClick={() => {
                setShowCheckout(false)
                setSelectedEvent(null)
              }}
              variant="outline"
              className="w-full"
            >
              ← Back to Events
            </Button>
          </div>

          <h2 className="text-xl font-bold mb-4">Purchase Tickets</h2>

          <Card className="border-primary/20 bg-card p-6 mb-4">
            <h3 className="font-semibold mb-4">{selectedEvent.name}</h3>
            <div className="space-y-2 text-sm mb-4">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-primary" />
                <span>{selectedEvent.date}</span>
              </div>
              {selectedEvent.location && (
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-primary" />
                  <span>{selectedEvent.location}</span>
                </div>
              )}
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-semibold">Number of Tickets</label>
                <Input
                  type="number"
                  min="1"
                  value={ticketQuantity}
                  onChange={(e) => setTicketQuantity(e.target.value)}
                  className="mt-2 bg-secondary text-foreground"
                />
              </div>

              <div className="border-t border-border pt-4 space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Price per ticket:</span>
                  <span className="font-semibold">Ƀ{pricePerTicket.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Quantity:</span>
                  <span className="font-semibold">{quantity}</span>
                </div>
                {selectedEvent.ticketsAvailable !== null && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Available:</span>
                    <span className="font-semibold">{selectedEvent.ticketsAvailable} tickets</span>
                  </div>
                )}
                <div className="flex justify-between text-lg font-bold pt-2 border-t border-border">
                  <span>Total:</span>
                  <span className="text-primary">Ƀ{total.toLocaleString()}</span>
                </div>
                <div className="text-xs text-muted-foreground pt-1">
                  Billed in BU · Payment deducted from your ɃU balance
                </div>
              </div>

              <Button
                onClick={handleCheckout}
                disabled={purchasing || quantity < 1 || (selectedEvent.ticketsAvailable !== null && quantity > selectedEvent.ticketsAvailable)}
                className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
              >
                {purchasing ? 'Processing...' : 'Complete Purchase'}
              </Button>
            </div>
          </Card>

          {showPinModal && (
            <PinVerification
              title="Enter PIN"
              description="Enter your 6-digit PIN to complete the purchase"
              onVerify={handlePinVerify}
              onCancel={() => setShowPinModal(false)}
            />
          )}
        </div>
      </div>
    )
  }

  // In buy flow from Event Info: don't show the search/list page — show loading until checkout is ready
  if (initialData?.action === 'buy' && initialData?.eventId) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center pb-24 pt-4">
        <BULoading />
      </div>
    )
  }

  return (
    <div className="space-y-6 pb-24 pt-4">
      <div className="px-4">
        <h2 className="text-xl font-bold mb-4">Shows & Parties Around Me</h2>
        <p className="text-sm text-muted-foreground mb-4">
          Browse and search for events and celebrations around you
        </p>

        {/* Search and Filters */}
        <Card className="border-primary/20 bg-card p-4 mb-4 space-y-3">
          <div className="flex items-center gap-3">
            <Search className="h-5 w-5 text-primary" />
            <Input
              type="text"
              placeholder="Search events by name, location, or category..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-secondary text-foreground placeholder:text-muted-foreground"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">City</label>
              <Input
                type="text"
                placeholder="Filter by city"
                value={cityFilter}
                onChange={(e) => setCityFilter(e.target.value)}
                className="bg-secondary text-foreground text-sm"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Category</label>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full rounded-lg border border-border bg-secondary px-3 py-2 text-sm text-foreground"
              >
                <option value="">All Categories</option>
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
          </div>
          
          {userCity && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <MapPin className="h-3 w-3" />
              <span>Showing events in: {userCity}</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setCityFilter('')
                  localStorage.removeItem('user_city')
                  setUserCity('')
                }}
                className="h-6 px-2 text-xs"
              >
                Change
              </Button>
            </div>
          )}
        </Card>

        {/* Events List */}
        {loading ? (
          <Card className="border-border/50 bg-card/50 p-8 text-center">
            <BULoading />
          </Card>
        ) : events.length === 0 ? (
          <Card className="border-border/50 bg-card/50 p-8 text-center">
            <p className="text-muted-foreground">
              {cityFilter || categoryFilter || searchQuery
                ? 'No events found matching your filters.'
                : 'No upcoming events with ticket sales available.'}
            </p>
            {(searchQuery || cityFilter || categoryFilter) && (
              <Button
                onClick={() => {
                  setSearchQuery('')
                  setCityFilter('')
                  setCategoryFilter('')
                }}
                variant="outline"
                className="mt-4"
              >
                Clear Filters
              </Button>
            )}
          </Card>
        ) : (
          <div className="space-y-3">
            {events.map((event) => (
              <Card
                key={event.id}
                onClick={() => handleEventClick(event)}
                className="border-primary/20 cursor-pointer bg-card p-4 transition hover:bg-card/80 hover:border-primary/40"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="font-semibold">{event.name}</h3>
                    {event.description && (
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                        {event.description}
                      </p>
                    )}
                  </div>
                  <span className="rounded-full bg-primary/20 px-2 py-1 text-xs text-primary ml-2">
                    {event.date}
                  </span>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="h-4 w-4 text-primary" />
                    <span>{event.city || event.location || 'Location TBD'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm">
                      <Ticket className="h-4 w-4 text-primary" />
                      <span className="text-muted-foreground">
                        {event.ticketsAvailable !== null 
                          ? `${event.ticketsAvailable} available`
                          : 'Unlimited tickets'}
                      </span>
                    </div>
                    <span className="text-lg font-bold text-primary">
                      Ƀ{event.ticket_price_bu?.toLocaleString() || '0'}
                    </span>
                  </div>
                  {event.ticket_price_bu != null && (
                    <p className="text-xs text-muted-foreground">
                      Billed in BU (ɃU)
                    </p>
                  )}
                  {event.category && (
                    <span className="inline-block rounded-full bg-primary/10 px-2 py-1 text-xs text-primary">
                      {event.category}
                    </span>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
