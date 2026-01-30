import { NextRequest, NextResponse } from 'next/server'
import { getAdminUser } from '@/lib/api-helpers'
import { supabase } from '@/lib/supabase'
import { successResponse, errorResponse } from '@/lib/api-helpers'

// Get all users (admin only)
export async function GET(request: NextRequest) {
  try {
    const adminUser = await getAdminUser(request)
    if (!adminUser) {
      return errorResponse('Authentication required', 401)
    }

    const searchParams = request.nextUrl.searchParams
    const search = searchParams.get('search') || ''
    const role = searchParams.get('role') || ''
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Build query
    let query = supabase
      .from('users')
      .select(`
        id,
        phone_number,
        first_name,
        last_name,
        email,
        role,
        created_at,
        updated_at
      `)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    // Apply filters
    if (role) {
      query = query.eq('role', role)
    }

    if (search && search.length >= 2) {
      const normalizedSearch = search.replace(/\D/g, '')
      query = query.or(
        `first_name.ilike.%${search}%,last_name.ilike.%${search}%,phone_number.ilike.%${search}%,phone_number.ilike.%${normalizedSearch}%`
      )
    }

    const { data: users, error } = await query

    if (error) {
      return errorResponse('Failed to fetch users: ' + error.message, 500)
    }

    // Get wallet balances for each user
    const usersWithWallets = await Promise.all(
      (users || []).map(async (user) => {
        const { data: wallet } = await supabase
          .from('wallets')
          .select('balance, naira_balance')
          .eq('user_id', user.id)
          .single()

        return {
          id: user.id,
          phoneNumber: user.phone_number,
          name: `${user.first_name} ${user.last_name}`,
          firstName: user.first_name,
          lastName: user.last_name,
          email: user.email,
          role: user.role,
          balance: wallet ? parseFloat(wallet.balance || '0') : 0,
          nairaBalance: wallet ? parseFloat(wallet.naira_balance || '0') : 0,
          createdAt: user.created_at,
          updatedAt: user.updated_at,
        }
      })
    )

    // Get total count
    let countQuery = supabase.from('users').select('*', { count: 'exact', head: true })
    if (role) {
      countQuery = countQuery.eq('role', role)
    }
    if (search) {
      const normalizedSearch = search.replace(/\D/g, '')
      countQuery = countQuery.or(
        `first_name.ilike.%${search}%,last_name.ilike.%${search}%,phone_number.ilike.%${search}%,phone_number.ilike.%${normalizedSearch}%`
      )
    }
    const { count } = await countQuery

    return successResponse({
      users: usersWithWallets,
      total: count || 0,
      limit,
      offset,
    })
  } catch (error: any) {
    console.error('Get users error:', error)
    return errorResponse('Internal server error', 500)
  }
}
