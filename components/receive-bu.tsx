'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { QrCode, Download, Share2, Copy, CheckCircle } from 'lucide-react'
import { transferApi, userApi } from '@/lib/api-client'
import { ReceiptModal } from '@/components/receipt-modal'
import BULoading from '@/components/bu-loading'

interface ReceivedTransfer {
  id: string
  senderUsername: string
  senderName: string
  amount: number
  type: 'transfer' | 'tip'
  message?: string
  date: string
}

export default function ReceiveBU() {
  const [mode, setMode] = useState<'menu' | 'qr' | 'history'>('menu')
  const [qrValue, setQrValue] = useState('')
  const [userInfo, setUserInfo] = useState<{ id: string; name: string; phoneNumber: string } | null>(null)
  const [receivedTransfers, setReceivedTransfers] = useState<ReceivedTransfer[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedReceipt, setSelectedReceipt] = useState<any>(null)
  const [showReceipt, setShowReceipt] = useState(false)

  // Fetch user info and received transfers
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Get current user info
        const userResponse = await userApi.getMe()
        if (userResponse.success && userResponse.data?.user) {
          const user = userResponse.data.user
          setUserInfo({
            id: user.id,
            name: user.name,
            phoneNumber: user.phoneNumber,
          })
        }

        // Get received transfers (where user is receiver)
        const transfersResponse = await transferApi.list(50, 0)
        if (transfersResponse.success && transfersResponse.data?.transfers) {
          const received = transfersResponse.data.transfers
            .filter((t: any) => t.receiver_id && t.sender) // Only transfers where user is receiver
            .map((t: any) => ({
              id: t.id,
              senderUsername: t.sender?.phone_number || 'User',
              senderName: t.sender ? `${t.sender.first_name} ${t.sender.last_name}` : 'User',
              amount: parseFloat(t.amount?.toString() || '0'),
              type: t.type === 'tip' ? 'tip' : 'transfer',
              message: t.message || undefined,
              date: new Date(t.created_at).toLocaleDateString(),
            }))
          setReceivedTransfers(received)
        }
      } catch (error) {
        console.error('Failed to fetch receive data:', error)
        // No fallback - user must be authenticated via API
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  // Generate QR code value for receiving ɃU
  useEffect(() => {
    if (mode === 'qr' && userInfo) {
      // Generate QR code with user ID for receiving BU
      const qrData = {
        type: 'receive_bu',
        userId: userInfo.id,
        username: userInfo.phoneNumber,
        name: userInfo.name,
      }
      setQrValue(JSON.stringify(qrData))
    }
  }, [mode, userInfo])

  const handleCopyQR = () => {
    if (qrValue) {
      navigator.clipboard.writeText(qrValue)
      alert('QR code data copied!')
    }
  }

  return (
    <div className="space-y-6 pb-24 pt-4">
      {mode === 'menu' && (
        <>
          <div className="px-4">
            <h2 className="text-xl font-bold mb-4">Receive ɃU</h2>
            <p className="text-sm text-muted-foreground mb-4">
              Receive ɃU from other users or accept tips instantly via QR code scan
            </p>

            {/* Receive Options */}
            <div className="space-y-3 mb-6">
              <Card
                onClick={() => setMode('qr')}
                className="border-primary/20 cursor-pointer bg-gradient-to-br from-primary/10 to-primary/5 p-6 transition-all hover:border-primary/60 hover:shadow-lg"
              >
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/20">
                    <QrCode className="h-6 w-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold">Show QR Code</h3>
                    <p className="mt-2 text-sm text-muted-foreground">
                      Display your QR code for instant tips and transfers. Others can scan to send ɃU directly to your wallet.
                    </p>
                  </div>
                </div>
              </Card>

              <Card className="border-border/50 bg-card/50 p-6">
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/20">
                    <span className="text-2xl">💳</span>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold">Your Username</h3>
                    <p className="mt-2 text-sm font-mono text-primary">
                      {userInfo?.phoneNumber || 'Loading...'}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Share your phone number for others to send ɃU directly
                    </p>
                  </div>
                </div>
              </Card>
            </div>

            {/* Recent Receipts */}
            {receivedTransfers.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold">Recent Receipts</h3>
                  <Button
                    onClick={() => setMode('history')}
                    variant="outline"
                    size="sm"
                  >
                    View All
                  </Button>
                </div>
                <div className="space-y-2">
                  {receivedTransfers.slice(0, 3).map((transfer) => (
                    <Card
                      key={transfer.id}
                      className="border-border/50 bg-card/50 p-3 cursor-pointer hover:bg-card/80 transition"
                      onClick={async () => {
                        try {
                          const response = await transferApi.get(transfer.id)
                          if (response.success && response.data?.transfer) {
                            const t = response.data.transfer
                            setSelectedReceipt({
                              id: t.id,
                              type: 'received',
                              amount: parseFloat(t.amount?.toString() || '0'),
                              senderName: t.sender ? `${t.sender.first_name} ${t.sender.last_name}` : 'User',
                              senderPhone: t.sender?.phone_number || '',
                              receiverName: t.receiver ? `${t.receiver.first_name} ${t.receiver.last_name}` : 'User',
                              receiverPhone: t.receiver?.phone_number || '',
                              message: t.message || undefined,
                              date: new Date(t.created_at).toLocaleDateString('en-US', { 
                                year: 'numeric', 
                                month: 'long', 
                                day: 'numeric' 
                              }),
                              time: new Date(t.created_at).toLocaleTimeString('en-US', {
                                hour: '2-digit',
                                minute: '2-digit'
                              }),
                              status: t.status || 'completed',
                            })
                            setShowReceipt(true)
                          }
                        } catch (error) {
                          console.error('Failed to fetch transfer:', error)
                        }
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <p className="font-medium">{transfer.senderName}</p>
                            {transfer.type === 'tip' && (
                              <span className="rounded-full bg-yellow-400/20 px-2 py-1 text-xs text-yellow-400">
                                Tip
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground">{transfer.senderUsername}</p>
                          {transfer.message && (
                            <p className="text-xs text-muted-foreground mt-1">"{transfer.message}"</p>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-primary">+Ƀ {transfer.amount.toLocaleString()}</p>
                          <p className="text-xs text-muted-foreground">{transfer.date}</p>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {mode === 'qr' && (
        <>
          <div className="px-4">
            <div className="mb-4">
              <Button
                onClick={() => setMode('menu')}
                variant="outline"
                className="w-full"
              >
                ← Back
              </Button>
            </div>

            <h2 className="text-xl font-bold mb-4">Your Receive QR Code</h2>
            <p className="text-sm text-muted-foreground mb-4">
              Show this QR code to receive ɃU instantly. Perfect for tips and gifts - no cash needed!
            </p>

            {/* QR Code Display */}
            <Card className="border-primary/20 bg-card p-6 mb-4">
              <div className="flex flex-col items-center">
                <div className="mb-4 rounded-lg border-4 border-primary/20 bg-white p-6">
                  {qrValue ? (
                    <div className="flex h-64 w-64 items-center justify-center bg-white">
                      {/* QR Code - Using external service for now */}
                      <img
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=256x256&data=${encodeURIComponent(qrValue)}`}
                        alt="Receive BU QR Code"
                        className="w-full h-full"
                      />
                    </div>
                  ) : (
                    <div className="flex h-64 w-64 items-center justify-center bg-white">
                      <BULoading />
                    </div>
                  )}
                </div>
                <p className="text-sm font-semibold mb-2">{userInfo?.name || 'User'}</p>
                <p className="text-xs text-muted-foreground mb-1">{userInfo?.phoneNumber || 'Loading...'}</p>
                <p className="text-xs text-muted-foreground mb-4">
                  Scan to send ɃU instantly
                </p>

                {/* QR Actions */}
                <div className="flex gap-2 w-full">
                  <Button
                    onClick={handleCopyQR}
                    variant="outline"
                    className="flex-1"
                  >
                    <Copy className="mr-2 h-4 w-4" />
                    Copy
                  </Button>
                  <Button
                    onClick={() => {
                      // Share functionality
                      if (navigator.share) {
                        navigator.share({
                          title: 'Receive ɃU',
                          text: 'Scan my QR code to send me ɃU',
                        })
                      }
                    }}
                    variant="outline"
                    className="flex-1"
                  >
                    <Share2 className="mr-2 h-4 w-4" />
                    Share
                  </Button>
                </div>
              </div>
            </Card>

            {/* Info Card */}
            <Card className="border-primary/20 bg-primary/5 p-4">
              <div className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                <div className="text-sm text-muted-foreground">
                  <p className="font-semibold mb-1">How it works:</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Show your QR code to the sender</li>
                    <li>They scan and enter the amount</li>
                    <li>ɃU is transferred instantly to your wallet</li>
                    <li>Perfect for tips, gifts, and donations</li>
                  </ul>
                </div>
              </div>
            </Card>
          </div>
        </>
      )}

      {mode === 'history' && (
        <>
          <div className="px-4">
            <div className="mb-4">
              <Button
                onClick={() => setMode('menu')}
                variant="outline"
                className="w-full"
              >
                ← Back
              </Button>
            </div>

            <h2 className="text-xl font-bold mb-4">Receive History</h2>

            <div className="space-y-3">
              {receivedTransfers.length === 0 ? (
                <Card className="border-border/50 bg-card/50 p-8 text-center">
                  <p className="text-muted-foreground">No receipts yet</p>
                </Card>
              ) : (
                receivedTransfers.map((transfer) => (
                  <Card
                    key={transfer.id}
                    className="border-border/50 bg-card/50 p-4 cursor-pointer hover:bg-card/80 transition"
                    onClick={async () => {
                      try {
                        const response = await transferApi.get(transfer.id)
                        if (response.success && response.data?.transfer) {
                          const t = response.data.transfer
                          setSelectedReceipt({
                            id: t.id,
                            type: 'received',
                            amount: parseFloat(t.amount?.toString() || '0'),
                            senderName: t.sender ? `${t.sender.first_name} ${t.sender.last_name}` : 'User',
                            senderPhone: t.sender?.phone_number || '',
                            receiverName: t.receiver ? `${t.receiver.first_name} ${t.receiver.last_name}` : 'User',
                            receiverPhone: t.receiver?.phone_number || '',
                            message: t.message || undefined,
                            date: new Date(t.created_at).toLocaleDateString('en-US', { 
                              year: 'numeric', 
                              month: 'long', 
                              day: 'numeric' 
                            }),
                            time: new Date(t.created_at).toLocaleTimeString('en-US', {
                              hour: '2-digit',
                              minute: '2-digit'
                            }),
                            status: t.status || 'completed',
                          })
                          setShowReceipt(true)
                        }
                      } catch (error) {
                        console.error('Failed to fetch transfer:', error)
                      }
                    }}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">{transfer.senderName}</h3>
                          {transfer.type === 'tip' && (
                            <span className="rounded-full bg-yellow-400/20 px-2 py-1 text-xs text-yellow-400">
                              Tip
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">{transfer.senderUsername}</p>
                        {transfer.message && (
                          <p className="mt-1 text-sm text-muted-foreground">
                            "{transfer.message}"
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground mt-2">{transfer.date}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-primary">
                          +Ƀ {transfer.amount.toLocaleString()}
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

      {/* Receipt Modal */}
      <ReceiptModal
        open={showReceipt}
        onOpenChange={setShowReceipt}
        receipt={selectedReceipt}
      />
    </div>
  )
}
