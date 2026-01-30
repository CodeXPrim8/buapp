// Admin-specific middleware for securing admin routes

import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from './api-helpers'
import { getClientIP } from './audit-log'

/**
 * Check if IP address is in whitelist
 */
function isIPWhitelisted(ip: string): boolean {
  const whitelist = process.env.ADMIN_IP_WHITELIST?.split(',').map(ip => ip.trim()) || []
  
  // If no whitelist configured, allow all (for development)
  if (whitelist.length === 0) {
    return process.env.NODE_ENV !== 'production'
  }
  
  return whitelist.includes(ip) || whitelist.some(allowedIP => {
    // Support CIDR notation (basic implementation)
    if (allowedIP.includes('/')) {
      // For production, use a proper CIDR library
      // This is a simplified check
      return ip.startsWith(allowedIP.split('/')[0].substring(0, 7))
    }
    return ip === allowedIP
  })
}

/**
 * Middleware wrapper that requires admin authentication and optional IP whitelisting
 */
export function withAdminAuth(
  handler: (request: NextRequest, user: { userId: string; role: string; phoneNumber: string }) => Promise<NextResponse>,
  options: { requireIPWhitelist?: boolean } = {}
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    // Check IP whitelist if required
    if (options.requireIPWhitelist && process.env.NODE_ENV === 'production') {
      const clientIP = getClientIP(request)
      if (!isIPWhitelisted(clientIP)) {
        return NextResponse.json(
          {
            success: false,
            error: 'Access denied. Your IP address is not authorized.',
          },
          { status: 403 }
        )
      }
    }

    // Require authentication
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

    // Check if user is admin or superadmin
    if (user.role !== 'admin' && user.role !== 'superadmin' && user.role !== 'super_admin') {
      return NextResponse.json(
        {
          success: false,
          error: 'Admin access required',
        },
        { status: 403 }
      )
    }
    
    return handler(request, user)
  }
}

/**
 * Combined middleware: Admin auth + CSRF protection + IP whitelisting
 */
export function withAdminAuthAndCSRF(
  handler: (request: NextRequest, user: { userId: string; role: string; phoneNumber: string }) => Promise<NextResponse>,
  options: { requireIPWhitelist?: boolean } = {}
) {
  const { withCSRFProtection } = require('./api-middleware')
  
  return withCSRFProtection(
    withAdminAuth(handler, options)
  )
}
