import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { successResponse, errorResponse } from '@/lib/api-helpers'

// List all registered users (for contacts/invites)
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const search = searchParams.get('search') || ''
    const limit = parseInt(searchParams.get('limit') || '100')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Build query
    let query = supabase
      .from('users')
      .select('id, phone_number, first_name, last_name, role')
      .order('first_name', { ascending: true })
      .range(offset, offset + limit - 1)

    // Apply search filter if provided
    if (search && search.length >= 2) {
      const normalizedSearch = search.replace(/\D/g, '') // Remove non-digits
      query = query.or(
        `first_name.ilike.%${search}%,last_name.ilike.%${search}%,phone_number.ilike.%${search}%,phone_number.ilike.%${normalizedSearch}%`
      )
    }

    const { data: users, error } = await query

    if (error) {
      return errorResponse('Failed to fetch users: ' + error.message, 500)
    }

    const formattedUsers = users?.map((user) => ({
      id: user.id,
      phoneNumber: user.phone_number,
      name: `${user.first_name} ${user.last_name}`,
      firstName: user.first_name,
      lastName: user.last_name,
      role: user.role,
    })) || []

    return successResponse({ 
      users: formattedUsers,
      total: formattedUsers.length,
    })
  } catch (error: any) {
    console.error('List users error:', error)
    return errorResponse('Internal server error', 500)
  }
}
