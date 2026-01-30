import { NextRequest, NextResponse } from 'next/server'
import { getAdminUser } from '@/lib/api-helpers'
import { supabase } from '@/lib/supabase'
import { successResponse, errorResponse, validateBody } from '@/lib/api-helpers'

// Set user role (admin action)
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const adminUser = await getAdminUser(request)
    if (!adminUser) {
      return errorResponse('Authentication required', 401)
    }

    const { id } = params
    const body = await request.json()

    const validation = validateBody(body, {
      role: (val) => ['user', 'celebrant', 'vendor', 'both', 'admin', 'super_admin'].includes(val),
    })

    if (!validation.valid) {
      return errorResponse('Valid role is required', 400, validation.errors)
    }

    const { role } = body

    const { data: updatedUser, error } = await supabase
      .from('users')
      .update({ role })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      return errorResponse('Failed to update user role: ' + error.message, 500)
    }

    return successResponse({
      user: {
        id: updatedUser.id,
        phoneNumber: updatedUser.phone_number,
        name: `${updatedUser.first_name} ${updatedUser.last_name}`,
        role: updatedUser.role,
      },
      message: `User role updated to ${role}`,
    })
  } catch (error: any) {
    console.error('Set user role error:', error)
    return errorResponse('Internal server error', 500)
  }
}
