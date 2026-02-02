'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { User, UserPlus, UserCheck, UserX, X, Search, Plus, Check, XCircle } from 'lucide-react'
import { contactsApi, friendRequestsApi } from '@/lib/api-client'
import { AlertPopup } from '@/components/ui/alert-popup'

interface Contact {
  id: string
  phone_number: string
  first_name: string
  last_name: string
  name: string
  last_transaction_at?: string
}

interface FriendRequest {
  id: string
  sender_id: string
  receiver_id: string
  status: string
  message?: string
  created_at: string
  expires_at: string
  sender: {
    id: string
    phone_number: string
    first_name: string
    last_name: string
    name: string
  }
  receiver: {
    id: string
    phone_number: string
    first_name: string
    last_name: string
    name: string
  }
  is_incoming: boolean
}

interface ContactsProps {
  onNavigate?: (page: string, data?: any) => void
  initialData?: any
}

export default function Contacts({ onNavigate, initialData }: ContactsProps) {
  const [activeTab, setActiveTab] = useState<'contacts' | 'requests'>(
    initialData?.tab === 'requests' ? 'requests' : 'contacts'
  )
  const [contacts, setContacts] = useState<Contact[]>([])
  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([])
  const [incomingRequests, setIncomingRequests] = useState<FriendRequest[]>([])
  const [outgoingRequests, setOutgoingRequests] = useState<FriendRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [showAddContact, setShowAddContact] = useState(false)
  const [newContactPhone, setNewContactPhone] = useState('')
  const [newContactMessage, setNewContactMessage] = useState('')
  const [sendingRequest, setSendingRequest] = useState(false)
  const [alertPopup, setAlertPopup] = useState<{ open: boolean; title: string; message: string; type: 'success' | 'error' | 'info' }>({
    open: false,
    title: '',
    message: '',
    type: 'info',
  })

  // Update active tab when initialData changes
  useEffect(() => {
    if (initialData?.tab === 'requests') {
      setActiveTab('requests')
    }
  }, [initialData])

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      await Promise.all([
        fetchContacts(),
        fetchFriendRequests(),
      ])
    } catch (error) {
      console.error('Failed to fetch contacts data:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchContacts = async () => {
    try {
      const response = await contactsApi.list()
      if (response.success && response.data?.contacts) {
        setContacts(response.data.contacts)
      }
    } catch (error) {
      console.error('Failed to fetch contacts:', error)
    }
  }

  const fetchFriendRequests = async () => {
    try {
      const response = await friendRequestsApi.list('all')
      if (response.success && response.data) {
        setFriendRequests(response.data.requests || [])
        setIncomingRequests(response.data.incoming || [])
        setOutgoingRequests(response.data.outgoing || [])
      }
    } catch (error) {
      console.error('Failed to fetch friend requests:', error)
    }
  }

  const handleSendFriendRequest = async () => {
    if (!newContactPhone || newContactPhone.length < 2) {
      setAlertPopup({
        open: true,
        title: 'Invalid Input',
        message: 'Please enter a valid phone number',
        type: 'error',
      })
      return
    }

    try {
      setSendingRequest(true)
      
      const response = await friendRequestsApi.send({
        phone_number: newContactPhone,
        message: newContactMessage || undefined,
      })

      if (response.success) {
        setAlertPopup({
          open: true,
          title: 'Success',
          message: 'Friend request sent!',
          type: 'success',
        })
        setNewContactPhone('')
        setNewContactMessage('')
        setShowAddContact(false)
        fetchFriendRequests()
      } else {
        // Show user-friendly error message
        const errorMsg = response.error || 'Failed to send friend request'
        setAlertPopup({
          open: true,
          title: 'Error',
          message: errorMsg,
          type: 'error',
        })
        console.error('Friend request error:', response)
      }
    } catch (error: any) {
      console.error('Send friend request error:', error)
      setAlertPopup({
        open: true,
        title: 'Error',
        message: error.message || 'Failed to send friend request',
        type: 'error',
      })
    } finally {
      setSendingRequest(false)
    }
  }

  const handleAcceptRequest = async (id: string) => {
    try {
      const response = await friendRequestsApi.accept(id)
      if (response.success) {
        fetchData()
        setAlertPopup({
          open: true,
          title: 'Success',
          message: 'Friend request accepted!',
          type: 'success',
        })
      } else {
        setAlertPopup({
          open: true,
          title: 'Error',
          message: response.error || 'Failed to accept request',
          type: 'error',
        })
      }
    } catch (error: any) {
      console.error('Accept request error:', error)
      setAlertPopup({
        open: true,
        title: 'Error',
        message: 'Failed to accept request',
        type: 'error',
      })
    }
  }

  const handleDeclineRequest = async (id: string) => {
    try {
      const response = await friendRequestsApi.decline(id)
      if (response.success) {
        fetchFriendRequests()
      } else {
        setAlertPopup({
          open: true,
          title: 'Error',
          message: response.error || 'Failed to decline request',
          type: 'error',
        })
      }
    } catch (error: any) {
      console.error('Decline request error:', error)
      setAlertPopup({
        open: true,
        title: 'Error',
        message: 'Failed to decline request',
        type: 'error',
      })
    }
  }

  const handleBlockRequest = async (id: string) => {
    setAlertPopup({
      open: true,
      title: 'Confirm Block',
      message: 'Are you sure you want to block this user? They will not be able to send you friend requests.',
      type: 'info',
    })
    
    // For now, we'll proceed with blocking. In a more advanced version, we could use a confirmation dialog
    try {
      const response = await friendRequestsApi.block(id)
      if (response.success) {
        fetchFriendRequests()
        setAlertPopup({
          open: true,
          title: 'Success',
          message: 'User blocked successfully',
          type: 'success',
        })
      } else {
        setAlertPopup({
          open: true,
          title: 'Error',
          message: response.error || 'Failed to block user',
          type: 'error',
        })
      }
    } catch (error: any) {
      console.error('Block request error:', error)
      setAlertPopup({
        open: true,
        title: 'Error',
        message: 'Failed to block user',
        type: 'error',
      })
    }
  }

  const handleCancelRequest = async (id: string) => {
    try {
      const response = await friendRequestsApi.cancel(id)
      if (response.success) {
        fetchFriendRequests()
      } else {
        setAlertPopup({
          open: true,
          title: 'Error',
          message: response.error || 'Failed to cancel request',
          type: 'error',
        })
      }
    } catch (error: any) {
      console.error('Cancel request error:', error)
      setAlertPopup({
        open: true,
        title: 'Error',
        message: 'Failed to cancel request',
        type: 'error',
      })
    }
  }

  const filteredContacts = contacts.filter((contact) => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return (
      contact.name.toLowerCase().includes(query) ||
      contact.phone_number.includes(query)
    )
  })

  const incomingCount = incomingRequests.length

  return (
    <div className="space-y-6 pb-24 pt-4">
      {/* Header */}
      <div className="px-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">Contacts</h2>
          {/* Plus button in header for easy access */}
          <Button
            onClick={() => setShowAddContact(true)}
            size="sm"
            className="h-10 w-10 rounded-full bg-primary text-primary-foreground hover:bg-primary/90"
          >
            <Plus className="h-5 w-5" />
          </Button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-4">
          <Button
            onClick={() => setActiveTab('contacts')}
            variant={activeTab === 'contacts' ? 'default' : 'outline'}
            className="flex-1"
          >
            Contacts ({contacts.length})
          </Button>
          <Button
            onClick={() => setActiveTab('requests')}
            variant={activeTab === 'requests' ? 'default' : 'outline'}
            className="flex-1 relative"
          >
            Requests
            {incomingCount > 0 && (
              <span className="ml-2 rounded-full bg-primary text-primary-foreground text-xs px-2 py-0.5">
                {incomingCount}
              </span>
            )}
          </Button>
        </div>
      </div>

      {/* Contacts Tab */}
      {activeTab === 'contacts' && (
        <>
          {/* Search */}
          <div className="px-4">
            <Card className="border-primary/20 bg-card p-4">
              <div className="flex items-center gap-3">
                <Search className="h-5 w-5 text-primary" />
                <Input
                  type="text"
                  placeholder="Search contacts..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-secondary text-foreground placeholder:text-muted-foreground"
                />
              </div>
            </Card>
          </div>

          {/* Contacts List */}
          <div className="px-4 space-y-3">
            {loading ? (
              <Card className="border-border/50 bg-card/50 p-8 text-center">
                <p className="text-muted-foreground">Loading contacts...</p>
              </Card>
            ) : filteredContacts.length === 0 ? (
              <Card className="border-border/50 bg-card/50 p-8 text-center">
                <p className="text-muted-foreground mb-2">
                  {searchQuery ? 'No contacts found' : 'No contacts yet'}
                </p>
                <p className="text-xs text-muted-foreground mb-4">
                  {searchQuery 
                    ? 'Try a different search term'
                    : 'Add someone to get started'}
                </p>
                {!searchQuery && (
                  <Button
                    onClick={() => setShowAddContact(true)}
                    className="bg-primary text-primary-foreground hover:bg-primary/90"
                  >
                    <UserPlus className="h-4 w-4 mr-2" />
                    Add Contact
                  </Button>
                )}
              </Card>
            ) : (
              filteredContacts.map((contact) => (
                <Card
                  key={contact.id}
                  className="border-border/50 bg-card/50 p-4 cursor-pointer transition hover:bg-card/80"
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    onNavigate?.('send-bu', { recipientId: contact.id })
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/20">
                        <User className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold">{contact.name}</h3>
                        <p className="text-sm text-muted-foreground">{contact.phone_number}</p>
                        {contact.last_transaction_at && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Last transaction: {new Date(contact.last_transaction_at).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation()
                        onNavigate?.('send-bu', { recipientId: contact.id })
                      }}
                    >
                      Send ɃU
                    </Button>
                  </div>
                </Card>
              ))
            )}
          </div>

        </>
      )}

      {/* Requests Tab */}
      {activeTab === 'requests' && (
        <div className="px-4 space-y-4">
          {/* Incoming Requests */}
          {incomingRequests.length > 0 && (
            <div>
              <h3 className="font-semibold mb-3">Incoming Requests</h3>
              <div className="space-y-3">
                {incomingRequests.map((request) => (
                  <Card key={request.id} className="border-primary/20 bg-card/50 p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3 flex-1">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/20">
                          <UserPlus className="h-6 w-6 text-primary" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold">{request.sender.name}</h3>
                          <p className="text-sm text-muted-foreground">{request.sender.phone_number}</p>
                          {request.message && (
                            <p className="text-xs text-muted-foreground mt-1">"{request.message}"</p>
                          )}
                          <p className="text-xs text-muted-foreground mt-1">
                            {new Date(request.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-col gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleAcceptRequest(request.id)}
                          className="bg-green-500 text-white hover:bg-green-600 w-full"
                        >
                          <Check className="h-4 w-4 mr-2" />
                          Accept
                        </Button>
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDeclineRequest(request.id)}
                            className="flex-1"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleBlockRequest(request.id)}
                            className="text-red-400 hover:text-red-500 flex-1"
                            title="Block user"
                          >
                            <XCircle className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Outgoing Requests */}
          {outgoingRequests.length > 0 && (
            <div>
              <h3 className="font-semibold mb-3">Outgoing Requests</h3>
              <div className="space-y-3">
                {outgoingRequests.map((request) => (
                  <Card key={request.id} className="border-border/50 bg-card/50 p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3 flex-1">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/20">
                          <UserCheck className="h-6 w-6 text-primary" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold">{request.receiver.name}</h3>
                          <p className="text-sm text-muted-foreground">{request.receiver.phone_number}</p>
                          {request.message && (
                            <p className="text-xs text-muted-foreground mt-1">"{request.message}"</p>
                          )}
                          <p className="text-xs text-muted-foreground mt-1">
                            Sent {new Date(request.created_at).toLocaleDateString()}
                          </p>
                          <span className="inline-block mt-2 rounded-full bg-yellow-400/20 px-2 py-1 text-xs text-yellow-400">
                            Pending
                          </span>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleCancelRequest(request.id)}
                        className="text-red-400 hover:text-red-500"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {incomingRequests.length === 0 && outgoingRequests.length === 0 && (
            <Card className="border-border/50 bg-card/50 p-8 text-center">
              <p className="text-muted-foreground">No friend requests</p>
            </Card>
          )}
        </div>
      )}

      {/* Add Contact Modal - Centered Popup */}
      <Dialog open={showAddContact} onOpenChange={(open) => {
        if (!open) {
          setShowAddContact(false)
          setNewContactPhone('')
          setNewContactMessage('')
        }
      }}>
        <DialogContent className="max-w-[calc(100%-2rem)] sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Contact</DialogTitle>
            <DialogDescription>
              Enter a phone number to send a friend request. Once accepted, they'll be added to your contacts.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 pt-2">
            <div>
              <label className="text-sm font-semibold mb-2 block">Phone Number</label>
              <Input
                type="tel"
                placeholder="+2348012345678 or 08012345678"
                value={newContactPhone}
                onChange={(e) => setNewContactPhone(e.target.value)}
                inputMode="tel"
                className="bg-secondary text-foreground placeholder:text-muted-foreground"
                autoFocus
              />
              <p className="text-xs text-muted-foreground mt-1">
                Enter the phone number of the user you want to add as a contact
              </p>
            </div>

            <div>
              <label className="text-sm font-semibold mb-2 block">Message (Optional)</label>
              <Input
                type="text"
                placeholder="Add a personal message (max 140 chars)"
                value={newContactMessage}
                onChange={(e) => {
                  if (e.target.value.length <= 140) {
                    setNewContactMessage(e.target.value)
                  }
                }}
                maxLength={140}
                className="bg-secondary text-foreground placeholder:text-muted-foreground"
              />
              <p className="text-xs text-muted-foreground mt-1">
                {newContactMessage.length}/140 characters
              </p>
            </div>

            <div className="flex gap-2 pt-2">
              <Button
                onClick={() => {
                  setShowAddContact(false)
                  setNewContactPhone('')
                  setNewContactMessage('')
                }}
                variant="outline"
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSendFriendRequest}
                disabled={!newContactPhone || sendingRequest}
                className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
              >
                {sendingRequest ? 'Sending...' : 'Send Request'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

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
