import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { successResponse, errorResponse, validateBody, getAuthUser } from '@/lib/api-helpers'
import { withCSRFProtection } from '@/lib/api-middleware'
import { sanitizeText, sanitizeName } from '@/lib/sanitize'

// Create event (celebrant only)
export const POST = withCSRFProtection(async function POST(request: NextRequest) {
  try {
    const authUser = await getAuthUser(request)
    if (!authUser) {
      return errorResponse('Authentication required', 401)
    }
    
    const celebrantId = authUser.userId
    const role = authUser.role

    // Only two event types: (1) Shows & Parties Around Me (superadmin only); (2) My Event (celebrant or vendor only)
    // Vendors can create My Event only (is_around_me false); they cannot create Shows & Parties Around Me

    // Verify user exists in database
    const { data: userCheck } = await supabase
      .from('users')
      .select('id')
      .eq('id', celebrantId)
      .single()

    if (!userCheck) {
      console.error('User not found in database. User ID:', celebrantId)
      return errorResponse('User not found. Please login again.', 401)
    }

    // Use the database user ID to ensure consistency
    const dbCelebrantId = userCheck.id

    const body = await request.json()
    const validation = validateBody(body, {
      name: (val) => typeof val === 'string' && val.length > 0,
      date: (val) => typeof val === 'string' && val.length > 0,
    })

    if (!validation.valid) {
      return errorResponse('Validation failed', 400, validation.errors)
    }

    const { 
      name, 
      date, 
      location, 
      gateway_id, 
      max_guests, 
      strictly_by_invitation,
      // Ticket vending fields
      ticket_price_bu,
      max_tickets,
      city,
      state,
      country,
      category,
      description,
      image_url,
      is_public,
      tickets_enabled,
      // Shows & Parties Around Me: only superadmin can set true
      is_around_me: bodyIsAroundMe,
    } = body

    // Sanitize user inputs
    const sanitizedName = sanitizeName(name || '')
    const sanitizedLocation = location ? sanitizeText(location) : null
    const sanitizedCity = city ? sanitizeName(city) : undefined
    const sanitizedState = state ? sanitizeName(state) : undefined
    const sanitizedCountry = country ? sanitizeName(country) : undefined
    const sanitizedCategory = category ? sanitizeText(category) : undefined
    const sanitizedDescription = description ? sanitizeText(description) : undefined

    const eventData: any = {
      celebrant_id: dbCelebrantId, // Use database user ID for consistency
      gateway_id: gateway_id || null,
      name: sanitizedName,
      date,
      location: sanitizedLocation,
      total_bu_received: 0,
      withdrawn: false,
    }

    // Add optional fields if provided
    if (max_guests !== undefined && max_guests !== null) {
      eventData.max_guests = parseInt(max_guests.toString())
    }
    if (strictly_by_invitation !== undefined && strictly_by_invitation !== null) {
      eventData.strictly_by_invitation = Boolean(strictly_by_invitation)
    }

    // Ticket vending fields
    if (ticket_price_bu !== undefined && ticket_price_bu !== null) {
      eventData.ticket_price_bu = parseFloat(ticket_price_bu.toString())
    }
    if (max_tickets !== undefined && max_tickets !== null) {
      eventData.max_tickets = parseInt(max_tickets.toString())
    }
    if (sanitizedCity !== undefined) eventData.city = sanitizedCity
    if (sanitizedState !== undefined) eventData.state = sanitizedState
    if (sanitizedCountry !== undefined) eventData.country = sanitizedCountry
    if (sanitizedCategory !== undefined) eventData.category = sanitizedCategory
    if (sanitizedDescription !== undefined) eventData.description = sanitizedDescription
    if (image_url !== undefined) eventData.image_url = image_url
    
    // Shows & Parties Around Me: ONLY superadmin can create; always public and tickets enabled
    // My Event: celebrant or vendor can create; private, invite-only. Never public to other users.
    const isAroundMe = role === 'superadmin' && bodyIsAroundMe === true
    if (bodyIsAroundMe === true && role !== 'superadmin') {
      return errorResponse('Only Super Admin can create Shows & Parties Around Me. Create a My Event instead.', 403)
    }
    // Non-negotiable: non-superadmin events are ALWAYS invite-only (is_around_me = false) so only invited+accepted users see them
    eventData.is_around_me = role === 'superadmin' ? isAroundMe : false
    eventData.is_public = isAroundMe ? true : (is_public === true)
    eventData.tickets_enabled = isAroundMe ? true : (tickets_enabled === true)
    eventData.tickets_sold = 0

    const { data: event, error } = await supabase
      .from('events')
      .insert([eventData])
      .select()
      .single()

    if (error) {
      return errorResponse('Failed to create event: ' + error.message, 500)
    }

    return successResponse({ event }, 201)
  } catch (error: any) {
    console.error('Create event error:', error)
    console.error('Error type:', typeof error)
    console.error('Error stack:', error?.stack)
    console.error('Error message:', error?.message)
    
    const errorMessage = error?.message || error?.toString() || 'Internal server error'
    
    try {
      return errorResponse(errorMessage, 500)
    } catch (responseError: any) {
      console.error('Failed to create error response:', responseError)
      return NextResponse.json(
        { success: false, error: errorMessage },
        { status: 500 }
      )
    }
  }
})

