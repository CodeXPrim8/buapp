'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Calendar, MapPin, Clock, User, CheckCircle, AlertCircle, QrCode, Download, Search, Link2 } from 'lucide-react'
import { gatewayApi, eventsApi, userApi } from '@/lib/api-client'
import BULoading from '@/components/bu-loading'

interface VendorGatewaySetupProps {
  onNavigate?: (page: string, data?: any) => void
  onGatewayCreated?: (gateway: any) => void
  initialEventId?: string
}

export default function VendorGatewaySetup({ onNavigate, onGatewayCreated, initialEventId }: VendorGatewaySetupProps) {
  const [linkMode, setLinkMode] = useState<'existing' | 'manual'>('existing') // 'existing' = link to event, 'manual' = manual entry
  const [formData, setFormData] = useState({
    eventId: '', // Selected event ID
    eventName: '',
    eventDate: '',
    eventTime: '',
    eventLocation: '',
    celebrantUniqueId: '', // Phone number
    celebrantName: '',
  })

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [gatewayCreated, setGatewayCreated] = useState(false)
  const [createdGateway, setCreatedGateway] = useState<any>(null)
  const [availableEvents, setAvailableEvents] = useState<Array<{ id: string; name: string; date: string; location?: string; celebrant_id: string; celebrant_name?: string }>>([])
  const [loadingEvents, setLoadingEvents] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  // Fetch available events to link to
  useEffect(() => {
    const fetchEvents = async () => {
      if (linkMode === 'existing') {
        setLoadingEvents(true)
        try {
          // Fetch all events (vendors can see events to link to)
          const response = await eventsApi.list({ for_gateway_link: true }) // Vendor sees their events + events they're invited to
          if (response.success && response.data?.events) {
            // Transform events with celebrant info
            const eventsWithCelebrants = response.data.events.map((event: any) => ({
              id: event.id,
              name: event.name,
              date: event.date,
              location: event.location,
              celebrant_id: event.celebrant_id,
              celebrant_name: event.celebrant 
                ? `${event.celebrant.first_name} ${event.celebrant.last_name}`
                : 'Unknown Celebrant',
              celebrant_phone: event.celebrant?.phone_number || '',
            }))
            setAvailableEvents(eventsWithCelebrants)
          }
        } catch (error) {
          console.error('Failed to fetch events:', error)
        } finally {
          setLoadingEvents(false)
        }
      }
    }

    fetchEvents()
  }, [linkMode])

  // Pre-select event when opened from Invites (Create gateway for this event)
  useEffect(() => {
    if (initialEventId && availableEvents.length > 0) {
      const event = availableEvents.find(e => e.id === initialEventId)
      if (event) {
        setFormData(prev => ({
          ...prev,
          eventId: event.id,
          eventName: event.name,
          eventDate: event.date,
          eventLocation: event.location || '',
          celebrantUniqueId: event.celebrant_phone,
          celebrantName: event.celebrant_name,
        }))
      }
    }
  }, [initialEventId, availableEvents])

  // Handle event selection
  const handleEventSelect = (eventId: string) => {
    const selectedEvent = availableEvents.find(e => e.id === eventId)
    if (selectedEvent) {
      setFormData(prev => ({
        ...prev,
        eventId: selectedEvent.id,
        eventName: selectedEvent.name,
        eventDate: selectedEvent.date,
        eventLocation: selectedEvent.location || '',
        celebrantUniqueId: selectedEvent.celebrant_phone,
        celebrantName: selectedEvent.celebrant_name,
      }))
    }
  }

  // Filter events based on search
  const filteredEvents = availableEvents.filter(event =>
    event.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    event.celebrant_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    event.location?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (linkMode === 'existing') {
      if (!formData.eventId) {
        alert('Please select an event to link')
        return
      }
    } else {
      if (!formData.eventName || !formData.eventDate || !formData.celebrantUniqueId || !formData.celebrantName) {
        alert('Please fill in all required fields')
        return
      }
    }

    setIsSubmitting(true)

    try {
      const gatewayData: any = {
        event_time: formData.eventTime || undefined,
        event_location: formData.eventLocation || undefined,
      }

      // If linking to existing event, send event_id
      if (linkMode === 'existing' && formData.eventId) {
        gatewayData.event_id = formData.eventId
      } else {
        // Manual entry
        gatewayData.event_name = formData.eventName
        gatewayData.event_date = formData.eventDate
        gatewayData.celebrant_unique_id = formData.celebrantUniqueId
        gatewayData.celebrant_name = formData.celebrantName
      }

      const response = await gatewayApi.create(gatewayData)

      if (!response.success || !response.data?.gateway) {
        alert(response.error || 'Failed to create gateway. Please try again.')
        setIsSubmitting(false)
        return
      }

      const gateway = response.data.gateway
      setCreatedGateway(gateway)
      setGatewayCreated(true)
      setIsSubmitting(false)

      if (onGatewayCreated) {
        onGatewayCreated(gateway)
      }
    } catch (error: any) {
      console.error('Gateway creation error:', error)
      alert(error.message || 'Failed to create gateway. Please try again.')
      setIsSubmitting(false)
    }
  }

  if (gatewayCreated && createdGateway) {
    // Generate QR code data for gateway
    const qrData = JSON.stringify({
      type: 'gateway',
      gatewayId: createdGateway.id,
      eventName: createdGateway.eventName,
      celebrantUniqueId: createdGateway.celebrantUniqueId,
      celebrantName: createdGateway.celebrantName,
    })

    // Generate QR code URL (using a QR code API service)
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qrData)}`

    return (
      <div className="space-y-6 pb-24 pt-4">
        <div className="px-4">
          <Card className="border-green-400/30 bg-green-400/10 p-6">
            <div className="flex flex-col items-center text-center">
              <CheckCircle className="h-12 w-12 text-green-400 mb-4" />
              <h3 className="text-xl font-bold mb-2">Payment Gateway Created!</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Gateway is now active. Guests can scan the QR code below to send ɃU directly to the celebrant's wallet.
              </p>
              
              {/* QR Code Display */}
              <Card className="border-primary/20 bg-card p-6 mb-4 w-full">
                <div className="flex flex-col items-center">
                  <QrCode className="h-6 w-6 text-primary mb-2" />
                  <h4 className="font-semibold mb-3">Gateway QR Code</h4>
                  <p className="text-xs text-muted-foreground mb-4 text-center">
                    Guests scan this to send ɃU to {createdGateway.celebrantName}
                  </p>
                  <div className="bg-white p-4 rounded-lg mb-4">
                    <img 
                      src={qrCodeUrl} 
                      alt="Gateway QR Code" 
                      className="w-64 h-64 mx-auto"
                    />
                  </div>
                  <Button
                    onClick={() => {
                      const link = document.createElement('a')
                      link.href = qrCodeUrl
                      link.download = `gateway-${createdGateway.id}-qr.png`
                      link.click()
                    }}
                    variant="outline"
                    className="w-full"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download QR Code
                  </Button>
                </div>
              </Card>

              <div className="w-full space-y-2 mb-4">
                <div className="rounded-lg bg-background/50 p-3 text-left">
                  <p className="text-xs text-muted-foreground">Gateway ID</p>
                  <p className="font-mono text-sm font-semibold">{createdGateway.id}</p>
                </div>
                <div className="rounded-lg bg-background/50 p-3 text-left">
                  <p className="text-xs text-muted-foreground">Linked Celebrant</p>
                  <p className="font-semibold">{createdGateway.celebrantName}</p>
                  <p className="text-xs text-muted-foreground">{createdGateway.celebrantUniqueId}</p>
                </div>
              </div>
              <div className="flex gap-2 w-full">
                <Button
                  onClick={() => {
                    setGatewayCreated(false)
                    setFormData({
                      eventName: '',
                      eventDate: '',
                      eventTime: '',
                      eventLocation: '',
                      celebrantUniqueId: '',
                      celebrantName: '',
                    })
                  }}
                  variant="outline"
                  className="flex-1"
                >
                  Create Another
                </Button>
                <Button
                  onClick={() => onNavigate?.('wallet')}
                  className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  Go to POS
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    )
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

        <h2 className="text-xl font-bold mb-2">Sell ɃU Note - Setup Gateway</h2>
        <p className="text-sm text-muted-foreground mb-6">
          Create a payment gateway linked to a celebrant's event. All ɃU sent through this gateway will go directly to the celebrant's event wallet.
        </p>

        {/* Link Mode Toggle */}
        <Card className="border-primary/20 bg-card p-4 mb-4">
          <div className="flex gap-2 mb-4">
            <Button
              type="button"
              onClick={() => setLinkMode('existing')}
              variant={linkMode === 'existing' ? 'default' : 'outline'}
              className="flex-1"
            >
              <Link2 className="h-4 w-4 mr-2" />
              Link to Existing Event
            </Button>
            <Button
              type="button"
              onClick={() => setLinkMode('manual')}
              variant={linkMode === 'manual' ? 'default' : 'outline'}
              className="flex-1"
            >
              <Calendar className="h-4 w-4 mr-2" />
              Manual Entry
            </Button>
          </div>
        </Card>

        {/* Info Card */}
        <Card className="border-primary/20 bg-primary/5 p-4 mb-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
            <div className="text-sm text-muted-foreground">
              <p className="font-semibold mb-1">How it works:</p>
              <ul className="list-disc list-inside space-y-1">
                {linkMode === 'existing' ? (
                  <>
                    <li>Search and select an existing event created by a celebrant</li>
                    <li>Gateway automatically links to the event and celebrant</li>
                    <li>All ɃU goes directly to the celebrant's event wallet</li>
                  </>
                ) : (
                  <>
                    <li>Fill event details and celebrant's phone number</li>
                    <li>Gateway links to celebrant's wallet</li>
                    <li>All ɃU goes directly to celebrant's wallet</li>
                  </>
                )}
                <li>You can sell physical ɃU notes to guests</li>
                <li>You confirm transactions on behalf of celebrant</li>
              </ul>
            </div>
          </div>
        </Card>

        <form onSubmit={handleSubmit} className="space-y-4">
          {linkMode === 'existing' ? (
            /* Link to Existing Event */
            <Card className="border-primary/20 bg-card p-6">
              <h3 className="font-semibold mb-4">Select Event to Link</h3>
              <div className="space-y-4">
                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-primary" />
                  <Input
                    type="text"
                    placeholder="Search events by name, celebrant, or location..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="bg-secondary pl-10 text-foreground placeholder:text-muted-foreground"
                  />
                </div>

                {/* Events List */}
                {loadingEvents ? (
                  <div className="flex justify-center py-8">
                    <BULoading />
                  </div>
                ) : filteredEvents.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">
                      {searchQuery ? 'No events found matching your search.' : 'No events available to link.'}
                    </p>
                    <p className="text-xs text-muted-foreground mt-2">
                      Celebrants need to create events first before you can link gateways.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {filteredEvents.map((event) => (
                      <Card
                        key={event.id}
                        onClick={() => handleEventSelect(event.id)}
                        className={`cursor-pointer border-border/50 bg-card/50 p-4 transition ${
                          formData.eventId === event.id
                            ? 'border-primary/50 bg-primary/5'
                            : 'hover:bg-card/80'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="font-semibold">{event.name}</h4>
                            <p className="text-sm text-muted-foreground mt-1">
                              {event.date} {event.location ? `· ${event.location}` : ''}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              Celebrant: {event.celebrant_name}
                            </p>
                          </div>
                          {formData.eventId === event.id && (
                            <CheckCircle className="h-5 w-5 text-primary flex-shrink-0" />
                          )}
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </Card>
          ) : (
            /* Manual Entry */
            <Card className="border-primary/20 bg-card p-6">
              <h3 className="font-semibold mb-4">Event Details</h3>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-semibold mb-2 block">Event Name *</label>
                  <Input
                    type="text"
                    placeholder="e.g., Chioma Adeyemi Wedding"
                    value={formData.eventName}
                    onChange={(e) => setFormData(prev => ({ ...prev, eventName: e.target.value }))}
                    required={linkMode === 'manual'}
                    disabled={linkMode === 'existing'}
                    className="bg-secondary text-foreground placeholder:text-muted-foreground"
                  />
                </div>

              <div>
                <label className="text-sm font-semibold mb-2 block">Event Date *</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-primary" />
                  <Input
                    type="date"
                    value={formData.eventDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, eventDate: e.target.value }))}
                    required
                    className="bg-secondary pl-10 text-foreground"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-semibold mb-2 block">Event Time</label>
                <div className="relative">
                  <Clock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-primary" />
                  <Input
                    type="time"
                    value={formData.eventTime}
                    onChange={(e) => setFormData(prev => ({ ...prev, eventTime: e.target.value }))}
                    className="bg-secondary pl-10 text-foreground"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-semibold mb-2 block">Event Location</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-primary" />
                  <Input
                    type="text"
                    placeholder="e.g., Lagos, Nigeria"
                    value={formData.eventLocation}
                    onChange={(e) => setFormData(prev => ({ ...prev, eventLocation: e.target.value }))}
                    className="bg-secondary pl-10 text-foreground placeholder:text-muted-foreground"
                  />
                </div>
              </div>
            </div>
          </Card>
          )}

          {/* Conditional cards based on linkMode */}
          {linkMode === 'manual' && (
            <Card className="border-primary/20 bg-card p-6">
              <h3 className="font-semibold mb-4">Link Celebrant Wallet</h3>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-semibold mb-2 block">Celebrant Unique ID (Phone Number) *</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-primary" />
                    <Input
                      type="tel"
                      placeholder="+2348012345678"
                      value={formData.celebrantUniqueId}
                      onChange={(e) => setFormData(prev => ({ ...prev, celebrantUniqueId: e.target.value }))}
                      required
                      className="bg-secondary pl-10 text-foreground placeholder:text-muted-foreground"
                    />
                  </div>
                  {formData.celebrantName && (
                    <p className="mt-2 text-sm text-green-400">
                      ✓ Found: {formData.celebrantName}
                    </p>
                  )}
                </div>
              </div>
            </Card>
          )}

          {linkMode === 'existing' && formData.eventId && (
            <Card className="border-green-400/30 bg-green-400/10 p-4">
              <div className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-green-400 flex-shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="font-semibold text-green-400 mb-1">Event Selected</p>
                  <p className="text-muted-foreground">
                    {formData.eventName} · {formData.eventDate}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Celebrant: {formData.celebrantName}
                  </p>
                </div>
              </div>
            </Card>
          )}

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
              disabled={
                linkMode === 'existing' 
                  ? (!formData.eventId || isSubmitting)
                  : (!formData.eventName || !formData.eventDate || !formData.celebrantUniqueId || isSubmitting)
              }
              className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {isSubmitting ? 'Creating Gateway...' : 'Create Gateway'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
