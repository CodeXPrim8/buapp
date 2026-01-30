'use client'

import { useState, useRef } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Download, Share2, X, CheckCircle, ArrowDown, ArrowUp } from 'lucide-react'
import html2canvas from 'html2canvas'

interface TransferReceipt {
  id: string
  type: 'sent' | 'received'
  amount: number
  senderName: string
  senderPhone: string
  receiverName: string
  receiverPhone: string
  message?: string
  date: string
  time: string
  status: string
}

interface ReceiptModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  receipt: TransferReceipt | null
}

export function ReceiptModal({ open, onOpenChange, receipt }: ReceiptModalProps) {
  const receiptRef = useRef<HTMLDivElement>(null)
  const [downloading, setDownloading] = useState(false)

  if (!receipt) return null

  const handleDownload = async () => {
    if (!receiptRef.current) return

    try {
      setDownloading(true)
      const canvas = await html2canvas(receiptRef.current, {
        backgroundColor: '#ffffff',
        scale: 2,
      })
      
      const link = document.createElement('a')
      link.download = `BU-Receipt-${receipt.id}-${Date.now()}.png`
      link.href = canvas.toDataURL('image/png')
      link.click()
    } catch (error) {
      console.error('Failed to download receipt:', error)
      alert('Failed to download receipt. Please try again.')
    } finally {
      setDownloading(false)
    }
  }

  const handleShare = async () => {
    if (!receiptRef.current) return

    try {
      const canvas = await html2canvas(receiptRef.current, {
        backgroundColor: '#ffffff',
        scale: 2,
      })
      
      const blob = await new Promise<Blob>((resolve) => {
        canvas.toBlob((blob) => {
          if (blob) resolve(blob)
        }, 'image/png')
      })

      const file = new File([blob], `BU-Receipt-${receipt.id}.png`, { type: 'image/png' })

      if (navigator.share && navigator.canShare({ files: [file] })) {
        await navigator.share({
          title: 'BU Transfer Receipt',
          text: `Receipt for ${receipt.type === 'sent' ? 'sending' : 'receiving'} Ƀ${receipt.amount.toLocaleString()}`,
          files: [file],
        })
      } else {
        // Fallback: copy image to clipboard or download
        canvas.toBlob((blob) => {
          if (blob) {
            const item = new ClipboardItem({ 'image/png': blob })
            navigator.clipboard.write([item]).then(() => {
              alert('Receipt copied to clipboard!')
            }).catch(() => {
              handleDownload()
            })
          }
        })
      }
    } catch (error) {
      console.error('Failed to share receipt:', error)
      // Fallback to download
      handleDownload()
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Transfer Receipt</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Receipt Preview */}
          <div ref={receiptRef} className="bg-white p-6 rounded-lg border-2 border-primary/20">
            {/* Header */}
            <div className="text-center mb-6 pb-4 border-b-2 border-gray-300">
              <h2 className="text-2xl font-bold text-gray-900 mb-1">BU Transfer Receipt</h2>
              <p className="text-sm text-gray-500">Transaction Confirmation</p>
            </div>

            {/* Status Badges */}
            <div className="flex justify-center gap-2 mb-6">
              {receipt.status === 'completed' && (
                <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-green-500 text-white">
                  <CheckCircle className="h-4 w-4" />
                  <span className="text-sm font-bold uppercase">COMPLETED</span>
                </div>
              )}
              <div className={`flex items-center gap-2 px-4 py-2 rounded-full ${
                receipt.type === 'sent' 
                  ? 'bg-red-50 text-red-600 border border-red-200' 
                  : 'bg-green-50 text-green-600 border border-green-200'
              }`}>
                {receipt.type === 'sent' ? (
                  <ArrowUp className="h-4 w-4" />
                ) : (
                  <ArrowDown className="h-4 w-4" />
                )}
                <span className="text-sm font-semibold uppercase">{receipt.type === 'sent' ? 'Sent' : 'Received'}</span>
              </div>
            </div>

            {/* Amount - More Prominent */}
            <div className="text-center mb-8">
              <p className="text-sm font-medium text-gray-600 mb-2">Amount</p>
              <p className={`text-5xl font-bold mb-2 ${
                receipt.type === 'sent' ? 'text-red-600' : 'text-green-600'
              }`}>
                Ƀ {receipt.amount.toLocaleString()}
              </p>
              <p className="text-xl text-gray-500 font-medium">₦{receipt.amount.toLocaleString()}</p>
            </div>

            {/* Transaction Details - Better Organized */}
            <div className="space-y-4 mb-6">
              {/* Sender Section */}
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-xs font-semibold text-gray-500 uppercase mb-2">From</p>
                <p className="text-base font-bold text-gray-900 mb-1">{receipt.senderName}</p>
                <p className="text-sm font-mono text-gray-600">{receipt.senderPhone}</p>
              </div>

              {/* Receiver Section */}
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-xs font-semibold text-gray-500 uppercase mb-2">To</p>
                <p className="text-base font-bold text-gray-900 mb-1">{receipt.receiverName}</p>
                <p className="text-sm font-mono text-gray-600">{receipt.receiverPhone}</p>
              </div>

              {/* Message */}
              {receipt.message && (
                <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
                  <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Message</p>
                  <p className="text-sm font-medium text-gray-800">"{receipt.message}"</p>
                </div>
              )}

              {/* Date and Time */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Date</p>
                  <p className="text-sm font-semibold text-gray-900">{receipt.date}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Time</p>
                  <p className="text-sm font-semibold text-gray-900">{receipt.time}</p>
                </div>
              </div>
            </div>

            {/* Transaction ID - More Readable */}
            <div className="pt-4 border-t-2 border-gray-300">
              <div className="bg-gray-50 rounded p-3">
                <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Transaction ID</p>
                <p className="text-xs font-mono text-gray-800 break-all">{receipt.id}</p>
              </div>
            </div>

            {/* Footer */}
            <div className="mt-6 pt-4 border-t border-gray-200 text-center">
              <p className="text-xs text-gray-500">
                This is an electronic receipt. Keep it for your records.
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <Button
              onClick={handleDownload}
              disabled={downloading}
              variant="outline"
              className="flex-1"
            >
              <Download className="h-4 w-4 mr-2" />
              {downloading ? 'Downloading...' : 'Download'}
            </Button>
            <Button
              onClick={handleShare}
              className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
            >
              <Share2 className="h-4 w-4 mr-2" />
              Share
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
