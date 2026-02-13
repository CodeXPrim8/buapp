'use client'

import { useState, useEffect, useMemo } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { User, CheckCircle, AlertCircle, Search, QrCode, Sparkles, Download, Share2 } from 'lucide-react'
import PinVerification from '@/components/pin-verification'
import { transferApi, userApi, contactsApi, friendRequestsApi } from '@/lib/api-client'
import { AlertPopup } from '@/components/ui/alert-popup'
import { ReceiptModal } from '@/components/receipt-modal'
import BULoading from '@/components/bu-loading'

interface UserProfile {
  username: string
  fullName: string
  verified: boolean
}

interface BUTransfer {
  id: string
  recipientUsername: string
  recipientName: string
  amount: number
  message: string
  date: string
  status: 'completed' | 'pending' | 'failed'
  type: 'transfer' | 'tip'
}

interface SendBUInitialData {
  eventId?: string
  eventName?: string
  gatewayId?: string
}

function AllContactsList({
  contactsLoading,
  allContacts,
  searchQuery,
  onSelectUser,
}: {
  contactsLoading: boolean
  allContacts: Array<{ id: string; phone_number: string; name: string }>
  searchQuery: string
  onSelectUser: (user: UserProfile & { id?: string }) => void
}) {
  const q = searchQuery.trim().toLowerCase()
  const toShow = q.length < 2
    ? allContacts
    : allContacts.filter((c) =>
        c.name.toLowerCase().includes(q) ||
        (c.phone_number && c.phone_number.replace(/\s/g, '').includes(q.replace(/\s/g, '')))
      )
  if (contactsLoading) {
    return (
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-foreground mb-2">All my contacts</h3>
        <Card className="border-border/50 bg-card/50 p-6 text-center">
          <BULoading />
        </Card>
      </div>
    )
  }
  return (
    <div className="mb-4">
      <h3 className="text-sm font-semibold text-foreground mb-2">All my contacts</h3>
      {toShow.length === 0 && allContacts.length === 0 ? (
        <Card className="border-border/50 bg-card/50 p-4">
          <p className="text-sm text-muted-foreground text-center">No contacts yet. Add people via friend requests or enter a phone number below.</p>
        </Card>
      ) : toShow.length === 0 ? (
        <Card className="border-border/50 bg-card/50 p-4">
          <p className="text-sm text-muted-foreground text-center">No contacts match your search.</p>
        </Card>
      ) : (
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {toShow.map((contact) => (
            <Card
              key={contact.id}
              onClick={() =>
                onSelectUser({
                  username: contact.phone_number,
                  fullName: contact.name,
                  verified: true,
                  id: contact.id,
                } as UserProfile & { id: string })
              }
              className="border-primary/20 cursor-pointer bg-card p-3 transition hover:bg-card/80 hover:border-primary/40"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/20">
                    <User className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">{contact.name}</p>
                    <p className="text-xs text-muted-foreground">{contact.phone_number}</p>
                  </div>
                </div>
                <span className="text-xs text-primary">Select</span>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

interface SendBUProps {
  initialData?: SendBUInitialData | null
  onNavigate?: (page: string, data?: any) => void
}

export default function SendBU({ initialData, onNavigate }: SendBUProps) {
  const [step, setStep] = useState<'menu' | 'search' | 'confirm' | 'tip-scan' | 'tip-confirm' | 'success' | 'history' | 'event-send' | 'event-success' | 'event-no-gateway'>('menu')
  const [transferType, setTransferType] = useState<'transfer' | 'tip'>('transfer')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null)
  const [tipAmount, setTipAmount] = useState('')
  const [scannedQRData, setScannedQRData] = useState<{ userId: string; username: string } | null>(null)
  const [transfers, setTransfers] = useState<BUTransfer[]>([])
  const [transfersLoading, setTransfersLoading] = useState(true)

  const [transferForm, setTransferForm] = useState({
    amount: '',
    message: '',
  })

  const [showPinVerification, setShowPinVerification] = useState(false)
  const [pendingTransfer, setPendingTransfer] = useState<BUTransfer | null>(null)
  const [searchResults, setSearchResults] = useState<UserProfile[]>([])
  const [searchLoading, setSearchLoading] = useState(false)
  const [isProcessingTransfer, setIsProcessingTransfer] = useState(false)
  const [searchMode, setSearchMode] = useState<'contacts' | 'manual'>('contacts')
  const [manualPhone, setManualPhone] = useState('')
  const [manualUser, setManualUser] = useState<UserProfile | null>(null)
  const [showAddToContacts, setShowAddToContacts] = useState(false)
  const [lastTransactionRecipient, setLastTransactionRecipient] = useState<string | null>(null)
  const [lastTransferId, setLastTransferId] = useState<string | null>(null)
  const [selectedReceipt, setSelectedReceipt] = useState<any>(null)
  const [showReceipt, setShowReceipt] = useState(false)
  const [allContacts, setAllContacts] = useState<Array<{ id: string; phone_number: string; name: string }>>([])
  const [contactsLoading, setContactsLoading] = useState(false)
  const [alertPopup, setAlertPopup] = useState<{ open: boolean; title: string; message: string; type: 'success' | 'error' | 'info' }>({
    open: false,
    title: '',
    message: '',
    type: 'info',
  })
  const [eventSendAmount, setEventSendAmount] = useState('')
  const [eventSendMessage, setEventSendMessage] = useState('')
  const [pendingGatewayTransfer, setPendingGatewayTransfer] = useState<{
    gatewayId: string
    eventId: string
    eventName: string
    amount: number
    message: string
  } | null>(null)
  const [eventSentAmount, setEventSentAmount] = useState<number | null>(null)

  // When opened from event-info with gateway, show event-send; without gateway show event-no-gateway (only when still on menu)
  useEffect(() => {
    if (!initialData) return
    setStep((s) => {
      if (s !== 'menu') return s
      if (initialData.gatewayId && initialData.eventName) return 'event-send'
      return 'event-no-gateway'
    })
  }, [initialData?.eventId, initialData?.eventName, initialData?.gatewayId])

  // Fetch transfer history on mount
  useEffect(() => {
    const fetchTransfers = async () => {
      try {
        setTransfersLoading(true)
        const response = await transferApi.list(50, 0)
        if (response.success && response.data?.transfers) {
          // Get current user from API
          const userResponse = await userApi.getMe()
          const currentUserId = userResponse.success && userResponse.data?.user ? userResponse.data.user.id : null
          
          const sentTransfers = response.data.transfers
            .filter((t: any) => {
              return currentUserId && t.sender_id === currentUserId // Only transfers where user is sender
            })
            .map((t: any) => ({
              id: t.id,
              recipientUsername: t.receiver?.phone_number || 'User',
              recipientName: t.receiver ? `${t.receiver.first_name} ${t.receiver.last_name}` : 'User',
              amount: parseFloat(t.amount?.toString() || '0'),
              message: t.message || '',
              date: new Date(t.created_at).toISOString().split('T')[0],
              status: t.status || 'completed',
              type: t.type === 'tip' ? 'tip' : 'transfer',
            }))
          setTransfers(sentTransfers)
        }
      } catch (error) {
        console.error('Failed to fetch transfers:', error)
      } finally {
        setTransfersLoading(false)
      }
    }

    fetchTransfers()
  }, [])

  // Fetch all contacts when on search step (Send BU to User)
  useEffect(() => {
    if (step !== 'search') return
    const fetchContacts = async () => {
      try {
        setContactsLoading(true)
        const response = await contactsApi.list()
        if (response.success && response.data?.contacts) {
          const list = response.data.contacts.map((c: any) => ({
            id: c.id,
            phone_number: c.phone_number || '',
            name: (c.name || `${c.first_name || ''} ${c.last_name || ''}`.trim()) || 'Unknown',
          }))
          setAllContacts(list)
        } else {
          setAllContacts([])
        }
      } catch (e) {
        console.error('Failed to fetch contacts:', e)
        setAllContacts([])
      } finally {
        setContactsLoading(false)
      }
    }
    fetchContacts()
  }, [step])

  // Search contacts via API
  const handleSearch = async (query: string) => {
    setSearchQuery(query)
    if (query.length < 2) {
      setSearchResults([])
      return
    }

    try {
      setSearchLoading(true)
      // Search only contacts (not manual lookup)
      const response = await userApi.search(query, false)
      if (response.success && response.data?.users) {
        const users = response.data.users.map((user: any) => ({
          username: user.phoneNumber, // Use phone as username
          fullName: user.name,
          verified: true,
          id: user.id,
          is_contact: user.is_contact,
        }))
        setSearchResults(users)
      } else {
        setSearchResults([])
      }
    } catch (error) {
      console.error('Search error:', error)
      setSearchResults([])
    } finally {
      setSearchLoading(false)
    }
  }

  // Manual phone lookup for non-contacts
  const handleManualPhoneLookup = async (phone: string) => {
    setManualPhone(phone)
    if (phone.length < 2) {
      setManualUser(null)
      return
    }

    try {
      setSearchLoading(true)
      // Manual lookup - allows searching all users by phone
      const response = await userApi.search(phone, true)
      if (response.success && response.data?.users && response.data.users.length > 0) {
        const user = response.data.users[0]
        setManualUser({
          username: user.phoneNumber,
          fullName: user.name,
          verified: true,
          id: user.id,
        })
      } else {
        setManualUser(null)
      }
    } catch (error) {
      console.error('Manual lookup error:', error)
      setManualUser(null)
    } finally {
      setSearchLoading(false)
    }
  }

  const handleSelectUser = (user: UserProfile) => {
    setSelectedUser(user)
    setStep('confirm')
    setSearchQuery('')
    setSearchResults([])
  }

  const handleSendBU = () => {
    if (
      selectedUser &&
      transferForm.amount &&
      !isNaN(Number(transferForm.amount)) &&
      Number(transferForm.amount) > 0
    ) {
      const newTransfer: BUTransfer = {
        id: `TXN-${Date.now()}`,
        recipientUsername: selectedUser.username,
        recipientName: selectedUser.fullName,
        amount: Number(transferForm.amount),
        message: transferForm.message,
        date: new Date().toISOString().split('T')[0],
        status: 'completed',
        type: transferType,
      }

      // Show PIN verification before completing transfer
      setPendingTransfer(newTransfer)
      setShowPinVerification(true)
    }
  }

  const handlePinVerified = async (pin: string) => {
    if (isProcessingTransfer) return

    // Event gateway flow: send BU to event via gateway
    if (pendingGatewayTransfer) {
      try {
        setIsProcessingTransfer(true)
        const userResponse = await userApi.getMe()
        const currentUser = userResponse.success && userResponse.data?.user ? userResponse.data.user : null
        if (!currentUser?.id) {
          setAlertPopup({ open: true, title: 'Error', message: 'Could not load your profile.', type: 'error' })
          setShowPinVerification(false)
          setPendingGatewayTransfer(null)
          setIsProcessingTransfer(false)
          return
        }
        const response = await transferApi.sendViaGatewayQR({
          gateway_id: pendingGatewayTransfer.gatewayId,
          amount: pendingGatewayTransfer.amount,
          message: pendingGatewayTransfer.message || undefined,
          guest_user_id: currentUser.id,
          guest_name: currentUser.name || 'Guest',
          guest_phone: currentUser.phoneNumber || '',
          pin,
        })
        if (response.success && response.data?.transfer) {
          setEventSentAmount(pendingGatewayTransfer.amount)
          setPendingGatewayTransfer(null)
          setShowPinVerification(false)
          setStep('event-success')
          try {
            const { walletApi } = await import('@/lib/api-client')
            const balanceResponse = await walletApi.getMe()
            if (balanceResponse.success && balanceResponse.data?.wallet && typeof window !== 'undefined') {
              const newBalance = parseFloat(balanceResponse.data.wallet.balance || '0')
              sessionStorage.setItem('cached_balance', newBalance.toString())
              sessionStorage.setItem('balance_updated_at', Date.now().toString())
              window.dispatchEvent(new CustomEvent('balance-updated', { detail: { balance: newBalance.toString() } }))
            }
          } catch (_) {}
        } else {
          setAlertPopup({
            open: true,
            title: 'Error',
            message: response.error || 'Transfer failed. Please try again.',
            type: 'error',
          })
          setShowPinVerification(false)
          setPendingGatewayTransfer(null)
        }
      } catch (error: any) {
        setAlertPopup({
          open: true,
          title: 'Error',
          message: error?.message || 'Transfer failed. Please try again.',
          type: 'error',
        })
        setShowPinVerification(false)
        setPendingGatewayTransfer(null)
      } finally {
        setIsProcessingTransfer(false)
      }
      return
    }

    if (!pendingTransfer) return

    try {
      setIsProcessingTransfer(true)
      
      // For tips, we need receiver ID from scanned QR data
      // For regular transfers, we need selectedUser
      let receiverId: string | null = null

      if (pendingTransfer.type === 'tip' && scannedQRData) {
        // For tips, receiver ID should be in scannedQRData
        receiverId = scannedQRData.userId
      } else if (selectedUser) {
        // For regular transfers
        receiverId = (selectedUser as any).id || selectedUser.username
      }

      if (!receiverId) {
        setAlertPopup({
          open: true,
          title: 'Error',
          message: 'Receiver not found. Please try again.',
          type: 'error',
        })
        setShowPinVerification(false)
        setIsProcessingTransfer(false)
        return
      }

      // Call transfer API
      const response = await transferApi.send({
        receiver_id: receiverId,
        amount: pendingTransfer.amount,
        message: pendingTransfer.message,
        pin: pin,
        type: pendingTransfer.type === 'tip' ? 'tip' : 'transfer',
      })

      if (response.success && response.data?.transfer) {
        const transfer = response.data.transfer
        
        // Store transfer ID and recipient ID for receipt and "Add to Contacts" option
        setLastTransferId(transfer.id)
        setLastTransactionRecipient(receiverId)
        
        // Get current user info for receipt
        const userResponse = await userApi.getMe()
        const currentUser = userResponse.success && userResponse.data?.user ? userResponse.data.user : null
        
        // Prepare receipt data
        const receiptData = {
          id: transfer.id,
          type: 'sent' as const,
          amount: parseFloat(transfer.amount?.toString() || '0'),
          senderName: currentUser ? `${currentUser.first_name || ''} ${currentUser.last_name || ''}`.trim() || 'You' : 'You',
          senderPhone: currentUser?.phoneNumber || '',
          receiverName: transfer.receiver ? `${transfer.receiver.first_name || ''} ${transfer.receiver.last_name || ''}`.trim() : 'User',
          receiverPhone: transfer.receiver?.phone_number || '',
          message: transfer.message || undefined,
          date: new Date(transfer.created_at).toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          }),
          time: new Date(transfer.created_at).toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit'
          }),
          status: transfer.status || 'completed',
        }
        
        // Show receipt modal
        setSelectedReceipt(receiptData)
        setShowReceipt(true)
        
        // Check if recipient is already a contact
        const contactsResponse = await contactsApi.list()
        const isContact = contactsResponse.success && contactsResponse.data?.contacts?.some(
          (c: any) => c.id === receiverId
        )
        
        // Show "Add to Contacts" option if not already a contact
        if (!isContact && pendingTransfer.type !== 'tip') {
          setShowAddToContacts(true)
        }
        
        // Update balance cache after successful transfer
        // Fetch fresh balance to update cache
        try {
          const { walletApi } = await import('@/lib/api-client')
          const balanceResponse = await walletApi.getMe()
          if (balanceResponse.success && balanceResponse.data?.wallet) {
            const newBalance = parseFloat(balanceResponse.data.wallet.balance || '0')
            if (typeof window !== 'undefined') {
              sessionStorage.setItem('cached_balance', newBalance.toString())
              sessionStorage.setItem('balance_updated_at', Date.now().toString())
              window.dispatchEvent(new CustomEvent('balance-updated', { detail: { balance: newBalance.toString() } }))
            }
          }
        } catch (error) {
          console.error('Failed to update balance cache:', error)
        }
        
        // Fetch updated transfer history from API to ensure accuracy
        const historyResponse = await transferApi.list(50, 0)
        if (historyResponse.success && historyResponse.data?.transfers) {
          // Get current user from API
          const currentUserId = currentUser?.id || null
          
          const sentTransfers = historyResponse.data.transfers
            .filter((t: any) => currentUserId && t.sender_id === currentUserId) // Only transfers where user is sender
            .map((t: any) => ({
              id: t.id,
              recipientUsername: t.receiver?.phone_number || 'User',
              recipientName: t.receiver ? `${t.receiver.first_name} ${t.receiver.last_name}` : 'User',
              amount: parseFloat(t.amount?.toString() || '0'),
              message: t.message || '',
              date: new Date(t.created_at).toISOString().split('T')[0],
              status: t.status || 'completed',
              type: t.type === 'tip' ? 'tip' : 'transfer',
            }))
          setTransfers(sentTransfers)
        }
        
        // Reset form based on transfer type
        if (pendingTransfer.type === 'tip') {
          setTipAmount('')
          setScannedQRData(null)
        } else {
          setTransferForm({ amount: '', message: '' })
          setSelectedUser(null)
          setManualUser(null)
          setManualPhone('')
        }
        
        setPendingTransfer(null)
        setShowPinVerification(false)
        // Don't set step to 'success' - receipt modal will handle the UI
      } else {
        setAlertPopup({
          open: true,
          title: 'Error',
          message: response.error || 'Transfer failed. Please try again.',
          type: 'error',
        })
        setShowPinVerification(false)
      }
    } catch (error: any) {
      console.error('Transfer error:', error)
      setAlertPopup({
        open: true,
        title: 'Error',
        message: error.message || 'Transfer failed. Please try again.',
        type: 'error',
      })
      setShowPinVerification(false)
    } finally {
      setIsProcessingTransfer(false)
    }
  }

  const handleTipScan = () => {
    // QR code scanning functionality
    // In production, this would activate the device camera and QR scanner
    // For now, users can manually enter recipient details
    setStep('tip-confirm')
  }

  const handleTipSend = () => {
    if (tipAmount && !isNaN(Number(tipAmount)) && Number(tipAmount) > 0 && scannedQRData) {
      const newTransfer: BUTransfer = {
        id: `TXN-${Date.now()}`,
        recipientUsername: scannedQRData.username,
        recipientName: scannedQRData.username.replace('@', '').replace('_', ' '),
        amount: Number(tipAmount),
        message: 'Tip',
        date: new Date().toISOString().split('T')[0],
        status: 'completed',
        type: 'tip',
      }

      // Show PIN verification before completing transfer
      setPendingTransfer(newTransfer)
      setShowPinVerification(true)
    }
  }

  return (
    <div className="space-y-6 pb-24 pt-4">
      {showPinVerification && (
        <PinVerification
          onVerify={handlePinVerified}
          onCancel={() => {
            setShowPinVerification(false)
            setPendingTransfer(null)
            setPendingGatewayTransfer(null)
          }}
          title={pendingGatewayTransfer ? 'Confirm send to event' : 'Confirm Transfer'}
          description={pendingGatewayTransfer ? 'Enter your PIN to send BU to this event' : 'Enter your PIN to confirm this ɃU transfer'}
        />
      )}
      {step === 'event-no-gateway' && (
        <div className="px-4 space-y-4">
          <Button variant="outline" onClick={() => { setStep('menu'); onNavigate?.('event-info', initialData?.eventId) }} className="w-full">
            ← Back
          </Button>
          <Card className="border-border/50 bg-card p-6">
            <p className="text-muted-foreground text-center">
              This event doesn&apos;t accept BU transfers from the app yet. You can send BU at the venue by scanning the event&apos;s QR code.
            </p>
          </Card>
        </div>
      )}
      {step === 'event-send' && initialData?.eventName && (
        <div className="px-4 space-y-4">
          <Button
            variant="outline"
            onClick={() => { setStep('menu'); setEventSendAmount(''); setEventSendMessage(''); onNavigate?.('event-info', initialData?.eventId) }}
            className="w-full"
          >
            ← Back
          </Button>
          <h2 className="text-xl font-bold">Send BU to this event</h2>
          <p className="text-sm text-muted-foreground">
            Send BU to <strong>{initialData.eventName}</strong>. The celebrant will receive it for this event.
          </p>
          <Card className="border-primary/20 bg-card p-4 space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Amount (ɃU)</label>
              <Input
                type="number"
                min="0"
                step="any"
                placeholder="0"
                value={eventSendAmount}
                onChange={(e) => setEventSendAmount(e.target.value)}
                className="bg-background"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Message (optional)</label>
              <Input
                placeholder="e.g. Happy birthday!"
                value={eventSendMessage}
                onChange={(e) => setEventSendMessage(e.target.value)}
                className="bg-background"
              />
            </div>
            <Button
              className="w-full"
              disabled={!eventSendAmount || isNaN(Number(eventSendAmount)) || Number(eventSendAmount) <= 0}
              onClick={() => {
                const amount = Number(eventSendAmount)
                if (!initialData?.gatewayId || !initialData?.eventId || !initialData?.eventName || amount <= 0) return
                setPendingGatewayTransfer({
                  gatewayId: initialData.gatewayId,
                  eventId: initialData.eventId,
                  eventName: initialData.eventName,
                  amount,
                  message: eventSendMessage.trim(),
                })
                setShowPinVerification(true)
              }}
            >
              Continue
            </Button>
          </Card>
        </div>
      )}
      {step === 'event-success' && (
        <div className="px-4 space-y-4">
          <Card className="border-primary/20 bg-primary/5 p-6 text-center">
            <CheckCircle className="h-12 w-12 text-primary mx-auto mb-3" />
            <h3 className="font-semibold text-lg">BU sent to event</h3>
            <p className="text-muted-foreground mt-1">
              {eventSentAmount != null && `Ƀ ${eventSentAmount.toLocaleString()} was sent successfully.`}
            </p>
          </Card>
          <div className="flex gap-2">
            {onNavigate && initialData?.eventId && (
              <Button variant="outline" className="flex-1" onClick={() => onNavigate('event-info', initialData.eventId)}>
                Back to event
              </Button>
            )}
            <Button className="flex-1" onClick={() => { setStep('menu'); setEventSentAmount(null); onNavigate?.('send-bu') }}>
              Done
            </Button>
          </div>
        </div>
      )}
      {step === 'menu' && (
        <>
          <div className="px-4">
            <h2 className="text-xl font-bold mb-4">Send ɃU</h2>
            <p className="text-sm text-muted-foreground mb-4">
              Send ɃU to other users or tip instantly via QR code scan
            </p>

            {/* Send Options */}
            <div className="space-y-3 mb-6">
              <Card
                onClick={() => {
                  setTransferType('transfer')
                  setStep('search')
                }}
                className="border-primary/20 cursor-pointer bg-gradient-to-br from-primary/10 to-primary/5 p-6 transition-all hover:border-primary/60 hover:shadow-lg"
              >
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/20">
                    <User className="h-6 w-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold">Send ɃU to User</h3>
                    <p className="mt-2 text-sm text-muted-foreground">
                      Send ɃU to another user using their unique username.
                    </p>
                  </div>
                </div>
              </Card>

              <Card
                onClick={() => {
                  setTransferType('tip')
                  setStep('tip-scan')
                }}
                className="border-yellow-400/20 cursor-pointer bg-gradient-to-br from-yellow-400/10 to-yellow-400/5 p-6 transition-all hover:border-yellow-400/60 hover:shadow-lg"
              >
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-yellow-400/20">
                    <Sparkles className="h-6 w-6 text-yellow-400" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold">Give Tip</h3>
                    <p className="mt-2 text-sm text-muted-foreground">
                      Scan recipient's QR code, enter amount, and send tip instantly. Perfect for performers, and gifters - digital instead of cash!
                    </p>
                  </div>
                </div>
              </Card>
            </div>

            {/* Recent Transfers */}
            {transfers.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold">Recent Transfers</h3>
                  <Button
                    onClick={() => setStep('history')}
                    variant="outline"
                    size="sm"
                  >
                    View All
                  </Button>
                </div>
                <div className="space-y-2">
                  {transfers.slice(0, 3).map((transfer) => (
                    <Card
                      key={transfer.id}
                      onClick={() => {
                        const user = {
                          username: transfer.recipientUsername,
                          fullName: transfer.recipientName,
                          verified: true,
                        }
                        setSelectedUser(user)
                        setTransferType(transfer.type)
                        setStep('confirm')
                      }}
                      className="border-border/50 cursor-pointer bg-card/50 p-3 transition hover:bg-card/80"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-medium">{transfer.recipientName}</p>
                            {transfer.type === 'tip' && (
                              <span className="rounded-full bg-yellow-400/20 px-2 py-1 text-xs text-yellow-400">
                                Tip
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground">{transfer.recipientUsername}</p>
                        </div>
                        <p className="font-bold text-primary">Ƀ {transfer.amount.toLocaleString()}</p>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {step === 'tip-scan' && (
        <>
          <div className="px-4">
            <div className="mb-4">
              <Button
                onClick={() => setStep('menu')}
                variant="outline"
                className="w-full"
              >
                ← Back
              </Button>
            </div>
            <h2 className="text-xl font-bold mb-4">Give Tip</h2>
            <p className="text-sm text-muted-foreground mb-4">
              Scan the recipient's QR code to send a tip instantly. Perfect for performers, and gifters - digital instead of cash!
            </p>

            <Card className="border-yellow-400/20 bg-yellow-400/5 p-6 mb-4">
              <div className="flex flex-col items-center">
                <div className="relative mb-4 w-full max-w-xs">
                  {/* QR Scanner Viewport */}
                  <div className="relative aspect-square w-full overflow-hidden rounded-lg bg-black/50">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <QrCode className="h-32 w-32 text-yellow-400/30" />
                    </div>
                    {/* Scanner Frame */}
                    <div className="absolute inset-4 border-4 border-yellow-400/50 rounded-lg">
                      <div className="absolute inset-2 border-2 border-dashed border-yellow-400/30 rounded" />
                    </div>
                    {/* Corner indicators */}
                    <div className="absolute top-4 left-4 h-6 w-6 border-t-4 border-l-4 border-yellow-400 rounded-tl" />
                    <div className="absolute top-4 right-4 h-6 w-6 border-t-4 border-r-4 border-yellow-400 rounded-tr" />
                    <div className="absolute bottom-4 left-4 h-6 w-6 border-b-4 border-l-4 border-yellow-400 rounded-bl" />
                    <div className="absolute bottom-4 right-4 h-6 w-6 border-b-4 border-r-4 border-yellow-400 rounded-br" />
                  </div>
                  <p className="mt-2 text-center text-xs text-muted-foreground">
                    Point camera at recipient's QR code
                  </p>
                </div>
                <Button
                  onClick={handleTipScan}
                  className="w-full bg-yellow-400 text-yellow-900 hover:bg-yellow-400/90"
                >
                  Scan QR Code
                </Button>
              </div>
            </Card>

            <Card className="border-border/50 bg-card/50 p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                <div className="text-sm text-muted-foreground">
                  <p className="font-semibold mb-1">How it works:</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>You enter tip amount</li>
                    <li>Recipient shows their QR code</li>
                    <li>Tip is sent instantly</li>
                  </ul>
                </div>
              </div>
            </Card>
          </div>
        </>
      )}

      {step === 'tip-confirm' && scannedQRData && (
        <>
          <div className="px-4">
            <div className="mb-4">
              <Button
                onClick={() => {
                  setStep('tip-scan')
                  setScannedQRData(null)
                  setTipAmount('')
                }}
                variant="outline"
                className="w-full"
              >
                ← Back
              </Button>
            </div>

            <h2 className="text-xl font-bold mb-4">Confirm Tip</h2>

            <Card className="border-yellow-400/20 bg-yellow-400/5 p-4 mb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-yellow-400/20">
                  <Sparkles className="h-8 w-8 text-yellow-400" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold">{scannedQRData.username}</h3>
                  <p className="text-sm text-muted-foreground mt-1">QR Code scanned successfully</p>
                </div>
              </div>
            </Card>

            <Card className="border-primary/20 space-y-4 bg-card p-6">
              <div>
                <label className="text-sm font-semibold">Tip Amount (Ƀ)</label>
                <Input
                  type="number"
                  placeholder="Enter tip amount"
                  value={tipAmount}
                  onChange={(e) => setTipAmount(e.target.value)}
                  className="mt-2 bg-secondary text-foreground placeholder:text-muted-foreground"
                />
                {tipAmount && !isNaN(Number(tipAmount)) && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    Equivalent: ₦{Number(tipAmount).toLocaleString()}
                  </p>
                )}
              </div>

              <div className="rounded-lg border border-yellow-400/20 bg-yellow-400/5 p-3">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-yellow-400 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-muted-foreground">
                    Tip will be sent instantly to {scannedQRData.username}'s wallet. This is a peer-to-peer tip transfer.
                  </p>
                </div>
              </div>

              <Button
                onClick={handleTipSend}
                disabled={!tipAmount || isNaN(Number(tipAmount)) || Number(tipAmount) <= 0}
                className="w-full bg-yellow-400 py-3 text-yellow-900 hover:bg-yellow-400/90"
              >
                Give Tip
              </Button>
            </Card>
          </div>
        </>
      )}

      {step === 'search' && (
        <>
          <div className="px-4">
            <div className="mb-4">
              <Button
                onClick={() => setStep('menu')}
                variant="outline"
                className="w-full"
              >
                ← Back
              </Button>
            </div>
            <h2 className="text-xl font-bold mb-4">Send ɃU to User</h2>
            <p className="text-sm text-muted-foreground mb-4">
              Send ɃU directly to another user using their phone number. Search by phone number to find the recipient.
            </p>

            {/* Search Contacts */}
            <Card className="border-primary/20 bg-card p-4 mb-4">
              <div className="flex items-center gap-3">
                <Search className="h-5 w-5 text-primary" />
                <Input
                  type="text"
                  placeholder="Search your contacts..."
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="bg-secondary text-foreground placeholder:text-muted-foreground"
                />
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                Search your saved contacts by name or phone number
              </p>
            </Card>

            {/* All my contacts - show when not searching (or filter by search) */}
            <AllContactsList
              contactsLoading={contactsLoading}
              allContacts={allContacts}
              searchQuery={searchQuery}
              onSelectUser={handleSelectUser}
            />

            {/* Divider */}
            <div className="flex items-center gap-4 px-4 mb-4">
              <div className="flex-1 border-t border-border"></div>
              <span className="text-sm text-muted-foreground">— or enter phone number —</span>
              <div className="flex-1 border-t border-border"></div>
            </div>

            {/* Enter unique phone number */}
            <Card className="border-primary/20 bg-card p-4 mb-4">
              <h3 className="text-sm font-semibold text-foreground mb-2">Enter phone number</h3>
              <div className="flex items-center gap-3">
                <User className="h-5 w-5 text-primary" />
                <Input
                  type="tel"
                  placeholder="e.g. +2348012345678"
                  value={manualPhone}
                  onChange={(e) => handleManualPhoneLookup(e.target.value)}
                  inputMode="tel"
                  className="bg-secondary text-foreground placeholder:text-muted-foreground"
                />
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                Enter any registered phone number to send money (even if not in contacts)
              </p>
            </Card>

            {/* Manual User Found */}
            {manualUser && (
              <Card className="border-primary/20 bg-card p-4 mb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/20">
                      <User className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold">{manualUser.fullName}</h3>
                      <p className="text-sm text-muted-foreground">{manualUser.username}</p>
                      <p className="text-xs text-yellow-400 mt-1">Not in your contacts</p>
                    </div>
                  </div>
                  <Button
                    onClick={() => handleSelectUser(manualUser)}
                    size="sm"
                    className="bg-primary text-primary-foreground hover:bg-primary/90"
                  >
                    Select
                  </Button>
                </div>
              </Card>
            )}

            {/* Search Results */}
            {searchQuery.length >= 2 && (
              <div className="space-y-2">
                {searchLoading ? (
                  <Card className="border-border/50 bg-card/50 p-8 text-center">
                    <BULoading />
                  </Card>
                ) : searchResults.length === 0 ? (
                  <Card className="border-border/50 bg-card/50 p-8 text-center">
                    <p className="text-muted-foreground">No users found</p>
                    <p className="text-xs text-muted-foreground mt-2">
                      Try searching by phone number (e.g., +2348012345678 or 08012345678)
                    </p>
                  </Card>
                ) : (
                  searchResults.map((user) => (
                    <Card
                      key={user.username}
                      onClick={() => handleSelectUser(user)}
                      className="border-primary/20 cursor-pointer bg-card p-4 transition hover:bg-card/80 hover:border-primary/40"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/20">
                            <User className="h-6 w-6 text-primary" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold">{user.fullName}</h3>
                              {user.verified && (
                                <span className="text-xs text-green-400">✓</span>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground">{user.username}</p>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          className="bg-primary text-primary-foreground hover:bg-primary/90"
                        >
                          Select
                        </Button>
                      </div>
                    </Card>
                  ))
                )}
              </div>
            )}

            {/* Recent Transfers */}
            {searchQuery.length < 2 && transfers.length > 0 && (
              <div className="mt-6">
                <h3 className="mb-4 font-semibold">Recent Transfers</h3>
                <div className="space-y-2">
                  {transfers.slice(0, 3).map((transfer) => (
                    <Card
                      key={transfer.id}
                      onClick={() => {
                        const user = {
                          username: transfer.recipientUsername,
                          fullName: transfer.recipientName,
                          verified: true,
                        }
                        handleSelectUser(user)
                      }}
                      className="border-border/50 cursor-pointer bg-card/50 p-3 transition hover:bg-card/80"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{transfer.recipientName}</p>
                          <p className="text-xs text-muted-foreground">{transfer.recipientUsername}</p>
                        </div>
                        <p className="font-bold text-primary">Ƀ {transfer.amount.toLocaleString()}</p>
                      </div>
                    </Card>
                  ))}
                </div>
                <Button
                  onClick={() => setStep('history')}
                  variant="outline"
                  className="w-full mt-4"
                >
                  View All Transfers
                </Button>
              </div>
            )}
          </div>
        </>
      )}

      {step === 'confirm' && selectedUser && (
        <>
          <div className="px-4">
            <div className="mb-4">
              <Button
                onClick={() => {
                  setStep('search')
                  setSelectedUser(null)
                  setTransferForm({ amount: '', message: '' })
                }}
                variant="outline"
                className="w-full"
              >
                ← Back to Search
              </Button>
            </div>

            <h2 className="text-xl font-bold mb-4">Send ɃU to User</h2>

            {/* Selected User Info */}
            <Card className="border-primary/20 bg-card p-4 mb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/20">
                  <User className="h-8 w-8 text-primary" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold">{selectedUser.fullName}</h3>
                    {selectedUser.verified && (
                      <span className="rounded-full bg-green-400/20 px-2 py-1 text-xs text-green-400">
                        Verified
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">{selectedUser.username}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Unique username - cannot be shared
                  </p>
                </div>
              </div>
            </Card>

            {/* Transfer Form */}
            <Card className="border-primary/20 space-y-4 bg-card p-6">
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-semibold">Amount (Ƀ)</label>
                  <Input
                    type="number"
                    placeholder="Enter ɃU amount"
                    value={transferForm.amount}
                    onChange={(e) =>
                      setTransferForm({ ...transferForm, amount: e.target.value })
                    }
                    className="mt-2 bg-secondary text-foreground placeholder:text-muted-foreground"
                  />
                  {transferForm.amount && !isNaN(Number(transferForm.amount)) && (
                    <p className="mt-1 text-xs text-muted-foreground">
                      Equivalent: ₦{Number(transferForm.amount).toLocaleString()}
                    </p>
                  )}
                </div>

                <div>
                  <label className="text-sm font-semibold">Message (Optional)</label>
                  <Input
                    placeholder="Add a message"
                    value={transferForm.message}
                    onChange={(e) =>
                      setTransferForm({ ...transferForm, message: e.target.value })
                    }
                    className="mt-2 bg-secondary text-foreground placeholder:text-muted-foreground"
                  />
                </div>

                <div className="rounded-lg border border-primary/20 bg-primary/5 p-3">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-muted-foreground">
                      ɃU will be transferred directly to {selectedUser.fullName}'s wallet ({selectedUser.username}). This is a peer-to-peer transfer, not related to events.
                    </p>
                  </div>
                </div>

                <Button
                  onClick={handleSendBU}
                  className="w-full bg-primary py-3 text-primary-foreground hover:bg-primary/90"
                >
                  Send ɃU Now
                </Button>
              </div>
            </Card>
          </div>
        </>
      )}

      {step === 'success' && transfers.length > 0 && (
        <>
          <div className="px-4">
            <Card className={`${transfers[0].type === 'tip' ? 'border-yellow-400/30 bg-yellow-400/10' : 'border-green-400/30 bg-green-400/10'} p-6 mb-4`}>
              <div className="flex items-start gap-3">
                <CheckCircle className={`h-6 w-6 ${transfers[0].type === 'tip' ? 'text-yellow-400' : 'text-green-400'} flex-shrink-0 mt-0.5`} />
                <div className="flex-1">
                  <h3 className={`font-semibold mb-2 ${transfers[0].type === 'tip' ? 'text-yellow-400' : 'text-green-400'}`}>
                    {transfers[0].type === 'tip' ? 'Tip Sent Instantly!' : 'ɃU Sent Successfully!'}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {transfers[0].type === 'tip' 
                      ? 'Your tip has been transferred instantly to the recipient\'s wallet. No cash needed!'
                      : 'Your ɃU has been transferred to the recipient\'s wallet.'}
                  </p>
                </div>
              </div>
            </Card>

            <Card className="border-primary/20 bg-card p-4 mb-4">
              <h4 className="font-semibold mb-3">Transfer Details</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Recipient:</span>
                  <span className="font-semibold">{transfers[0].recipientName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Username:</span>
                  <span className="font-semibold">{transfers[0].recipientUsername}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Type:</span>
                  <span className={`font-semibold ${transfers[0].type === 'tip' ? 'text-yellow-400' : 'text-primary'}`}>
                    {transfers[0].type === 'tip' ? 'Tip' : 'Transfer'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Amount:</span>
                  <span className="font-bold text-primary">Ƀ {transfers[0].amount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Status:</span>
                  <span className="text-green-400">Completed</span>
                </div>
                {transfers[0].message && (
                  <div className="pt-2 border-t border-border">
                    <p className="text-muted-foreground">Message:</p>
                    <p className="font-medium">"{transfers[0].message}"</p>
                  </div>
                )}
              </div>
            </Card>

            {/* Add to Contacts Option */}
            {showAddToContacts && lastTransactionRecipient && (
              <Card className="border-primary/20 bg-primary/5 p-4 mb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold mb-1">Add to Contacts?</h4>
                    <p className="text-sm text-muted-foreground">
                      Send a friend request to add this user to your contacts
                    </p>
                  </div>
                  <Button
                    onClick={async () => {
                      try {
                        // Get recipient phone number from last transfer
                        const recipientPhone = transfers[0]?.recipientUsername
                        if (recipientPhone) {
                          const response = await friendRequestsApi.send({
                            phone_number: recipientPhone,
                          })
                          if (response.success) {
                            setAlertPopup({
                              open: true,
                              title: 'Success',
                              message: 'Friend request sent! They will be added to your contacts when accepted.',
                              type: 'success',
                            })
                            setShowAddToContacts(false)
                          } else {
                            setAlertPopup({
                              open: true,
                              title: 'Error',
                              message: response.error || 'Failed to send friend request',
                              type: 'error',
                            })
                          }
                        }
                      } catch (error: any) {
                        console.error('Send friend request error:', error)
                        setAlertPopup({
                          open: true,
                          title: 'Error',
                          message: 'Failed to send friend request',
                          type: 'error',
                        })
                      }
                    }}
                    size="sm"
                    className="bg-primary text-primary-foreground hover:bg-primary/90"
                  >
                    Add Contact
                  </Button>
                </div>
              </Card>
            )}

            <div className="flex gap-2">
              <Button
                onClick={() => {
                  setStep('menu')
                  setSelectedUser(null)
                  setTransferForm({ amount: '', message: '' })
                  setTipAmount('')
                  setScannedQRData(null)
                  setShowAddToContacts(false)
                  setLastTransactionRecipient(null)
                  setManualUser(null)
                  setManualPhone('')
                }}
                className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
              >
                Send More ɃU
              </Button>
              <Button
                onClick={() => setStep('history')}
                variant="outline"
                className="flex-1"
              >
                View History
              </Button>
            </div>
          </div>
        </>
      )}

      {step === 'history' && (
        <>
          <div className="px-4">
            <div className="mb-4">
              <Button
                onClick={() => setStep('menu')}
                variant="outline"
                className="w-full"
              >
                ← Back
              </Button>
            </div>

            <h2 className="text-xl font-bold mb-4">Send ɃU History</h2>

            <div className="space-y-3">
              {transfersLoading ? (
                <Card className="border-border/50 bg-card/50 p-8 text-center">
                  <BULoading />
                </Card>
              ) : transfers.length === 0 ? (
                <Card className="border-border/50 bg-card/50 p-8 text-center">
                  <p className="text-muted-foreground">No transfers yet</p>
                  <Button
                    onClick={() => setStep('menu')}
                    className="mt-4 bg-primary text-primary-foreground hover:bg-primary/90"
                  >
                    Send ɃU
                  </Button>
                </Card>
              ) : (
                transfers.map((transfer) => (
                  <Card
                    key={transfer.id}
                    className="border-border/50 bg-card/50 p-4"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">{transfer.recipientName}</h3>
                          {transfer.type === 'tip' && (
                            <span className="rounded-full bg-yellow-400/20 px-2 py-1 text-xs text-yellow-400">
                              Tip
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">{transfer.recipientUsername}</p>
                        {transfer.message && (
                          <p className="mt-1 text-sm text-muted-foreground">
                            "{transfer.message}"
                          </p>
                        )}
                        <span
                          className={`mt-2 inline-block rounded-full px-2 py-1 text-xs font-semibold ${
                            transfer.status === 'completed'
                              ? 'bg-green-400/20 text-green-400'
                              : transfer.status === 'pending'
                                ? 'bg-yellow-400/20 text-yellow-400'
                                : 'bg-red-400/20 text-red-400'
                          }`}
                        >
                          {transfer.status}
                        </span>
                        <p className="text-xs text-muted-foreground mt-2">{transfer.date}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-primary">
                          Ƀ {transfer.amount.toLocaleString()}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          ₦{transfer.amount.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </Card>
                ))
              )}
            </div>
            </div>
          </>
        )}

        {/* Alert Popup */}
        <AlertPopup
          open={alertPopup.open}
          onOpenChange={(open) => setAlertPopup({ ...alertPopup, open })}
          title={alertPopup.title}
          message={alertPopup.message}
          type={alertPopup.type}
        />

        {/* Receipt Modal */}
        <ReceiptModal
          open={showReceipt}
          onOpenChange={(open) => {
            setShowReceipt(open)
            // When receipt modal closes, go back to menu
            if (!open) {
              setStep('menu')
              setSelectedReceipt(null)
              setShowAddToContacts(false)
              setLastTransactionRecipient(null)
            }
          }}
          receipt={selectedReceipt}
        />
      </div>
    )
  }
