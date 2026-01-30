import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// Check if database tables exist
export async function GET() {
  try {
    // Try to query the users table
    const { data, error } = await supabase
      .from('users')
      .select('count')
      .limit(1)
    
    if (error) {
      return NextResponse.json({
        success: false,
        error: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
        tableExists: false,
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'Users table exists and is accessible',
      tableExists: true,
    })
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message,
      tableExists: false,
      note: 'This usually means the table does not exist. Run database/schema.sql in Supabase SQL Editor.',
    }, { status: 500 })
  }
}
