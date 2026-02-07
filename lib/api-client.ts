// API Client Utility
// Centralized API calls with error handling and auth management

const API_BASE = '/api'

interface ApiOptions extends RequestInit {
  requireAuth?: boolean
}

interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  errors?: string[]
}

/**
 * Get CSRF token from cookie (client-side only)
 */
function getCSRFToken(): string | null {
  if (typeof document === 'undefined') {
    return null
  }
  
  // Read CSRF token from cookie
  const cookies = document.cookie.split(';')
  const csrfCookie = cookies.find(c => c.trim().startsWith('csrf-token='))
  if (csrfCookie) {
    return csrfCookie.split('=')[1]?.trim() || null
  }
  
  return null
}

// Main API call function
// Note: Authentication is now handled via httpOnly cookies (JWT tokens)
// Cookies are automatically sent with requests, no need for manual headers
export async function apiCall<T = any>(
  endpoint: string,
  options: ApiOptions = {}
): Promise<ApiResponse<T>> {
  const { requireAuth = false, headers = {}, ...fetchOptions } = options

  // Get CSRF token for state-modifying requests
  const method = (fetchOptions.method || 'GET').toUpperCase()
  const needsCSRF = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)
  let csrfToken = needsCSRF ? getCSRFToken() : null
  
  // If CSRF token is missing for a state-modifying request, try to refresh it first
  // Only refresh if this is NOT already a GET /users/me call (to avoid infinite loop)
  if (needsCSRF && !csrfToken && endpoint !== '/users/me') {
    console.warn('[API CLIENT] CSRF token missing for', method, endpoint, '- Attempting to refresh...')
    
    // Try to get CSRF token by calling getMe directly (which sets CSRF token)
    // Use direct fetch, not apiCall, to avoid recursion
    try {
      const refreshResponse = await fetch(`${API_BASE}/users/me`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      })
      
      if (refreshResponse.ok) {
        // CSRF token should now be set in cookie, try reading it again
        csrfToken = getCSRFToken()
        if (csrfToken) {
          console.log('[API CLIENT] CSRF token refreshed successfully')
        } else {
          console.warn('[API CLIENT] CSRF token still missing after refresh attempt')
          console.warn('[API CLIENT] Available cookies:', typeof document !== 'undefined' ? document.cookie : 'N/A (SSR)')
        }
      } else {
        console.warn('[API CLIENT] Failed to refresh CSRF token - user may not be authenticated')
      }
    } catch (refreshError) {
      console.error('[API CLIENT] Failed to refresh CSRF token:', refreshError)
    }
  } else if (needsCSRF && !csrfToken) {
    console.warn('[API CLIENT] CSRF token missing for', method, endpoint)
    console.warn('[API CLIENT] Available cookies:', typeof document !== 'undefined' ? document.cookie : 'N/A (SSR)')
  }

  // Build headers
  const requestHeaders: HeadersInit = {
    'Content-Type': 'application/json',
    ...(csrfToken && { 'x-csrf-token': csrfToken }),
    ...headers,
  }

  // Note: requireAuth flag is kept for API route logic, but auth is via cookies now
  // The server will verify JWT from httpOnly cookie

  try {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...fetchOptions,
      headers: requestHeaders,
    })

    // Read response text once (can only be read once)
    let responseText = ''
    try {
      responseText = await response.text()
    } catch (readError: any) {
      console.error('Failed to read response body:', readError)
        return {
          success: false,
          error: 'Failed to read server response',
        }
      }

    // Check content type
    const contentType = response.headers.get('content-type')
    const isJSON = contentType && contentType.includes('application/json')

    // Handle empty response
    if (!responseText || responseText.trim() === '') {
      console.error('Empty response body from:', endpoint)
      console.error('Response status:', response.status)
      console.error('Response headers:', Object.fromEntries(response.headers.entries()))
      return {
        success: false,
        error: `Server returned empty response (${response.status})`,
        status: response.status,
      }
    }
    
    // Check if response is just "{}"
    if (responseText.trim() === '{}') {
      console.error('Response is empty JSON object:', endpoint)
      console.error('Response status:', response.status)
      return {
        success: false,
        error: `Server returned empty JSON object (${response.status}). Check server logs.`,
        status: response.status,
      }
    }

    // Parse JSON if content type indicates JSON, or try to parse anyway
    let data
    if (!isJSON) {
      console.warn('Response is not marked as JSON, but attempting to parse:', endpoint)
    }

    try {
      data = JSON.parse(responseText)
      
      // Check if parsed data is effectively empty
      if (data && typeof data === 'object' && Object.keys(data).length === 0) {
        console.error('Parsed JSON is an empty object:', endpoint)
        console.error('This usually means the server returned an error but the body is empty')
        console.error('Response status:', response.status)
        // Don't return early - let the error handling below deal with it
      }
    } catch (jsonError: any) {
      console.error('Failed to parse JSON response:', jsonError)
      console.error('Response status:', response.status)
      console.error('Response text:', responseText)
      return {
        success: false,
        error: `Server returned invalid JSON (${response.status}): ${jsonError.message}`,
      }
    }

    if (!response.ok) {
      // Log all response details
      const responseDetails = {
        endpoint,
        status: response.status,
        statusText: response.statusText,
        responseTextLength: responseText.length,
        responseText: responseText,
        parsedData: data,
        dataType: typeof data,
        dataKeys: data ? Object.keys(data) : [],
        isEmptyObject: data && typeof data === 'object' && Object.keys(data).length === 0,
        contentType: contentType,
        headers: Object.fromEntries(response.headers.entries()),
      }
      
      // Log error details (but not for 401 - expected when not authenticated)
      if (response.status !== 401) {
        console.error(`API Error [${endpoint}]:`, response.status, response.statusText)
      }
      
      // If response is empty, log a warning (but not for 401)
      if (responseText.trim() === '' || responseText.trim() === '{}') {
        if (response.status !== 401) {
          console.error('Empty response body from server')
        }
      }
      
      // Extract error message from various possible formats
      let errorMessage = `Request failed with status ${response.status}`
      
      // First, try to extract from parsed data
      if (data && typeof data === 'object' && data !== null) {
        const keys = Object.keys(data)
        if (keys.length > 0) {
          // Check for error field first (most common format: { success: false, error: "message" })
          if (data.error !== undefined && data.error !== null && String(data.error).trim() !== '') {
            errorMessage = String(data.error).trim() // Ensure it's a string and trim whitespace
          } else if (data.errors && Array.isArray(data.errors) && data.errors.length > 0) {
            // Handle array of errors
            errorMessage = data.errors.join(', ')
          } else if (data.message) {
            errorMessage = data.message
          } else if (data.msg) {
            errorMessage = data.msg
          } else if (data.detail) {
            errorMessage = data.detail
          } else {
            // Fallback to stringify if we have data but no recognized error field
            errorMessage = `Server error: ${JSON.stringify(data)}`
          }
        }
      } else if (data !== null && data !== undefined && typeof data !== 'object') {
        errorMessage = String(data)
      }
      
      // If parsed data is empty or doesn't have error, try parsing responseText again
      if ((!data || (typeof data === 'object' && Object.keys(data).length === 0)) && responseText && responseText.trim() !== '' && responseText.trim() !== '{}') {
        try {
          // Try to parse the response text again to extract error
          const parsedResponse = JSON.parse(responseText)
          if (parsedResponse && typeof parsedResponse === 'object') {
            if (parsedResponse.error) {
              errorMessage = parsedResponse.error
            } else if (parsedResponse.message) {
              errorMessage = parsedResponse.message
            } else if (Object.keys(parsedResponse).length > 0) {
              // If we have a valid parsed object, use it
              errorMessage = JSON.stringify(parsedResponse)
            }
          }
        } catch (parseError) {
          // If parsing fails, use the response text directly
          if (responseText.length < 200) {
            errorMessage = responseText
          } else {
            errorMessage = responseText.substring(0, 200)
          }
        }
      }
      
      // Final fallback
      if (!errorMessage || errorMessage.trim() === '' || errorMessage === `Request failed with status ${response.status}`) {
        errorMessage = response.statusText || `Server error (${response.status}). Check server logs for details.`
      }
      
      // Ensure we always have a valid error message
      if (!errorMessage || errorMessage.trim() === '') {
        errorMessage = `Request failed with status ${response.status}. Please check server logs.`
      }
      
      const errorResponse = {
        success: false,
        error: errorMessage,
        ...(data?.errors && { errors: data.errors }),
        status: response.status,
      }
      
      // Don't log 401 errors (expected when not authenticated)
      if (response.status !== 401) {
        // Log the actual error message clearly
        console.error(`API Error [${endpoint}]:`, response.status, response.statusText)
        console.error('Error message:', errorMessage)
        if (data?.errors) {
          console.error('Validation errors:', data.errors)
        }
      }
      
      return errorResponse
    }

    const successResponse = {
      success: true,
      data: data?.data || data,
    }
    
    console.log('Returning success response:', {
      success: successResponse.success,
      hasData: !!successResponse.data,
    })
    
    return successResponse
  } catch (error: any) {
    console.error(`API call error [${endpoint}]:`, error?.message || error)
    
    const errorResponse = {
      success: false,
      error: error?.message || error?.toString() || 'Network error occurred',
    }
    
    return errorResponse
  }
}

