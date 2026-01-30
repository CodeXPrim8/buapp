'use client'

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { CheckCircle, XCircle, Info } from 'lucide-react'

interface AlertPopupProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  message: string
  type?: 'success' | 'error' | 'info'
}

export function AlertPopup({ open, onOpenChange, title, message, type = 'info' }: AlertPopupProps) {
  const icons = {
    success: <CheckCircle className="h-6 w-6 text-green-500" />,
    error: <XCircle className="h-6 w-6 text-red-500" />,
    info: <Info className="h-6 w-6 text-primary" />,
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="sm:max-w-md">
        <AlertDialogHeader>
          <div className="flex items-center gap-3">
            {icons[type]}
            <AlertDialogTitle>{title}</AlertDialogTitle>
          </div>
          <AlertDialogDescription className="pt-2">{message}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogAction onClick={() => onOpenChange(false)} className="w-full">
            OK
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
