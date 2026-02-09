import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { successResponse, errorResponse, getAuthUser } from '@/lib/api-helpers'
import { sendPushToUser } from '@/lib/push'
import { withCSRFProtection } from '@/lib/api-middleware'

// Create invites (POST) - Celebrant sends invites to guests
export const POST = withCSRFProtection(async function POST(request: NextRequest) {
  try {
    const authUser = await getAuthUser(request)
    if (!authUser || !authUser.userId) {
      console.error('Authentication failed. authUser:', authUser)
      console.error('Request headers:', {
        'x-user-id': request.headers.get('x-user-id'),
        'x-user-role': request.headers.get('x-user-role'),
        'x-user-phone': request.headers.get('x-user-phone'),
      })
      return errorResponse('Authentication required. Please login again.', 401)
    }

    // Allow all users to send invites (not just celebrants)
    // Users registered as 'user' or 'both' can access celebrant features including sending invites
    if (authUser.role === 'vendor') {
      return errorResponse('Vendors cannot send invites. Register as User or Both to send invites.', 403)
    }

    let body
    try {
      body = await request.json()
    } catch (parseError: any) {
      console.error('Failed to parse request body:', parseError)
      return errorResponse('Invalid request body. Expected JSON.', 400)
    }

    const { event_id, guest_ids, gate, seat, seat_category } = body || {}

    console.log('Invite creation request:', {
      event_id,
      guest_ids_count: Array.isArray(guest_ids) ? guest_ids.length : 0,
      guest_ids: guest_ids,
      gate,
      seat,
      seat_category,
      hasBody: !!body,
    })

    if (!event_id || !guest_ids || !Array.isArray(guest_ids) || guest_ids.length === 0) {
      console.error('Validation failed:', { event_id, guest_ids, hasBody: !!body })
      return errorResponse('Event ID and guest IDs are required', 400)
    }

    // First verify the user exists in database to get the correct UUID format
    // Try to find user by ID first, then by phone number if that fails
    let dbUser = null
    let dbUserId: string | null = null
    
    // Safely get userId from authUser
    if (authUser && authUser.userId) {
      dbUserId = String(authUser.userId).trim()
    }
    
    if (!dbUserId) {
      console.error('User ID is missing or invalid. authUser:', authUser)
      return errorResponse('User ID is required. Please login again.', 401)
    }
    
    // Try finding by ID
    const { data: userById, error: userByIdError } = await supabase
      .from('users')
      .select('id, phone_number')
      .eq('id', dbUserId)
      .single()

    if (!userByIdError && userById) {
      dbUser = userById
      dbUserId = userById.id
    } else {
      // If ID lookup fails, try to get user from phone number in headers
      // This handles cases where localStorage has an old/invalid ID
      const phoneNumber = request.headers.get('x-user-phone')
      if (phoneNumber) {
        const { data: userByPhone, error: userByPhoneError } = await supabase
          .from('users')
          .select('id, phone_number')
          .eq('phone_number', phoneNumber)
          .single()

        if (!userByPhoneError && userByPhone) {
          dbUser = userByPhone
          dbUserId = userByPhone.id
        }
      }
    }

    if (!dbUser) {
      console.error('User lookup failed. User ID from header:', authUser.userId)
      console.error('User ID type:', typeof authUser.userId)
      console.error('Phone number from header:', request.headers.get('x-user-phone'))
      return errorResponse('User not found. Please logout and login again.', 401)
    }

    console.log('User verified:', {
      userId: authUser.userId,
      dbUserId: dbUserId,
      role: authUser.role,
    })

    // Verify event exists and belongs to user
    const { data: event, error: eventError } = await supabase
      .from('events')
      .select('id, name, celebrant_id, max_guests, strictly_by_invitation')
      .eq('id', event_id)
      .eq('celebrant_id', dbUserId)
      .single()

    if (eventError) {
      console.error('Event lookup error:', eventError)
      console.error('Event ID:', event_id)
      console.error('DB User ID:', dbUserId)
      
      // Check if event exists but belongs to different user
      const { data: eventExists } = await supabase
        .from('events')
        .select('id, celebrant_id')
        .eq('id', event_id)
        .single()
      
      if (eventExists) {
        console.error('Event exists but celebrant_id mismatch:')
        console.error('Event celebrant_id:', eventExists.celebrant_id, typeof eventExists.celebrant_id)
        console.error('DB User ID:', dbUserId, typeof dbUserId)
        console.error('Match:', String(eventExists.celebrant_id) === String(dbUserId))
        return errorResponse('You do not have permission to send invites for this event', 403)
      }
      
      return errorResponse(`Event not found: ${eventError.message}`, 404)
    }

    if (!event) {
      return errorResponse('Event not found', 404)
    }

    // Check if event is strictly by invitation and if max guests is reached
    if (event.strictly_by_invitation) {
      // Count existing invites for this event
      const { count: inviteCount } = await supabase
        .from('invites')
        .select('*', { count: 'exact', head: true })
        .eq('event_id', event_id)
        .in('status', ['pending', 'accepted'])

      const newInviteCount = guest_ids.length
      const totalInvites = (inviteCount || 0) + newInviteCount

      if (event.max_guests && totalInvites > event.max_guests) {
        return errorResponse(
          `Cannot send invites. Event has a maximum of ${event.max_guests} guests. ` +
          `Currently ${inviteCount || 0} invited, trying to add ${newInviteCount} more.`,
          400
        )
      }
    }

    // Get guest details - verify guests exist and get their database IDs
    console.log('Looking up guests by IDs:', guest_ids)
    const { data: guests, error: guestsError } = await supabase
      .from('users')
      .select('id, phone_number, first_name, last_name')
      .in('id', guest_ids)

    if (guestsError) {
      console.error('Error looking up guests:', guestsError)
      return errorResponse('Failed to verify guest IDs: ' + guestsError.message, 400)
    }

    if (!guests || guests.length === 0) {
      console.error('No guests found for IDs:', guest_ids)
      return errorResponse('Invalid guest IDs. Guests not found in database.', 400)
    }

    if (guests.length !== guest_ids.length) {
      console.warn('Some guest IDs not found. Expected:', guest_ids.length, 'Found:', guests.length)
      console.warn('Guest IDs provided:', guest_ids)
      console.warn('Guests found:', guests.map(g => g.id))
    }

    console.log('Found guests:', guests.map(g => ({ id: g.id, name: `${g.first_name} ${g.last_name}`, phone: g.phone_number })))

    // Create invites with seat allocation
    // If seat_category is provided as array, map to each guest; otherwise use single value
    const seatCategories = Array.isArray(seat_category) ? seat_category : 
                          seat_category ? new Array(guests.length).fill(seat_category) : 
                          new Array(guests.length).fill(null)
    
    // Build invite objects - first try with seat_category
    const invitesToCreateWithCategory = guests.map((guest, index) => {
      const inviteData: any = {
        event_id,
        celebrant_id: dbUserId,
        guest_id: guest.id,
        guest_phone: guest.phone_number,
        guest_name: `${guest.first_name} ${guest.last_name}`,
        gate: gate || null,
        seat: seat || null,
        status: 'pending',
      }
      
      // Only add seat_category if provided
      const category = seatCategories[index]
      if (category && category !== null && category !== '') {
        inviteData.seat_category = category
      }
      
      return inviteData
    })

    // Try inserting with seat_category first
    let { data: createdInvites, error: createError } = await supabase
      .from('invites')
      .insert(invitesToCreateWithCategory)
      .select()

    // If error is due to missing seat_category column, retry without it
    if (createError && (createError.message?.includes('seat_category') || createError.message?.includes('column "seat_category"') || createError.code === '42703')) {
      console.warn('seat_category column not found, creating invites without seat categories')
      
      // Build invites without seat_category
      const invitesToCreateWithoutCategory = guests.map((guest) => ({
        event_id,
        celebrant_id: dbUserId,
        guest_id: guest.id,
        guest_phone: guest.phone_number,
        guest_name: `${guest.first_name} ${guest.last_name}`,
        gate: gate || null,
        seat: seat || null,
        status: 'pending',
      }))

      const retryResult = await supabase
        .from('invites')
        .insert(invitesToCreateWithoutCategory)
        .select()

      createdInvites = retryResult.data
      createError = retryResult.error
    }

    if (createError) {
      console.error('Create invites error:', createError)
      console.error('Error code:', createError.code)
      console.error('Error message:', createError.message)
      console.error('Error details:', createError.details)
      console.error('Invites to create:', JSON.stringify(invitesToCreateWithCategory, null, 2))
      
      // Handle duplicate invite error gracefully
      if (createError.code === '23505') { // Unique constraint violation
        return errorResponse('One or more guests already have invites for this event', 409)
      }
      
      return errorResponse('Failed to create invites: ' + createError.message, 500)
    }

    // Create notifications for guests
    // Use dbUserId instead of authUser.userId to ensure correct UUID format
    const { data: celebrant, error: celebrantError } = await supabase
      .from('users')
      .select('first_name, last_name')
      .eq('id', dbUserId)
      .single()

    if (celebrantError) {
      console.error('Celebrant lookup error for notifications:', celebrantError)
      // Continue without celebrant name - use fallback
    }

    const notifications = guests.map(guest => ({
      user_id: guest.id,
      type: 'event_invite',
      title: 'Event Invitation',
      message: `${celebrant ? `${celebrant.first_name} ${celebrant.last_name}` : 'A celebrant'} invited you to ${event.name}`,
      metadata: {
        event_id,
        invite_id: createdInvites?.find(inv => inv.guest_id === guest.id)?.id,
        celebrant_name: celebrant ? `${celebrant.first_name} ${celebrant.last_name}` : 'Celebrant',
      },
    }))

    // Insert notifications - don't fail if this fails, just log it
    const { error: notificationError } = await supabase.from('notifications').insert(notifications)
    if (notificationError) {
      console.error('Failed to create notifications:', notificationError)
      // Don't fail the request if notifications fail - invites were created successfully
    }

    notifications.forEach((notification) => {
      void sendPushToUser(notification.user_id, {
        title: notification.title,
        body: notification.message,
        data: { url: '/?page=notifications' },
      })
    })

    return successResponse({
      invites: createdInvites,
      message: `Successfully sent ${createdInvites?.length || 0} invite(s)`,
    }, 201)
  } catch (error: any) {
    console.error('Create invites error:', error)
    console.error('Error type:', typeof error)
    console.error('Error stack:', error?.stack)
    console.error('Error message:', error?.message)
    console.error('Error name:', error?.name)
    console.error('Full error:', JSON.stringify(error, Object.getOwnPropertyNames(error), 2))
    
    // Ensure we always return a proper error response
    const errorMessage = error?.message || error?.toString() || 'Internal server error'
    console.error('Returning error response:', errorMessage)
    
    try {
      return errorResponse(errorMessage, 500)
    } catch (responseError: any) {
      console.error('Failed to create error response:', responseError)
      // Fallback: return a plain JSON response
      return NextResponse.json(
        { success: false, error: errorMessage },
        { status: 500 }
      )
    }
  }
})

