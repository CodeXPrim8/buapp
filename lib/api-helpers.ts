import { NextRequest, NextResponse } from 'next/server'
import { getAuthCookie } from '@/lib/cookies'
import { verifyToken } from '@/lib/jwt'
import { verifyCSRF } from '@/lib/csrf'

// API Response helpers
export function successResponse(data: any, status = 200) {
  return NextResponse.json({ success: true, data }, { status })
}

export function errorResponse(message: string, status = 400, errors?: any) {
  try {
    const responseData: any = { 
      success: false, 
      error: message || 'An error occurred'
    }
    
    if (errors) {
      responseData.errors = errors
    }
    
    console.log('Creating error response:', {
      message,
      status,
      hasErrors: !!errors,
      responseData,
    })
    
    const response = NextResponse.json(responseData, { status })
    
    // Verify the response was created correctly
    if (!response) {
      console.error('errorResponse returned null/undefined!')
      return NextResponse.json(
        { success: false, error: message || 'An error occurred' },
        { status }
      )
    }
    
    return response
  } catch (error: any) {
    console.error('Error in errorResponse function:', error)
    // Fallback: return a basic error response
    return NextResponse.json(
      { success: false, error: message || 'An error occurred' },
      { status }
    )
  }
}

// Get user from request (for authenticated routes) - Now uses JWT from httpOnly cookies
export async function getAuthUser(request: NextRequest): Promise<{ userId: string; role: string; phoneNumber: string; name?: string } | null> {
  try {
    // Get token from httpOnly cookie - pass request for API routes
    const token = await getAuthCookie(request)
    
    if (!token) {
      return null
    }
    
    // Verify JWT token
    const payload = verifyToken(token)
    
    if (!payload) {
      return null
    }
    
    // Return authenticated user data
    return {
      userId: payload.userId,
      role: payload.role,
      phoneNumber: payload.phoneNumber,
    }
  } catch (error) {
    console.error('Auth verification error:', error)
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
