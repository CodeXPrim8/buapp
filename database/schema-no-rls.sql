-- Bison Note Database Schema (Without RLS for Custom Auth)
-- Run this in your Supabase SQL Editor
-- This version disables RLS since we're using custom PIN-based auth

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  phone_number TEXT UNIQUE NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT,
  role TEXT NOT NULL CHECK (role IN ('user', 'celebrant', 'vendor')),
  pin_hash TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Wallets table
CREATE TABLE IF NOT EXISTS wallets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  balance NUMERIC(15, 2) DEFAULT 0 CHECK (balance >= 0),
  naira_balance NUMERIC(15, 2) DEFAULT 0 CHECK (naira_balance >= 0),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Gateways table
CREATE TABLE IF NOT EXISTS gateways (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vendor_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  event_name TEXT NOT NULL,
  event_date DATE NOT NULL,
  event_time TIME,
  event_location TEXT,
  celebrant_unique_id TEXT NOT NULL,
  celebrant_name TEXT NOT NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  qr_code_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Events table
CREATE TABLE IF NOT EXISTS events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  celebrant_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  gateway_id UUID REFERENCES gateways(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  date DATE NOT NULL,
  location TEXT,
  total_bu_received NUMERIC(15, 2) DEFAULT 0 CHECK (total_bu_received >= 0),
  withdrawn BOOLEAN DEFAULT FALSE,
  vendor_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Transfers table
CREATE TABLE IF NOT EXISTS transfers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  receiver_id UUID REFERENCES users(id) ON DELETE SET NULL,
  event_id UUID REFERENCES events(id) ON DELETE SET NULL,
  gateway_id UUID REFERENCES gateways(id) ON DELETE SET NULL,
  amount NUMERIC(15, 2) NOT NULL CHECK (amount > 0),
  message TEXT,
  type TEXT NOT NULL CHECK (type IN ('transfer', 'tip', 'gateway_qr', 'manual_sale')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed')),
  source TEXT CHECK (source IN ('gateway_qr_scan', 'manual_sale', 'direct')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Vendor pending sales table
CREATE TABLE IF NOT EXISTS vendor_pending_sales (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  transfer_id UUID NOT NULL REFERENCES transfers(id) ON DELETE CASCADE,
  gateway_id UUID NOT NULL REFERENCES gateways(id) ON DELETE CASCADE,
  vendor_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  guest_name TEXT NOT NULL,
  guest_phone TEXT,
  amount NUMERIC(15, 2) NOT NULL CHECK (amount > 0),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'notes_issued')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('transfer_received', 'transfer_sent', 'event_invite', 'ticket_purchased', 'withdrawal_completed')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  amount NUMERIC(15, 2),
  read BOOLEAN DEFAULT FALSE,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Withdrawals table
CREATE TABLE IF NOT EXISTS withdrawals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  event_id UUID REFERENCES events(id) ON DELETE SET NULL,
  bu_amount NUMERIC(15, 2) NOT NULL CHECK (bu_amount > 0),
  naira_amount NUMERIC(15, 2) NOT NULL CHECK (naira_amount > 0),
  type TEXT NOT NULL CHECK (type IN ('bank', 'wallet')),
  bank_name TEXT,
  account_number TEXT,
  account_name TEXT,
  wallet_address TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Indexes for performance (IF NOT EXISTS handles duplicates)
CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone_number);
CREATE INDEX IF NOT EXISTS idx_wallets_user ON wallets(user_id);
CREATE INDEX IF NOT EXISTS idx_gateways_vendor ON gateways(vendor_id);
CREATE INDEX IF NOT EXISTS idx_gateways_status ON gateways(status);
CREATE INDEX IF NOT EXISTS idx_events_celebrant ON events(celebrant_id);
CREATE INDEX IF NOT EXISTS idx_events_gateway ON events(gateway_id);
CREATE INDEX IF NOT EXISTS idx_transfers_sender ON transfers(sender_id);
CREATE INDEX IF NOT EXISTS idx_transfers_receiver ON transfers(receiver_id);
CREATE INDEX IF NOT EXISTS idx_transfers_event ON transfers(event_id);
CREATE INDEX IF NOT EXISTS idx_transfers_gateway ON transfers(gateway_id);
CREATE INDEX IF NOT EXISTS idx_vendor_sales_vendor ON vendor_pending_sales(vendor_id);
CREATE INDEX IF NOT EXISTS idx_vendor_sales_status ON vendor_pending_sales(status);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);
CREATE INDEX IF NOT EXISTS idx_withdrawals_user ON withdrawals(user_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at (drop if exists first)
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_wallets_updated_at ON wallets;
CREATE TRIGGER update_wallets_updated_at BEFORE UPDATE ON wallets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_gateways_updated_at ON gateways;
CREATE TRIGGER update_gateways_updated_at BEFORE UPDATE ON gateways
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_events_updated_at ON events;
CREATE TRIGGER update_events_updated_at BEFORE UPDATE ON events
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_vendor_sales_updated_at ON vendor_pending_sales;
CREATE TRIGGER update_vendor_sales_updated_at BEFORE UPDATE ON vendor_pending_sales
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- IMPORTANT: Disable RLS for custom auth system
-- Since we're using PIN-based auth, not Supabase Auth, we disable RLS
-- Security is handled in API routes instead
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE wallets DISABLE ROW LEVEL SECURITY;
ALTER TABLE gateways DISABLE ROW LEVEL SECURITY;
ALTER TABLE events DISABLE ROW LEVEL SECURITY;
ALTER TABLE transfers DISABLE ROW LEVEL SECURITY;
ALTER TABLE vendor_pending_sales DISABLE ROW LEVEL SECURITY;
ALTER TABLE notifications DISABLE ROW LEVEL SECURITY;
ALTER TABLE withdrawals DISABLE ROW LEVEL SECURITY;
