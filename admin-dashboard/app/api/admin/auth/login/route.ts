import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { generateToken } from '@/lib/jwt'
import { setAuthCookie } from '@/lib/cookies'
import { successResponse, errorResponse, validateBody } from '@/lib/api-helpers'
import bcrypt from 'bcryptjs'

// Admin login
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validation = validateBody(body, {
      phone_number: (val) => typeof val === 'string' && val.length > 0,
      pin: (val) => typeof val === 'string' && val.length === 6 && /^\d+$/.test(val),
    })

    if (!validation.valid) {
      return errorResponse('Phone number and PIN are required', 400, validation.errors)
    }

    const { phone_number, pin } = body

    // Normalize phone number: ensure it starts with +
    let normalizedPhone = phone_number.trim()
    if (!normalizedPhone.startsWith('+')) {
      // If it starts with 234, add +
      if (normalizedPhone.startsWith('234')) {
        normalizedPhone = '+' + normalizedPhone
      } else if (normalizedPhone.startsWith('0')) {
        // If it starts with 0, replace with +234
        normalizedPhone = '+234' + normalizedPhone.substring(1)
      } else {
        // Otherwise, assume it's missing the + and add it
        normalizedPhone = '+' + normalizedPhone
      }
    }

    console.log('Admin login attempt:', { phone_number: normalizedPhone, pin_length: pin?.length })

    // Find user by phone number (try both normalized and original)
    let { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('phone_number', normalizedPhone)
      .maybeSingle()

    // If not found with normalized, try original
    if (!user && phone_number !== normalizedPhone) {
      const { data: userAlt, error: errorAlt } = await supabase
        .from('users')
        .select('*')
        .eq('phone_number', phone_number)
        .maybeSingle()
      
      if (userAlt) {
        user = userAlt
        userError = errorAlt
      }
    }

    console.log('User lookup result:', { 
      found: !!user, 
      error: userError?.message,
      user_id: user?.id,
      user_role: user?.role,
      user_phone: user?.phone_number 
    })

    if (userError || !user) {
      console.error('User not found or error:', userError)
      return errorResponse('Invalid credentials', 401)
    }

    // Check if user is admin (support both 'superadmin' and 'super_admin' for backward compatibility)
    if (user.role !== 'admin' && user.role !== 'superadmin' && user.role !== 'super_admin') {
      console.log('User role check failed:', { user_role: user.role, required: ['admin', 'superadmin', 'super_admin'] })
      return errorResponse('Access denied. Admin privileges required.', 403)
    }

    // Verify PIN
    if (!user.pin_hash) {
      console.error('User has no PIN hash')
      return errorResponse('Invalid credentials', 401)
    }

    const pinValid = await bcrypt.compare(pin, user.pin_hash)
    
    console.log('PIN verification:', { valid: pinValid, has_pin_hash: !!user.pin_hash })
    
    if (!pinValid) {
      return errorResponse('Invalid credentials', 401)
    }

    // Generate JWT token
    const token = generateToken({
      userId: user.id,
      role: user.role,
      phoneNumber: user.phone_number,
    })

    // Create response with cookie
    const response = successResponse({
      user: {
        id: user.id,
        phoneNumber: user.phone_number,
        name: `${user.first_name} ${user.last_name}`,
        role: user.role,
      },
    })

    // Set auth cookie
    await setAuthCookie(token, response)

    return response
  } catch (error: any) {
    console.error('Admin login error:', error)
    return errorResponse('Login failed: ' + error.message, 500)
  }
}
