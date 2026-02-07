-- Delete ALL "My Event" records (is_around_me = false or null).
-- Only "Shows & Parties Around Me" (is_around_me = true) will remain.
-- Run this once to clear existing My Events. New My Events created after this
-- will only be visible to the celebrant and to users who were invited and have accepted.

-- Dependent rows: invites and tickets CASCADE on event delete;
-- gateways.event_id, transfers.event_id, withdrawals.event_id SET NULL on event delete.
DELETE FROM events
WHERE is_around_me IS NOT TRUE;

-- Optional: show how many were deleted (run separately if needed)
-- SELECT COUNT(*) FROM events WHERE is_around_me IS NOT TRUE;
