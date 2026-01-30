-- Contacts and Friend Requests Schema
-- Run this in your Supabase SQL Editor

-- Friend Requests table
CREATE TABLE IF NOT EXISTS friend_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'blocked', 'cancelled')),
  message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '7 days'),
  UNIQUE(sender_id, receiver_id)
);

-- Contacts table (bidirectional relationship after acceptance)
CREATE TABLE IF NOT EXISTS contacts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  contact_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_transaction_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(user_id, contact_id),
  CHECK (user_id != contact_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_friend_requests_sender ON friend_requests(sender_id);
CREATE INDEX IF NOT EXISTS idx_friend_requests_receiver ON friend_requests(receiver_id);
CREATE INDEX IF NOT EXISTS idx_friend_requests_status ON friend_requests(status);
CREATE INDEX IF NOT EXISTS idx_contacts_user ON contacts(user_id);
CREATE INDEX IF NOT EXISTS idx_contacts_contact ON contacts(contact_id);
CREATE INDEX IF NOT EXISTS idx_contacts_last_transaction ON contacts(last_transaction_at DESC);

-- Function to auto-create contact relationship when friend request is accepted
CREATE OR REPLACE FUNCTION create_contact_on_accept()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'accepted' AND OLD.status = 'pending' THEN
    -- Create bidirectional contact relationship
    INSERT INTO contacts (user_id, contact_id)
    VALUES (NEW.sender_id, NEW.receiver_id)
    ON CONFLICT (user_id, contact_id) DO NOTHING;
    
    INSERT INTO contacts (user_id, contact_id)
    VALUES (NEW.receiver_id, NEW.sender_id)
    ON CONFLICT (user_id, contact_id) DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to create contacts when friend request is accepted
CREATE TRIGGER trigger_create_contact_on_accept
  AFTER UPDATE ON friend_requests
  FOR EACH ROW
  EXECUTE FUNCTION create_contact_on_accept();

-- Function to update last_transaction_at when a transfer occurs
CREATE OR REPLACE FUNCTION update_contact_last_transaction()
RETURNS TRIGGER AS $$
BEGIN
  -- Update last_transaction_at for both sender and receiver contacts
  UPDATE contacts
  SET last_transaction_at = NOW()
  WHERE (user_id = NEW.sender_id AND contact_id = NEW.receiver_id)
     OR (user_id = NEW.receiver_id AND contact_id = NEW.sender_id);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update contact last_transaction_at on transfer
CREATE TRIGGER trigger_update_contact_transaction
  AFTER INSERT ON transfers
  FOR EACH ROW
  WHEN (NEW.receiver_id IS NOT NULL)
  EXECUTE FUNCTION update_contact_last_transaction();

-- Cleanup expired friend requests (run periodically via cron or manual cleanup)
CREATE OR REPLACE FUNCTION cleanup_expired_friend_requests()
RETURNS void AS $$
BEGIN
  DELETE FROM friend_requests
  WHERE status = 'pending' AND expires_at < NOW();
END;
$$ LANGUAGE plpgsql;
