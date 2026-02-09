import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { successResponse, errorResponse, getAuthUser, validateBody } from '@/lib/api-helpers'
import { getUserByPhone } from '@/lib/auth'
import { sendPushToUser } from '@/lib/push'

// Send friend request
export async function POST(request: NextRequest) {
  try {
    const authUser = await getAuthUser(request)
    if (!authUser) {
      return errorResponse('Unauthorized', 401)
    }

    const body = await request.json()
    
    const validation = validateBody(body, {
      phone_number: (val) => typeof val === 'string' && val.length > 0,
      message: (val) => val === undefined || (typeof val === 'string' && val.length <= 140),
    })

    if (!validation.valid) {
      return errorResponse('Validation failed', 400, validation.errors)
    }

    const { phone_number, message } = body

    console.log('Friend request - Original phone:', phone_number)

    // getUserByPhone now handles all format conversions internally
    const receiver = await getUserByPhone(phone_number)

    if (!receiver) {
      console.error('User lookup failed for phone:', phone_number)
      // Check what phone numbers exist in database (for debugging)
      const { data: sampleUsers } = await supabase
        .from('users')
        .select('phone_number')
        .limit(5)
      
      console.log('Sample phone numbers in database:', sampleUsers?.map(u => u.phone_number))
      
      return errorResponse(`User not found with phone number: ${phone_number}. Please ensure the user is registered on BU app.`, 404)
    }

    if (receiver.id === authUser.userId) {
      return errorResponse('Cannot send friend request to yourself', 400)
    }

    // Check if already contacts
    const { data: existingContact } = await supabase
      .from('contacts')
      .select('id')
      .eq('user_id', authUser.userId)
      .eq('contact_id', receiver.id)
      .single()

    if (existingContact) {
      return errorResponse('User is already in your contacts', 400)
    }

    // Check for existing pending request
    const { data: existingRequest } = await supabase
      .from('friend_requests')
      .select('id, status')
      .or(`and(sender_id.eq.${authUser.userId},receiver_id.eq.${receiver.id}),and(sender_id.eq.${receiver.id},receiver_id.eq.${authUser.userId})`)
      .in('status', ['pending', 'accepted'])
      .single()

    if (existingRequest) {
      if (existingRequest.status === 'pending') {
        return errorResponse('Friend request already sent or received', 400)
      }
      if (existingRequest.status === 'accepted') {
        return errorResponse('User is already in your contacts', 400)
      }
    }

    // Check rate limit: max 5 requests/day to unconnected numbers
    const today = new Date().toISOString().split('T')[0]
    const { count: todayRequests } = await supabase
      .from('friend_requests')
      .select('id', { count: 'exact', head: true })
      .eq('sender_id', authUser.userId)
      .gte('created_at', today)

    if (todayRequests && todayRequests >= 5) {
      return errorResponse('Rate limit exceeded. Maximum 5 friend requests per day.', 429)
    }

    // Create friend request
    const { data: friendRequest, error } = await supabase
      .from('friend_requests')
      .insert({
        sender_id: authUser.userId,
        receiver_id: receiver.id,
        message: message || null,
        status: 'pending',
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
      })
      .select()
      .single()

    if (error) {
      console.error('Failed to create friend request:', error)
      return errorResponse('Failed to send friend request: ' + error.message, 500)
    }

    // Get sender's name for notification
    const { data: sender } = await supabase
      .from('users')
      .select('first_name, last_name')
      .eq('id', authUser.userId)
      .single()

    const senderName = sender 
      ? `${sender.first_name || ''} ${sender.last_name || ''}`.trim() || 'a user'
      : 'a user'

    // Verify receiver exists in database (to ensure correct UUID format)
    const { data: receiverUser, error: receiverCheckError } = await supabase
      .from('users')
      .select('id')
      .eq('id', receiver.id)
      .single()

    if (receiverCheckError || !receiverUser) {
      console.error('Receiver user not found in database:', {
        receiverId: receiver.id,
        error: receiverCheckError?.message,
      })
      // Don't fail the request, but log the error
    } else {
      // Create notification for receiver using verified user ID
      const notificationTitle = 'New Friend Request'
      const notificationMessage = `You have a new friend request from ${senderName}`
      const { error: notificationError } = await supabase
        .from('notifications')
        .insert([{
          user_id: receiverUser.id, // Use verified user ID
          type: 'friend_request',
          title: notificationTitle,
          message: notificationMessage,
          metadata: { friend_request_id: friendRequest.id, sender_id: authUser.userId },
          read: false,
        }])

      if (notificationError) {
        console.error('Failed to create friend request notification:', notificationError)
        console.error('Receiver ID:', receiverUser.id)
        console.error('Receiver ID type:', typeof receiverUser.id)
        console.error('Error details:', {
          code: notificationError.code,
          message: notificationError.message,
          details: notificationError.details,
          hint: notificationError.hint,
        })
        // Don't fail the request if notification fails - friend request was created successfully
        // But log it for debugging
      } else {
        console.log('Friend request notification created successfully for user:', receiverUser.id)
        void sendPushToUser(receiverUser.id, {
          title: notificationTitle,
          body: notificationMessage,
          data: { url: '/?page=notifications' },
        })
      }
    }

    return successResponse({ friend_request: friendRequest })
  } catch (error: any) {
    console.error('Send friend request error:', error)
    return errorResponse('Internal server error', 500)
  }
}

