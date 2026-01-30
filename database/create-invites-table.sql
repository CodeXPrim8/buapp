-- Create invites table for event invitations
CREATE TABLE IF NOT EXISTS invites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  celebrant_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  guest_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  guest_phone TEXT NOT NULL,
  guest_name TEXT NOT NULL,
  gate TEXT,
  seat TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(event_id, guest_id) -- Prevent duplicate invites
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_invites_event ON invites(event_id);
CREATE INDEX IF NOT EXISTS idx_invites_guest ON invites(guest_id);
CREATE INDEX IF NOT EXISTS idx_invites_celebrant ON invites(celebrant_id);
CREATE INDEX IF NOT EXISTS idx_invites_status ON invites(status);

-- Trigger for updated_at
DROP TRIGGER IF EXISTS update_invites_updated_at ON invites;
CREATE TRIGGER update_invites_updated_at BEFORE UPDATE ON invites
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Disable RLS for custom auth
ALTER TABLE invites DISABLE ROW LEVEL SECURITY;
