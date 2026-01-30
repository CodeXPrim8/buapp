-- Add new fields to events table for guest management
ALTER TABLE events 
ADD COLUMN IF NOT EXISTS max_guests INTEGER,
ADD COLUMN IF NOT EXISTS strictly_by_invitation BOOLEAN DEFAULT FALSE;

-- Add seat category to invites table (VIP, VVIP, etc.)
ALTER TABLE invites
ADD COLUMN IF NOT EXISTS seat_category TEXT CHECK (seat_category IN ('VIP', 'VVIP', 'Regular', 'Standard') OR seat_category IS NULL);

-- Add QR code for invite (for gate entry)
ALTER TABLE invites
ADD COLUMN IF NOT EXISTS qr_code_data JSONB;

-- Create index for faster invite lookups
CREATE INDEX IF NOT EXISTS idx_invites_guest_id ON invites(guest_id);
CREATE INDEX IF NOT EXISTS idx_invites_event_id ON invites(event_id);
CREATE INDEX IF NOT EXISTS idx_invites_status ON invites(status);
