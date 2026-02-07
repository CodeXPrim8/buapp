import { NextRequest, NextResponse } from 'next/server'
import { getAdminUser } from '@/lib/api-helpers'
import { supabase } from '@/lib/supabase'
import { successResponse, errorResponse } from '@/lib/api-helpers'

// Create "Shows & Parties Around Me" (super admin only) - visible to all BU app users, location-sorted
export async function POST(request: NextRequest) {
  try {
    const adminUser = await getAdminUser(request)
    if (!adminUser) {
      return errorResponse('Authentication required', 401)
    }
    if (adminUser.role !== 'superadmin' && adminUser.role !== 'super_admin' && adminUser.role !== 'admin') {
      return errorResponse('Only super admin can create Shows & Parties Around Me', 403)
    }

    const body = await request.json()
    const {
      name,
      date,
      location,
      city,
      state,
      country,
      category,
      description,
      ticket_price_bu,
      max_tickets,
    } = body

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return errorResponse('Event name is required', 400)
    }
    if (!date || typeof date !== 'string' || date.trim().length === 0) {
      return errorResponse('Event date is required', 400)
    }
    if (!city || typeof city !== 'string' || city.trim().length === 0) {
      return errorResponse('City is required for Shows & Parties Around Me', 400)
    }
    const price = ticket_price_bu != null ? parseFloat(String(ticket_price_bu)) : 0
    if (isNaN(price) || price <= 0) {
      return errorResponse('Ticket price (ɃU) is required and must be greater than 0', 400)
    }

    const { data: dbUser } = await supabase
      .from('users')
      .select('id')
      .eq('id', adminUser.userId)
      .single()

    if (!dbUser?.id) {
      return errorResponse('Admin user not found in database', 401)
    }

    const eventData: Record<string, unknown> = {
      celebrant_id: dbUser.id,
      name: String(name).trim().substring(0, 200),
      date: String(date).trim(),
      location: location ? String(location).trim().substring(0, 500) : null,
      city: String(city).trim().substring(0, 100),
      state: state ? String(state).trim().substring(0, 100) : null,
      country: country ? String(country).trim().substring(0, 100) : 'Nigeria',
      category: category ? String(category).trim().substring(0, 100) : null,
      description: description ? String(description).trim().substring(0, 2000) : null,
      ticket_price_bu: price,
      max_tickets: max_tickets != null ? parseInt(String(max_tickets), 10) : null,
      tickets_sold: 0,
      total_bu_received: 0,
      withdrawn: false,
      is_around_me: true,
      is_public: true,
      tickets_enabled: true,
    }

    const { data: event, error } = await supabase
      .from('events')
      .insert([eventData])
      .select()
      .single()

    if (error) {
      console.error('Create Shows & Parties Around Me error:', error)
      return errorResponse('Failed to create event: ' + error.message, 500)
    }

    return successResponse({ event }, 201)
  } catch (error: any) {
    console.error('Create Shows & Parties Around Me error:', error)
    return errorResponse(error?.message || 'Internal server error', 500)
  }
}
