// API middleware for common security checks

import { NextRequest, NextResponse } from 'next/server'
import { verifyCSRF } from './csrf'
import { getAuthUser } from './api-helpers'

/**
 * Middleware wrapper that adds CSRF protection to API routes
 * Use this for routes that modify state (POST, PUT, DELETE, PATCH)
 */
export function withCSRFProtection(
  handler: (request: NextRequest) => Promise<NextResponse>
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    const method = request.method.toUpperCase()
    
    // Only protect state-modifying methods
    if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(method)) {
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
    }
    
    return handler(request)
  }
}

/**
 * Middleware wrapper that requires authentication
 */
export function withAuth(
  handler: (request: NextRequest, user: { userId: string; role: string; phoneNumber: string }) => Promise<NextResponse>
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    const user = await getAuthUser(request)
    
    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: 'Authentication required',
        },
        { status: 401 }
      )
    }
    
    return handler(request, user)
  }
}

/**
 * Combined middleware: CSRF protection + Authentication
 */
export function withAuthAndCSRF(
  handler: (request: NextRequest, user: { userId: string; role: string; phoneNumber: string }) => Promise<NextResponse>
) {
  return withCSRFProtection(
    withAuth(handler)
  )
}
