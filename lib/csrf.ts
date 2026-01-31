// CSRF Protection middleware and utilities

import { NextRequest, NextResponse } from 'next/server'
import { generateCSRFToken, verifyCSRFToken } from './security'
import { getAuthCookie } from './cookies'

const CSRF_TOKEN_COOKIE = 'csrf-token'
const CSRF_HEADER = 'x-csrf-token'

/**
 * Generate and set CSRF token cookie
 */
export function setCSRFToken(response: NextResponse): string {
  const token = generateCSRFToken()
  response.cookies.set(CSRF_TOKEN_COOKIE, token, {
    httpOnly: false, // Must be readable by JavaScript
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 60 * 60 * 24, // 24 hours
    path: '/',
  })
  return token
}

/**
 * Verify CSRF token from request
 */
export async function verifyCSRF(request: NextRequest): Promise<boolean> {
  // Skip CSRF for GET, HEAD, OPTIONS requests
  const method = request.method.toUpperCase()
  if (['GET', 'HEAD', 'OPTIONS'].includes(method)) {
    return true
  }

  // Get token from cookie
  const cookieToken = request.cookies.get(CSRF_TOKEN_COOKIE)?.value
  
  // Get token from header
  const headerToken = request.headers.get(CSRF_HEADER)
  
  if (!cookieToken || !headerToken) {
    return false
  }
  
  return verifyCSRFToken(headerToken, cookieToken)
}

/**
 * CSRF protection middleware
 * Use this in API routes that modify state
 */
export async function csrfProtection(
  request: NextRequest,
  handler: (request: NextRequest) => Promise<NextResponse>
): Promise<NextResponse> {
  const isValid = await verifyCSRF(request)
  
  if (!isValid) {
    return NextResponse.json(
      {
        success: false,
        error: 'Invalid CSRF token. Please refresh the page and try again.',
      },
      { status: 403 }
    )
  }
  
  return handler(request)
}

/**
 * Get CSRF token for client-side requests
 */
export async function getCSRFToken(request: NextRequest): Promise<string | null> {
  return request.cookies.get(CSRF_TOKEN_COOKIE)?.value || null
}
