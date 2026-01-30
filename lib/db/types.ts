// Database Types - Match Supabase schema

export type UserRole = 'user' | 'celebrant' | 'vendor' | 'both' | 'admin' | 'superadmin'

export interface User {
  id: string
  phone_number: string
  first_name: string
  last_name: string
  email?: string
  role: UserRole
  pin_hash: string
  created_at: string
  updated_at: string
}

export interface Wallet {
  id: string
  user_id: string
  balance: number
  naira_balance: number
  created_at: string
  updated_at: string
}

export interface Gateway {
  id: string
  vendor_id: string
  event_name: string
  event_date: string
  event_time?: string
  event_location?: string
  celebrant_unique_id: string
  celebrant_name: string
  status: 'active' | 'inactive'
  qr_code_data?: any
  created_at: string
  updated_at: string
}

export interface Event {
  id: string
  celebrant_id: string
  gateway_id?: string
  name: string
  date: string
  location?: string
  total_bu_received: number
  withdrawn: boolean
  vendor_name: string
  created_at: string
  updated_at: string
}

export interface Transfer {
  id: string
  sender_id: string
  receiver_id?: string
  event_id?: string
  gateway_id?: string
  amount: number
  message?: string
  type: 'transfer' | 'tip' | 'gateway_qr' | 'manual_sale'
  status: 'pending' | 'completed' | 'failed'
  source?: 'gateway_qr_scan' | 'manual_sale' | 'direct'
  created_at: string
}

export interface VendorPendingSale {
  id: string
  transfer_id: string
  gateway_id: string
  vendor_id: string
  guest_name: string
  guest_phone?: string
  amount: number
  status: 'pending' | 'confirmed' | 'notes_issued'
  created_at: string
  updated_at: string
}

export interface Notification {
  id: string
  user_id: string
  type: 'transfer_received' | 'transfer_sent' | 'event_invite' | 'ticket_purchased' | 'withdrawal_completed'
  title: string
  message: string
  amount?: number
  read: boolean
  metadata?: any
  created_at: string
}

export interface Withdrawal {
  id: string
  user_id: string
  event_id?: string
  bu_amount: number
  naira_amount: number
  type: 'bank' | 'wallet'
  bank_name?: string
  account_number?: string
  account_name?: string
  wallet_address?: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  created_at: string
  completed_at?: string
}
