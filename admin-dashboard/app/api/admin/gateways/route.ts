import { NextRequest, NextResponse } from 'next/server'
import { getAdminUser } from '@/lib/api-helpers'
import { supabase } from '@/lib/supabase'
import { successResponse, errorResponse } from '@/lib/api-helpers'

// Get all gateways
export async function GET(request: NextRequest) {
  try {
    const adminUser = await getAdminUser(request)
    if (!adminUser) {
      return errorResponse('Authentication required', 401)
    }

    const searchParams = request.nextUrl.searchParams
    const limit = parseInt(searchParams.get('limit') || '100')
    const offset = parseInt(searchParams.get('offset') || '0')

    const { data: gateways, error } = await supabase
      .from('gateways')
      .select(`
        *,
        vendor:users!gateways_vendor_id_fkey(id, first_name, last_name, phone_number)
      `)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      return errorResponse('Failed to fetch gateways: ' + error.message, 500)
    }

    const formattedGateways = gateways?.map((g: any) => ({
      id: g.id,
      vendor: g.vendor ? {
        id: g.vendor.id,
        name: `${g.vendor.first_name} ${g.vendor.last_name}`,
        phoneNumber: g.vendor.phone_number,
      } : null,
      eventName: g.event_name,
      eventDate: g.event_date,
      eventTime: g.event_time,
      eventLocation: g.event_location,
      celebrantUniqueId: g.celebrant_unique_id,
      celebrantName: g.celebrant_name,
      status: g.status,
      qrCodeData: g.qr_code_data,
      createdAt: g.created_at,
    })) || []

    const { count } = await supabase
      .from('gateways')
      .select('*', { count: 'exact', head: true })

    return successResponse({
      gateways: formattedGateways,
      total: count || 0,
      limit,
      offset,
    })
  } catch (error: any) {
    console.error('Get gateways error:', error)
    return errorResponse('Internal server error', 500)
  }
}
