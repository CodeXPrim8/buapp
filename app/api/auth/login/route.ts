import { NextRequest, NextResponse } from 'next/server'
import { getUserByPhone, verifyPin } from '@/lib/auth'
import { successResponse, errorResponse, validateBody } from '@/lib/api-helpers'
import { generateToken, generateRefreshToken } from '@/lib/jwt'
import { setAuthCookie } from '@/lib/cookies'
import { rateLimiters } from '@/lib/rate-limit'
import { checkAccountLockout, recordFailedAttempt, clearFailedAttempts } from '@/lib/account-lockout'
import { logLoginAttempt, getClientIP, getUserAgent } from '@/lib/audit-log'
import { setCSRFToken } from '@/lib/csrf'
import crypto from 'crypto'

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
    const ipAddress = getClientIP(request)
    const userAgent = getUserAgent(request)

    // Get user
    let user
    try {
      user = await getUserByPhone(phone_number)
      console.log('[LOGIN] User lookup result:', { 
        found: !!user, 
        userId: user?.id, 
        role: user?.role,
        phoneNumber: phone_number?.substring(0, 5) + '***'
      })
    } catch (error: any) {
      console.error('Error fetching user during login:', error)
      return errorResponse('Database error during login. Please try again.', 500)
    }

    if (!user) {
      // Don't reveal if user exists or not (security best practice)
      console.log('[LOGIN] User not found for phone:', phone_number?.substring(0, 5) + '***')
      
      // Log failed login attempt
      await logLoginAttempt(null, null, false, ipAddress, userAgent, 'User not found')
      
      return errorResponse('Invalid phone number or PIN', 401)
    }
    
    // Check account lockout BEFORE PIN verification
    const lockoutStatus = checkAccountLockout(user.id)
    if (lockoutStatus.isLocked) {
      await logLoginAttempt(user.id, user.role, false, ipAddress, userAgent, 'Account locked')
      return errorResponse(lockoutStatus.message || 'Account is temporarily locked', 423) // 423 Locked
    }
    
    console.log('[LOGIN] User found, role:', user.role)

    // Verify PIN
    let isValidPin
    try {
      isValidPin = await verifyPin(pin, user.pin_hash)
    } catch (error: any) {
      console.error('Error verifying PIN:', error)
      return errorResponse('Error verifying credentials. Please try again.', 500)
    }

    if (!isValidPin) {
      // Record failed attempt and check for lockout
      const lockoutStatus = await recordFailedAttempt(user.id, ipAddress)
      
      // Log failed login attempt
      await logLoginAttempt(user.id, user.role, false, ipAddress, userAgent, 'Invalid PIN')
      
      if (lockoutStatus.isLocked) {
        return errorResponse(lockoutStatus.message || 'Account locked due to multiple failed attempts', 423)
      }
      
      return errorResponse(
        `Invalid phone number or PIN. ${lockoutStatus.attemptsRemaining} attempts remaining.`,
        401
      )
    }
    
    // Successful PIN verification - clear failed attempts
    clearFailedAttempts(user.id)

    // Generate JWT tokens (access + refresh)
    // Generate refresh token ID
    const refreshTokenId = crypto.randomUUID()
    
    const accessToken = generateToken({
      userId: user.id,
      role: user.role,
      phoneNumber: user.phone_number,
    })
    
    const refreshToken = generateRefreshToken(user.id, refreshTokenId)
    
    console.log('[LOGIN] Token generated successfully for role:', user.role)

    // Return user data (without PIN hash)
    const { pin_hash: _, ...userWithoutPin } = user

    const response = successResponse({
      user: userWithoutPin,
      message: 'Login successful',
    })
    
    console.log('[LOGIN] Login successful for user:', { id: user.id, role: user.role })
    
    // Log successful login
    await logLoginAttempt(user.id, user.role, true, ipAddress, userAgent)

    // Set httpOnly cookies on response
    // Access token (short-lived: 1 hour)
    response.cookies.set('bu-auth-token', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60, // 1 hour (reduced from 7 days)
      path: '/',
    })
    
    // Refresh token (long-lived: 7 days)
    response.cookies.set('bu-refresh-token', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    })
    
    // Set CSRF token
    setCSRFToken(response)

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
