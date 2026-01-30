import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

const TOKEN_COOKIE_NAME = 'bu-auth-token'
const COOKIE_MAX_AGE = 60 * 60 * 24 * 7 // 7 days in seconds

// Set authentication cookie (server-side) - returns response with cookie header
export async function setAuthCookie(token: string, response?: NextResponse): Promise<NextResponse> {
  // In API routes, we must set the cookie on the response object
  if (response) {
    response.cookies.set(TOKEN_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax', // Changed from 'strict' to 'lax' for better compatibility
      maxAge: COOKIE_MAX_AGE,
      path: '/',
    })
  } else {
    // For Server Components, use cookies() API
    try {
      const cookieStore = await cookies()
      cookieStore.set(TOKEN_COOKIE_NAME, token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: COOKIE_MAX_AGE,
        path: '/',
      })
    } catch (error) {
      console.error('Error setting cookie via cookies() API:', error)
    }
  }
  
  return response || NextResponse.next()
}

// Get authentication cookie (server-side)
// Can be called with or without request - if request provided, reads from request cookies
export async function getAuthCookie(request?: NextRequest): Promise<string | null> {
  try {
    if (request) {
      // Read from request cookies (for API routes)
      const token = request.cookies.get(TOKEN_COOKIE_NAME)
      return token?.value || null
    } else {
      // Read from Next.js cookies() API (for Server Components)
      const cookieStore = await cookies()
      const token = cookieStore.get(TOKEN_COOKIE_NAME)
      return token?.value || null
    }
  } catch (error: any) {
    console.error('getAuthCookie error:', error)
    return null
  }
}

// Delete authentication cookie (server-side)
export async function deleteAuthCookie() {
  const cookieStore = await cookies()
  cookieStore.delete(TOKEN_COOKIE_NAME)
}

// Client-side cookie helpers (for logout)
export function deleteAuthCookieClient() {
  if (typeof document !== 'undefined') {
    document.cookie = `${TOKEN_COOKIE_NAME}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`
  }
}
