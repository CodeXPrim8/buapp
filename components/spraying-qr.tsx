'use client'

import { useState, useRef, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { QrCode, CheckCircle, Calendar, MapPin, User, AlertCircle } from 'lucide-react'
import PinVerification from '@/components/pin-verification'
import { createNotification } from '@/components/notifications'
import { transferApi, userApi } from '@/lib/api-client'

interface EventDetails {
  eventId: string
  eventName: string
  celebrantName: string
  celebrantWalletId: string
  eventDate: string
  location?: string
  vendorName: string
  gatewayId?: string // Optional gateway ID if scanned from gateway QR
}

interface BUTransfer {
  id: string
  eventId: string
  eventName: string
  celebrantName: string
  amount: number
  message: string
  date: string
  status: 'completed' | 'pending'
}

export default function SprayingQR() {
  const [mode, setMode] = useState<'scan' | 'details' | 'send-bu' | 'confirmation'>('scan')
  const [scannedData, setScannedData] = useState<string>('')
  const [eventDetails, setEventDetails] = useState<EventDetails | null>(null)
  const [cameraActive, setCameraActive] = useState(false)
  const [cameraError, setCameraError] = useState('')
  const [cameraPermission, setCameraPermission] = useState<'unknown' | 'granted' | 'denied'>('unknown')
  const [transfers, setTransfers] = useState<BUTransfer[]>([])
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const detectorRef = useRef<any>(null)
  const scanningRef = useRef(false)

  const [sprayForm, setSprayForm] = useState({
    amount: '',
    message: '',
  })
  const [showPinVerification, setShowPinVerification] = useState(false)
  const [pendingTransfer, setPendingTransfer] = useState<BUTransfer | null>(null)

  const stopCamera = () => {
    scanningRef.current = false
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
    setCameraActive(false)
    setCameraError('')
  }

  useEffect(() => {
    return () => stopCamera()
  }, [])

  const scanLoop = async () => {
    if (!scanningRef.current || !videoRef.current || !detectorRef.current) return
    try {
      const detections = await detectorRef.current.detect(videoRef.current)
      if (detections?.length > 0) {
        const value = detections[0]?.rawValue ?? detections[0]?.data ?? ''
        if (value) {
          handleQRCodeScanned(String(value))
          stopCamera()
          return
        }
      }
    } catch {
      // ignore frame errors
    }
    if (scanningRef.current) {
      requestAnimationFrame(scanLoop)
    }
  }

  const startCamera = async () => {
    setCameraError('')
    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraError('Camera is not supported on this device. Use "Simulate Scan (Demo)" below.')
      return
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' } },
      })
      streamRef.current = stream
      setCameraPermission('granted')
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
      }
      setCameraActive(true)
      if ('BarcodeDetector' in window) {
        detectorRef.current = new (window as any).BarcodeDetector({ formats: ['qr_code'] })
        scanningRef.current = true
        requestAnimationFrame(scanLoop)
      } else {
        setCameraError('QR scanning not supported in this browser. Use "Simulate Scan (Demo)" or try another browser.')
      }
    } catch (err: any) {
      setCameraPermission('denied')
      setCameraError(err?.message || 'Could not access camera. Allow camera permission in settings or use "Simulate Scan (Demo)".')
    }
  }

  const simulateQRScan = async () => {
    // Try to load gateways from API first
    try {
      const { gatewayApi } = await import('@/lib/api-client')
      const response = await gatewayApi.list()
      
      if (response.success && response.data?.gateways && response.data.gateways.length > 0) {
        // Use first active gateway for demo (in production, this would be the actual scanned QR)
        const gateway = response.data.gateways.find((g: any) => g.status === 'active') || response.data.gateways[0]
        const gatewayQRData = {
          type: 'gateway',
          gatewayId: gateway.id,
          eventName: gateway.event_name,
          celebrantUniqueId: gateway.celebrant_unique_id,
          celebrantName: gateway.celebrant_name,
        }
        setScannedData(JSON.stringify(gatewayQRData))
        // Convert gateway data to event details format
        setEventDetails({
          eventId: gateway.id, // Use gateway ID as event ID
          eventName: gateway.event_name,
          celebrantName: gateway.celebrant_name,
          celebrantWalletId: gateway.celebrant_unique_id,
          eventDate: gateway.event_date,
          location: gateway.event_location,
          vendorName: 'Vendor',
          gatewayId: gateway.id, // Store gateway ID
        })
        setMode('details')
        setCameraActive(false)
        return
      }
    } catch (error) {
      console.error('Failed to load gateways from API:', error)
    }

    // No gateways found - show error
    alert('No active gateway found. Please ensure a gateway is set up and active.')
    setMode('menu')
    setCameraActive(false)
  }

  // Handle actual QR scan (for production)
  const handleQRCodeScanned = async (qrData: string) => {
    try {
      const parsed = JSON.parse(qrData)
      
      if (parsed.type === 'gateway') {
        // Handle gateway QR code - fetch from API
        try {
          const { gatewayApi } = await import('@/lib/api-client')
          const response = await gatewayApi.list()
          
          if (response.success && response.data?.gateways) {
            const gateway = response.data.gateways.find((g: any) => g.id === parsed.gatewayId)
            
            if (gateway) {
              setScannedData(qrData)
              setEventDetails({
                eventId: gateway.id,
                eventName: gateway.event_name,
                celebrantName: gateway.celebrant_name,
                celebrantWalletId: gateway.celebrant_unique_id,
                eventDate: gateway.event_date,
                location: gateway.event_location,
                vendorName: 'Vendor',
                gatewayId: gateway.id,
              })
              setMode('details')
              setCameraActive(false)
            } else {
              alert('Gateway not found. Please check the QR code.')
            }
          } else {
            alert('Failed to load gateways. Please try again.')
          }
        } catch (error) {
          console.error('Failed to load gateways:', error)
          alert('Failed to load gateways. Please try again.')
        }
      } else {
        // Handle regular event QR code
        setScannedData(qrData)
        setEventDetails(parsed)
        setMode('details')
        setCameraActive(false)
      }
    } catch (error) {
      alert('Invalid QR code format')
    }
  }

  const handleSendBU = () => {
    if (eventDetails && sprayForm.amount && !isNaN(Number(sprayForm.amount)) && Number(sprayForm.amount) > 0) {
      const newTransfer: BUTransfer = {
        id: `TXN-${Date.now()}`,
        eventId: eventDetails.eventId,
        eventName: eventDetails.eventName,
        celebrantName: eventDetails.celebrantName,
        amount: Number(sprayForm.amount),
        message: sprayForm.message,
        date: new Date().toISOString().split('T')[0],
        status: 'completed',
      }

      // Show PIN verification before completing transfer
      setPendingTransfer(newTransfer)
      setShowPinVerification(true)
    }
  }

  const handlePinVerified = async (pin: string) => {
    if (!pendingTransfer || !eventDetails || !eventDetails.gatewayId) {
      alert('Missing transfer details')
      return
    }

    try {
      // Get current user from API
      const userResponse = await userApi.getMe()
      if (!userResponse.success || !userResponse.data?.user) {
        alert('Authentication required. Please login again.')
        return
      }
      const currentUser = userResponse.data.user
      
      // Call API to send BU via gateway QR
      const response = await transferApi.sendViaGatewayQR({
        gateway_id: eventDetails.gatewayId,
        amount: pendingTransfer.amount,
        message: pendingTransfer.message || undefined,
        guest_user_id: currentUser.id,
        guest_name: currentUser.name || 'Guest',
        guest_phone: currentUser.phoneNumber || '',
        pin: pin,
      })

      if (!response.success || !response.data?.transfer) {
        alert(response.error || 'Transfer failed. Please check your PIN and try again.')
        setShowPinVerification(false)
        setPendingTransfer(null)
        return
      }

      // Transfer successful - update local state
      const transfer = response.data.transfer
      setTransfers([{
        id: transfer.id,
        eventId: transfer.event_id || eventDetails.eventId,
        eventName: eventDetails.eventName,
        celebrantName: eventDetails.celebrantName,
        amount: transfer.amount,
        message: transfer.message || '',
        date: new Date(transfer.created_at).toISOString().split('T')[0],
        status: 'completed',
      }, ...transfers])

      // Update balance cache after successful transfer
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

      // Notifications are created by the API, but we can also create local ones for immediate UI feedback
      createNotification({
        type: 'transfer_sent',
        title: 'ɃU Sent',
        message: `You sent Ƀ ${pendingTransfer.amount.toLocaleString()} to ${eventDetails.eventName}`,
        amount: pendingTransfer.amount,
        toUser: eventDetails.celebrantName,
      })

      setSprayForm({ amount: '', message: '' })
      setPendingTransfer(null)
      setShowPinVerification(false)
      setMode('confirmation')
    } catch (error: any) {
      console.error('Transfer error:', error)
      alert(error.message || 'Transfer failed. Please try again.')
      setShowPinVerification(false)
      setPendingTransfer(null)
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
          }}
          title="Confirm ɃU Transfer"
          description="Enter your PIN to confirm sending ɃU to this event"
        />
      )}
      {mode === 'scan' && (
        <>
          <div className="px-4">
            <h2 className="text-xl font-bold mb-4">Scan Event QR Code</h2>
            <p className="text-sm text-muted-foreground mb-4">
              Scan the QR code provided by the vendor at the event to link to the celebration and send ɃU directly to the celebrant's wallet.
            </p>

            {/* QR Scanner Area */}
            <Card className="border-primary/20 bg-card p-6 mb-4">
              {!cameraActive ? (
                <div className="space-y-4">
                  <div className="flex justify-center">
                    <div className="rounded-lg bg-foreground/5 p-8 border-2 border-dashed border-primary/30">
                      <QrCode className="h-24 w-24 text-primary/50 mx-auto" />
                    </div>
                  </div>
                  <Button
                    onClick={startCamera}
                    className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
                  >
                    Start QR Scanner
                  </Button>
                  {cameraError && (
                    <p className="text-xs text-destructive text-center">{cameraError}</p>
                  )}
                  {cameraPermission === 'denied' && (
                    <p className="text-xs text-muted-foreground text-center">
                      Allow camera in your browser or device settings to scan QR codes.
                    </p>
                  )}
                  <Button
                    onClick={simulateQRScan}
                    variant="outline"
                    className="w-full"
                  >
                    Simulate Scan (Demo)
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="relative aspect-square overflow-hidden rounded-lg bg-black">
                    <video
                      ref={videoRef}
                      className="h-full w-full object-cover"
                      autoPlay
                      playsInline
                      muted
                    />
                    <div className="absolute inset-0 border-4 border-primary/50 pointer-events-none">
                      <div className="absolute inset-4 border border-dashed border-primary/30" />
                    </div>
                    <p className="absolute bottom-4 left-1/2 -translate-x-1/2 text-xs text-white bg-black/50 px-2 py-1 rounded">
                      Point camera at event QR code
                    </p>
                  </div>
                  <Button
                    onClick={stopCamera}
                    variant="outline"
                    className="w-full"
                  >
                    Stop camera
                  </Button>
                  <Button
                    onClick={() => {
                      stopCamera()
                      simulateQRScan()
                    }}
                    variant="ghost"
                    className="w-full text-sm text-muted-foreground"
                  >
                    Use demo scan instead
                  </Button>
                </div>
              )}
            </Card>
          </div>
        </>
      )}

      {mode === 'details' && eventDetails && (
        <>
          <div className="px-4">
            <div className="mb-4">
              <Button
                onClick={() => {
                  setMode('scan')
                  setEventDetails(null)
                  setScannedData('')
                }}
                variant="outline"
                className="w-full"
              >
                ← Scan Different QR
              </Button>
            </div>

            <Card className="border-green-400/30 bg-green-400/10 p-4 mb-4">
              <div className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-green-400 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-green-400 mb-1">QR Code Scanned Successfully!</h3>
                  <p className="text-sm text-muted-foreground">
                    Event details loaded. You can now send ɃU to the celebrant.
                  </p>
                </div>
              </div>
            </Card>

            {/* Event Details */}
            <Card className="border-primary/20 bg-card p-6 mb-4">
              <h3 className="font-semibold mb-4">Event Details</h3>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <Calendar className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground">Event Name</p>
                    <p className="font-semibold">{eventDetails.eventName}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <User className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground">Celebrant</p>
                    <p className="font-semibold">{eventDetails.celebrantName}</p>
                  </div>
                </div>
                {eventDetails.location && (
                  <div className="flex items-start gap-3">
                    <MapPin className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm text-muted-foreground">Location</p>
                      <p className="font-semibold">{eventDetails.location}</p>
                    </div>
                  </div>
                )}
                <div className="flex items-start gap-3">
                  <Calendar className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground">Date</p>
                    <p className="font-semibold">{eventDetails.eventDate}</p>
                  </div>
                </div>
              </div>
            </Card>

            {/* ɃU Transfer Form */}
            <Card className="border-primary/20 space-y-4 bg-card p-6">
              <h3 className="font-semibold">Send ɃU to Celebrant</h3>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-semibold">Amount (Ƀ)</label>
                  <Input
                    type="number"
                    placeholder="Enter ɃU amount"
                    value={sprayForm.amount}
                    onChange={(e) =>
                      setSprayForm({ ...sprayForm, amount: e.target.value })
                    }
                    className="mt-2 bg-secondary text-foreground placeholder:text-muted-foreground"
                  />
                  {sprayForm.amount && !isNaN(Number(sprayForm.amount)) && (
                    <p className="mt-1 text-xs text-muted-foreground">
                      Equivalent: ₦{Number(sprayForm.amount).toLocaleString()}
                    </p>
                  )}
                </div>

                <div>
                  <label className="text-sm font-semibold">Message (Optional)</label>
                  <Input
                    placeholder="Add a congratulatory message"
                    value={sprayForm.message}
                    onChange={(e) =>
                      setSprayForm({ ...sprayForm, message: e.target.value })
                    }
                    className="mt-2 bg-secondary text-foreground placeholder:text-muted-foreground"
                  />
                </div>

                <div className="rounded-lg border border-primary/20 bg-primary/5 p-3">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-muted-foreground">
                      ɃU will be transferred directly to {eventDetails.celebrantName}'s wallet. After confirmation, visit the vendor to receive your physical Bison Notes for ceremonial spraying. These notes have zero monetary value.
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

      {mode === 'confirmation' && transfers.length > 0 && (
        <>
          <div className="px-4">
            <Card className="border-green-400/30 bg-green-400/10 p-6 mb-4">
              <div className="flex items-start gap-3">
                <CheckCircle className="h-6 w-6 text-green-400 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h3 className="font-semibold text-green-400 mb-2">ɃU Transfer Successful!</h3>
                  <p className="text-sm text-muted-foreground">
                    Your ɃU has been transferred directly to the celebrant's wallet. Visit the vendor at the event to receive your physical Bison Notes for ceremonial spraying.
                  </p>
                </div>
              </div>
            </Card>

            <Card className="border-primary/20 bg-card p-4 mb-4">
              <h4 className="font-semibold mb-3">Transfer Details</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Event:</span>
                  <span className="font-semibold">{transfers[0].eventName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Celebrant:</span>
                  <span className="font-semibold">{transfers[0].celebrantName}</span>
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

            <Button
              onClick={() => {
                setMode('scan')
                setEventDetails(null)
                setScannedData('')
                setSprayForm({ amount: '', message: '' })
              }}
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
            >
              Scan Another QR Code
            </Button>
          </div>
        </>
      )}
    </div>
  )
}
