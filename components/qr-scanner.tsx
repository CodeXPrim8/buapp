'use client'

import { useState, useRef, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CheckCircle, XCircle, AlertCircle, Ticket } from 'lucide-react'
import { invitesApi, transferApi, userApi } from '@/lib/api-client'

interface TransferValidation {
  id: string
  transferId: string
  eventId: string
  eventName: string
  guestName: string
  amount: number
  status: 'valid' | 'invalid' | 'duplicate' | 'not_found'
  timestamp: string
  message: string
}

interface InviteValidation {
  id: string
  inviteId: string
  eventId: string
  eventName: string
  guestName: string
  guestPhone: string
  gate?: string
  seat?: string
  seatCategory?: string
  status: 'valid' | 'invalid' | 'not_found' | 'not_accepted' | 'unauthorized'
  timestamp: string
  message: string
}

interface QRScannerProps {
  mode?: 'user' | 'vendor' | 'celebrant'
}

export default function QRScanner({ mode: userMode = 'user' }: QRScannerProps) {
  const [mode, setMode] = useState<'menu' | 'scanning' | 'history' | 'invite-scanning'>('menu')
  const [scanType, setScanType] = useState<'transfer' | 'invite'>('transfer')
  const [cameraActive, setCameraActive] = useState(false)
  const [validations, setValidations] = useState<(TransferValidation | InviteValidation)[]>([])
  const [manualInput, setManualInput] = useState('')
  const [scanResult, setScanResult] = useState<TransferValidation | InviteValidation | null>(null)
  const [isVendor, setIsVendor] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    // Check if user is vendor via API
    const checkVendorStatus = async () => {
      try {
        const userResponse = await userApi.getMe()
        if (userResponse.success && userResponse.data?.user) {
          const role = userResponse.data.user.role
          setIsVendor(role === 'vendor' || role === 'both')
        }
      } catch (e) {
        console.error('Failed to check vendor status:', e)
      }
    }
    checkVendorStatus()
  }, [])

  const startCamera = () => {
    setCameraActive(true)
    // Simulated camera activation
  }

  const stopCamera = () => {
    setCameraActive(false)
  }

  const validateTransfer = async (transferId: string) => {
    // Validate transfer via API - fetch transfer details
    try {
      const response = await transferApi.list(100, 0)
      
      if (response.success && response.data?.transfers) {
        const transfer = response.data.transfers.find((t: any) => t.id === transferId)
        const isDuplicate = validations.some((v) => v.transferId === transferId && v.status === 'valid')

        if (!transfer) {
          const newValidation: TransferValidation = {
            id: String(validations.length + 1),
            transferId,
            eventId: 'EVT-XXX',
            eventName: 'Unknown Event',
            guestName: 'Unknown',
            amount: 0,
            status: 'not_found',
            timestamp: new Date().toLocaleString(),
            message: 'Transfer ID not found in system',
          }
          setScanResult(newValidation)
          setValidations([newValidation, ...validations])
          setManualInput('')
          return
        }

        if (isDuplicate) {
          const newValidation: TransferValidation = {
            id: String(validations.length + 1),
            transferId,
            eventId: transfer.event_id || 'EVT-XXX',
            eventName: transfer.event?.name || 'Unknown Event',
            guestName: transfer.sender?.first_name && transfer.sender?.last_name 
              ? `${transfer.sender.first_name} ${transfer.sender.last_name}`
              : 'Unknown',
            amount: parseFloat(transfer.amount?.toString() || '0'),
            status: 'duplicate',
            timestamp: new Date().toLocaleString(),
            message: 'Transfer already validated - Notes already issued',
          }
          setScanResult(newValidation)
          setValidations([newValidation, ...validations])
          setManualInput('')
          return
        }

        const newValidation: TransferValidation = {
          id: String(validations.length + 1),
          transferId,
          eventId: transfer.event_id || 'EVT-XXX',
          eventName: transfer.event?.name || 'Unknown Event',
          guestName: transfer.sender?.first_name && transfer.sender?.last_name 
            ? `${transfer.sender.first_name} ${transfer.sender.last_name}`
            : 'Unknown',
          amount: parseFloat(transfer.amount?.toString() || '0'),
          status: 'valid',
          timestamp: new Date().toLocaleString(),
          message: 'ɃU transfer confirmed - Valid for note issuance',
        }
        setScanResult(newValidation)
        setValidations([newValidation, ...validations])
        setManualInput('')
      } else {
        const newValidation: TransferValidation = {
          id: String(validations.length + 1),
          transferId,
          eventId: 'EVT-XXX',
          eventName: 'Unknown Event',
          guestName: 'Unknown',
          amount: 0,
          status: 'not_found',
          timestamp: new Date().toLocaleString(),
          message: response.error || 'Failed to fetch transfers',
        }
        setScanResult(newValidation)
        setValidations([newValidation, ...validations])
        setManualInput('')
      }
    } catch (error: any) {
      const newValidation: TransferValidation = {
        id: String(validations.length + 1),
        transferId,
        eventId: 'EVT-XXX',
        eventName: 'Unknown Event',
        guestName: 'Unknown',
        amount: 0,
        status: 'invalid',
        timestamp: new Date().toLocaleString(),
        message: error.message || 'Failed to validate transfer',
      }
      setScanResult(newValidation)
      setValidations([newValidation, ...validations])
      setManualInput('')
    }
  }

  const validateInvite = async (qrData: string) => {
    try {
      // Try to parse as JSON if it's a string
      let parsedData: any
      try {
        parsedData = typeof qrData === 'string' ? JSON.parse(qrData) : qrData
      } catch (e) {
        // If it's not JSON, treat as invite ID
        parsedData = { invite_id: qrData }
      }

      const response = await invitesApi.validate(parsedData)

      if (response.success && response.data?.valid) {
        const invite = response.data.invite
        const newValidation: InviteValidation = {
          id: String(validations.length + 1),
          inviteId: invite.id,
          eventId: invite.event_id || '',
          eventName: invite.event_name || 'Event',
          guestName: invite.guest_name || 'Guest',
          guestPhone: invite.guest_phone || '',
          gate: invite.gate,
          seat: invite.seat,
          seatCategory: invite.seat_category,
          status: 'valid',
          timestamp: new Date().toLocaleString(),
          message: response.data.message || 'Invite validated successfully. Guest can enter.',
        }
        setScanResult(newValidation)
        setValidations([newValidation, ...validations])
        setManualInput('')
      } else {
        const newValidation: InviteValidation = {
          id: String(validations.length + 1),
          inviteId: parsedData.invite_id || 'Unknown',
          eventId: parsedData.event_id || '',
          eventName: 'Unknown Event',
          guestName: 'Unknown',
          guestPhone: '',
          status: 'invalid',
          timestamp: new Date().toLocaleString(),
          message: response.error || 'Invalid invite QR code',
        }
        setScanResult(newValidation)
        setValidations([newValidation, ...validations])
        setManualInput('')
      }
    } catch (error: any) {
      const newValidation: InviteValidation = {
        id: String(validations.length + 1),
        inviteId: 'Unknown',
        eventId: '',
        eventName: 'Unknown Event',
        guestName: 'Unknown',
        guestPhone: '',
        status: 'invalid',
        timestamp: new Date().toLocaleString(),
        message: error.message || 'Failed to validate invite',
      }
      setScanResult(newValidation)
      setValidations([newValidation, ...validations])
      setManualInput('')
    }
  }

  const handleManualEntry = () => {
    if (manualInput.trim()) {
      if (scanType === 'invite') {
        validateInvite(manualInput.trim())
      } else {
        validateTransfer(manualInput.trim())
      }
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'valid':
        return <CheckCircle className="h-5 w-5 text-green-400" />
      case 'invalid':
      case 'duplicate':
      case 'not_found':
        return <XCircle className="h-5 w-5 text-red-400" />
      default:
        return null
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'valid':
        return 'bg-green-400/10 border-green-400/30'
      case 'invalid':
      case 'duplicate':
      case 'not_found':
        return 'bg-red-400/10 border-red-400/30'
      default:
        return 'bg-card'
    }
  }

  return (
    <div className="space-y-6 pb-24 pt-4">
      {/* Info Card */}
      <Card className="border-primary/20 bg-gradient-to-br from-primary/10 to-primary/5 p-4 mb-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold">
              {isVendor ? 'QR Code Validation' : 'ɃU Transfer Validation'}
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              {isVendor 
                ? 'Validate invite QR codes from guests for gate entry. Make sure your gateway is linked to the event.'
                : 'Validate ɃU transfer confirmations from guests. Physical Bison Notes cannot be scanned or redeemed - they are ceremonial tokens only.'}
            </p>
          </div>
        </div>
      </Card>

      {mode === 'menu' && (
        <>
          <h2 className="text-xl font-bold">
            {isVendor ? 'QR Code Validation' : 'Transfer Validation'}
          </h2>

          {isVendor && (
            <>
              <Card 
                className="border-primary/30 cursor-pointer bg-gradient-to-br from-primary/10 to-primary/5 p-6 transition-all hover:border-primary/60 hover:shadow-lg"
                onClick={() => {
                  setScanType('invite')
                  setMode('invite-scanning')
                  startCamera()
                }}
              >
                <div className="flex items-center gap-3">
                  <Ticket className="h-6 w-6 text-primary" />
                  <div>
                    <h3 className="text-lg font-semibold">Validate Invite</h3>
                    <p className="mt-2 text-sm text-muted-foreground">
                      Scan invite QR code to verify guest entry for events you're linked to
                    </p>
                  </div>
                </div>
              </Card>

              <Card className="border-primary/30 cursor-pointer bg-gradient-to-br from-primary/10 to-primary/5 p-6 transition-all hover:border-primary/60 hover:shadow-lg"
                onClick={() => {
                  setScanType('transfer')
                  setMode('scanning')
                  startCamera()
                }}
              >
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-6 w-6 text-primary" />
                  <div>
                    <h3 className="text-lg font-semibold">Validate Transfer</h3>
                    <p className="mt-2 text-sm text-muted-foreground">
                      Scan QR code or enter transfer ID to confirm ɃU transfer from guest
                    </p>
                  </div>
                </div>
              </Card>
            </>
          )}

          {!isVendor && (
            <Card className="border-primary/30 cursor-pointer bg-gradient-to-br from-primary/10 to-primary/5 p-6 transition-all hover:border-primary/60 hover:shadow-lg">
              <div
                onClick={() => {
                  setMode('scanning')
                  startCamera()
                }}
              >
                <h3 className="text-lg font-semibold">Validate Transfer</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Scan QR code or enter transfer ID to confirm ɃU transfer from guest
                </p>
              </div>
            </Card>
          )}

          <Card
            onClick={() => setMode('history')}
            className="border-primary/30 cursor-pointer bg-gradient-to-br from-primary/10 to-primary/5 p-6 transition-all hover:border-primary/60 hover:shadow-lg"
          >
            <h3 className="text-lg font-semibold">Validation History</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              View all validated {isVendor ? 'QR codes' : 'transfers'}
            </p>
          </Card>
        </>
      )}

      {(mode === 'scanning' || mode === 'invite-scanning') && (
        <>
          <div className="mb-4">
            <Button
              onClick={() => {
                setMode('menu')
                stopCamera()
                setScanResult(null)
              }}
              variant="outline"
              className="w-full"
            >
              ← Back
            </Button>
          </div>

          <h2 className="text-xl font-bold">
            {scanType === 'invite' ? 'Validate Invite' : 'Validate ɃU Transfer'}
          </h2>

          {/* Camera Preview */}
          {cameraActive && (
            <Card className="border-primary/20 bg-card p-4">
              <div className="relative aspect-square overflow-hidden rounded-lg bg-black">
                <video
                  ref={videoRef}
                  className="h-full w-full object-cover"
                  autoPlay
                  playsInline
                />
                <div className="absolute inset-0 border-4 border-primary/50">
                  <div className="absolute inset-4 border border-dashed border-primary/30" />
                </div>
                <p className="absolute bottom-4 left-1/2 -translate-x-1/2 text-xs text-white">
                  Point at {scanType === 'invite' ? 'invite' : 'transfer'} QR code
                </p>
              </div>
            </Card>
          )}

          {/* Manual Entry */}
          <div className="space-y-3">
            <p className="text-sm font-semibold text-muted-foreground">
              {scanType === 'invite' ? 'Enter QR code data manually' : 'Enter Transfer ID manually'}
            </p>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder={scanType === 'invite' ? 'Paste QR code JSON or invite ID' : 'Enter Transfer ID'}
                value={manualInput}
                onChange={(e) => setManualInput(e.target.value)}
                className="flex-1 rounded-lg border border-border bg-card px-3 py-2 text-foreground placeholder:text-muted-foreground"
              />
              <Button
                onClick={handleManualEntry}
                className="bg-primary text-primary-foreground hover:bg-primary/90"
              >
                Validate
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              {scanType === 'invite' 
                ? 'Paste the QR code data from the guest\'s invite QR code'
                : 'Enter the transfer ID from the guest\'s ɃU transfer confirmation'}
            </p>
          </div>

          {/* Validation Result */}
          {scanResult && (
            <Card
              className={`border ${getStatusColor(scanResult.status)} p-4`}
            >
              <div className="flex items-start gap-3">
                <div className="mt-0.5">{getStatusIcon(scanResult.status)}</div>
                <div className="flex-1">
                  <h3 className="font-semibold capitalize">
                    {scanResult.status === 'valid' 
                      ? (scanType === 'invite' ? 'Invite Validated' : 'Transfer Validated')
                      : 'Validation Failed'}
                  </h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {scanResult.message}
                  </p>
                  {scanResult.status === 'valid' && (
                    <div className="mt-3 space-y-1 rounded-lg bg-background/50 p-2 text-sm">
                      <p>
                        <span className="text-muted-foreground">Event:</span>{' '}
                        <span className="font-semibold">{scanResult.eventName}</span>
                      </p>
                      <p>
                        <span className="text-muted-foreground">Guest:</span>{' '}
                        <span className="font-semibold">{scanResult.guestName}</span>
                      </p>
                      {scanType === 'invite' && 'guestPhone' in scanResult && (
                        <p>
                          <span className="text-muted-foreground">Phone:</span>{' '}
                          <span className="font-semibold">{scanResult.guestPhone}</span>
                        </p>
                      )}
                      {scanType === 'invite' && 'gate' in scanResult && scanResult.gate && (
                        <p>
                          <span className="text-muted-foreground">Gate:</span>{' '}
                          <span className="font-semibold">{scanResult.gate}</span>
                        </p>
                      )}
                      {scanType === 'invite' && 'seat' in scanResult && scanResult.seat && (
                        <p>
                          <span className="text-muted-foreground">Seat:</span>{' '}
                          <span className="font-semibold">{scanResult.seat}</span>
                        </p>
                      )}
                      {scanType === 'invite' && 'seatCategory' in scanResult && scanResult.seatCategory && (
                        <p>
                          <span className="text-muted-foreground">Category:</span>{' '}
                          <span className="font-semibold">{scanResult.seatCategory}</span>
                        </p>
                      )}
                      {scanType === 'transfer' && 'amount' in scanResult && (
                        <p>
                          <span className="text-muted-foreground">Amount:</span>{' '}
                          <span className="font-bold text-primary">
                            Ƀ {scanResult.amount.toLocaleString()}
                          </span>
                        </p>
                      )}
                    </div>
                  )}
                  <p className="mt-2 text-xs text-muted-foreground">
                    {scanType === 'invite' && 'inviteId' in scanResult
                      ? `Invite ID: ${scanResult.inviteId} · ${scanResult.timestamp}`
                      : 'transferId' in scanResult
                      ? `Transfer ID: ${scanResult.transferId} · ${scanResult.timestamp}`
                      : scanResult.timestamp}
                  </p>
                </div>
              </div>
            </Card>
          )}
        </>
      )}

      {mode === 'history' && (
        <>
          <div className="mb-4">
            <Button
              onClick={() => setMode('menu')}
              variant="outline"
              className="w-full"
            >
              ← Back
            </Button>
          </div>

          <h2 className="text-xl font-bold">Validation History</h2>

          <div className="space-y-3">
            {validations.map((validation) => (
              <Card
                key={validation.id}
                className={`border ${getStatusColor(validation.status)} p-4`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(validation.status)}
                      <h3 className="font-semibold">{validation.transferId}</h3>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {validation.message}
                    </p>
                    {validation.status === 'valid' && (
                      <div className="mt-2 space-y-1 text-sm">
                        <p>
                          <span className="text-muted-foreground">Event:</span>{' '}
                          <span className="font-semibold">{validation.eventName}</span>
                        </p>
                        <p>
                          <span className="text-muted-foreground">Guest:</span>{' '}
                          <span className="font-semibold">{validation.guestName}</span>
                        </p>
                        {'gate' in validation && validation.gate && (
                          <p>
                            <span className="text-muted-foreground">Gate:</span>{' '}
                            <span className="font-semibold">{validation.gate}</span>
                          </p>
                        )}
                        {'seat' in validation && validation.seat && (
                          <p>
                            <span className="text-muted-foreground">Seat:</span>{' '}
                            <span className="font-semibold">{validation.seat}</span>
                          </p>
                        )}
                      </div>
                    )}
                    <p className="text-xs text-muted-foreground mt-2">{validation.timestamp}</p>
                  </div>
                  {validation.status === 'valid' && (
                    <div className="text-right">
                      {'amount' in validation && (
                        <p className="font-bold text-primary">
                          Ƀ {validation.amount.toLocaleString()}
                        </p>
                      )}
                      <span className="inline-block rounded-full bg-green-400/20 px-2 py-1 text-xs text-green-400 mt-1">
                        Valid
                      </span>
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
