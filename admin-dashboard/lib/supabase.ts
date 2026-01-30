import { createClient } from '@supabase/supabase-js'

// Supabase configuration - shared with main app
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://cmqtnppqpksvyhtqrcqi.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY || ''

// Service role key for admin operations (bypasses RLS)
// IMPORTANT: Only use this server-side, never expose to client
// Get this from Supabase Dashboard > Project Settings > API > service_role key (secret)
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

// Create Supabase client for server-side operations
// Use service role key if available (for admin operations), otherwise use anon key
const serverKey = supabaseServiceRoleKey || supabaseAnonKey

// Log which key is being used (only in development)
if (process.env.NODE_ENV === 'development' && typeof console !== 'undefined') {
  console.log('[Supabase Admin] Using key type:', supabaseServiceRoleKey ? 'SERVICE_ROLE (bypasses RLS)' : 'ANON (subject to RLS)')
}

export const supabase = createClient(supabaseUrl, serverKey, {
  db: {
    schema: 'public',
  },
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

// Create Supabase client for client-side operations
export const createSupabaseClient = () => {
  return createClient(supabaseUrl, supabaseAnonKey)
}
