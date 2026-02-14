import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { successResponse, errorResponse, validateBody, getAuthUser } from '@/lib/api-helpers'

// Create gateway
export async function POST(request: NextRequest) {
  try {
    const authUser = await getAuthUser(request)
    // Allow vendors, celebrants, and users with 'both' role to create gateways
    if (!authUser || (authUser.role !== 'vendor' && authUser.role !== 'both' && authUser.role !== 'celebrant')) {
      return errorResponse('Unauthorized. Only vendors or celebrants can create gateways.', 401)
    }

    const body = await request.json()
    
    // If event_id is provided, link to existing event; otherwise require manual entry
    const { event_id, event_name, event_date, event_time, event_location, celebrant_unique_id, celebrant_name } = body

    let eventData: any = null
    let celebrantData: any = null

    // If event_id is provided, fetch event and celebrant details
    if (event_id) {
      const { data: event, error: eventError } = await supabase
        .from('events')
        .select(`
          *,
          celebrant:users!events_celebrant_id_fkey(id, phone_number, first_name, last_name)
        `)
        .eq('id', event_id)
        .single()

      if (eventError || !event) {
        return errorResponse('Event not found. Please select a valid event.', 404)
      }

      eventData = event
      celebrantData = event.celebrant

      console.log('Event fetched:', {
        eventId: event?.id,
        eventName: event?.name,
        hasCelebrant: !!event?.celebrant,
        celebrantData: event?.celebrant,
      })

      if (!celebrantData) {
        console.error('Celebrant data missing from event:', {
          eventId: event_id,
          eventName: event?.name,
          eventCelebrantId: event?.celebrant_id,
        })
        return errorResponse('Celebrant not found for this event. The event may not have a valid celebrant.', 404)
      }
    } else {
      // Manual entry - validate required fields
      const validation = validateBody(body, {
        event_name: (val) => typeof val === 'string' && val.length > 0,
        event_date: (val) => typeof val === 'string' && val.length > 0,
        celebrant_unique_id: (val) => typeof val === 'string' && val.length > 0,
        celebrant_name: (val) => typeof val === 'string' && val.length > 0,
      })

      if (!validation.valid) {
        return errorResponse('Validation failed', 400, validation.errors)
      }

      // Verify celebrant exists
      const { data: celebrant } = await supabase
        .from('users')
        .select('id, phone_number, first_name, last_name')
        .eq('phone_number', celebrant_unique_id)
        .single()

      if (!celebrant) {
        return errorResponse('Celebrant not found. Please verify the phone number.', 404)
      }

      celebrantData = celebrant
    }

    // Use event data from database or manual entry
    const finalEventName = eventData?.name || event_name
    const finalEventDate = eventData?.date || event_date
    const finalEventTime = eventData?.time || event_time
    const finalEventLocation = eventData?.location || event_location
    const finalCelebrantId = celebrantData?.phone_number || celebrant_unique_id
    const finalCelebrantName = celebrantData ? `${celebrantData.first_name} ${celebrantData.last_name}` : celebrant_name

    // Validate required fields
    if (!finalEventName || !finalEventDate || !finalCelebrantId || !finalCelebrantName) {
      console.error('Missing required fields:', {
        eventName: finalEventName,
        eventDate: finalEventDate,
        celebrantId: finalCelebrantId,
        celebrantName: finalCelebrantName,
        hasEventData: !!eventData,
        hasCelebrantData: !!celebrantData,
      })
      return errorResponse('Missing required fields. Please ensure event and celebrant data are complete.', 400)
    }

    // Generate QR code data
    const qrCodeData = {
      type: 'gateway',
      gatewayId: '', // Will be set after creation
      eventId: event_id || null,
      eventName: finalEventName,
      celebrantUniqueId: finalCelebrantId,
      celebrantName: finalCelebrantName,
    }

    // Create gateway
    const gatewayData: any = {
      vendor_id: authUser.userId,
      event_name: finalEventName,
      event_date: finalEventDate, // Should be in YYYY-MM-DD format
      event_time: finalEventTime || null,
      event_location: finalEventLocation || null,
      celebrant_unique_id: finalCelebrantId,
      celebrant_name: finalCelebrantName,
      status: 'active',
      qr_code_data: qrCodeData,
    }

    // Ensure date is in correct format (YYYY-MM-DD)
    if (gatewayData.event_date && typeof gatewayData.event_date === 'string') {
      // If date includes time, extract just the date part
      const dateOnly = gatewayData.event_date.split('T')[0]
      gatewayData.event_date = dateOnly
    }

    // Only add event_id if it exists
    if (event_id) {
      gatewayData.event_id = event_id
    }

    console.log('Creating gateway with data:', {
      vendor_id: gatewayData.vendor_id,
      event_id: gatewayData.event_id || 'null',
      event_name: gatewayData.event_name,
      celebrant_name: gatewayData.celebrant_name,
    })

    let { data: gateway, error } = await supabase
      .from('gateways')
      .insert([gatewayData])
      .select()
      .single()

    // If error is about missing event_id column, try without it
    if (error && event_id && (error.code === '42703' || error.message?.includes('column "event_id"') || error.message?.includes('does not exist'))) {
      console.warn('event_id column not found, creating gateway without event_id link')
      delete gatewayData.event_id
      
      // Retry without event_id
      const retryResult = await supabase
        .from('gateways')
        .insert([gatewayData])
        .select()
        .single()
      
      if (retryResult.error) {
        error = retryResult.error
      } else {
        gateway = retryResult.data
        error = null
      }
    }

    if (error) {
      console.error('Gateway creation error:', error)
      console.error('Error code:', error.code)
      console.error('Error message:', error.message)
      console.error('Error details:', error.details)
      console.error('Error hint:', error.hint)
      
      // Provide helpful error message
      if (error.code === '42703' || error.message?.includes('column') || error.message?.includes('does not exist')) {
        return errorResponse('Database schema error. Please run the migration: database/add-event-id-to-gateways.sql in Supabase SQL Editor', 500)
      }
      
      return errorResponse(`Failed to create gateway: ${error.message || 'Unknown error'}`, 500)
    }

    if (!gateway) {
      console.error('Gateway creation returned null')
      return errorResponse('Failed to create gateway: No data returned', 500)
    }

    // Update QR code data with actual gateway ID
    const updatedQrData = { ...qrCodeData, gatewayId: gateway.id }
    await supabase
      .from('gateways')
      .update({ qr_code_data: updatedQrData })
      .eq('id', gateway.id)

    return successResponse({
      gateway: { ...gateway, qr_code_data: updatedQrData },
      message: 'Gateway created successfully',
    }, 201)
  } catch (error: any) {
    console.error('Gateway creation error:', error)
    console.error('Error type:', typeof error)
    console.error('Error stack:', error?.stack)
    console.error('Error message:', error?.message)
    console.error('Full error:', JSON.stringify(error, null, 2))
    return errorResponse(error?.message || 'Internal server error', 500)
  }
}

// Get gateways (for vendor)
export async function GET(request: NextRequest) {
  try {
    const authUser = await getAuthUser(request)
    // Allow vendors and users with 'both' role to view gateways
    if (!authUser || (authUser.role !== 'vendor' && authUser.role !== 'both')) {
      return errorResponse('Unauthorized', 401)
    }

    const { data: gateways, error } = await supabase
      .from('gateways')
      .select('*')
      .eq('vendor_id', authUser.userId)
      .order('created_at', { ascending: false })

    if (error) {
      return errorResponse('Failed to fetch gateways', 500)
    }

    return successResponse({ gateways })
  } catch (error: any) {
    console.error('Get gateways error:', error)
    return errorResponse(error.message || 'Internal server error', 500)
  }
}
