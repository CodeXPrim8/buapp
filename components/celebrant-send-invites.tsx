'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { CheckCircle, UserPlus, Search, Phone } from 'lucide-react'
import { userApi, invitesApi, eventsApi } from '@/lib/api-client'

interface Contact {
  phoneNumber: string
  name: string
  registered: boolean
  userId?: string
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

  // Fetch events and registered users from API
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        setLoadingEvents(true)
        
        // Fetch events - only events created by this celebrant
        const eventsResponse = await eventsApi.list({ my_events: true })
        if (eventsResponse.success && eventsResponse.data?.events) {
          const formattedEvents = eventsResponse.data.events.map((e: any) => ({
            id: e.id,
            name: e.name,
            date: e.date,
          }))
          setEvents(formattedEvents)
          // If no eventId was passed but events exist, select the first one
          if (!selectedEventId && formattedEvents.length > 0) {
            setSelectedEventId(formattedEvents[0].id)
          }
        }

        // Fetch registered users
        const usersResponse = await userApi.list(searchQuery || undefined, 100, 0)
        if (usersResponse.success && usersResponse.data?.users) {
          // Convert API users to Contact format - all are registered since they come from the database
          const contacts: Contact[] = usersResponse.data.users.map((user: any) => ({
            phoneNumber: user.phoneNumber,
            name: user.name,
            registered: true, // All users from API are registered
            userId: user.id,
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
  }, [searchQuery])
  
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

  const handleSendInvites = async () => {
    const eventIdToUse = selectedEventId || eventId
    
    if (selectedContacts.size === 0) {
      alert('Please select at least one contact to invite')
      return
    }

    if (!eventIdToUse) {
      alert('Please select an event first')
      return
    }

    setIsSending(true)

    try {
      // Get user IDs from selected phone numbers
      const guestIds = Array.from(selectedContacts)
        .map(phoneNumber => {
          const contact = allContacts.find(c => c.phoneNumber === phoneNumber)
          return contact?.userId
        })
        .filter((id): id is string => !!id)

      if (guestIds.length === 0) {
        alert('No valid contacts selected')
        setIsSending(false)
        return
      }

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
        return contact ? (contactSeatCategories.get(contact.phoneNumber) || defaultSeatCategory) : defaultSeatCategory
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

      console.log('Invite creation response:', response)
      console.log('Response type:', typeof response)
      console.log('Response keys:', response ? Object.keys(response) : 'null')
      console.log('Response success:', response?.success)
      console.log('Response error:', response?.error)
      console.log('Response data:', response?.data)

      if (response && response.success) {
        // Create local invite objects for display
        const newInvites: Invite[] = Array.from(selectedContacts).map(phoneNumber => {
          const contact = allContacts.find(c => c.phoneNumber === phoneNumber)
          return {
            phoneNumber,
            name: contact?.name || phoneNumber,
            status: 'sent' as const,
          }
        })

        setInvites(newInvites)
        setSent(true)
        setSelectedContacts(new Set())
      } else {
        // Handle empty or invalid response
        if (!response || typeof response !== 'object') {
          console.error('Invalid response object:', response)
          alert('Failed to send invites: Invalid response from server. Please check your connection and try again.')
        } else {
          // Check if response is empty object
          const responseKeys = Object.keys(response || {})
          console.error('Failed to send invites - Response details:', {
            response: response,
            responseKeys: responseKeys,
            responseType: typeof response,
            hasError: 'error' in (response || {}),
            hasErrors: 'errors' in (response || {}),
            hasStatus: 'status' in (response || {}),
            error: response?.error,
            errors: response?.errors,
            status: response?.status,
            fullResponse: JSON.stringify(response, null, 2),
          })
          
          // Build error message with fallbacks
          let errorMessage = 'Unknown error occurred'
          if (response.error) {
            errorMessage = response.error
          } else if (response.errors && Array.isArray(response.errors) && response.errors.length > 0) {
            errorMessage = response.errors.join(', ')
          } else if (response.status) {
            errorMessage = `Request failed with status ${response.status}. Please check server logs.`
          } else if (responseKeys.length === 0) {
            errorMessage = 'Server returned an empty response. Please check your connection and try again.'
          } else {
            errorMessage = `Request failed: ${JSON.stringify(response)}`
          }
          
          alert(`Failed to send invites: ${errorMessage}`)
        }
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
          Select contacts from your phone that are registered in ɃU app. Only registered users will be shown.
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

        {/* Search */}
        <Card className="border-primary/20 bg-card p-4 mb-4">
          <div className="flex items-center gap-3">
            <Search className="h-5 w-5 text-primary" />
            <Input
              type="text"
              placeholder="Search contacts by name or phone number"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-secondary text-foreground placeholder:text-muted-foreground"
            />
          </div>
        </Card>

        {/* Selected Count and Default Seat Category */}
        {selectedContacts.size > 0 && (
          <Card className="border-primary/20 bg-primary/5 p-3 mb-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold">
                  {selectedContacts.size} contact{selectedContacts.size !== 1 ? 's' : ''} selected
                </span>
                <Button
                  onClick={() => {
                    setSelectedContacts(new Set())
                    setContactSeatCategories(new Map())
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
              <p className="text-muted-foreground">Loading registered users...</p>
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

        {/* Send Button */}
        <Button
          onClick={handleSendInvites}
          disabled={selectedContacts.size === 0 || isSending}
          className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
        >
          {isSending ? 'Sending Invites...' : `Send ${selectedContacts.size > 0 ? `${selectedContacts.size} ` : ''}Invite${selectedContacts.size !== 1 ? 's' : ''}`}
        </Button>

        {/* Info Card */}
        <Card className="border-border/50 bg-card/50 p-4 mt-4">
          <p className="text-xs text-muted-foreground">
            💡 Only contacts registered in ɃU app are shown. Unregistered contacts won't appear in this list.
          </p>
        </Card>
      </div>
    </div>
  )
}
