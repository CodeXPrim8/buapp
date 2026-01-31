import { NextRequest, NextResponse } from 'next/server'
import { getAuthCookie } from './cookies'
import { verifyToken } from './jwt'

// API Response helpers
export function successResponse(data: any, status = 200) {
  return NextResponse.json({ success: true, data }, { status })
}

export function errorResponse(message: string, status = 400, errors?: any) {
  const responseData: any = { 
    success: false, 
    error: message || 'An error occurred'
  }
  
  if (errors) {
    responseData.errors = errors
  }
  
  return NextResponse.json(responseData, { status })
}

// Get admin user from request (for authenticated routes)
export async function getAdminUser(request: NextRequest): Promise<{ userId: string; role: string; phoneNumber: string } | null> {
  try {
    const token = await getAuthCookie(request)
    
    if (!token) {
      return null
    }
    
    const payload = verifyToken(token)
    
    if (!payload) {
      return null
    }
    
    // Check if user is admin (support both 'superadmin' and 'super_admin' for backward compatibility)
    if (payload.role !== 'admin' && payload.role !== 'superadmin' && payload.role !== 'super_admin') {
      return null
    }
    
    return {
      userId: payload.userId,
      role: payload.role,
      phoneNumber: payload.phoneNumber,
    }
  } catch (error: any) {
    console.error('Admin auth verification error:', error)
    return null
  }
}

// Validate request body
export function validateBody<T>(body: any, schema: Record<string, (val: any) => boolean>): { valid: boolean; errors?: string[] } {
  const errors: string[] = []
  
  for (const [key, validator] of Object.entries(schema)) {
    if (!validator(body[key])) {
      errors.push(`${key} is required or invalid`)
    }
  }
  
  return { valid: errors.length === 0, errors: errors.length > 0 ? errors : undefined }
}
