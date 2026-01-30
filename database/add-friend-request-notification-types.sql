-- Add friend request notification types to notifications table
-- Run this in your Supabase SQL Editor

ALTER TABLE notifications
DROP CONSTRAINT IF EXISTS notifications_type_check;

ALTER TABLE notifications
ADD CONSTRAINT notifications_type_check 
CHECK (type IN (
  'transfer_received', 
  'transfer_sent', 
  'event_invite', 
  'ticket_purchased', 
  'withdrawal_completed',
  'friend_request',
  'friend_request_accepted'
));
