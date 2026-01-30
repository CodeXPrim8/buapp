import { NextRequest, NextResponse } from 'next/server'
import { createUser, createWallet, hashPin } from '@/lib/auth'
import { successResponse, errorResponse, validateBody } from '@/lib/api-helpers'
import { generateToken } from '@/lib/jwt'
import { setAuthCookie } from '@/lib/cookies'
import { rateLimiters } from '@/lib/rate-limit'

export async function POST(request: NextRequest) {
  try {
    // Apply rate limiting
    const rateLimitResult = await rateLimiters.registration(request)
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: 'Too many registration attempts. Please try again later.',
          retryAfter: Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000),
        },
        {
          status: 429,
          headers: {
            'Retry-After': String(Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000)),
            'X-RateLimit-Limit': '3',
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': String(rateLimitResult.resetTime),
          },
        }
      )
    }

    let body
    try {
      body = await request.json()
    } catch (e) {
      return errorResponse('Invalid JSON in request body', 400)
    }
    
    // Validate request body - Updated to require 6-digit PIN
    const validation = validateBody(body, {
      phone_number: (val) => typeof val === 'string' && val.length > 0,
      first_name: (val) => typeof val === 'string' && val.length > 0,
      last_name: (val) => typeof val === 'string' && val.length > 0,
      role: (val) => ['user', 'celebrant', 'vendor', 'both'].includes(val),
      pin: (val) => typeof val === 'string' && val.length === 6 && /^\d+$/.test(val),
    })

    if (!validation.valid) {
      return errorResponse('Validation failed', 400, validation.errors)
    }

    const { phone_number, first_name, last_name, email, role, pin } = body

    // Check if user already exists
    const { supabase } = await import('@/lib/supabase')
    
    // Verify Supabase connection
    if (!supabase) {
      console.error('Supabase client not initialized')
      return errorResponse('Database connection error', 500)
    }

    let existingUser, checkError
    try {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/5302d33a-07c7-4c7f-8d80-24b4192edc7b',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/api/auth/register/route.ts:64',message:'Before Supabase query',data:{phoneNumber:phone_number?.substring(0,5)+'***'},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
      // #endregion agent log
      
      const result = await supabase
        .from('users')
        .select('id')
        .eq('phone_number', phone_number)
        .single()
      existingUser = result.data
      checkError = result.error
      
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/5302d33a-07c7-4c7f-8d80-24b4192edc7b',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/api/auth/register/route.ts:72',message:'After Supabase query',data:{hasData:!!existingUser,hasError:!!checkError,errorCode:checkError?.code,errorMessage:checkError?.message,errorDetails:checkError?.details,errorHint:checkError?.hint},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
      // #endregion agent log
    } catch (fetchError: any) {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/5302d33a-07c7-4c7f-8d80-24b4192edc7b',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/api/auth/register/route.ts:75',message:'Supabase fetch exception',data:{errorMessage:fetchError?.message,errorStack:fetchError?.stack?.substring(0,200)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
      // #endregion agent log
      
      console.error('Fetch error connecting to Supabase:', fetchError)
      return errorResponse(
        'Cannot connect to database. Please check if Supabase project is active and URL is correct. Error: ' + fetchError.message,
        500
      )
    }

    if (checkError && checkError.code !== 'PGRST116') { // PGRST116 = no rows returned
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/5302d33a-07c7-4c7f-8d80-24b4192edc7b',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/api/auth/register/route.ts:87',message:'Supabase error detected',data:{errorCode:checkError?.code,errorMessage:checkError?.message,errorDetails:checkError?.details,errorHint:checkError?.hint,fullError:JSON.stringify(checkError)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
      // #endregion agent log
      
      console.error('Error checking existing user:', checkError)
      return errorResponse('Database error: ' + checkError.message, 500)
    }

    if (existingUser) {
      return errorResponse('User with this phone number already exists', 409)
    }

    // Hash PIN
    let pin_hash
    try {
      pin_hash = await hashPin(pin)
    } catch (error: any) {
      console.error('PIN hashing error:', error)
      return errorResponse('Failed to process PIN', 500)
    }

    // Create user
    let user
    try {
      user = await createUser({
        phone_number,
        first_name,
        last_name,
        email,
        role,
        pin_hash,
      })
    } catch (createError: any) {
      console.error('Failed to create user:', createError)
      console.error('Role attempted:', role)
      console.error('Error details:', createError.message)
      
      // Check if it's a constraint violation for role
      if (createError.message?.includes('role') || createError.message?.includes('constraint')) {
        return errorResponse(
          `Failed to create user: ${createError.message}. Please ensure the database allows the "${role}" role. Run the SQL script: database/add-both-role.sql`,
          500
        )
      }
      
      // Return the actual error message
      return errorResponse(
        `Failed to create user: ${createError.message || 'Unknown database error'}`,
        500
      )
    }

    if (!user) {
      console.error('Failed to create user. Role:', role)
      return errorResponse('Failed to create user: User creation returned null', 500)
    }

    // Create wallet for user
    const walletCreated = await createWallet(user.id)
    if (!walletCreated) {
      console.error('Failed to create wallet for user:', user.id)
      // Don't fail registration if wallet creation fails, but log it
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
      message: 'User registered successfully',
    }, 201)

    // Set httpOnly cookie on response
    response.cookies.set('bu-auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    })

    // Add rate limit headers
    response.headers.set('X-RateLimit-Limit', '3')
    response.headers.set('X-RateLimit-Remaining', String(rateLimitResult.remaining))
    response.headers.set('X-RateLimit-Reset', String(rateLimitResult.resetTime))

    return response
  } catch (error: any) {
    console.error('Registration error:', error)
    return errorResponse(error.message || 'Internal server error', 500)
  }
}
