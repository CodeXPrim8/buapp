-- Add 'ticket_purchase' to transfers type constraint (optional - currently using 'transfer' type)
-- This is optional since we're using 'transfer' type with a message field
-- Uncomment if you want a dedicated ticket_purchase type:

-- ALTER TABLE transfers DROP CONSTRAINT IF EXISTS transfers_type_check;
-- ALTER TABLE transfers ADD CONSTRAINT transfers_type_check 
--   CHECK (type IN ('transfer', 'tip', 'gateway_qr', 'manual_sale', 'ticket_purchase'));