// Get friend requests (incoming and outgoing)
export async function GET(request: NextRequest) {
  try {
    const authUser = await getAuthUser(request)
    if (!authUser) {
      return errorResponse('Unauthorized', 401)
    }

    const searchParams = request.nextUrl.searchParams
    const type = searchParams.get('type') || 'all' // 'incoming', 'outgoing', 'all'

    let query = supabase
      .from('friend_requests')
      .select(`
        id,
        sender_id,
        receiver_id,
        status,
        message,
        created_at,
        expires_at,
        sender:sender_id (
          id,
          phone_number,
          first_name,
          last_name
        ),
        receiver:receiver_id (
          id,
          phone_number,
          first_name,
          last_name
        )
      `)

    if (type === 'incoming') {
      query = query.eq('receiver_id', authUser.userId)
    } else if (type === 'outgoing') {
      query = query.eq('sender_id', authUser.userId)
    } else {
      query = query.or(`sender_id.eq.${authUser.userId},receiver_id.eq.${authUser.userId}`)
    }

    query = query.in('status', ['pending', 'accepted', 'declined'])
      .order('created_at', { ascending: false })

    const { data: requests, error } = await query

    if (error) {
      console.error('Failed to fetch friend requests:', error)
      return errorResponse('Failed to fetch friend requests: ' + error.message, 500)
    }

    const formattedRequests = requests?.map((req: any) => ({
      id: req.id,
      sender_id: req.sender_id,
      receiver_id: req.receiver_id,
      status: req.status,
      message: req.message,
      created_at: req.created_at,
      expires_at: req.expires_at,
      sender: {
        id: req.sender?.id,
        phone_number: req.sender?.phone_number,
        first_name: req.sender?.first_name,
        last_name: req.sender?.last_name,
        name: `${req.sender?.first_name || ''} ${req.sender?.last_name || ''}`.trim(),
      },
      receiver: {
        id: req.receiver?.id,
        phone_number: req.receiver?.phone_number,
        first_name: req.receiver?.first_name,
        last_name: req.receiver?.last_name,
        name: `${req.receiver?.first_name || ''} ${req.receiver?.last_name || ''}`.trim(),
      },
      is_incoming: req.receiver_id === authUser.userId,
    })) || []

    return successResponse({ 
      requests: formattedRequests,
      incoming: formattedRequests.filter((r: any) => r.is_incoming && r.status === 'pending'),
      outgoing: formattedRequests.filter((r: any) => !r.is_incoming && r.status === 'pending'),
    })
  } catch (error: any) {
    console.error('Get friend requests error:', error)
    return errorResponse('Internal server error', 500)
  }
}
