'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Calendar, MapPin, CheckCircle, Clock, QrCode, Download } from 'lucide-react'
import { invitesApi } from '@/lib/api-client'
import BULoading from '@/components/bu-loading'

interface Invite {
  id: string
  eventName: string
  eventDate: string
  location?: string
  gate?: string
  seat?: string
  seat_category?: string
  status: 'accepted' | 'pending' | 'declined'
  celebrantName: string
  qr_code_data?: any
}

export default function Invites() {
  const [invites, setInvites] = useState<Invite[]>([])
  const [loading, setLoading] = useState(true)
  const [processingId, setProcessingId] = useState<string | null>(null)

  // Fetch invites from API
  useEffect(() => {
    const fetchInvites = async () => {
      try {
        setLoading(true)
        console.log('Fetching received invites...')
        
        // Get current user for debugging
        const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}')
        console.log('Current user:', {
          id: currentUser.id,
          role: currentUser.role,
          phoneNumber: currentUser.phoneNumber,
        })
        
        const response = await invitesApi.list('received')
        console.log('Invites API response:', response)
        
        if (response.success && response.data?.invites) {
          console.log('Found invites:', response.data.invites.length)
          console.log('Invites data:', response.data.invites)
          
          const formattedInvites: Invite[] = response.data.invites.map((inv: any) => {
            // Format date properly
            let formattedDate = ''
            if (inv.event?.date) {
              try {
                const date = new Date(inv.event.date)
                formattedDate = date.toLocaleDateString('en-US', { 
                  month: 'short', 
                  day: 'numeric',
                  year: 'numeric'
                })
              } catch (e) {
                formattedDate = inv.event.date
              }
            }
            
            return {
              id: inv.id,
              eventName: inv.event?.name || 'Event',
              eventDate: formattedDate,
              location: inv.event?.location || undefined,
              gate: inv.gate || undefined,
              seat: inv.seat || undefined,
              seat_category: inv.seat_category || undefined,
              status: inv.status,
              celebrantName: inv.celebrant
                ? `${inv.celebrant.first_name} ${inv.celebrant.last_name}`
                : 'Celebrant',
              qr_code_data: inv.qr_code_data || null,
            }
          })
          setInvites(formattedInvites)
          console.log('Formatted invites:', formattedInvites)
        } else {
          console.error('Failed to fetch invites:', {
            success: response?.success,
            error: response?.error,
            data: response?.data,
            fullResponse: response,
          })
          
          // If there's an error, show it to the user
          if (response?.error) {
            console.error('API Error:', response.error)
          }
        }
      } catch (error) {
        console.error('Failed to fetch invites:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchInvites()
  }, [])

  const handleAcceptInvite = async (inviteId: string) => {
    try {
      setProcessingId(inviteId)
      const response = await invitesApi.accept(inviteId)
      if (response.success) {
        // Update local state
        setInvites(prev =>
          prev.map(inv => (inv.id === inviteId ? { ...inv, status: 'accepted' as const, qr_code_data: response.data?.invite?.qr_code_data } : inv))
        )
      } else {
        alert(response.error || 'Failed to accept invite')
      }
    } catch (error: any) {
      console.error('Accept invite error:', error)
      alert(error.message || 'Failed to accept invite')
    } finally {
      setProcessingId(null)
    }
  }

  const handleDeclineInvite = async (inviteId: string) => {
    try {
      setProcessingId(inviteId)
      const response = await invitesApi.decline(inviteId)
      if (response.success) {
        // Update local state
        setInvites(prev =>
          prev.map(inv => (inv.id === inviteId ? { ...inv, status: 'declined' as const } : inv))
        )
      } else {
        alert(response.error || 'Failed to decline invite')
      }
    } catch (error: any) {
      console.error('Decline invite error:', error)
      alert(error.message || 'Failed to decline invite')
    } finally {
      setProcessingId(null)
    }
  }

  return (
    <div className="space-y-6 pb-24 pt-4">
      <div className="px-4">
        <h2 className="text-xl font-bold mb-4">My Invites</h2>
        <p className="text-sm text-muted-foreground mb-4">
          Invitations from celebrants with gate access and seating arrangements
        </p>

        <div className="space-y-3">
          {loading ? (
            <Card className="border-border/50 bg-card/50 p-8 text-center">
              <BULoading />
            </Card>
          ) : invites.length === 0 ? (
            <Card className="border-border/50 bg-card/50 p-8 text-center">
              <p className="text-muted-foreground">No invites received yet</p>
            </Card>
          ) : (
            invites.map((invite) => (
            <Card
              key={invite.id}
              className="border-primary/20 bg-card p-4"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3 className="font-semibold">{invite.eventName}</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    From: {invite.celebrantName}
                  </p>
                </div>
                <span
                  className={`rounded-full px-2 py-1 text-xs font-semibold ${
                    invite.status === 'accepted'
                      ? 'bg-green-400/20 text-green-400'
                      : invite.status === 'pending'
                        ? 'bg-yellow-400/20 text-yellow-400'
                        : 'bg-red-400/20 text-red-400'
                  }`}
                >
                  {invite.status}
                </span>
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-primary" />
                  <span>{invite.eventDate}</span>
                </div>
                {invite.location && (
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="h-4 w-4 text-primary" />
                    <span>{invite.location}</span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-sm">
                  <span>🚪</span>
                  <span className="font-semibold">Gate: {invite.gate}</span>
                </div>
                {invite.seat && (
                  <div className="flex items-center gap-2 text-sm">
                    <span>🪑</span>
                    <span className="font-semibold">Seat: {invite.seat}</span>
                  </div>
                )}
                {invite.seat_category && (
                  <div className="flex items-center gap-2 text-sm">
                    <span>⭐</span>
                    <span className="font-semibold">Category: {invite.seat_category}</span>
                  </div>
                )}
              </div>

              {invite.status === 'accepted' && (
                <Card className="border-green-400/30 bg-green-400/10 p-4 mb-3">
                  <div className="flex flex-col items-center text-center">
                    <QrCode className="h-16 w-16 text-green-400 mb-2" />
                    <p className="text-sm font-semibold mb-1">Gate Entry QR Code</p>
                    <p className="text-xs text-muted-foreground mb-3">
                      Show this QR code at the event gate for entry
                    </p>
                    {invite.qr_code_data ? (
                      <div className="bg-white p-2 rounded-lg">
                        <img 
                          src={invite.qr_code_data.url || `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(JSON.stringify({ invite_id: invite.id, event: invite.eventName, guest: invite.celebrantName }))}`}
                          alt="Invite QR Code"
                          className="w-32 h-32"
                        />
                      </div>
                    ) : (
                      <div className="bg-white p-2 rounded-lg">
                        <img 
                          src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(JSON.stringify({ invite_id: invite.id, event: invite.eventName, guest: invite.celebrantName, status: 'accepted' }))}`}
                          alt="Invite QR Code"
                          className="w-32 h-32"
                        />
                      </div>
                    )}
                  </div>
                </Card>
              )}

              {invite.status === 'pending' && (
                <div className="flex gap-2">
                  <Button
                    onClick={() => handleAcceptInvite(invite.id)}
                    disabled={processingId === invite.id}
                    className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
                  >
                    {processingId === invite.id ? 'Processing...' : 'Accept'}
                  </Button>
                  <Button
                    onClick={() => handleDeclineInvite(invite.id)}
                    disabled={processingId === invite.id}
                    variant="outline"
                    className="flex-1"
                  >
                    {processingId === invite.id ? 'Processing...' : 'Decline'}
                  </Button>
                </div>
              )}

              {invite.status === 'accepted' && (
                <div className="flex items-center gap-2 text-green-400">
                  <CheckCircle className="h-4 w-4" />
                  <span className="text-sm">Invitation accepted</span>
                </div>
              )}
            </Card>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
