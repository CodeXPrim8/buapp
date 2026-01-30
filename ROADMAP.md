# ɃU App - Development Roadmap

## ✅ Completed
- ✅ Database schema created (8 tables)
- ✅ RLS policies configured (8 policies)
- ✅ Supabase connection configured
- ✅ API endpoints created (10+ endpoints)
- ✅ Frontend UI complete (using localStorage)

## 🎯 Next Steps (Priority Order)

### Phase 1: Frontend-Backend Integration (Current Priority)

#### 1.1 Create API Client Utility
**File:** `lib/api-client.ts`
- Centralized API calls
- Error handling
- Auth token management
- Request/response interceptors

#### 1.2 Update Authentication
**File:** `components/auth.tsx`
- Replace localStorage registration with `/api/auth/register`
- Replace localStorage login with `/api/auth/login`
- Handle API errors
- Store auth tokens

#### 1.3 Update Gateway System
**Files:** 
- `components/vendor-gateway-setup.tsx` → Use `/api/gateways` POST
- `components/vendor-pos.tsx` → Use `/api/vendor/sales/*` endpoints

#### 1.4 Update Transfer System
**Files:**
- `components/spraying-qr.tsx` → Use `/api/transfers/gateway-qr` POST
- `components/send-bu.tsx` → Use transfer API endpoints

#### 1.5 Update Notifications
**File:** `components/notifications.tsx`
- Use `/api/notifications` GET
- Real-time updates with Supabase Realtime

### Phase 2: Missing API Endpoints

#### 2.1 Wallet Endpoints
- `GET /api/wallets/me` - Get user wallet
- `POST /api/wallets/topup` - Top up wallet
- `GET /api/wallets/transactions` - Get transactions

#### 2.2 Event Endpoints
- `POST /api/events` - Create event (celebrant)
- `GET /api/events` - List events
- `GET /api/events/[id]` - Get event details
- `PUT /api/events/[id]/withdraw` - Withdraw from event

#### 2.3 Transfer Endpoints (Additional)
- `POST /api/transfers` - Direct transfer
- `POST /api/transfers/tip` - Send tip
- `GET /api/transfers` - Get transfer history

#### 2.4 Withdrawal Endpoints
- `POST /api/withdrawals` - Create withdrawal
- `GET /api/withdrawals` - Get withdrawal history

### Phase 3: Authentication Enhancement

#### 3.1 JWT Implementation
- Replace header-based auth with JWT tokens
- Add token refresh mechanism
- Secure token storage

#### 3.2 Session Management
- Implement proper session handling
- Add logout functionality
- Token expiration handling

### Phase 4: Real-time Features

#### 4.1 Supabase Realtime
- Real-time notifications
- Real-time wallet balance updates
- Real-time transfer status updates

### Phase 5: Testing & Polish

#### 5.1 Error Handling
- Comprehensive error messages
- User-friendly error UI
- Error logging

#### 5.2 Loading States
- Loading indicators
- Skeleton screens
- Optimistic updates

#### 5.3 Testing
- Unit tests for API routes
- Integration tests
- E2E tests

## 🚀 Recommended Starting Point

**Start with Phase 1.1: Create API Client Utility**

This will make all subsequent integrations easier and more consistent.

## 📋 Quick Checklist

- [ ] Create `lib/api-client.ts`
- [ ] Update `components/auth.tsx` to use API
- [ ] Update `components/vendor-gateway-setup.tsx` to use API
- [ ] Update `components/spraying-qr.tsx` to use API
- [ ] Update `components/notifications.tsx` to use API
- [ ] Add wallet API endpoints
- [ ] Add event API endpoints
- [ ] Implement JWT authentication
- [ ] Add real-time features
- [ ] Add error handling & loading states

## 🎯 Current Status

**Backend:** ✅ Ready
**Database:** ✅ Ready
**Frontend:** ⏳ Needs API integration
**Integration:** ⏳ Not started

## 💡 Next Immediate Action

Create the API client utility, then update the authentication component to use it.
