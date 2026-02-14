'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { CheckCircle, UserPlus, Search, Phone, Store } from 'lucide-react'
import { userApi, invitesApi, eventsApi, contactsApi } from '@/lib/api-client'
import BULoading from '@/components/bu-loading'

interface Contact {
  phoneNumber: string
  name: string
  registered: boolean
  userId?: string
  id?: string
  role?: string
}

interface SelectedVendor {
  userId: string
  phoneNumber: string
  name: string
}

interface Invite {
  phoneNumber: string
  name: string
  status: 'pending' | 'sent' | 'accepted' | 'declined'
}

interface CelebrantSendInvitesProps {
  eventId?: string
  onNavigate?: (page: string, data?: any) => void
}

export default function CelebrantSendInvites({ eventId, onNavigate }: CelebrantSendInvitesProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedContacts, setSelectedContacts] = useState<Set<string>>(new Set())
  const [contactSeatCategories, setContactSeatCategories] = useState<Map<string, string>>(new Map())
  const [invites, setInvites] = useState<Invite[]>([])
  const [isSending, setIsSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [allContacts, setAllContacts] = useState<Contact[]>([])
  const [loading, setLoading] = useState(true)
  const [events, setEvents] = useState<Array<{ id: string; name: string; date: string }>>([])
  const [selectedEventId, setSelectedEventId] = useState<string>(eventId || '')
  const [loadingEvents, setLoadingEvents] = useState(false)
  const [defaultSeatCategory, setDefaultSeatCategory] = useState<string>('Regular')
  const [sendError, setSendError] = useState<string | null>(null)
  const [selectedVendors, setSelectedVendors] = useState<SelectedVendor[]>([])
  const [vendorPhoneInput, setVendorPhoneInput] = useState('')
  const [vendorLookupLoading, setVendorLookupLoading] = useState(false)
  const [vendorLookupError, setVendorLookupError] = useState<string | null>(null)

  // Fetch events and BU contacts from API
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        setLoadingEvents(true)
        
        const eventsResponse = await eventsApi.list({ my_events: true })
        if (eventsResponse.success && eventsResponse.data?.events) {
          const formattedEvents = eventsResponse.data.events.map((e: any) => ({
            id: e.id,
            name: e.name,
            date: e.date,
          }))
          setEvents(formattedEvents)
          if (!selectedEventId && formattedEvents.length > 0) {
            setSelectedEventId(formattedEvents[0].id)
          }
        }

        const contactsResponse = await contactsApi.list()
        if (contactsResponse.success && contactsResponse.data?.contacts) {
          const contacts: Contact[] = (contactsResponse.data.contacts as any[]).map((c: any) => ({
            phoneNumber: c.phone_number || '',
            name: c.name || 'Unknown',
            registered: true,
            userId: c.id,
            id: c.id,
            role: c.role || 'user',
          }))
          setAllContacts(contacts)
        } else {
          setAllContacts([])
        }
      } catch (error) {
        console.error('Failed to fetch data:', error)
        setAllContacts([])
      } finally {
        setLoading(false)
        setLoadingEvents(false)
      }
    }

    fetchData()
  }, [])
  
  // Set selected event when eventId prop changes
  useEffect(() => {
    if (eventId && eventId !== selectedEventId) {
      setSelectedEventId(eventId)
    }
  }, [eventId])

  // Filter contacts - all contacts are already registered (from API)
  const filteredContacts = allContacts.filter(contact =>
    contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    contact.phoneNumber.includes(searchQuery)
  )

  const toggleContact = (phoneNumber: string) => {
    setSelectedContacts(prev => {
      const newSet = new Set(prev)
      if (newSet.has(phoneNumber)) {
        newSet.delete(phoneNumber)
        // Remove seat category when unselecting
        setContactSeatCategories(prev => {
          const newMap = new Map(prev)
          newMap.delete(phoneNumber)
          return newMap
        })
      } else {
        newSet.add(phoneNumber)
        // Set default seat category when selecting
        setContactSeatCategories(prev => {
          const newMap = new Map(prev)
          newMap.set(phoneNumber, defaultSeatCategory)
          return newMap
        })
      }
      return newSet
    })
  }

  const updateSeatCategory = (phoneNumber: string, category: string) => {
    setContactSeatCategories(prev => {
      const newMap = new Map(prev)
      newMap.set(phoneNumber, category)
      return newMap
    })
  }

  const vendorContacts = allContacts.filter(c => c.role === 'vendor' || c.role === 'both')
  const isVendorSelected = (userId: string) => selectedVendors.some(v => v.userId === userId)
  const toggleVendor = (c: Contact) => {
    if (!c.userId) return
    if (isVendorSelected(c.userId)) {
      setSelectedVendors(prev => prev.filter(v => v.userId !== c.userId))
    } else {
      setSelectedVendors(prev => [...prev, { userId: c.userId, phoneNumber: c.phoneNumber, name: c.name }])
    }
  }
  const removeVendor = (userId: string) => {
    setSelectedVendors(prev => prev.filter(v => v.userId !== userId))
  }
  const handleVendorLookup = async () => {
    const phone = vendorPhoneInput.trim().replace(/\D/g, '')
    if (phone.length < 2) {
      setVendorLookupError('Enter at least 2 digits')
      return
    }
    setVendorLookupError(null)
    setVendorLookupLoading(true)
    try {
      const response = await userApi.search(vendorPhoneInput, true)
      if (response.success && response.data?.users?.length) {
        const user = response.data.users[0]
        const role = (user as any).role || 'user'
        if (role !== 'vendor' && role !== 'both') {
          setVendorLookupError('This number is not registered as a vendor in BU.')
          return
        }
        if (selectedVendors.some(v => v.userId === user.id)) {
          setVendorLookupError('Vendor already added.')
          return
        }
        setSelectedVendors(prev => [...prev, {
          userId: user.id,
          phoneNumber: user.phoneNumber || '',
          name: user.name || 'Vendor',
        }])
        setVendorPhoneInput('')
      } else {
        setVendorLookupError('No vendor found with this number.')
      }
    } catch {
      setVendorLookupError('Lookup failed. Try again.')
    } finally {
      setVendorLookupLoading(false)
    }
  }

  const handleSendInvites = async () => {
    const eventIdToUse = selectedEventId || eventId
    
    const guestIdsFromContacts = Array.from(selectedContacts)
      .map(phoneNumber => allContacts.find(c => c.phoneNumber === phoneNumber)?.userId)
      .filter((id): id is string => typeof id === 'string' && id.trim() !== '')
    const guestIdsFromVendors = selectedVendors.map(v => v.userId)
    const guestIds = [...new Set([...guestIdsFromContacts, ...guestIdsFromVendors])]

    if (guestIds.length === 0) {
      alert('Please select at least one guest or vendor to invite')
      return
    }

    if (!eventIdToUse) {
      alert('Please select an event first')
      return
    }

    setIsSending(true)
    setSendError(null)

    try {

      // Debug logging
      const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}')
      console.log('Sending invites:', {
        event_id: eventIdToUse,
        guest_ids: guestIds,
        current_user_id: currentUser.id,
        current_user_role: currentUser.role,
      })

      // Prepare seat categories array matching guest_ids order
      const seatCategories = guestIds.map(id => {
        const contact = allContacts.find(c => c.userId === id)
        if (contact) return contactSeatCategories.get(contact.phoneNumber) || defaultSeatCategory
        return defaultSeatCategory
      })

      // Call API to create invites
      console.log('Sending invite request:', {
        event_id: eventIdToUse,
        guest_ids: guestIds,
        guest_ids_count: guestIds.length,
        seat_categories: seatCategories,
      })

      const response = await invitesApi.create({
        event_id: eventIdToUse,
        guest_ids: guestIds,
        gate: undefined, // Can be added later if needed
        seat: undefined, // Can be added later if needed
        seat_category: seatCategories,
      })

      if (response && response.success) {
        setSendError(null)
        const fromContacts: Invite[] = Array.from(selectedContacts).map(phoneNumber => {
          const contact = allContacts.find(c => c.phoneNumber === phoneNumber)
          return { phoneNumber, name: contact?.name || phoneNumber, status: 'sent' as const }
        })
        const fromVendors: Invite[] = selectedVendors.map(v => ({
          phoneNumber: v.phoneNumber,
          name: v.name,
          status: 'sent' as const,
        }))
        setInvites([...fromContacts, ...fromVendors])
        setSent(true)
        setSelectedContacts(new Set())
        setSelectedVendors([])
      } else {
        const errorMessage =
          (response && typeof response === 'object' && response.error)
            ? String(response.error)
            : response?.errors && Array.isArray(response.errors) && response.errors.length > 0
              ? response.errors.join(', ')
              : 'Failed to send invites. Please try again.'
        setSendError(errorMessage)
        alert(errorMessage)
      }
    } catch (error: any) {
      console.error('Error sending invites:', error)
      console.error('Error details:', {
        message: error?.message,
        stack: error?.stack,
        response: error?.response,
      })
      alert(`Failed to send invites: ${error?.message || 'Unknown error'}`)
    } finally {
      setIsSending(false)
    }
  }

  if (sent) {
    return (
      <div className="space-y-6 pb-24 pt-4">
        <div className="px-4">
          <Card className="border-green-400/30 bg-green-400/10 p-6">
            <div className="flex flex-col items-center text-center">
              <CheckCircle className="h-12 w-12 text-green-400 mb-4" />
              <h3 className="text-xl font-bold mb-2">Invites Sent Successfully!</h3>
              <p className="text-sm text-muted-foreground mb-4">
                {invites.length} invite{invites.length !== 1 ? 's' : ''} sent to your guests.
              </p>
              <Button
                onClick={() => onNavigate?.('dashboard')}
                className="bg-primary text-primary-foreground hover:bg-primary/90"
              >
                Back to Dashboard
              </Button>
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

        <h2 className="text-xl font-bold mb-2">Send Invites</h2>
        <p className="text-sm text-muted-foreground mb-4">
          Invite guests from your BU contacts and invite vendors so they can create a gateway for this event.
        </p>

        {/* Event Selection */}
        {events.length > 0 && (
          <Card className="border-primary/20 bg-card p-4 mb-4">
            <label className="text-sm font-semibold mb-2 block">Select Event *</label>
            <select
              value={selectedEventId}
              onChange={(e) => setSelectedEventId(e.target.value)}
              className="w-full rounded-lg border border-border bg-secondary px-3 py-2 text-foreground"
            >
              <option value="">-- Select an event --</option>
              {events.map((event) => (
                <option key={event.id} value={event.id}>
                  {event.name} - {new Date(event.date).toLocaleDateString()}
                </option>
              ))}
            </select>
            {!selectedEventId && (
              <p className="mt-2 text-xs text-muted-foreground">
                No event selected. <button 
                  onClick={() => onNavigate?.('celebrant-create-event')}
                  className="text-primary underline"
                >
                  Create a new event
                </button>
              </p>
            )}
          </Card>
        )}

        {events.length === 0 && !loadingEvents && (
          <Card className="border-primary/20 bg-card p-4 mb-4">
            <p className="text-sm text-muted-foreground mb-2">
              You don't have any events yet.
            </p>
            <Button
              onClick={() => onNavigate?.('celebrant-create-event')}
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
            >
              Create Your First Event
            </Button>
          </Card>
        )}

        {/* Search guests */}
        <Card className="border-primary/20 bg-card p-4 mb-4">
          <h3 className="text-sm font-semibold mb-2">Guests (BU contacts)</h3>
          <div className="flex items-center gap-3">
            <Search className="h-5 w-5 text-primary" />
            <Input
              type="text"
              placeholder="Search by name or phone number"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-secondary text-foreground placeholder:text-muted-foreground"
            />
          </div>
        </Card>

        {/* Selected Count and Default Seat Category */}
        {(selectedContacts.size > 0 || selectedVendors.length > 0) && (
          <Card className="border-primary/20 bg-primary/5 p-3 mb-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold">
                  {selectedContacts.size + selectedVendors.length} invitee{selectedContacts.size + selectedVendors.length !== 1 ? 's' : ''} selected
                  {selectedVendors.length > 0 && ` (${selectedVendors.length} vendor${selectedVendors.length !== 1 ? 's' : ''})`}
                </span>
                <Button
                  onClick={() => {
                    setSelectedContacts(new Set())
                    setContactSeatCategories(new Map())
                    setSelectedVendors([])
                  }}
                  variant="outline"
                  size="sm"
                >
                  Clear
                </Button>
              </div>
              <div>
                <label className="text-xs font-semibold mb-1 block">Default Seat Category</label>
                <select
                  value={defaultSeatCategory}
                  onChange={(e) => {
                    setDefaultSeatCategory(e.target.value)
                    // Update all selected contacts to use new default
                    selectedContacts.forEach(phoneNumber => {
                      updateSeatCategory(phoneNumber, e.target.value)
                    })
                  }}
                  className="w-full rounded-lg border border-border bg-secondary px-3 py-2 text-sm text-foreground"
                >
                  <option value="Regular">Regular</option>
                  <option value="VIP">VIP</option>
                  <option value="VVIP">VVIP</option>
                  <option value="Standard">Standard</option>
                </select>
              </div>
            </div>
          </Card>
        )}

        {/* Contacts List */}
        <div className="space-y-2 mb-4">
          {loading ? (
            <Card className="border-border/50 bg-card/50 p-8 text-center">
              <BULoading />
            </Card>
          ) : filteredContacts.length === 0 ? (
            <Card className="border-border/50 bg-card/50 p-8 text-center">
              <p className="text-muted-foreground">
                {searchQuery ? 'No registered contacts found matching your search.' : 'No registered users found in ɃU app.'}
              </p>
            </Card>
          ) : (
            filteredContacts.map((contact) => {
              const isSelected = selectedContacts.has(contact.phoneNumber)
              const seatCategory = contactSeatCategories.get(contact.phoneNumber) || defaultSeatCategory
              return (
                <Card
                  key={contact.phoneNumber}
                  className={`border-border/50 bg-card/50 p-4 transition ${
                    isSelected ? 'border-primary/50 bg-primary/5' : 'hover:bg-card/80'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div 
                      className="flex items-center gap-3 flex-1 cursor-pointer"
                      onClick={() => toggleContact(contact.phoneNumber)}
                    >
                      <div className={`flex h-10 w-10 items-center justify-center rounded-full ${
                        isSelected ? 'bg-primary/20' : 'bg-secondary'
                      }`}>
                        {isSelected ? (
                          <CheckCircle className="h-5 w-5 text-primary" />
                        ) : (
                          <UserPlus className="h-5 w-5 text-muted-foreground" />
                        )}
                      </div>
                      <div>
                        <h4 className="font-semibold">{contact.name}</h4>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Phone className="h-3 w-3" />
                          <span>{contact.phoneNumber}</span>
                        </div>
                      </div>
                    </div>
                    {isSelected && (
                      <CheckCircle className="h-5 w-5 text-primary" />
                    )}
                  </div>
                  {isSelected && (
                    <div className="mt-2 pt-2 border-t border-border/50">
                      <label className="text-xs font-semibold mb-1 block">Seat Category</label>
                      <select
                        value={seatCategory}
                        onChange={(e) => updateSeatCategory(contact.phoneNumber, e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                        className="w-full rounded-lg border border-border bg-secondary px-2 py-1 text-xs text-foreground"
                      >
                        <option value="Regular">Regular</option>
                        <option value="VIP">VIP</option>
                        <option value="VVIP">VVIP</option>
                        <option value="Standard">Standard</option>
                      </select>
                    </div>
                  )}
                </Card>
              )
            })
          )}
        </div>

        {/* Invite vendors - so they can create a gateway for this event */}
        <Card className="border-primary/20 bg-card p-4 mb-4">
          <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
            <Store className="h-4 w-4 text-primary" />
            Invite vendors
          </h3>
          <p className="text-xs text-muted-foreground mb-3">
            Vendors you invite can create a payment gateway for this event after they accept.
          </p>
          {vendorContacts.length > 0 && (
            <div className="space-y-2 mb-3">
              <span className="text-xs font-medium text-muted-foreground">Vendors in your BU contacts</span>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {vendorContacts.map((c) => {
                  const selected = isVendorSelected(c.userId!)
                  return (
                    <Card
                      key={c.userId}
                      className={`border-border/50 p-3 cursor-pointer transition ${selected ? 'border-primary/50 bg-primary/5' : 'hover:bg-card/80'}`}
                      onClick={() => toggleVendor(c)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`rounded-full h-8 w-8 flex items-center justify-center ${selected ? 'bg-primary/20' : 'bg-secondary'}`}>
                            {selected ? <CheckCircle className="h-4 w-4 text-primary" /> : <Store className="h-4 w-4 text-muted-foreground" />}
                          </div>
                          <div>
                            <p className="font-medium text-sm">{c.name}</p>
                            <p className="text-xs text-muted-foreground">{c.phoneNumber}</p>
                          </div>
                        </div>
                        {selected && <CheckCircle className="h-5 w-5 text-primary" />}
                      </div>
                    </Card>
                  )
                })}
              </div>
            </div>
          )}
          <div>
            <span className="text-xs font-medium text-muted-foreground block mb-2">Add vendor by phone number</span>
            <div className="flex gap-2">
              <Input
                placeholder="Vendor's BU phone number"
                value={vendorPhoneInput}
                onChange={(e) => { setVendorPhoneInput(e.target.value); setVendorLookupError(null) }}
                className="bg-secondary flex-1"
              />
              <Button variant="outline" onClick={handleVendorLookup} disabled={vendorLookupLoading}>
                {vendorLookupLoading ? '...' : 'Add'}
              </Button>
            </div>
            {vendorLookupError && <p className="text-xs text-destructive mt-1">{vendorLookupError}</p>}
          </div>
          {selectedVendors.length > 0 && (
            <div className="mt-3 pt-3 border-t border-border/50">
              <span className="text-xs font-medium text-muted-foreground block mb-2">Selected vendors</span>
              <div className="flex flex-wrap gap-2">
                {selectedVendors.map((v) => (
                  <span
                    key={v.userId}
                    className="inline-flex items-center gap-1 rounded-full bg-primary/15 px-2 py-1 text-xs"
                  >
                    {v.name}
                    <button type="button" onClick={(e) => { e.stopPropagation(); removeVendor(v.userId) }} className="hover:text-destructive">×</button>
                  </span>
                ))}
              </div>
            </div>
          )}
        </Card>

        {/* Send Button */}
        <Button
          onClick={handleSendInvites}
          disabled={(selectedContacts.size === 0 && selectedVendors.length === 0) || isSending}
          className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
        >
          {isSending ? 'Sending Invites...' : `Send ${selectedContacts.size + selectedVendors.length > 0 ? `${selectedContacts.size + selectedVendors.length} ` : ''}Invite${(selectedContacts.size + selectedVendors.length) !== 1 ? 's' : ''}`}
        </Button>

        {/* Inline error from server (e.g. max guests reached) */}
        {sendError && (
          <div className="mt-3 rounded-lg border border-destructive/30 bg-destructive/10 p-3 flex items-start gap-2">
            <AlertCircle className="h-4 w-4 text-destructive flex-shrink-0 mt-0.5" />
            <p className="text-sm text-destructive flex-1">{sendError}</p>
            <button
              type="button"
              onClick={() => setSendError(null)}
              className="text-destructive hover:underline text-xs flex-shrink-0"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Info Card */}
        <Card className="border-border/50 bg-card/50 p-4 mt-4">
          <p className="text-xs text-muted-foreground">
            💡 Guests are from your BU contacts. Invite vendors so they can set up the payment gateway for this event after accepting.
          </p>
        </Card>
      </div>
    </div>
  )
}
