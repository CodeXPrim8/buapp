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

// Log which key is being used (for debugging, but don't log the actual key)
if (typeof window === 'undefined') {
  console.log('[Supabase] Server-side client initialized:', {
    hasServiceRoleKey: !!supabaseServiceRoleKey,
    serviceRoleKeyLength: supabaseServiceRoleKey?.length || 0,
    usingServiceRole: useServiceRole,
    hasAnonKey: !!supabaseAnonKey && supabaseAnonKey.length > 50,
    anonKeyLength: supabaseAnonKey?.length || 0,
    clientKeyLength: clientKey?.length || 0,
    envCheck: {
      SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY ? 'SET' : 'NOT SET',
      NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'SET' : 'NOT SET'
    }
  })
  
  // Warn if service role key is expected but not found
  if (!supabaseServiceRoleKey && process.env.NODE_ENV === 'production') {
    console.warn('[Supabase] ⚠️  WARNING: SUPABASE_SERVICE_ROLE_KEY not found in production!')
    console.warn('[Supabase] This may cause RLS permission errors. Check Vercel environment variables.')
  }
}

export const supabase = createClient(supabaseUrl, clientKey, {
  db: {
    schema: 'public',
  },
})

// Create Supabase client for client-side operations (with RLS)
export const createSupabaseClient = () => {
  return createClient(supabaseUrl, supabaseAnonKey)
}
