import { NextRequest, NextResponse } from 'next/server'
import { getAdminUser } from '@/lib/api-helpers'
import { supabase } from '@/lib/supabase'
import { successResponse, errorResponse } from '@/lib/api-helpers'

// Get current admin user
export async function GET(request: NextRequest) {
  try {
    const adminUser = await getAdminUser(request)
    
    if (!adminUser) {
      return errorResponse('Authentication required', 401)
    }

    // Get full user details
    const { data: user, error } = await supabase
      .from('users')
      .select('id, phone_number, first_name, last_name, email, role, created_at')
      .eq('id', adminUser.userId)
      .single()

    if (error || !user) {
      return errorResponse('User not found', 404)
    }

    return successResponse({
      user: {
        id: user.id,
        phoneNumber: user.phone_number,
        name: `${user.first_name} ${user.last_name}`,
        firstName: user.first_name,
        lastName: user.last_name,
        email: user.email,
        role: user.role,
        createdAt: user.created_at,
      },
    })
  } catch (error: any) {
    console.error('Get admin user error:', error)
    return errorResponse('Internal server error', 500)
  }
}
