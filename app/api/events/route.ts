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

    // Allow users registered as 'user', 'celebrant', or 'both' to create events
    // Vendors cannot create events
    if (role === 'vendor') {
      return errorResponse('Vendors cannot create events', 403)
    }

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
      tickets_enabled
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
    if (is_public !== undefined) eventData.is_public = Boolean(is_public)
    if (tickets_enabled !== undefined) eventData.tickets_enabled = Boolean(tickets_enabled)
    
    // Set tickets_sold to 0 for new events
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

// List events (celebrant's own events)
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
      .select('id')
      .eq('id', trimmedUserId)
      .single()

    console.log('User lookup result:', {
      found: !!dbUser,
      error: userError?.message,
      userId: dbUser?.id,
    })

    if (userError || !dbUser) {
      console.log('User not found by ID, trying phone number fallback')
      // Try by phone number as fallback
      if (phoneNumber) {
        const { data: userByPhone } = await supabase
          .from('users')
          .select('id')
          .eq('phone_number', phoneNumber)
          .single()
        
        if (userByPhone) {
          // Use the database user ID
          const dbUserId = userByPhone.id
          
          // Get query parameters for filtering
          const { searchParams } = new URL(request.url)
          const city = searchParams.get('city')
          const category = searchParams.get('category')
          const search = searchParams.get('search')
          const publicOnly = searchParams.get('public') === 'true'
          const ticketsOnly = searchParams.get('tickets_only') === 'true'
          const myEvents = searchParams.get('my_events') === 'true'

          // Allow vendors to view events for linking gateways
          // If role is vendor or both, show all events; otherwise show only celebrant's events or public events
          let query = supabase
            .from('events')
            .select(`
              *,
              celebrant:users!events_celebrant_id_fkey(id, phone_number, first_name, last_name)
            `)

          // Filter by role
          if (role !== 'vendor' && role !== 'both') {
            // For non-vendors (regular users and celebrants)
            if (myEvents) {
              // My Events: only show events created by this user
              query = query.eq('celebrant_id', dbUserId)
            } else if (publicOnly || ticketsOnly) {
              // Events Around Me: show public events with tickets enabled
              query = query.eq('is_public', true).eq('tickets_enabled', true)
            } else {
              // Default: show events user is invited to OR events they created
              // First, get event IDs the user is invited to
              const { data: invites } = await supabase
                .from('invites')
                .select('event_id')
                .eq('guest_id', dbUserId)
              
              const invitedEventIds = invites?.map(inv => inv.event_id) || []
              
              // Build filter: events user created OR events user is invited to
              if (invitedEventIds.length > 0) {
                // Get events created by user
                const { data: createdEvents } = await supabase
                  .from('events')
                  .select('id')
                  .eq('celebrant_id', dbUserId)
                
                // Combine event IDs: created + invited
                const createdEventIds = createdEvents?.map(e => e.id) || []
                const allEventIds = [...new Set([...createdEventIds, ...invitedEventIds])]
                
                if (allEventIds.length > 0) {
                  query = query.in('id', allEventIds)
                } else {
                  // If no events found, return empty result by filtering with non-existent ID
                  query = query.eq('id', '00000000-0000-0000-0000-000000000000')
                }
              } else {
                // If no invites, only show events created by user
                query = query.eq('celebrant_id', dbUserId)
              }
            }
          } else {
            // Vendors can see all events, but can filter for public ticket sales
            if (publicOnly || ticketsOnly) {
              query = query.eq('is_public', true).eq('tickets_enabled', true)
            }
          }

          // Filter by city
          if (city) {
            query = query.ilike('city', `%${city}%`)
          }

          // Filter by category
          if (category) {
            query = query.eq('category', category)
          }

          // Filter by search term (name, description, location)
          if (search) {
            query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%,location.ilike.%${search}%,city.ilike.%${search}%`)
          }

          // Filter by tickets enabled
          if (ticketsOnly) {
            query = query.eq('tickets_enabled', true)
          }

          // Only show future events for public browsing
          if (publicOnly || ticketsOnly) {
            query = query.gte('date', new Date().toISOString().split('T')[0])
          }

          query = query.order('date', { ascending: true })

          const { data: events, error } = await query

          if (error) {
            return errorResponse('Failed to fetch events: ' + error.message, 500)
          }

          // Calculate total BU received from transfers for each event
          const eventsWithTotals = await Promise.all(
            (events || []).map(async (event) => {
              const { data: transfers } = await supabase
                .from('transfers')
                .select('amount')
                .eq('event_id', event.id)
                .eq('status', 'completed')

              const totalBU = transfers?.reduce((sum, t) => sum + parseFloat(t.amount.toString()), 0) || 0

              return {
                ...event,
                total_bu_received: totalBU,
              }
            })
          )

          return successResponse({ events: eventsWithTotals })
        }
      }
      
      console.error('User not found in database. User ID:', userId)
      console.log('Returning 401 error response')
      const response = errorResponse('User not found. Please login again.', 401)
      console.log('Error response created:', response)
      return response
    }

    // Use the database user ID
    const dbUserId = dbUser.id

    // Get query parameters for filtering
    const { searchParams } = new URL(request.url)
    const city = searchParams.get('city')
    const category = searchParams.get('category')
    const search = searchParams.get('search')
    const publicOnly = searchParams.get('public') === 'true'
    const ticketsOnly = searchParams.get('tickets_only') === 'true'
    const myEvents = searchParams.get('my_events') === 'true'

    console.log('Fetching events for user:', {
      userId: userId,
      dbUserId: dbUserId,
      role: role,
      filters: { city, category, search, publicOnly, ticketsOnly, myEvents },
    })

    // Build query
    let query = supabase
      .from('events')
      .select(`
        *,
        celebrant:users!events_celebrant_id_fkey(id, phone_number, first_name, last_name)
      `)

    // Filter by role and parameters
    if (role !== 'vendor' && role !== 'both') {
      // For non-vendors (regular users and celebrants)
      if (myEvents) {
        // My Events: only show events created by this user
        query = query.eq('celebrant_id', dbUserId)
      } else if (publicOnly || ticketsOnly) {
        // Events Around Me: show public events with tickets enabled
        query = query.eq('is_public', true).eq('tickets_enabled', true)
      } else {
        // Default: show events user is invited to OR events they created
        // First, get event IDs the user is invited to
        const { data: invites } = await supabase
          .from('invites')
          .select('event_id')
          .eq('guest_id', dbUserId)
        
        const invitedEventIds = invites?.map(inv => inv.event_id) || []
        
        // Build filter: events user created OR events user is invited to
        if (invitedEventIds.length > 0) {
          // Get events created by user
          const { data: createdEvents } = await supabase
            .from('events')
            .select('id')
            .eq('celebrant_id', dbUserId)
          
          // Combine event IDs: created + invited
          const createdEventIds = createdEvents?.map(e => e.id) || []
          const allEventIds = [...new Set([...createdEventIds, ...invitedEventIds])]
          
          if (allEventIds.length > 0) {
            query = query.in('id', allEventIds)
          } else {
            // If no events found, return empty result by filtering with non-existent ID
            query = query.eq('id', '00000000-0000-0000-0000-000000000000')
          }
        } else {
          // If no invites, only show events created by user
          query = query.eq('celebrant_id', dbUserId)
        }
      }
    } else {
      // Vendors can see all events, but can filter for public ticket sales
      if (publicOnly || ticketsOnly) {
        query = query.eq('is_public', true).eq('tickets_enabled', true)
      }
    }

    // Filter by city
    if (city) {
      query = query.ilike('city', `%${city}%`)
    }

    // Filter by category
    if (category) {
      query = query.eq('category', category)
    }

    // Filter by search term (name, description, location)
    if (search) {
      query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%,location.ilike.%${search}%,city.ilike.%${search}%`)
    }

    // Filter by tickets enabled
    if (ticketsOnly) {
      query = query.eq('tickets_enabled', true)
    }

    // Only show future events for public browsing
    if (publicOnly || ticketsOnly) {
      query = query.gte('date', new Date().toISOString().split('T')[0])
    }

    query = query.order('date', { ascending: true })

    const { data: events, error } = await query

    if (error) {
      console.error('Error fetching events:', error)
      return errorResponse('Failed to fetch events: ' + error.message, 500)
    }

    console.log(`Found ${events?.length || 0} events for user ${dbUserId}`)

    // Calculate total BU received from transfers for each event
    const eventsWithTotals = await Promise.all(
      (events || []).map(async (event) => {
        const { data: transfers } = await supabase
          .from('transfers')
          .select('amount')
          .eq('event_id', event.id)
          .eq('status', 'completed')

        const totalBU = transfers?.reduce((sum, t) => sum + parseFloat(t.amount.toString()), 0) || 0

        return {
          ...event,
          total_bu_received: totalBU,
        }
      })
    )

    console.log(`Returning ${eventsWithTotals.length} events with totals`)
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
