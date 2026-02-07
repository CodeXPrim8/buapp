-- Only TWO event types in BU app: (1) Shows & Parties Around Me, (2) My Event
-- Shows & Parties Around Me: is_around_me = true, created by superadmin only, public, location-based, ticket purchase
-- My Event: is_around_me = false, created by celebrant/vendor only, private, visible only to invited+accepted guests
ALTER TABLE events
ADD COLUMN IF NOT EXISTS is_around_me BOOLEAN DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_events_is_around_me ON events(is_around_me);
CREATE INDEX IF NOT EXISTS idx_events_state ON events(state);

COMMENT ON COLUMN events.is_around_me IS 'true = Shows & Parties Around Me (super-admin only, public); false = My Event (celebrant/vendor only, invite-only)';
