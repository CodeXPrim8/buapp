-- Add ticket vending fields to events table
ALTER TABLE events
ADD COLUMN IF NOT EXISTS ticket_price_bu NUMERIC(15, 2) DEFAULT 0 CHECK (ticket_price_bu >= 0),
ADD COLUMN IF NOT EXISTS max_tickets INTEGER,
ADD COLUMN IF NOT EXISTS tickets_sold INTEGER DEFAULT 0 CHECK (tickets_sold >= 0),
ADD COLUMN IF NOT EXISTS city TEXT,
ADD COLUMN IF NOT EXISTS state TEXT,
ADD COLUMN IF NOT EXISTS country TEXT DEFAULT 'Nigeria',
ADD COLUMN IF NOT EXISTS category TEXT,
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS image_url TEXT,
ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS tickets_enabled BOOLEAN DEFAULT FALSE;

-- Create tickets table for tracking ticket purchases
CREATE TABLE IF NOT EXISTS tickets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  buyer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  total_price_bu NUMERIC(15, 2) NOT NULL CHECK (total_price_bu >= 0),
  transfer_id UUID REFERENCES transfers(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'confirmed' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'refunded')),
  qr_code_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(event_id, buyer_id, created_at) -- Allow multiple purchases but track each transaction
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_tickets_event ON tickets(event_id);
CREATE INDEX IF NOT EXISTS idx_tickets_buyer ON tickets(buyer_id);
CREATE INDEX IF NOT EXISTS idx_tickets_status ON tickets(status);
CREATE INDEX IF NOT EXISTS idx_events_city ON events(city);
CREATE INDEX IF NOT EXISTS idx_events_category ON events(category);
CREATE INDEX IF NOT EXISTS idx_events_public ON events(is_public);
CREATE INDEX IF NOT EXISTS idx_events_tickets_enabled ON events(tickets_enabled);
CREATE INDEX IF NOT EXISTS idx_events_date ON events(date);

-- Trigger for updated_at
DROP TRIGGER IF EXISTS update_tickets_updated_at ON tickets;
CREATE TRIGGER update_tickets_updated_at BEFORE UPDATE ON tickets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Disable RLS for custom auth
ALTER TABLE tickets DISABLE ROW LEVEL SECURITY;
