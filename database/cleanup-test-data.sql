-- Clean up test events and related data
-- WARNING: This will delete all events and related invites/transfers
-- Run this in Supabase SQL Editor

-- Delete all invites (they reference events)
DELETE FROM invites;

-- Delete all transfers that reference events
DELETE FROM transfers WHERE event_id IS NOT NULL;

-- Delete all events
DELETE FROM events;

-- Note: Wallets and users are kept intact (BU balances preserved)
