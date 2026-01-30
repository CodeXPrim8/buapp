import { createClient } from '@supabase/supabase-js'

// Supabase configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://cmqtnppqpksvyhtqrcqi.supabase.co'
// Support both variable names (anon_key is standard, publishable_key is what user provided)
let supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY || ''

// Validate that we have a real API key (not a placeholder)
if (supabaseAnonKey && (supabaseAnonKey.includes('your_supabase') || supabaseAnonKey.length < 50)) {
  console.error('⚠️  WARNING: Invalid or placeholder Supabase API key detected!')
  console.error('   Key length:', supabaseAnonKey.length)
  console.error('   Key preview:', supabaseAnonKey.substring(0, 30))
  console.error('   Please ensure NEXT_PUBLIC_SUPABASE_ANON_KEY is set correctly in .env.local')
  console.error('   and restart your development server.')
  // Don't throw here, let Supabase handle the error with a clearer message
}

// Check for service role key (bypasses RLS) - only use server-side
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
const useServiceRole = !!supabaseServiceRoleKey && typeof window === 'undefined'

// Create Supabase client for server-side operations
// Use service role key if available (bypasses RLS for login queries)
// Otherwise use anon key (subject to RLS)
const clientKey = useServiceRole ? supabaseServiceRoleKey : supabaseAnonKey

export const supabase = createClient(supabaseUrl, clientKey, {
  db: {
    schema: 'public',
  },
})

// Create Supabase client for client-side operations (with RLS)
export const createSupabaseClient = () => {
  return createClient(supabaseUrl, supabaseAnonKey)
}