// Convenience methods
export const api = {
  // GET request
  get: <T = any>(endpoint: string, requireAuth = false) =>
    apiCall<T>(endpoint, { method: 'GET', requireAuth }),

  // POST request
  post: <T = any>(endpoint: string, body?: any, requireAuth = false) =>
    apiCall<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(body),
      requireAuth,
    }),

  // PUT request
  put: <T = any>(endpoint: string, body?: any, requireAuth = false) =>
    apiCall<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(body),
      requireAuth,
    }),

  // DELETE request
  delete: <T = any>(endpoint: string, requireAuth = false) =>
    apiCall<T>(endpoint, { method: 'DELETE', requireAuth }),
}

// Auth API
export const authApi = {
  register: (data: {
    phone_number: string
    first_name: string
    last_name: string
    email?: string
    role: 'user' | 'celebrant' | 'vendor'
    pin: string
  }) => api.post('/auth/register', data),

  login: (data: { phone_number: string; pin: string }) =>
    api.post('/auth/login', data),

  logout: () => api.post('/auth/logout', {}, true),
}

// Gateway API
export const gatewayApi = {
  create: (data: {
    event_name: string
    event_date: string
    event_time?: string
    event_location?: string
    celebrant_unique_id: string
    celebrant_name: string
  }) => api.post('/gateways', data, true),

  list: () => api.get('/gateways', true),

  getQRCode: (id: string) => api.get(`/gateways/${id}/qr-code`, true),
}

