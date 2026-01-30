# BU Admin Dashboard

Super Admin Dashboard for managing the Bison Note (BU) application.

## Features

- **Dashboard Overview**: System statistics and key metrics
- **User Management**: View, search, and manage all users
- **Event Management**: Monitor and manage events
- **Transaction Management**: View all BU transfers
- **Withdrawal Management**: Approve and process withdrawals
- **Payment Management**: Monitor Paystack payments
- **Gateway Management**: View and manage QR gateways

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create `.env.local` file:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_key
JWT_SECRET=your_jwt_secret
NEXT_PUBLIC_API_BASE=http://localhost:3000/api
```

3. Create an admin user in the database:
   - Register a user with role 'admin' or 'super_admin' in the main BU app
   - Or manually insert into the users table with role 'admin' or 'super_admin'

4. Run the development server:
```bash
npm run dev
```

5. Access the dashboard at: http://localhost:3001

## Admin Authentication

- Only users with `role = 'admin'` or `role = 'super_admin'` can access the dashboard
- Login uses phone number and PIN (same as main app)
- JWT tokens are stored in httpOnly cookies

## API Endpoints

All admin endpoints are prefixed with `/api/admin/`:
- `/api/admin/auth/login` - Admin login
- `/api/admin/auth/logout` - Admin logout
- `/api/admin/auth/me` - Get current admin user
- `/api/admin/stats` - Get dashboard statistics
- `/api/admin/users` - Get all users
- `/api/admin/users/[id]` - Get/update user
- `/api/admin/users/fund-wallet` - Fund user wallet
- `/api/admin/events` - Get all events
- `/api/admin/transactions` - Get all transactions
- `/api/admin/withdrawals` - Get all withdrawals
- `/api/admin/withdrawals/[id]` - Update withdrawal status
- `/api/admin/payments` - Get payment transactions
- `/api/admin/gateways` - Get all gateways

## Port

The admin dashboard runs on port **3001** by default to avoid conflicts with the main app (port 3000).

## Security

- Admin-only access (verified by role)
- JWT authentication with httpOnly cookies
- Server-side API routes with authentication checks
- Shared database with main app (read-only for most operations)
