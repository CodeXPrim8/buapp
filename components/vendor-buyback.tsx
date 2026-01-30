'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { CheckCircle, AlertCircle, QrCode, ArrowUp, Search } from 'lucide-react'

interface BuybackRequest {
  id: string
  noteId: string
  amount: number
  guestName: string
  guestPhone: string
  timestamp: string
  status: 'pending' | 'approved' | 'rejected' | 'completed'
}

interface VendorBuybackProps {
  onNavigate?: (page: string, data?: any) => void
}

export default function VendorBuyback({ onNavigate }: VendorBuybackProps) {
  const [mode, setMode] = useState<'scan' | 'manual' | 'requests'>('scan')
  const [noteId, setNoteId] = useState('')
  const [amount, setAmount] = useState('')
  const [guestPhone, setGuestPhone] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [requestCreated, setRequestCreated] = useState(false)
  const [createdRequest, setCreatedRequest] = useState<BuybackRequest | null>(null)

  const [buybackRequests, setBuybackRequests] = useState<BuybackRequest[]>([])
  const [loading, setLoading] = useState(false)

  const handleScanQR = () => {
    // QR code scanning functionality
    // In production, this would activate the device camera and QR scanner
    // For now, switch to manual entry mode
    setMode('manual')
  }

  const handleCreateRequest = async () => {
    if (!noteId || !amount || !guestPhone) return

    setIsProcessing(true)

    try {
      // TODO: Implement buyback API endpoint
      // For now, show message that feature is coming soon
      alert('Buyback feature is coming soon. API integration pending.')
      setIsProcessing(false)
      
      // Reset form
      setNoteId('')
      setAmount('')
      setGuestPhone('')
    } catch (error: any) {
      console.error('Failed to create buyback request:', error)
      alert('Failed to create buyback request. Please try again.')
      setIsProcessing(false)
    }
  }

  const handleApproveRequest = async (requestId: string) => {
    // TODO: Implement buyback API endpoint
    alert('Buyback approval feature is coming soon. API integration pending.')
  }

  const handleCompleteRequest = async (requestId: string) => {
    // TODO: Implement buyback API endpoint
    alert('Buyback completion feature is coming soon. API integration pending.')
  }

  const handleRejectRequest = async (requestId: string) => {
    // TODO: Implement buyback API endpoint
    alert('Buyback rejection feature is coming soon. API integration pending.')
  }

  if (requestCreated && createdRequest) {
    return (
      <div className="space-y-6 pb-24 pt-4">
        <div className="px-4">
          <Card className="border-green-400/30 bg-green-400/10 p-6">
            <div className="flex flex-col items-center text-center">
              <CheckCircle className="h-12 w-12 text-green-400 mb-4" />
              <h3 className="text-xl font-bold mb-2">Buyback Request Created!</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Request ID: {createdRequest.id}
              </p>
              <div className="w-full space-y-2 mb-4">
                <div className="rounded-lg bg-background/50 p-3 text-left">
                  <p className="text-xs text-muted-foreground">Note ID</p>
                  <p className="font-mono text-sm font-semibold">{createdRequest.noteId}</p>
                </div>
                <div className="rounded-lg bg-background/50 p-3 text-left">
                  <p className="text-xs text-muted-foreground">Amount</p>
                  <p className="font-semibold">Ƀ {createdRequest.amount.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">₦{createdRequest.amount.toLocaleString()}</p>
                </div>
                <div className="rounded-lg bg-background/50 p-3 text-left">
                  <p className="text-xs text-muted-foreground">Status</p>
                  <span className="inline-block rounded-full bg-yellow-400/20 px-2 py-1 text-xs text-yellow-400 mt-1">
                    Pending Approval
                  </span>
                </div>
              </div>
              <div className="flex gap-2 w-full">
                <Button
                  onClick={() => {
                    setRequestCreated(false)
                    setCreatedRequest(null)
                    setMode('requests')
                  }}
                  variant="outline"
                  className="flex-1"
                >
                  View Requests
                </Button>
                <Button
                  onClick={() => {
                    setRequestCreated(false)
                    setCreatedRequest(null)
                    setMode('scan')
                    setNoteId('')
                    setAmount('')
                    setGuestPhone('')
                  }}
                  className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  Create Another
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

        <h2 className="text-xl font-bold mb-2">Buyback Request</h2>
        <p className="text-sm text-muted-foreground mb-4">
          Buy back physical ɃU notes from guests. Scan the note QR code or enter details manually.
        </p>

        {/* Mode Tabs */}
        <div className="flex gap-2 mb-4">
          <Button
            onClick={() => setMode('scan')}
            variant={mode === 'scan' ? 'default' : 'outline'}
            className="flex-1"
          >
            Scan Note
          </Button>
          <Button
            onClick={() => setMode('manual')}
            variant={mode === 'manual' ? 'default' : 'outline'}
            className="flex-1"
          >
            Manual Entry
          </Button>
          <Button
            onClick={() => setMode('requests')}
            variant={mode === 'requests' ? 'default' : 'outline'}
            className="flex-1"
          >
            Requests ({buybackRequests.filter(r => r.status === 'pending' || r.status === 'approved').length})
          </Button>
        </div>

        {mode === 'scan' && (
          <>
            {/* QR Scanner */}
            <Card className="border-primary/20 bg-card p-6 mb-4">
              <h3 className="font-semibold mb-4">Scan ɃU Note QR Code</h3>
              <div className="relative aspect-square overflow-hidden rounded-lg bg-black flex items-center justify-center mb-4">
                <QrCode className="h-24 w-24 text-primary/50" />
                <div className="absolute inset-0 border-4 border-primary/50">
                  <div className="absolute inset-4 border border-dashed border-primary/30" />
                </div>
                <p className="absolute bottom-4 left-1/2 -translate-x-1/2 text-xs text-white">
                  {isProcessing ? 'Scanning...' : 'Point camera at QR code'}
                </p>
              </div>
              <Button
                onClick={handleScanQR}
                disabled={isProcessing}
                className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
              >
                {isProcessing ? 'Scanning...' : 'Scan QR Code'}
              </Button>
            </Card>

            {/* Info Card */}
            <Card className="border-border/50 bg-card/50 p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                <div className="text-sm text-muted-foreground">
                  <p className="font-semibold mb-1">How it works:</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Scan the QR code on the physical ɃU note</li>
                    <li>Enter guest phone number</li>
                    <li>Create buyback request</li>
                    <li>Approve and complete the transaction</li>
                  </ul>
                </div>
              </div>
            </Card>
          </>
        )}

        {mode === 'manual' && (
          <>
            <Card className="border-primary/20 bg-card p-6 mb-4">
              <h3 className="font-semibold mb-4">Enter Note Details</h3>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-semibold mb-2 block">Note ID *</label>
                  <Input
                    type="text"
                    placeholder="e.g., NOTE-12345"
                    value={noteId}
                    onChange={(e) => setNoteId(e.target.value)}
                    className="bg-secondary text-foreground placeholder:text-muted-foreground"
                  />
                </div>

                <div>
                  <label className="text-sm font-semibold mb-2 block">Amount (Ƀ) *</label>
                  <Input
                    type="number"
                    placeholder="Enter amount"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="bg-secondary text-foreground placeholder:text-muted-foreground"
                  />
                  {amount && !isNaN(Number(amount)) && (
                    <p className="mt-1 text-xs text-muted-foreground">
                      Equivalent: ₦{Number(amount).toLocaleString()}
                    </p>
                  )}
                </div>

                <div>
                  <label className="text-sm font-semibold mb-2 block">Guest Phone Number *</label>
                  <Input
                    type="tel"
                    placeholder="+2348012345678"
                    value={guestPhone}
                    onChange={(e) => setGuestPhone(e.target.value)}
                    className="bg-secondary text-foreground placeholder:text-muted-foreground"
                  />
                </div>
              </div>
            </Card>

            <Button
              onClick={handleCreateRequest}
              disabled={!noteId || !amount || !guestPhone || isProcessing}
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {isProcessing ? 'Creating Request...' : 'Create Buyback Request'}
            </Button>
          </>
        )}

        {mode === 'requests' && (
          <>
            <h3 className="font-semibold mb-4">Buyback Requests</h3>
            
            {/* Filter Tabs */}
            <div className="flex gap-2 mb-4 overflow-x-auto">
              <Button
                onClick={() => {}}
                variant="outline"
                size="sm"
                className="flex-shrink-0"
              >
                All ({buybackRequests.length})
              </Button>
              <Button
                onClick={() => {}}
                variant="outline"
                size="sm"
                className="flex-shrink-0"
              >
                Pending ({buybackRequests.filter(r => r.status === 'pending').length})
              </Button>
              <Button
                onClick={() => {}}
                variant="outline"
                size="sm"
                className="flex-shrink-0"
              >
                Approved ({buybackRequests.filter(r => r.status === 'approved').length})
              </Button>
            </div>

            <div className="space-y-3">
              {buybackRequests.length === 0 ? (
                <Card className="border-border/50 bg-card/50 p-8 text-center">
                  <p className="text-muted-foreground">No buyback requests yet</p>
                </Card>
              ) : (
                buybackRequests.map((request) => (
                  <Card
                    key={request.id}
                    className={`border-border/50 bg-card/50 p-4 ${
                      request.status === 'pending' ? 'border-yellow-400/30 bg-yellow-400/5' :
                      request.status === 'approved' ? 'border-blue-400/30 bg-blue-400/5' :
                      request.status === 'completed' ? 'border-green-400/30 bg-green-400/5' :
                      'border-red-400/30 bg-red-400/5'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold">Request {request.id}</h4>
                          <span className={`rounded-full px-2 py-1 text-xs font-semibold ${
                            request.status === 'pending' ? 'bg-yellow-400/20 text-yellow-400' :
                            request.status === 'approved' ? 'bg-blue-400/20 text-blue-400' :
                            request.status === 'completed' ? 'bg-green-400/20 text-green-400' :
                            'bg-red-400/20 text-red-400'
                          }`}>
                            {request.status}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          Note ID: {request.noteId}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Guest: {request.guestName} ({request.guestPhone})
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {request.timestamp}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-primary">
                          Ƀ {request.amount.toLocaleString()}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          ₦{request.amount.toLocaleString()}
                        </p>
                      </div>
                    </div>

                    {request.status === 'pending' && (
                      <div className="flex gap-2 mt-3">
                        <Button
                          onClick={() => handleApproveRequest(request.id)}
                          className="flex-1 bg-green-400 text-white hover:bg-green-400/90"
                        >
                          Approve
                        </Button>
                        <Button
                          onClick={() => handleRejectRequest(request.id)}
                          variant="outline"
                          className="flex-1"
                        >
                          Reject
                        </Button>
                      </div>
                    )}

                    {request.status === 'approved' && (
                      <Button
                        onClick={() => handleCompleteRequest(request.id)}
                        className="w-full mt-3 bg-primary text-primary-foreground hover:bg-primary/90"
                      >
                        Complete Transaction
                      </Button>
                    )}

                    {request.status === 'completed' && (
                      <div className="flex items-center gap-2 mt-3 text-green-400">
                        <CheckCircle className="h-4 w-4" />
                        <span className="text-sm">Transaction completed</span>
                      </div>
                    )}
                  </Card>
                ))
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