// Transfer API
export const transferApi = {
  sendViaGatewayQR: (data: {
    gateway_id: string
    amount: number
    message?: string
    guest_user_id: string
    guest_name: string
    guest_phone: string
    pin: string
  }) => api.post('/transfers/gateway-qr', data, true),

  send: (data: {
    receiver_id: string
    amount: number
    message?: string
    pin: string
    type?: 'transfer' | 'tip'
  }) => api.post('/transfers', data, true),

  list: (limit?: number, offset?: number) => {
    const params = new URLSearchParams()
    if (limit) params.append('limit', limit.toString())
    if (offset) params.append('offset', offset.toString())
    return api.get(`/transfers?${params.toString()}`, true)
  },

  get: (id: string) => api.get(`/transfers/${id}`, true),
}

// Wallet API
export const walletApi = {
  getMe: () => api.get('/wallets/me', true),
  
  getTransactions: (limit?: number, offset?: number) => {
    const params = new URLSearchParams()
    if (limit) params.append('limit', limit.toString())
    if (offset) params.append('offset', offset.toString())
    return api.get(`/wallets/transactions?${params.toString()}`, true)
  },

  topup: (amount: number) => api.post('/wallets/topup', { amount }, true),
}

// User API
export const userApi = {
  getMe: () => api.get('/users/me', true),
  
  update: (data: {
    first_name?: string
    last_name?: string
    email?: string
    upgrade_to_vendor?: boolean
    current_pin?: string
    new_pin?: string
  }) => api.put('/users/me', data, true),

  search: (query: string, manual?: boolean) => api.get(`/users/search?q=${encodeURIComponent(query)}${manual ? '&manual=true' : ''}`, true),

  list: (search?: string, limit?: number, offset?: number) => {
    const params = new URLSearchParams()
    if (search) params.append('search', search)
    if (limit) params.append('limit', limit.toString())
    if (offset) params.append('offset', offset.toString())
    return api.get(`/users/list?${params.toString()}`, true)
  },
}

