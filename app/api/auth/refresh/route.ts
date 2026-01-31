import { NextRequest, NextResponse } from 'next/server'
import { verifyRefreshToken, generateToken } from '@/lib/jwt'
import { successResponse, errorResponse } from '@/lib/api-helpers'
import { getAuthCookie } from '@/lib/cookies'
import { setCSRFToken } from '@/lib/csrf'
import { supabase } from '@/lib/supabase'

// Refresh access token using refresh token
export async function POST(request: NextRequest) {
  try {
    // Get refresh token from cookie
    const refreshToken = request.cookies.get('bu-refresh-token')?.value
    
    if (!refreshToken) {
      return errorResponse('Refresh token not found', 401)
    }
    
    // Verify refresh token
    const payload = verifyRefreshToken(refreshToken)
    
    if (!payload) {
      return errorResponse('Invalid or expired refresh token', 401)
    }
    
    // Verify user still exists and is active
    const { data: user, error } = await supabase
      .from('users')
      .select('id, phone_number, role')
      .eq('id', payload.userId)
      .single()
    
    if (error || !user) {
      return errorResponse('User not found', 401)
    }
    
    // Generate new access token
    const accessToken = generateToken({
      userId: user.id,
      role: user.role,
      phoneNumber: user.phone_number,
    })
    
    const response = successResponse({
      message: 'Token refreshed successfully',
    })
    
    // Set new access token cookie
    response.cookies.set('bu-auth-token', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60, // 1 hour
      path: '/',
    })
    
    // Set CSRF token
    setCSRFToken(response)
    
    return response
  } catch (error: any) {
    console.error('Token refresh error:', error)
    return errorResponse('Failed to refresh token', 500)
  }
}
