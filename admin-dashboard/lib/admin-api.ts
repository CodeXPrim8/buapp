// Admin API Client
// Use relative path for same-origin requests (admin dashboard has its own API routes)
const API_BASE = process.env.NEXT_PUBLIC_API_BASE || '/api'

interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  errors?: string[]
}

async function apiCall<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const { headers = {}, ...fetchOptions } = options

  const requestHeaders: HeadersInit = {
    'Content-Type': 'application/json',
    ...headers,
  }

  try {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...fetchOptions,
      headers: requestHeaders,
      credentials: 'include', // Include cookies for auth
    })

    const data = await response.json()

    if (!response.ok) {
      return {
        success: false,
        error: data.error || `HTTP ${response.status}`,
        errors: data.errors,
      }
    }

    return {
      success: true,
      data: data.data || data,
    }
  } catch (error: any) {
    console.error(`API call error [${endpoint}]:`, error)
    return {
      success: false,
      error: error?.message || 'Network error occurred',
    }
  }
}

// Admin API methods
export const adminApi = {
  // Auth
  login: (phoneNumber: string, pin: string) =>
    apiCall('/admin/auth/login', {
      method: 'POST',
      body: JSON.stringify({ phone_number: phoneNumber, pin }),
    }),

  logout: () => apiCall('/admin/auth/logout', { method: 'POST' }),

  getMe: () => apiCall('/admin/auth/me'),

  // Stats
  getStats: () => apiCall('/admin/stats'),

  // Users
  getUsers: (params?: { search?: string; role?: string; limit?: number; offset?: number }) => {
    const queryParams = new URLSearchParams()
    if (params?.search) queryParams.append('search', params.search)
    if (params?.role) queryParams.append('role', params.role)
    if (params?.limit) queryParams.append('limit', params.limit.toString())
    if (params?.offset) queryParams.append('offset', params.offset.toString())
    return apiCall(`/admin/users?${queryParams.toString()}`)
  },

  getUser: (id: string) => apiCall(`/admin/users/${id}`),

  updateUser: (id: string, data: any) =>
    apiCall(`/admin/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  fundWallet: (userId: string, amount: number) =>
    apiCall('/admin/users/fund-wallet', {
      method: 'POST',
      body: JSON.stringify({ user_id: userId, amount }),
    }),

  // Events
  getEvents: (params?: { search?: string; around_me?: boolean; limit?: number; offset?: number }) => {
    const queryParams = new URLSearchParams()
    if (params?.search) queryParams.append('search', params.search)
    if (params?.around_me) queryParams.append('around_me', 'true')
    if (params?.limit) queryParams.append('limit', params.limit.toString())
    if (params?.offset) queryParams.append('offset', params.offset.toString())
    return apiCall(`/admin/events?${queryParams.toString()}`)
  },

  getEvent: (id: string) => apiCall(`/admin/events/${id}`),

  updateEvent: (id: string, data: { name?: string; date?: string; location?: string; city?: string; state?: string; category?: string; description?: string; ticket_price_bu?: number; max_tickets?: number | null }) =>
    apiCall(`/admin/events/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),

  // Transactions
  getTransactions: (params?: { type?: string; status?: string; limit?: number; offset?: number; startDate?: string; endDate?: string }) => {
    const queryParams = new URLSearchParams()
    if (params?.type) queryParams.append('type', params.type)
    if (params?.status) queryParams.append('status', params.status)
    if (params?.limit) queryParams.append('limit', params.limit.toString())
    if (params?.offset) queryParams.append('offset', params.offset.toString())
    if (params?.startDate) queryParams.append('start_date', params.startDate)
    if (params?.endDate) queryParams.append('end_date', params.endDate)
    return apiCall(`/admin/transactions?${queryParams.toString()}`)
  },

  getTransaction: (id: string) => apiCall(`/admin/transactions/${id}`),

  // Withdrawals
  getWithdrawals: (params?: { status?: string; limit?: number; offset?: number }) => {
    const queryParams = new URLSearchParams()
    if (params?.status) queryParams.append('status', params.status)
    if (params?.limit) queryParams.append('limit', params.limit.toString())
    if (params?.offset) queryParams.append('offset', params.offset.toString())
    return apiCall(`/admin/withdrawals?${queryParams.toString()}`)
  },

  updateWithdrawal: (id: string, status: string) =>
    apiCall(`/admin/withdrawals/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    }),

  sendWithdrawalPaystack: (id: string) =>
    apiCall(`/admin/withdrawals/${id}/paystack-transfer`, {
      method: 'POST',
    }),

  // Payments
  getPayments: (params?: { limit?: number; offset?: number; startDate?: string; endDate?: string }) => {
    const queryParams = new URLSearchParams()
    if (params?.limit) queryParams.append('limit', params.limit.toString())
    if (params?.offset) queryParams.append('offset', params.offset.toString())
    if (params?.startDate) queryParams.append('start_date', params.startDate)
    if (params?.endDate) queryParams.append('end_date', params.endDate)
    return apiCall(`/admin/payments?${queryParams.toString()}`)
  },

  // Gateways
  getGateways: (params?: { limit?: number; offset?: number }) => {
    const queryParams = new URLSearchParams()
    if (params?.limit) queryParams.append('limit', params.limit.toString())
    if (params?.offset) queryParams.append('offset', params.offset.toString())
    return apiCall(`/admin/gateways?${queryParams.toString()}`)
  },

  // Reports
  generateReport: (type: string, params?: { startDate?: string; endDate?: string }) =>
    apiCall('/admin/reports/generate', {
      method: 'POST',
      body: JSON.stringify({ type, ...params }),
    }),
}
