import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { successResponse, errorResponse, getAuthUser } from '@/lib/api-helpers'

// Get user's contacts
export async function GET(request: NextRequest) {
  try {
    const authUser = await getAuthUser(request)
    if (!authUser) {
      return errorResponse('Unauthorized', 401)
    }

    const { data: contacts, error } = await supabase
      .from('contacts')
      .select(`
        contact_id,
        last_transaction_at,
        contact:contact_id (
          id,
          phone_number,
          first_name,
          last_name
        )
      `)
      .eq('user_id', authUser.userId)
      .order('last_transaction_at', { ascending: false, nullsFirst: false })
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Failed to fetch contacts:', error)
      return errorResponse('Failed to fetch contacts: ' + error.message, 500)
    }

    const formattedContacts = contacts?.map((c: any) => ({
      id: c.contact?.id,
      phone_number: c.contact?.phone_number,
      first_name: c.contact?.first_name,
      last_name: c.contact?.last_name,
      name: `${c.contact?.first_name || ''} ${c.contact?.last_name || ''}`.trim(),
      last_transaction_at: c.last_transaction_at,
    })) || []

    return successResponse({ contacts: formattedContacts })
  } catch (error: any) {
    console.error('Get contacts error:', error)
    return errorResponse('Internal server error', 500)
  }
}
