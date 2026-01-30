import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { successResponse, errorResponse, getAuthUser } from '@/lib/api-helpers'

// Search users - returns contacts only, or allows manual phone lookup
export async function GET(request: NextRequest) {
  try {
    const authUser = await getAuthUser(request)
    if (!authUser) {
      return errorResponse('Unauthorized', 401)
    }

    const searchParams = request.nextUrl.searchParams
    const query = searchParams.get('q')
    const manual = searchParams.get('manual') === 'true' // If true, allow searching all users by phone

    if (!query || query.length < 2) {
      return successResponse({ users: [] })
    }

    // Normalize phone number (remove non-digits, handle +234 format)
    let normalizedQuery = query.replace(/\D/g, '') // Remove all non-digits
    if (normalizedQuery.startsWith('0')) {
      normalizedQuery = '234' + normalizedQuery.substring(1) // Replace leading 0 with 234
    } else if (!normalizedQuery.startsWith('234')) {
      normalizedQuery = '234' + normalizedQuery // Assume local number
    }

    if (manual) {
      // Manual phone lookup - check if user exists (for transactions with non-contacts)
      const { data: users, error } = await supabase
        .from('users')
        .select('id, phone_number, first_name, last_name, role')
        .or(`phone_number.ilike.%${normalizedQuery}%,phone_number.ilike.%${query}%`)
        .limit(5)

      if (error) {
        return errorResponse('Failed to search users: ' + error.message, 500)
      }

      const formattedUsers = users?.map((user) => ({
        id: user.id,
        phoneNumber: user.phone_number,
        name: `${user.first_name} ${user.last_name}`,
        firstName: user.first_name,
        lastName: user.last_name,
        role: user.role,
        is_contact: false, // Manual lookup, not a contact
      })) || []

      return successResponse({ users: formattedUsers })
    } else {
      // Search only contacts
      const { data: contacts, error } = await supabase
        .from('contacts')
        .select(`
          contact_id,
          contact:contact_id (
            id,
            phone_number,
            first_name,
            last_name,
            role
          )
        `)
        .eq('user_id', authUser.userId)
        .or(`contact.phone_number.ilike.%${normalizedQuery}%,contact.phone_number.ilike.%${query}%`)
        .limit(20)

      if (error) {
        return errorResponse('Failed to search contacts: ' + error.message, 500)
      }

      const formattedUsers = contacts?.map((c: any) => ({
        id: c.contact?.id,
        phoneNumber: c.contact?.phone_number,
        name: `${c.contact?.first_name || ''} ${c.contact?.last_name || ''}`.trim(),
        firstName: c.contact?.first_name,
        lastName: c.contact?.last_name,
        role: c.contact?.role,
        is_contact: true,
      })) || []

      return successResponse({ users: formattedUsers })
    }
  } catch (error: any) {
    console.error('Search users error:', error)
    return errorResponse('Internal server error', 500)
  }
}
