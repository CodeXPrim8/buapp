# Backend Setup Guide

## Prerequisites
- Node.js 18+ installed
- Supabase account and project
- Supabase project URL and anon key

## Step 1: Set Up Supabase

1. Go to your Supabase project: https://cmqtnppqpksvyhtqrcqi.supabase.co
2. Navigate to SQL Editor
3. Run the SQL schema from `database/schema.sql`
4. Your Supabase credentials are already configured in `.env.local`

## Step 2: Configure Environment Variables

✅ **Environment variables are already configured!**

Your Supabase credentials have been set up in `.env.local`:
- `NEXT_PUBLIC_SUPABASE_URL`: https://cmqtnppqpksvyhtqrcqi.supabase.co
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Configured

**Note**: Make sure to add a `JWT_SECRET` for production use.

## Step 3: Install Dependencies

Dependencies are already installed, but if needed:
```bash
npm install
```

## Step 4: Test API Endpoints

Start the development server:
```bash
npm run dev
```

The API routes will be available at:
- `http://localhost:3000/api/auth/register`
- `http://localhost:3000/api/auth/login`
- `http://localhost:3000/api/gateways`
- etc.

## API Endpoints Overview

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user

### Gateways
- `POST /api/gateways` - Create gateway (vendor only)
- `GET /api/gateways` - List gateways (vendor only)
- `GET /api/gateways/[id]/qr-code` - Get QR code for gateway

### Transfers
- `POST /api/transfers/gateway-qr` - Send BU via gateway QR scan

### Vendor Sales
- `GET /api/vendor/sales/pending` - Get pending sales
- `POST /api/vendor/sales/[id]/confirm` - Confirm sale
- `POST /api/vendor/sales/[id]/issue-notes` - Issue physical notes

### Notifications
- `GET /api/notifications` - Get user notifications
- `PUT /api/notifications/[id]/read` - Mark notification as read

## Authentication Flow

Currently, the API uses header-based authentication:
- `x-user-id`: User ID
- `x-user-role`: User role (user, celebrant, vendor)

**TODO**: Implement proper JWT-based authentication

## Next Steps

1. ✅ Database schema created
2. ✅ Basic API routes created
3. ⏳ Implement JWT authentication
4. ⏳ Update frontend to use API endpoints
5. ⏳ Add error handling and validation
6. ⏳ Add real-time subscriptions
7. ⏳ Add wallet endpoints
8. ⏳ Add event endpoints
9. ⏳ Add withdrawal endpoints

## Testing

You can test the API using:
- Postman
- curl
- Frontend integration

Example registration:
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "phone_number": "+2341234567890",
    "first_name": "John",
    "last_name": "Doe",
    "role": "user",
    "pin": "1234"
  }'
```
