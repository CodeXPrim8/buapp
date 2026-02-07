-- Fix events that should be invite-only (My Event) but were saved as public.
-- Run add-events-around-me-flag.sql first if is_around_me column does not exist.
-- This sets is_around_me = false for events that are strictly by invitation (private).
UPDATE events
SET is_around_me = false
WHERE strictly_by_invitation = true;

-- Optional: set all events to invite-only except those explicitly marked as Shows & Parties Around Me
-- (Only run if you have no superadmin-created "Shows & Parties Around Me" events yet.)
-- UPDATE events SET is_around_me = false WHERE is_around_me IS NOT true;
