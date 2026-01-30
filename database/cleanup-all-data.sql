-- ⚠️ WARNING: This script will DELETE ALL DATA from the database
-- Use only for development/testing. DO NOT run in production unless you want to delete everything!
-- This action CANNOT be undone!

-- Delete in order to respect foreign key constraints
-- Using TRUNCATE CASCADE for faster deletion (PostgreSQL)

-- Option 1: TRUNCATE (faster, resets sequences) - Try this first
TRUNCATE TABLE transfers CASCADE;
TRUNCATE TABLE withdrawals CASCADE;
TRUNCATE TABLE tickets CASCADE;
TRUNCATE TABLE friend_requests CASCADE;
TRUNCATE TABLE contacts CASCADE;
TRUNCATE TABLE notifications CASCADE;
TRUNCATE TABLE invites CASCADE;
TRUNCATE TABLE gateways CASCADE;
TRUNCATE TABLE events CASCADE;
TRUNCATE TABLE wallets CASCADE;
TRUNCATE TABLE users CASCADE;

-- Option 2: DELETE (if TRUNCATE doesn't work due to permissions or foreign key issues)
-- Uncomment these if TRUNCATE fails:
-- DELETE FROM transfers;
-- DELETE FROM withdrawals;
-- DELETE FROM tickets;
-- DELETE FROM friend_requests;
-- DELETE FROM contacts;
-- DELETE FROM notifications;
-- DELETE FROM invites;
-- DELETE FROM gateways;
-- DELETE FROM events;
-- DELETE FROM wallets;
-- DELETE FROM users;

-- Verify deletion - All counts should be 0
SELECT 
  (SELECT COUNT(*) FROM users) as users_count,
  (SELECT COUNT(*) FROM wallets) as wallets_count,
  (SELECT COUNT(*) FROM transfers) as transfers_count,
  (SELECT COUNT(*) FROM events) as events_count,
  (SELECT COUNT(*) FROM invites) as invites_count,
  (SELECT COUNT(*) FROM friend_requests) as friend_requests_count,
  (SELECT COUNT(*) FROM contacts) as contacts_count,
  (SELECT COUNT(*) FROM notifications) as notifications_count,
  (SELECT COUNT(*) FROM withdrawals) as withdrawals_count,
  (SELECT COUNT(*) FROM tickets) as tickets_count,
  (SELECT COUNT(*) FROM gateways) as gateways_count;
