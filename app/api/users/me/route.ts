import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { successResponse, errorResponse, getAuthUser } from '@/lib/api-helpers'
import { verifyPin, hashPin } from '@/lib/auth'
import { withCSRFProtection } from '@/lib/api-middleware'

// Get current user profile
export async function GET(request: NextRequest) {
  try {
    const authUser = await getAuthUser(request)
    
    if (!authUser) {
      return errorResponse('Authentication required', 401)
    }
    
    const userId = authUser.userId

    console.log('[GET /users/me] Looking up user:', { userId, phoneNumber: authUser.phoneNumber, role: authUser.role })

    const { data: user, error } = await supabase
      .from('users')
      .select('id, phone_number, first_name, last_name, email, role, created_at')
      .eq('id', userId)
      .maybeSingle()

    if (error) {
      console.error('[GET /users/me] Supabase query error:', error)
      return errorResponse('Database error: ' + error.message, 500)
    }

    if (!user) {
      console.error('[GET /users/me] User not found in database:', { userId, phoneNumber: authUser.phoneNumber })
      // Try to find user by phone number as fallback
      const { data: userByPhone } = await supabase
        .from('users')
        .select('id, phone_number, first_name, last_name, email, role, created_at')
        .eq('phone_number', authUser.phoneNumber)
        .maybeSingle()
      
      if (userByPhone) {
        console.log('[GET /users/me] Found user by phone number:', { foundId: userByPhone.id, tokenId: userId })
        // User exists but token has wrong ID - return user data but this indicates token mismatch
        return successResponse({
          user: {
            ...userByPhone,
            name: `${userByPhone.first_name} ${userByPhone.last_name}`,
            phoneNumber: userByPhone.phone_number,
          },
        })
      }
      
      // User from token doesn't exist - token is invalid, return 401 to force re-authentication
      console.error('[GET /users/me] User from token does not exist in database - invalid token')
      return errorResponse('Authentication invalid - please log in again', 401)
    }

    return successResponse({
      user: {
        ...user,
        name: `${user.first_name} ${user.last_name}`,
        phoneNumber: user.phone_number,
      },
    })
  } catch (error: any) {
    console.error('Get user error:', error)
    return errorResponse('Internal server error', 500)
  }
}

