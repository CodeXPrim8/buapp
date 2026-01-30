import { NextRequest, NextResponse } from 'next/server'
import { successResponse } from '@/lib/api-helpers'

export async function POST(request: NextRequest) {
  try {
    const response = successResponse({
      message: 'Logged out successfully',
    })
    
    // Delete auth cookie by setting it to expire immediately
    response.cookies.set('bu-auth-token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 0, // Expire immediately
      path: '/',
    })
    
    return response
  } catch (error: any) {
    console.error('Logout error:', error)
    const response = successResponse({
      message: 'Logged out successfully',
    })
    
    // Still try to clear cookie even on error
    response.cookies.set('bu-auth-token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 0,
      path: '/',
    })
    
    return response
  }
}
