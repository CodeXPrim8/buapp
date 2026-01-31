-- Enable Row Level Security (RLS) policies for all tables
-- This ensures users can only access their own data

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE transfers ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE gateways ENABLE ROW LEVEL SECURITY;
ALTER TABLE invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE withdrawals ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendor_pending_sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE friend_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Users table policies
-- Users can only view/update their own record
CREATE POLICY "Users can view own profile"
  ON users FOR SELECT
  USING (auth.uid()::text = id::text);

CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  USING (auth.uid()::text = id::text);

-- Note: User creation is handled by the application layer with proper authentication
-- Admin users can view all users (handled by application layer)

-- Wallets table policies
-- Users can only view/update their own wallet
CREATE POLICY "Users can view own wallet"
  ON wallets FOR SELECT
  USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can update own wallet"
  ON wallets FOR UPDATE
  USING (auth.uid()::text = user_id::text);

-- Transfers table policies
-- Users can view transfers where they are sender or receiver
CREATE POLICY "Users can view own transfers"
  ON transfers FOR SELECT
  USING (
    auth.uid()::text = sender_id::text OR 
    auth.uid()::text = receiver_id::text
  );

-- Users can create transfers (as sender)
CREATE POLICY "Users can create transfers"
  ON transfers FOR INSERT
  WITH CHECK (auth.uid()::text = sender_id::text);

-- Events table policies
-- Users can view events where they are the celebrant
CREATE POLICY "Users can view own events"
  ON events FOR SELECT
  USING (auth.uid()::text = celebrant_id::text);

-- Users can create events (as celebrant)
CREATE POLICY "Users can create events"
  ON events FOR INSERT
  WITH CHECK (auth.uid()::text = celebrant_id::text);

-- Users can update their own events
CREATE POLICY "Users can update own events"
  ON events FOR UPDATE
  USING (auth.uid()::text = celebrant_id::text);

-- Gateways table policies
-- Vendors can view their own gateways
CREATE POLICY "Vendors can view own gateways"
  ON gateways FOR SELECT
  USING (auth.uid()::text = vendor_id::text);

-- Vendors can create gateways
CREATE POLICY "Vendors can create gateways"
  ON gateways FOR INSERT
  WITH CHECK (auth.uid()::text = vendor_id::text);

-- Invites table policies
-- Users can view invites where they are celebrant or guest
CREATE POLICY "Users can view own invites"
  ON invites FOR SELECT
  USING (
    auth.uid()::text = celebrant_id::text OR 
    auth.uid()::text = guest_id::text
  );

-- Celebrants can create invites
CREATE POLICY "Celebrants can create invites"
  ON invites FOR INSERT
  WITH CHECK (auth.uid()::text = celebrant_id::text);

-- Notifications table policies
-- Users can only view their own notifications
CREATE POLICY "Users can view own notifications"
  ON notifications FOR SELECT
  USING (auth.uid()::text = user_id::text);

-- Users can update their own notifications
CREATE POLICY "Users can update own notifications"
  ON notifications FOR UPDATE
  USING (auth.uid()::text = user_id::text);

-- Withdrawals table policies
-- Users can only view their own withdrawal requests
CREATE POLICY "Users can view own withdrawals"
  ON withdrawals FOR SELECT
  USING (auth.uid()::text = user_id::text);

-- Users can create withdrawal requests
CREATE POLICY "Users can create withdrawals"
  ON withdrawals FOR INSERT
  WITH CHECK (auth.uid()::text = user_id::text);

-- Vendor pending sales policies
-- Vendors can view their own pending sales
CREATE POLICY "Vendors can view own pending sales"
  ON vendor_pending_sales FOR SELECT
  USING (auth.uid()::text = vendor_id::text);

-- Friend requests policies
-- Users can view friend requests where they are sender or receiver
CREATE POLICY "Users can view own friend requests"
  ON friend_requests FOR SELECT
  USING (
    auth.uid()::text = sender_id::text OR 
    auth.uid()::text = receiver_id::text
  );

-- Contacts policies
-- Users can view their own contacts
CREATE POLICY "Users can view own contacts"
  ON contacts FOR SELECT
  USING (auth.uid()::text = user_id::text);

-- Tickets policies
-- Users can view tickets they purchased
CREATE POLICY "Users can view own tickets"
  ON tickets FOR SELECT
  USING (auth.uid()::text = buyer_id::text);

-- Audit logs - Admin only (handled by application layer)
-- RLS can be more permissive here since audit logs are read-only for most users
CREATE POLICY "Users cannot modify audit logs"
  ON audit_logs FOR ALL
  USING (false); -- No direct modifications allowed

-- Note: The application uses service role key for admin operations
-- RLS policies work in conjunction with application-level authorization
-- Admin routes should use service role key to bypass RLS when needed
