-- Verification queries to check if tables were created successfully
-- Run these in Supabase SQL Editor to verify your setup

-- Check if all tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN (
    'users', 
    'wallets', 
    'gateways', 
    'events', 
    'transfers', 
    'vendor_pending_sales', 
    'notifications', 
    'withdrawals',
    'push_subscriptions'
  )
ORDER BY table_name;

-- Check table structures
SELECT 
  table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name IN ('users', 'wallets', 'gateways', 'events', 'transfers', 'push_subscriptions')
ORDER BY table_name, ordinal_position;

-- Check indexes
SELECT 
  tablename,
  indexname
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename IN ('users', 'wallets', 'gateways', 'events', 'transfers', 'push_subscriptions')
ORDER BY tablename, indexname;

-- Check RLS policies
SELECT 
  schemaname,
  tablename,
  policyname
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