// Update user profile
export const PUT = withCSRFProtection(async function PUT(request: NextRequest) {
  try {
    const authUser = await getAuthUser(request)
    
    if (!authUser) {
      return errorResponse('Authentication required', 401)
    }
    
    const userId = authUser.userId

    const body = await request.json()
    const updateData: any = {}

    if (body.first_name) updateData.first_name = body.first_name
    if (body.last_name) updateData.last_name = body.last_name
    if (body.email !== undefined) updateData.email = body.email
    
    // Handle PIN change
    if (body.current_pin && body.new_pin) {
      // Get current user to verify current PIN
      const { data: currentUser, error: userError } = await supabase
        .from('users')
        .select('pin_hash')
        .eq('id', userId)
        .single()
      
      if (userError || !currentUser) {
        return errorResponse('User not found', 404)
      }

      // Verify current PIN
      const isCurrentPinValid = await verifyPin(body.current_pin, currentUser.pin_hash)
      if (!isCurrentPinValid) {
        return errorResponse('Current PIN is incorrect', 401)
      }

      // Validate new PIN
      if (body.new_pin.length !== 6 || !/^\d+$/.test(body.new_pin)) {
        return errorResponse('New PIN must be 6 digits', 400)
      }

      // Hash new PIN
      const newPinHash = await hashPin(body.new_pin)
      updateData.pin_hash = newPinHash
    }
    
    // Handle role upgrade to vendor
    if (body.upgrade_to_vendor === true) {
      // Get current user to check their role
      const { data: currentUser, error: userError } = await supabase
        .from('users')
        .select('role')
        .eq('id', userId)
        .single()
      
      if (userError) {
        console.error('[PUT /users/me] Error fetching current user:', userError)
        return errorResponse('Failed to fetch user data: ' + userError.message, 500)
      }
      
      if (!currentUser) {
        return errorResponse('User not found', 404)
      }

      const currentRole = currentUser.role
      console.log('[PUT /users/me] Upgrade to vendor requested. Current role:', currentRole)

      // Upgrade role logic:
      // - 'user' -> 'both' (add vendor capabilities)
      // - 'celebrant' -> 'both' (add vendor capabilities)
      // - 'vendor' -> 'vendor' (already vendor, no change needed - but return success)
      // - 'both' -> 'both' (already has both, no change needed - but return success)
      // - 'admin' -> 'admin' (admins keep admin role, but can also be vendors - set to 'both' if they want vendor features)
      // - 'superadmin' -> 'superadmin' (superadmins keep superadmin role, but can also be vendors - set to 'both' if they want vendor features)
      
      if (currentRole === 'user' || currentRole === 'celebrant') {
        updateData.role = 'both'
        console.log('[PUT /users/me] Upgrading from', currentRole, 'to both')
      } else if (currentRole === 'vendor' || currentRole === 'both') {
        // Already has vendor access - return success without updating
        console.log('[PUT /users/me] User already has vendor access (role:', currentRole, ')')
        // Return current user data as success
        const { data: fullUser } = await supabase
          .from('users')
          .select('id, phone_number, first_name, last_name, email, role, created_at')
          .eq('id', userId)
          .single()
        
        if (fullUser) {
          return successResponse({
            user: {
              ...fullUser,
              name: `${fullUser.first_name} ${fullUser.last_name}`,
              phoneNumber: fullUser.phone_number,
            },
            message: 'You already have vendor access',
          })
        }
      } else if (currentRole === 'admin' || currentRole === 'superadmin') {
        // Admins/superadmins can also have vendor features
        // For now, we'll allow them to upgrade to 'both' to get vendor UI features
        // This gives them vendor dashboard access while keeping admin capabilities
        console.log('[PUT /users/me] Admin/superadmin user requesting vendor access (role:', currentRole, ')')
        console.log('[PUT /users/me] Upgrading admin/superadmin to both role for vendor UI access')
        updateData.role = 'both'
      } else {
        // Unknown role - log it and try to upgrade anyway
        console.warn('[PUT /users/me] Unknown role encountered:', currentRole, '- attempting upgrade to both')
        updateData.role = 'both'
      }
    }

    if (Object.keys(updateData).length === 0) {
      // If no fields to update and it's not an upgrade request or PIN change, return error
      if (body.upgrade_to_vendor !== true && !body.current_pin) {
        return errorResponse('No fields to update', 400)
      }
      
      // If PIN change was attempted but failed validation, error already returned above
      if (body.current_pin && body.new_pin) {
        return errorResponse('PIN change failed - please check your current PIN', 400)
      }
      // If it was an upgrade request but no update needed (already vendor/both), 
      // we should have returned above, but if we get here, return success anyway
      console.log('[PUT /users/me] Upgrade requested but no update needed - user already has vendor access')
      const { data: fullUser } = await supabase
        .from('users')
        .select('id, phone_number, first_name, last_name, email, role, created_at')
        .eq('id', userId)
        .single()
      
      if (fullUser) {
        return successResponse({
          user: {
            ...fullUser,
            name: `${fullUser.first_name} ${fullUser.last_name}`,
            phoneNumber: fullUser.phone_number,
          },
          message: 'You already have vendor access',
        })
      }
      return errorResponse('Unable to process upgrade request - user data not found', 500)
    }

    const { data: user, error } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', userId)
      .select('id, phone_number, first_name, last_name, email, role, created_at')
      .single()

    if (error) {
      return errorResponse('Failed to update user: ' + error.message, 500)
    }

    return successResponse({
      user: {
        ...user,
        name: `${user.first_name} ${user.last_name}`,
        phoneNumber: user.phone_number,
      },
    })
  } catch (error: any) {
    console.error('Update user error:', error)
    return errorResponse('Internal server error', 500)
  }
})
