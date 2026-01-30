-- Add event_id to gateways table to link gateways to events
ALTER TABLE gateways
ADD COLUMN IF NOT EXISTS event_id UUID REFERENCES events(id) ON DELETE SET NULL;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_gateways_event_id ON gateways(event_id);
