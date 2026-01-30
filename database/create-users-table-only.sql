-- Quick test: Create just the users table first
-- Run this in Supabase SQL Editor to test

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop table if exists (for testing)
DROP TABLE IF EXISTS users CASCADE;

-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  phone_number TEXT UNIQUE NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT,
  role TEXT NOT NULL CHECK (role IN ('user', 'celebrant', 'vendor')),
  pin_hash TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index
CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone_number);

-- Test insert (optional - remove after testing)
-- INSERT INTO users (phone_number, first_name, last_name, role, pin_hash) 
-- VALUES ('+2341234567890', 'Test', 'User', 'user', 'hashed_pin_here');

-- Verify table was created
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' AND table_name = 'users';
