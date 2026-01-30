-- Add status field to events table
ALTER TABLE events
ADD COLUMN IF NOT EXISTS is_done BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active' CHECK (status IN ('active', 'done', 'cancelled'));

-- Create index for status queries
CREATE INDEX IF NOT EXISTS idx_events_status ON events(status);
CREATE INDEX IF NOT EXISTS idx_events_is_done ON events(is_done);
