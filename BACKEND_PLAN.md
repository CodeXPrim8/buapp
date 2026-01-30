# Backend Implementation Plan

## Architecture Overview
- **Frontend**: Next.js 16 (App Router) - Already implemented
- **Backend**: Next.js API Routes + Supabase
- **Database**: Supabase PostgreSQL
- **Authentication**: Supabase Auth + Custom PIN system
- **Real-time**: Supabase Realtime subscriptions

## Database Schema

### Tables Needed:

1. **users**
   - id (uuid, primary key)
   - phone_number (text, unique)
   - first_name (text)
   - last_name (text)
   - email (text, nullable)
   - role (enum: 'user', 'celebrant', 'vendor')
   - pin_hash (text) - Hashed PIN
   - created_at (timestamp)
   - updated_at (timestamp)

2. **wallets**
   - id (uuid, primary key)
   - user_id (uuid, foreign key -> users.id)
   - balance (numeric) - BU balance
   - naira_balance (numeric) - Equivalent Naira
   - created_at (timestamp)
   - updated_at (timestamp)

3. **gateways**
   - id (uuid, primary key)
   - vendor_id (uuid, foreign key -> users.id)
   - event_name (text)
   - event_date (date)
   - event_time (time, nullable)
   - event_location (text, nullable)
   - celebrant_unique_id (text) - Phone number
   - celebrant_name (text)
   - status (text) - 'active', 'inactive'
   - qr_code_data (jsonb) - QR code payload
   - created_at (timestamp)
   - updated_at (timestamp)

4. **events**
   - id (uuid, primary key)
   - celebrant_id (uuid, foreign key -> users.id)
   - gateway_id (uuid, foreign key -> gateways.id, nullable)
   - name (text)
   - date (date)
   - location (text, nullable)
   - total_bu_received (numeric, default 0)
   - withdrawn (boolean, default false)
   - vendor_name (text)
   - created_at (timestamp)
   - updated_at (timestamp)

5. **transfers**
   - id (uuid, primary key)
   - sender_id (uuid, foreign key -> users.id)
   - receiver_id (uuid, foreign key -> users.id, nullable) - For direct transfers
   - event_id (uuid, foreign key -> events.id, nullable)
   - gateway_id (uuid, foreign key -> gateways.id, nullable)
   - amount (numeric)
   - message (text, nullable)
   - type (text) - 'transfer', 'tip', 'gateway_qr', 'manual_sale'
   - status (text) - 'pending', 'completed', 'failed'
   - source (text) - 'gateway_qr_scan', 'manual_sale', 'direct'
   - created_at (timestamp)

6. **vendor_pending_sales**
   - id (uuid, primary key)
   - transfer_id (uuid, foreign key -> transfers.id)
   - gateway_id (uuid, foreign key -> gateways.id)
   - vendor_id (uuid, foreign key -> users.id)
   - guest_name (text)
   - guest_phone (text, nullable)
   - amount (numeric)
   - status (text) - 'pending', 'confirmed', 'notes_issued'
   - created_at (timestamp)
   - updated_at (timestamp)

7. **notifications**
   - id (uuid, primary key)
   - user_id (uuid, foreign key -> users.id)
   - type (text) - 'transfer_received', 'transfer_sent', 'event_invite', etc.
   - title (text)
   - message (text)
   - amount (numeric, nullable)
   - read (boolean, default false)
   - metadata (jsonb) - Additional data
   - created_at (timestamp)

8. **withdrawals**
   - id (uuid, primary key)
   - user_id (uuid, foreign key -> users.id)
   - event_id (uuid, foreign key -> events.id, nullable)
   - bu_amount (numeric)
   - naira_amount (numeric)
   - type (text) - 'bank', 'wallet'
   - bank_name (text, nullable)
   - account_number (text, nullable)
   - account_name (text, nullable)
   - wallet_address (text, nullable)
   - status (text) - 'pending', 'processing', 'completed', 'failed'
   - created_at (timestamp)
   - completed_at (timestamp, nullable)

## API Routes Structure

### Authentication
- POST /api/auth/register
- POST /api/auth/login
- POST /api/auth/verify-pin
- POST /api/auth/logout

### Users
- GET /api/users/me
- PUT /api/users/me

### Wallets
- GET /api/wallets/me
- POST /api/wallets/topup
- GET /api/wallets/transactions

### Gateways
- POST /api/gateways
- GET /api/gateways
- GET /api/gateways/[id]
- GET /api/gateways/[id]/qr-code

### Events
- POST /api/events
- GET /api/events
- GET /api/events/[id]
- PUT /api/events/[id]/withdraw

### Transfers
- POST /api/transfers
- POST /api/transfers/gateway-qr
- GET /api/transfers
- GET /api/transfers/[id]

### Vendor Sales
- GET /api/vendor/sales/pending
- POST /api/vendor/sales/[id]/confirm
- POST /api/vendor/sales/[id]/issue-notes

### Notifications
- GET /api/notifications
- PUT /api/notifications/[id]/read
- PUT /api/notifications/read-all

### Withdrawals
- POST /api/withdrawals
- GET /api/withdrawals

## Implementation Steps

1. Set up Supabase client and configuration
2. Create database schema (SQL migrations)
3. Create TypeScript types/interfaces
4. Create API route handlers
5. Create utility functions (auth, validation, etc.)
6. Update frontend components to use API
7. Add error handling and validation
8. Add real-time subscriptions for notifications
