'use client'

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Download, CheckCircle } from 'lucide-react'
import html2canvas from 'html2canvas'

export interface TicketPurchaseReceiptData {
  eventName: string
  eventDate: string
  eventLocation?: string
  quantity: number
  pricePerTicket: number
  total: number
  ticketId: string
  purchaseDate: string
  purchaseTime: string
}

interface TicketPurchaseReceiptProps {
  receipt: TicketPurchaseReceiptData
  onDone: () => void
}

export function TicketPurchaseReceipt({ receipt, onDone }: TicketPurchaseReceiptProps) {
  const receiptRef = useRef<HTMLDivElement>(null)
  const [downloading, setDownloading] = useState(false)

  const handleDownload = async () => {
    if (!receiptRef.current) return
    try {
      setDownloading(true)
      const canvas = await html2canvas(receiptRef.current, {
        backgroundColor: '#ffffff',
        scale: 2,
      })
      const link = document.createElement('a')
      link.download = `BU-Ticket-Receipt-${receipt.ticketId}-${Date.now()}.png`
      link.href = canvas.toDataURL('image/png')
      link.click()
    } catch (error) {
      console.error('Failed to download receipt:', error)
      alert('Failed to download receipt. Please try again.')
    } finally {
      setDownloading(false)
    }
  }

  return (
    <div className="space-y-6 pb-24 pt-4 px-4">
      {/* Success message */}
      <div className="flex flex-col items-center gap-3 text-center">
        <div className="rounded-full bg-green-500/20 p-4">
          <CheckCircle className="h-12 w-12 text-green-600 dark:text-green-400" />
        </div>
        <h2 className="text-2xl font-bold text-foreground">Ticket purchased</h2>
        <p className="text-sm text-muted-foreground">
          Your tickets for {receipt.eventName} have been confirmed.
        </p>
      </div>

      {/* Receipt card (captured for download) */}
      <div
        ref={receiptRef}
        className="bg-white text-gray-900 p-6 rounded-xl border-2 border-primary/20 shadow-lg"
      >
        <div className="text-center mb-4 pb-4 border-b-2 border-gray-200">
          <h3 className="text-lg font-bold text-gray-900">ɃU Ticket Receipt</h3>
          <p className="text-xs text-gray-500">Purchase Confirmation</p>
        </div>
        <div className="flex justify-center mb-4">
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-500 text-white text-sm font-semibold">
            <CheckCircle className="h-4 w-4" />
            COMPLETED
          </span>
        </div>
        <div className="space-y-3 text-sm">
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase">Event</p>
            <p className="font-bold text-gray-900">{receipt.eventName}</p>
          </div>
          {receipt.eventDate && (
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase">Date</p>
              <p className="font-semibold text-gray-900">{receipt.eventDate}</p>
            </div>
          )}
          {receipt.eventLocation && (
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase">Location</p>
              <p className="font-semibold text-gray-900">{receipt.eventLocation}</p>
            </div>
          )}
          <div className="grid grid-cols-2 gap-3 pt-3 border-t border-gray-200">
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase">Quantity</p>
              <p className="font-semibold text-gray-900">{receipt.quantity} ticket(s)</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase">Price per ticket</p>
              <p className="font-semibold text-gray-900">Ƀ{receipt.pricePerTicket.toLocaleString()}</p>
            </div>
          </div>
          <div className="pt-3 border-t-2 border-gray-200">
            <p className="text-xs font-semibold text-gray-500 uppercase">Total paid</p>
            <p className="text-xl font-bold text-primary">Ƀ{receipt.total.toLocaleString()}</p>
          </div>
          <div className="pt-3 border-t border-gray-200">
            <p className="text-xs font-semibold text-gray-500 uppercase">Date & time</p>
            <p className="font-semibold text-gray-900">{receipt.purchaseDate} · {receipt.purchaseTime}</p>
          </div>
          <div className="pt-3 border-t border-gray-200">
            <p className="text-xs font-semibold text-gray-500 uppercase">Ticket / Transaction ID</p>
            <p className="text-xs font-mono text-gray-700 break-all">{receipt.ticketId}</p>
          </div>
        </div>
        <p className="text-xs text-gray-500 text-center mt-4 pt-4 border-t border-gray-200">
          This is your electronic receipt. Keep it for your records.
        </p>
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-3">
        <Button
          onClick={handleDownload}
          disabled={downloading}
          variant="outline"
          className="w-full"
        >
          <Download className="h-4 w-4 mr-2" />
          {downloading ? 'Downloading...' : 'Download receipt'}
        </Button>
        <Button onClick={onDone} className="w-full bg-primary text-primary-foreground hover:bg-primary/90">
          Done
        </Button>
      </div>
    </div>
  )
}
