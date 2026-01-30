import { NextRequest, NextResponse } from 'next/server'
import { getUserByPhone, verifyPin } from '@/lib/auth'
import { successResponse, errorResponse, validateBody } from '@/lib/api-helpers'
import { generateToken } from '@/lib/jwt'
import { setAuthCookie } from '@/lib/cookies'
import { rateLimiters } from '@/lib/rate-limit'

export async function POST(request: NextRequest) {
  try {
    // Apply rate limiting
    const rateLimitResult = await rateLimiters.login(request)
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: 'Too many login attempts. Please try again later.',
          retryAfter: Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000),
        },
        {
          status: 429,
          headers: {
            'Retry-After': String(Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000)),
            'X-RateLimit-Limit': '5',
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': String(rateLimitResult.resetTime),
          },
        }
      )
    }

    const body = await request.json()
    
    // Validate request body - Updated to require 6-digit PIN
    const validation = validateBody(body, {
      phone_number: (val) => typeof val === 'string' && val.length > 0,
      pin: (val) => typeof val === 'string' && val.length === 6 && /^\d+$/.test(val),
    })

    if (!validation.valid) {
      return errorResponse(
        validation.errors?.join(', ') || 'Phone number and 6-digit PIN are required', 
        400,
        validation.errors
      )
    }

    const { phone_number, pin } = body

    // Get user
    let user
    try {
      user = await getUserByPhone(phone_number)
    } catch (error: any) {
      console.error('Error fetching user during login:', error)
      return errorResponse('Database error during login. Please try again.', 500)
    }

    if (!user) {
      // Don't reveal if user exists or not (security best practice)
      return errorResponse('Invalid phone number or PIN', 401)
    }

    // Verify PIN
    let isValidPin
    try {
      isValidPin = await verifyPin(pin, user.pin_hash)
    } catch (error: any) {
      console.error('Error verifying PIN:', error)
      return errorResponse('Error verifying credentials. Please try again.', 500)
    }

    if (!isValidPin) {
      return errorResponse('Invalid phone number or PIN', 401)
    }

    // Generate JWT token
    const token = generateToken({
      userId: user.id,
      role: user.role,
      phoneNumber: user.phone_number,
    })

    // Return user data (without PIN hash)
    const { pin_hash: _, ...userWithoutPin } = user

    const response = successResponse({
      user: userWithoutPin,
      message: 'Login successful',
    })

    // Set httpOnly cookie on response
    response.cookies.set('bu-auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    })

    // Add rate limit headers
    response.headers.set('X-RateLimit-Limit', '5')
    response.headers.set('X-RateLimit-Remaining', String(rateLimitResult.remaining))
    response.headers.set('X-RateLimit-Reset', String(rateLimitResult.resetTime))

    return response
  } catch (error: any) {
    console.error('Login error:', error)
    return errorResponse('Internal server error', 500)
  }
}
