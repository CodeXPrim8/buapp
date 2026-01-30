import { NextResponse } from 'next/server'

// Check environment variables (without exposing sensitive data)
export async function GET() {
  return NextResponse.json({
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
    hasAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    hasPublishableKey: !!process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY,
    anonKeyLength: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.length || 0,
    publishableKeyLength: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY?.length || 0,
    expectedUrl: 'https://cmqtnppqpksvyhtqrcqi.supabase.co',
    urlMatches: process.env.NEXT_PUBLIC_SUPABASE_URL === 'https://cmqtnppqpksvyhtqrcqi.supabase.co',
    note: 'Tables exist in Supabase. This checks if environment variables are correct.',
  })
}