// List events. Only two types: Shows & Parties Around Me (around_me=true), My Event (my_events=true or invited+accepted).
export async function GET(request: NextRequest) {
  try {
    const authUser = await getAuthUser(request)
    if (!authUser) {
      return errorResponse('Authentication required', 401)
    }
    
    const userId = authUser.userId
    const role = authUser.role
    const phoneNumber = authUser.phoneNumber

    // Verify user exists in database to get correct UUID format
    const trimmedUserId = userId ? String(userId).trim() : null
    if (!trimmedUserId) {
      console.error('User ID is missing or invalid:', userId)
      return errorResponse('User ID is required', 401)
    }
    
    console.log('Looking up user in database:', trimmedUserId)
    const { data: dbUser, error: userError } = await supabase
      .from('users')
      .select('id, phone_number')
      .eq('id', trimmedUserId)
      .single()

    console.log('User lookup result:', {
      found: !!dbUser,
      error: userError?.message,
      userId: dbUser?.id,
      phoneNumber: dbUser?.phone_number,
    })

    if (userError || !dbUser) {
      console.log('User not found by ID, trying phone number fallback')
      if (phoneNumber) {
        const { data: userByPhone } = await supabase
          .from('users')
          .select('id, phone_number')
          .eq('phone_number', phoneNumber)
          .single()
        if (userByPhone) {
          // Use same dbUser shape so rest of GET uses same logic
          Object.assign(dbUser ?? {}, { id: userByPhone.id, phone_number: userByPhone.phone_number })
          if (!dbUser) (request as any)._dbUserFallback = userByPhone
        }
      }
      if (!dbUser && !(request as any)._dbUserFallback) {
        return errorResponse('User not found. Please login again.', 401)
      }
    }
    const dbUserId = dbUser?.id ?? (request as any)._dbUserFallback?.id
    if (!dbUserId) {
      return errorResponse('User not found. Please login again.', 401)
    }

    // Query params: around_me = Shows & Parties Around Me (super-admin catalog); my_events = Celebrant/Vendor "My Event" list; default = Guest invited+accepted only
    const { searchParams } = new URL(request.url)
    const city = searchParams.get('city')
    const userCity = searchParams.get('user_city') || city // user's location for sorting Shows & Parties Around Me
    const userState = searchParams.get('user_state')
    const category = searchParams.get('category')
    const search = searchParams.get('search')
    const aroundMe = searchParams.get('around_me') === 'true'
    const myEvents = searchParams.get('my_events') === 'true'

    let query = supabase
      .from('events')
      .select(`
        *,
        celebrant:users!events_celebrant_id_fkey(id, phone_number, first_name, last_name)
      `)

    // My Event visibility (non-negotiable): a My Event is only visible to (1) the celebrant who created it, or (2) users who were sent an invite AND have accepted. No one else.
    const applyInvitedAndAcceptedOnly = async (): Promise<void> => {
      const { data: invites, error: invitesError } = await supabase
        .from('invites')
        .select('event_id')
        .eq('guest_id', dbUserId)
        .eq('status', 'accepted')
      if (invitesError) {
        query = query.eq('id', '00000000-0000-0000-0000-000000000000')
        return
      }
      const acceptedEventIds = invites?.map((inv: { event_id: string }) => inv.event_id).filter(Boolean) || []
      if (acceptedEventIds.length > 0) {
        query = query.in('id', acceptedEventIds).eq('is_around_me', false)
      } else {
        query = query.eq('id', '00000000-0000-0000-0000-000000000000')
      }
    }

    if (role === 'vendor' || role === 'both') {
      if (aroundMe) {
        query = query.eq('is_around_me', true)
      } else if (myEvents) {
        query = query.eq('celebrant_id', dbUserId).eq('is_around_me', false)
      } else {
        await applyInvitedAndAcceptedOnly()
      }
    } else {
      if (aroundMe) {
        // Shows & Parties Around Me only: must have is_around_me = true (superadmin-created public events only)
        query = query.eq('is_around_me', true).gte('date', new Date().toISOString().split('T')[0])
      } else if (myEvents) {
        query = query.eq('celebrant_id', dbUserId).eq('is_around_me', false)
      } else {
        await applyInvitedAndAcceptedOnly()
      }
    }

    if (city) query = query.ilike('city', `%${city}%`)
    if (category) query = query.eq('category', category)
    if (search) {
      query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%,location.ilike.%${search}%,city.ilike.%${search}%`)
    }
    if (aroundMe) {
      query = query.gte('date', new Date().toISOString().split('T')[0])
    }
    query = query.order('date', { ascending: true })

    const { data: events, error } = await query

    if (error) {
      console.error('Error fetching events:', error)
      return errorResponse('Failed to fetch events: ' + error.message, 500)
    }

    // Calculate total BU received from transfers for each event
    let eventsWithTotals = await Promise.all(
      (events || []).map(async (event) => {
        const { data: transfers } = await supabase
          .from('transfers')
          .select('amount')
          .eq('event_id', event.id)
          .eq('status', 'completed')
        const totalBU = transfers?.reduce((sum, t) => sum + parseFloat(t.amount.toString()), 0) || 0
        return { ...event, total_bu_received: totalBU }
      })
    )

    // Shows & Parties Around Me: sort by user location (same city first, then same state, then date)
    if (aroundMe && eventsWithTotals.length > 0 && (userCity || userState)) {
      const cityLower = (userCity || '').toLowerCase()
      const stateLower = (userState || '').toLowerCase()
      eventsWithTotals = [...eventsWithTotals].sort((a, b) => {
        const aCity = (a.city || '').toLowerCase()
        const bCity = (b.city || '').toLowerCase()
        const aState = (a.state || '').toLowerCase()
        const bState = (b.state || '').toLowerCase()
        const aCityMatch = cityLower && aCity.includes(cityLower)
        const bCityMatch = cityLower && bCity.includes(cityLower)
        const aStateMatch = stateLower && aState.includes(stateLower)
        const bStateMatch = stateLower && bState.includes(stateLower)
        if (aCityMatch && !bCityMatch) return -1
        if (!aCityMatch && bCityMatch) return 1
        if (aStateMatch && !bStateMatch) return -1
        if (!aStateMatch && bStateMatch) return 1
        return (a.date || '').localeCompare(b.date || '')
      })
    }

    return successResponse({ events: eventsWithTotals })
  } catch (error: any) {
    console.error('=== GET EVENTS ERROR ===')
    console.error('Error type:', typeof error)
    console.error('Error name:', error?.name)
    console.error('Error message:', error?.message)
    console.error('Error stack:', error?.stack)
    console.error('Full error:', JSON.stringify(error, Object.getOwnPropertyNames(error), 2))
    
    // Ensure we always return a proper error response
    const errorMessage = error?.message || error?.toString() || 'Internal server error'
    console.error('Error message to return:', errorMessage)
    
    try {
      console.log('Attempting to create error response...')
      const errorResp = errorResponse(errorMessage, 500)
      console.log('Error response created successfully, status:', errorResp.status)
      console.log('Error response body:', JSON.stringify({ success: false, error: errorMessage }))
      return errorResp
    } catch (responseError: any) {
      console.error('=== FAILED TO CREATE ERROR RESPONSE ===')
      console.error('Response error:', responseError)
      console.error('Response error message:', responseError?.message)
      console.error('Falling back to direct NextResponse.json...')
      
      // Fallback: return a plain JSON response directly
      try {
        const fallbackResp = NextResponse.json(
          { success: false, error: errorMessage },
          { status: 500 }
        )
        console.log('Fallback response created, status:', fallbackResp.status)
        return fallbackResp
      } catch (fallbackError: any) {
        console.error('=== EVEN FALLBACK FAILED ===')
        console.error('Fallback error:', fallbackError)
        // Last resort - return a basic response
        return new NextResponse(
          JSON.stringify({ success: false, error: errorMessage }),
          { 
            status: 500,
            headers: { 'Content-Type': 'application/json' }
          }
        )
      }
    }
  }
}
