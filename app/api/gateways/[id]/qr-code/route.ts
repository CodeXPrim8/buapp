import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { successResponse, errorResponse, getAuthUser } from '@/lib/api-helpers'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authUser = await getAuthUser(request)
    if (!authUser) {
      return errorResponse('Unauthorized', 401)
    }

    const { id } = await params

    const { data: gateway, error } = await supabase
      .from('gateways')
      .select('*')
      .eq('id', id)
      .single()

    if (error || !gateway) {
      return errorResponse('Gateway not found', 404)
    }

    // Generate QR code URL
    const qrData = JSON.stringify(gateway.qr_code_data || {
      type: 'gateway',
      gatewayId: gateway.id,
      eventName: gateway.event_name,
      celebrantUniqueId: gateway.celebrant_unique_id,
      celebrantName: gateway.celebrant_name,
    })

    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qrData)}`

    return successResponse({
      qrCodeUrl,
      qrData: gateway.qr_code_data,
      gateway: {
        id: gateway.id,
        event_name: gateway.event_name,
        celebrant_name: gateway.celebrant_name,
      },
    })
  } catch (error: any) {
    console.error('QR code generation error:', error)
    return errorResponse(error.message || 'Internal server error', 500)
  }
}
