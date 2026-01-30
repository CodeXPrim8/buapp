'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { CheckCircle, XCircle, AlertCircle, Plus, User, DollarSign } from 'lucide-react'
import { createNotification } from '@/components/notifications'
import { gatewayApi, vendorSalesApi } from '@/lib/api-client'

interface Gateway {
  id: string
  eventName: string
  eventDate: string
  eventTime: string
  eventLocation: string
  celebrantUniqueId: string
  celebrantName: string
  status: string
  createdAt: string
}

interface BUTransfer {
  id: string
  gatewayId: string
  eventName: string
  guestName: string
  guestPhone?: string
  amount: number
  timestamp: string
  status: 'pending' | 'confirmed' | 'notes_issued'
  noteIssued: boolean
  celebrantUniqueId: string
  source?: 'gateway_qr_scan' | 'manual_sale' // Track where transfer came from
}

interface VendorPOSProps {
  onNavigate?: (page: string, data?: any) => void
}

export default function VendorPOS({ onNavigate }: VendorPOSProps) {
  const [mode, setMode] = useState<'sell' | 'pending' | 'history'>('sell')
  const [gateways, setGateways] = useState<Gateway[]>([])
  const [selectedGateway, setSelectedGateway] = useState<string>('')
  
  // Sell BU Note form
  const [sellForm, setSellForm] = useState({
    guestName: '',
    guestPhone: '',
    amount: '',
  })
  
  const [pendingTransfers, setPendingTransfers] = useState<BUTransfer[]>([])
  const [completedTransfers, setCompletedTransfers] = useState<BUTransfer[]>([])

  // Load gateways and transfers from API
  useEffect(() => {
    const loadData = async () => {
      try {
        // Load gateways from API
        const gatewaysResponse = await gatewayApi.list()
        if (gatewaysResponse.success && gatewaysResponse.data?.gateways) {
          // Transform API gateways to match component format
          const transformedGateways = gatewaysResponse.data.gateways.map((g: any) => ({
            id: g.id,
            eventName: g.event_name,
            eventDate: g.event_date,
            eventTime: g.event_time,
            eventLocation: g.event_location,
            celebrantUniqueId: g.celebrant_unique_id,
            celebrantName: g.celebrant_name,
            status: g.status,
            createdAt: g.created_at,
          }))
          setGateways(transformedGateways)
        }

        // Load pending sales from API
        const salesResponse = await vendorSalesApi.getPending()
        if (salesResponse.success && salesResponse.data?.sales) {
          // Transform API sales to match component format
          const transformedSales = salesResponse.data.sales.map((s: any) => ({
            id: s.id,
            gatewayId: s.gateway_id,
            eventName: s.gateways?.event_name || s.eventName,
            guestName: s.guest_name,
            guestPhone: s.guest_phone,
            amount: s.amount,
            timestamp: s.created_at,
            status: s.status,
            noteIssued: s.status === 'notes_issued',
            celebrantUniqueId: s.gateways?.celebrant_unique_id || s.celebrantUniqueId,
            source: s.transfers?.source || 'manual_sale',
          }))
          setPendingTransfers(transformedSales.filter((s: any) => s.status === 'pending' || s.status === 'confirmed'))
          setCompletedTransfers(transformedSales.filter((s: any) => s.status === 'notes_issued'))
        }
      } catch (error) {
        console.error('Failed to load data from API:', error)
        // Show error message instead of falling back to localStorage
        alert('Failed to load data. Please check your connection and try again.')
      }
    }

    loadData()
    
    // Poll for updates every 5 seconds
    const interval = setInterval(loadData, 5000)

    return () => {
      clearInterval(interval)
    }
  }, [])

  // Note: Transfers are now managed via API, no need to save to localStorage

  const handleSellBU = () => {
    if (!selectedGateway || !sellForm.guestName || !sellForm.amount) {
      alert('Please fill in all required fields')
      return
    }

    const amount = Number(sellForm.amount)
    if (isNaN(amount) || amount <= 0) {
      alert('Please enter a valid amount')
      return
    }

    const gateway = gateways.find(g => g.id === selectedGateway)
    if (!gateway) {
      alert('Please select a gateway')
      return
    }

    // TODO: Implement manual sale API endpoint
    // For now, show message that feature needs API integration
    alert('Manual sale feature requires API integration. Please use QR scan for now.')
    
    // Future implementation (when API endpoint is ready):
    // try {
    //   const { transferApi } = await import('@/lib/api-client')
    //   const response = await transferApi.createManualSale({
    //     gateway_id: gateway.id,
    //     guest_name: sellForm.guestName,
    //     guest_phone: sellForm.guestPhone,
    //     amount: amount,
    //     pin: pin, // Would need PIN verification
    //   })
    //
    //   if (response.success) {
    //     // Reload data to get updated transfers
    //     const salesResponse = await vendorSalesApi.getPending()
    //     if (salesResponse.success && salesResponse.data?.sales) {
    //       const transformedSales = salesResponse.data.sales.map((s: any) => ({
    //         id: s.id,
    //         gatewayId: s.gateway_id,
    //         eventName: s.gateways?.event_name || s.eventName,
    //         guestName: s.guest_name,
    //         guestPhone: s.guest_phone,
    //         amount: s.amount,
    //         timestamp: s.created_at,
    //         status: s.status,
    //         noteIssued: s.status === 'notes_issued',
    //         celebrantUniqueId: s.gateways?.celebrant_unique_id || s.celebrantUniqueId,
    //         source: s.transfers?.source || 'manual_sale',
    //       }))
    //       setPendingTransfers(transformedSales.filter((s: any) => s.status === 'pending' || s.status === 'confirmed'))
    //     }
    //     
    //     setSellForm({ guestName: '', guestPhone: '', amount: '' })
    //     setSelectedGateway('')
    //     alert('BU Note sale recorded! Please confirm the transfer before issuing physical notes.')
    //   } else {
    //     alert(response.error || 'Failed to record sale. Please try again.')
    //   }
    // } catch (error: any) {
    //   console.error('Failed to create transfer:', error)
    //   alert('Failed to record sale. Please try again.')
    // }
  }

  const handleConfirmTransfer = async (transferId: string) => {
    try {
      const response = await vendorSalesApi.confirm(transferId)
      if (response.success) {
        // Reload data to get updated status
        const salesResponse = await vendorSalesApi.getPending()
        if (salesResponse.success && salesResponse.data?.sales) {
          const transformedSales = salesResponse.data.sales.map((s: any) => ({
            id: s.id,
            gatewayId: s.gateway_id,
            eventName: s.gateways?.event_name || s.eventName,
            guestName: s.guest_name,
            guestPhone: s.guest_phone,
            amount: s.amount,
            timestamp: s.created_at,
            status: s.status,
            noteIssued: s.status === 'notes_issued',
            celebrantUniqueId: s.gateways?.celebrant_unique_id || s.celebrantUniqueId,
            source: s.transfers?.source || 'manual_sale',
          }))
          setPendingTransfers(transformedSales.filter((s: any) => s.status === 'pending' || s.status === 'confirmed'))
        }
      } else {
        alert(response.error || 'Failed to confirm transfer')
      }
    } catch (error: any) {
      console.error('Confirm transfer error:', error)
      alert(error.message || 'Failed to confirm transfer')
    }
  }

  const handleIssueNotes = async (transferId: string) => {
    try {
      const response = await vendorSalesApi.issueNotes(transferId)
      if (response.success) {
        // Reload data to get updated status
        const salesResponse = await vendorSalesApi.getPending()
        if (salesResponse.success && salesResponse.data?.sales) {
          const transformedSales = salesResponse.data.sales.map((s: any) => ({
            id: s.id,
            gatewayId: s.gateway_id,
            eventName: s.gateways?.event_name || s.eventName,
            guestName: s.guest_name,
            guestPhone: s.guest_phone,
            amount: s.amount,
            timestamp: s.created_at,
            status: s.status,
            noteIssued: s.status === 'notes_issued',
            celebrantUniqueId: s.gateways?.celebrant_unique_id || s.celebrantUniqueId,
            source: s.transfers?.source || 'manual_sale',
          }))
          setPendingTransfers(transformedSales.filter((s: any) => s.status === 'pending' || s.status === 'confirmed'))
          setCompletedTransfers(transformedSales.filter((s: any) => s.status === 'notes_issued'))
        }
      } else {
        alert(response.error || 'Failed to issue notes')
      }
    } catch (error: any) {
      console.error('Issue notes error:', error)
      alert(error.message || 'Failed to issue notes')
    }
  }

  const filteredPending = selectedGateway === 'all'
    ? pendingTransfers
    : selectedGateway
    ? pendingTransfers.filter((t) => t.gatewayId === selectedGateway)
    : pendingTransfers

  return (
    <div className="space-y-6 pb-24 pt-4">
      {/* Info Card */}
      <Card className="border-primary/20 bg-gradient-to-br from-primary/10 to-primary/5 p-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
              <div>
            <h3 className="font-semibold">Note Issuance System</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Confirm ɃU transfers from guests, then issue physical Bison Notes. All ɃU goes directly to the celebrant's wallet. Notes are ceremonial tokens with zero monetary value.
                </p>
              </div>
              </div>
            </Card>

      {/* Mode Tabs */}
      <div className="flex gap-2">
        <Button
          onClick={() => setMode('sell')}
          variant={mode === 'sell' ? 'default' : 'outline'}
          className="flex-1"
        >
          Sell BU Note
        </Button>
        <Button
          onClick={() => setMode('pending')}
          variant={mode === 'pending' ? 'default' : 'outline'}
          className="flex-1"
        >
          Pending ({pendingTransfers.length})
        </Button>
        <Button
          onClick={() => setMode('history')}
          variant={mode === 'history' ? 'default' : 'outline'}
          className="flex-1"
        >
          History
        </Button>
      </div>

      {mode === 'sell' && (
        <>
          {gateways.length === 0 ? (
            <Card className="border-yellow-400/30 bg-yellow-400/10 p-6 text-center">
              <AlertCircle className="h-8 w-8 text-yellow-400 mx-auto mb-3" />
              <h3 className="font-semibold mb-2">No Gateways Available</h3>
              <p className="text-sm text-muted-foreground mb-4">
                You need to create a payment gateway first to sell BU notes.
              </p>
              <Button
                onClick={() => onNavigate?.('vendor-gateway-setup')}
                className="bg-primary text-primary-foreground hover:bg-primary/90"
              >
                Create Gateway
              </Button>
            </Card>
          ) : (
            <Card className="border-primary/20 bg-card p-6">
              <h3 className="font-semibold mb-4">Sell Physical BU Note</h3>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-semibold mb-2 block">Select Gateway/Event *</label>
                  <select
                    value={selectedGateway}
                    onChange={(e) => setSelectedGateway(e.target.value)}
                    className="w-full rounded-lg border border-border bg-secondary px-3 py-2 text-foreground"
                  >
                    <option value="">Select a gateway...</option>
                    {gateways.filter(g => g.status === 'active').map((gateway) => (
                      <option key={gateway.id} value={gateway.id}>
                        {gateway.eventName} - {gateway.celebrantName}
                      </option>
                    ))}
                  </select>
                </div>

                {selectedGateway && (
                  <>
                    <div>
                      <label className="text-sm font-semibold mb-2 block">Guest Name *</label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-primary" />
                        <Input
                          type="text"
                          placeholder="Enter guest name"
                          value={sellForm.guestName}
                          onChange={(e) => setSellForm({ ...sellForm, guestName: e.target.value })}
                          className="bg-secondary pl-10 text-foreground placeholder:text-muted-foreground"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-sm font-semibold mb-2 block">Guest Phone (Optional)</label>
                      <Input
                        type="tel"
                        placeholder="+2348012345678"
                        value={sellForm.guestPhone}
                        onChange={(e) => setSellForm({ ...sellForm, guestPhone: e.target.value })}
                        className="bg-secondary text-foreground placeholder:text-muted-foreground"
                      />
                    </div>

                    <div>
                      <label className="text-sm font-semibold mb-2 block">BU Amount *</label>
                      <div className="relative">
                        <DollarSign className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-primary" />
                        <Input
                          type="number"
                          placeholder="Enter amount in ɃU"
                          value={sellForm.amount}
                          onChange={(e) => setSellForm({ ...sellForm, amount: e.target.value })}
                          className="bg-secondary pl-10 text-foreground placeholder:text-muted-foreground"
                        />
                      </div>
                    </div>

                    <Button
                      onClick={handleSellBU}
                      className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
                    >
                      Record Sale
                    </Button>
                  </>
                )}
              </div>
            </Card>
          )}
        </>
      )}

      {mode === 'pending' && (
        <>
          {/* Gateway Filter */}
          {gateways.length > 0 && (
            <div>
              <label className="text-sm font-semibold mb-2 block">Filter by Gateway</label>
              <select
                value={selectedGateway}
                onChange={(e) => setSelectedGateway(e.target.value)}
                className="w-full rounded-lg border border-border bg-secondary px-3 py-2 text-foreground"
              >
                <option value="all">All Gateways</option>
                {gateways.map((gateway) => (
                  <option key={gateway.id} value={gateway.id}>
                    {gateway.eventName}
                  </option>
                ))}
              </select>
            </div>
          )}

          <h3 className="font-semibold">Pending ɃU Transfers</h3>

          {filteredPending.length === 0 ? (
            <Card className="border-border/50 bg-card/50 p-8 text-center">
              <p className="text-muted-foreground">No pending transfers</p>
              <p className="text-xs text-muted-foreground mt-2">
                Transfers from guests scanning gateway QR codes will appear here
              </p>
            </Card>
          ) : (
            <div className="space-y-3">
              {filteredPending.map((transfer) => (
                <Card
                  key={transfer.id}
                  className={`p-4 ${
                    (transfer as any).source === 'gateway_qr_scan'
                      ? 'border-blue-400/30 bg-blue-400/10'
                      : 'border-yellow-400/30 bg-yellow-400/10'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold">{transfer.eventName}</h4>
                        {(transfer as any).source === 'gateway_qr_scan' && (
                          <span className="inline-block rounded-full bg-blue-400/20 px-2 py-0.5 text-xs text-blue-400">
                            QR Scan
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        Guest: {transfer.guestName}
                        {transfer.guestPhone && ` (${transfer.guestPhone})`}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {transfer.timestamp}
                      </p>
                      {(transfer as any).source === 'gateway_qr_scan' && (
                        <p className="text-xs text-blue-400 mt-1">
                          ✓ BU already sent to celebrant wallet
                        </p>
                      )}
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

                  <div className="mt-4 flex gap-2">
                    {transfer.status === 'pending' && (
                      <>
                      <Button
                          onClick={() => handleConfirmTransfer(transfer.id)}
                          className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
                      >
                          Confirm Transfer
                      </Button>
                      <Button
                          onClick={() => handleIssueNotes(transfer.id)}
                          variant="outline"
                          className="flex-1"
                          disabled
                      >
                          Issue Notes
                      </Button>
                      </>
                    )}
                    {transfer.status === 'confirmed' && (
                      <Button
                        onClick={() => handleIssueNotes(transfer.id)}
                        className="w-full bg-green-400 text-white hover:bg-green-400/90"
                      >
                        Issue Physical Notes
                      </Button>
                    )}
                  </div>
                </Card>
                ))}
              </div>
          )}
        </>
      )}

      {mode === 'history' && (
        <>
          <h3 className="font-semibold">Completed Note Issuances</h3>

          {completedTransfers.length === 0 ? (
            <Card className="border-border/50 bg-card/50 p-8 text-center">
              <p className="text-muted-foreground">No completed issuances yet</p>
            </Card>
          ) : (
            <div className="space-y-3">
              {completedTransfers.map((transfer) => (
                <Card
                  key={transfer.id}
                  className="border-green-400/30 bg-green-400/10 p-4"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-400" />
                        <h4 className="font-semibold">{transfer.eventName}</h4>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        Guest: {transfer.guestName}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {transfer.timestamp}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-primary">
                        Ƀ {transfer.amount.toLocaleString()}
                      </p>
                      <span className="inline-block rounded-full bg-green-400/20 px-2 py-1 text-xs text-green-400 mt-1">
                        Notes Issued
                      </span>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}