// Get invites (GET) - Get invites for current user or for an event
export async function GET(request: NextRequest) {
  try {
    const authUser = await getAuthUser(request)
    if (!authUser || !authUser.userId) {
      console.error('Authentication failed in GET invites')
      return errorResponse('Authentication required', 401)
    }

    // Verify user exists in database to get correct UUID format
    const userId = authUser.userId
    const { data: dbUser, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('id', userId.trim())
      .single()

    if (userError || !dbUser) {
      // Try by phone number as fallback
      const phoneNumber = request.headers.get('x-user-phone')
      if (phoneNumber) {
        const { data: userByPhone } = await supabase
          .from('users')
          .select('id')
          .eq('phone_number', phoneNumber)
          .single()
        
        if (userByPhone) {
          const dbUserId = userByPhone.id
          console.log('User found by phone, using ID:', dbUserId)
          
          const searchParams = request.nextUrl.searchParams
          const eventId = searchParams.get('event_id')
          const type = searchParams.get('type') || 'received'

          let query = supabase
            .from('invites')
            .select(`
              *,
              event:events(id, name, date, location),
              celebrant:users!invites_celebrant_id_fkey(id, first_name, last_name, phone_number),
              guest:users!invites_guest_id_fkey(id, first_name, last_name, phone_number)
            `)

          if (type === 'received') {
            query = query.eq('guest_id', dbUserId)
            console.log('Fetching received invites for guest_id:', dbUserId)
          } else if (type === 'sent') {
            if (authUser.role === 'vendor') {
              return errorResponse('Vendors cannot view sent invites', 403)
            }
            query = query.eq('celebrant_id', dbUserId)
            console.log('Fetching sent invites for celebrant_id:', dbUserId)
          }

          if (eventId) {
            query = query.eq('event_id', eventId)
          }

          query = query.order('created_at', { ascending: false })

          const { data: invites, error } = await query

          if (error) {
            console.error('Error fetching invites:', error)
            return errorResponse('Failed to fetch invites: ' + error.message, 500)
          }

          console.log(`Found ${invites?.length || 0} invites`)
          return successResponse({ invites: invites || [] })
        }
      }
      
      console.error('User not found in database. User ID:', userId)
      return errorResponse('User not found. Please login again.', 401)
    }

    const dbUserId = dbUser.id
    console.log('User verified, using ID:', dbUserId)

    const searchParams = request.nextUrl.searchParams
    const eventId = searchParams.get('event_id')
    const type = searchParams.get('type') || 'received' // 'received' or 'sent'

    let query = supabase
      .from('invites')
      .select(`
        *,
        event:events(id, name, date, location),
        celebrant:users!invites_celebrant_id_fkey(id, first_name, last_name, phone_number),
        guest:users!invites_guest_id_fkey(id, first_name, last_name, phone_number)
      `)

    if (type === 'received') {
      // Get invites received by current user - use database user ID
      query = query.eq('guest_id', dbUserId)
      console.log('Fetching received invites for guest_id:', dbUserId)
    } else if (type === 'sent') {
      // Get invites sent by current user (allow all users except vendors)
      if (authUser.role === 'vendor') {
        return errorResponse('Vendors cannot view sent invites', 403)
      }
      query = query.eq('celebrant_id', dbUserId)
      console.log('Fetching sent invites for celebrant_id:', dbUserId)
    }

    if (eventId) {
      query = query.eq('event_id', eventId)
    }

    query = query.order('created_at', { ascending: false })

    const { data: invites, error } = await query

    if (error) {
      return errorResponse('Failed to fetch invites: ' + error.message, 500)
    }

    return successResponse({ invites: invites || [] })
  } catch (error: any) {
    console.error('Get invites error:', error)
    return errorResponse('Internal server error', 500)
  }
}
