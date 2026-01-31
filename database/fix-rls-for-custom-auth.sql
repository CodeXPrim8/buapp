-- Fix RLS Policies for Custom JWT Authentication
-- This allows registration and login to work with custom JWT (not Supabase Auth)
-- Run this in your Supabase SQL Editor

-- Drop existing policies that use auth.uid() (they don't work with custom JWT)
DROP POLICY IF EXISTS "Users can read own data" ON users;

-- Allow INSERT for registration (anyone can register)
CREATE POLICY "Allow user registration" ON users
  FOR INSERT
  WITH CHECK (true);

-- Allow SELECT for login (server-side API routes will use service role key, but this allows anon key to work too)
-- Note: This is less secure but necessary for login. Consider using service role key instead.
CREATE POLICY "Allow user lookup for login" ON users
  FOR SELECT
  USING (true);

-- Allow users to update their own data (by ID matching, not auth.uid())
-- This will be enforced by application logic, not RLS
CREATE POLICY "Allow user updates" ON users
  FOR UPDATE
  USING (true)
  WITH CHECK (true);