// Events API
export const eventsApi = {
  create: (data: {
    name: string
    date: string
    location?: string
    gateway_id?: string
    max_guests?: number
    strictly_by_invitation?: boolean
    city?: string
    state?: string
    country?: string
    category?: string
    description?: string
    ticket_price_bu?: number
    max_tickets?: number
    is_around_me?: boolean
  }) => api.post('/events', data, true),

  list: (params?: { city?: string; category?: string; search?: string; around_me?: boolean; my_events?: boolean; user_city?: string; user_state?: string }) => {
    const queryParams = new URLSearchParams()
    if (params?.city) queryParams.append('city', params.city)
    if (params?.category) queryParams.append('category', params.category)
    if (params?.search) queryParams.append('search', params.search)
    if (params?.around_me) queryParams.append('around_me', 'true')
    if (params?.my_events) queryParams.append('my_events', 'true')
    if (params?.user_city) queryParams.append('user_city', params.user_city)
    if (params?.user_state) queryParams.append('user_state', params.user_state)
    const queryString = queryParams.toString()
    return api.get(`/events${queryString ? `?${queryString}` : ''}`, true)
  },

  get: (id: string) => api.get(`/events/${id}`, true),

  withdraw: (id: string) => api.post(`/events/${id}/withdraw`, {}, true),

  markDone: (id: string) => api.put(`/events/${id}/mark-done`, {}, true),

  delete: (id: string) => api.delete(`/events/${id}/delete`, true),
}

// Tickets API
export const ticketsApi = {
  purchase: (eventId: string, quantity: number, pin: string) =>
    api.post('/tickets/purchase', { event_id: eventId, quantity, pin }, true),
  
  list: (type?: 'purchased' | 'upcoming') => {
    const params = new URLSearchParams()
    if (type) params.append('type', type)
    return api.get(`/tickets?${params.toString()}`, true)
  },
}

// Notification API
export const notificationApi = {
  list: () => api.get('/notifications', true),

  markAsRead: (id: string) => api.put(`/notifications/${id}/read`, {}, true),
  
  markAllAsRead: () => api.put('/notifications/read-all', {}, true),
}

// Vendor Sales API
export const vendorSalesApi = {
  getPending: (gatewayId?: string) => {
    const endpoint = gatewayId && gatewayId !== 'all'
      ? `/vendor/sales/pending?gateway_id=${gatewayId}`
      : '/vendor/sales/pending'
    return api.get(endpoint, true)
  },

  confirm: (id: string) => api.post(`/vendor/sales/${id}/confirm`, {}, true),

  issueNotes: (id: string) => api.post(`/vendor/sales/${id}/issue-notes`, {}, true),
}

// Withdrawals API
export const withdrawalsApi = {
  create: (data: {
    bu_amount: number
    naira_amount: number
    type: 'bank' | 'wallet'
    bank_name?: string
    account_number?: string
    account_name?: string
    wallet_address?: string
    event_id?: string
    pin: string
  }) => api.post('/withdrawals', data, true),

  list: (limit?: number, offset?: number) => {
    const params = new URLSearchParams()
    if (limit) params.append('limit', limit.toString())
    if (offset) params.append('offset', offset.toString())
    return api.get(`/withdrawals?${params.toString()}`, true)
  },
}

// Invites API
export const invitesApi = {
  create: (data: {
    event_id: string
    guest_ids: string[]
    gate?: string
    seat?: string
    seat_category?: string | string[]
  }) => api.post('/invites', data, true),

  list: (type?: 'received' | 'sent', eventId?: string) => {
    const params = new URLSearchParams()
    if (type) params.append('type', type)
    if (eventId) params.append('event_id', eventId)
    return api.get(`/invites?${params.toString()}`, true)
  },

  accept: (id: string) => api.post(`/invites/${id}/accept`, {}, true),

  decline: (id: string) => api.post(`/invites/${id}/decline`, {}, true),

  validate: (qrData: string | object) => {
    const data = typeof qrData === 'string' ? { qr_data: qrData } : { qr_data: JSON.stringify(qrData) }
    return api.post('/invites/validate', data, true)
  },
}

// Contacts API
export const contactsApi = {
  list: () => api.get('/contacts', true),
}

// Friend Requests API
export const friendRequestsApi = {
  send: (data: {
    phone_number: string
    message?: string
  }) => api.post('/friend-requests', data, true),

  list: (type?: 'incoming' | 'outgoing' | 'all') => {
    const params = new URLSearchParams()
    if (type) params.append('type', type)
    return api.get(`/friend-requests?${params.toString()}`, true)
  },

  accept: (id: string) => api.put(`/friend-requests/${id}`, { action: 'accept' }, true),

  decline: (id: string) => api.put(`/friend-requests/${id}`, { action: 'decline' }, true),

  block: (id: string) => api.put(`/friend-requests/${id}`, { action: 'block' }, true),

  cancel: (id: string) => api.put(`/friend-requests/${id}`, { action: 'cancel' }, true),
}
