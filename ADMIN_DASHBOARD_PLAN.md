# Super Admin Dashboard - Architecture Plan

## BU App Overview

### Core Concept
- Digital celebration platform where users send "ɃU" (Bison Units) instead of cash
- Physical Bison Notes are ceremonial tokens (zero monetary value)
- All value is transferred digitally before notes are issued

### User Roles
1. **User** - Regular users who can send/receive BU, attend events
2. **Celebrant** - Event organizers who receive BU at their events
3. **Vendor** - Sells physical Bison Notes at events via QR gateways
4. **Both** - Users who can be both celebrant and vendor

### Key Features
- **Wallet System**: Paystack integration for top-ups, balance management
- **Events**: Creation, management, ticket sales, invites
- **Gateways**: QR code system for vendors to sell notes at events
- **Transfers**: Send BU to users/events (spraying)
- **Withdrawals**: Bank/wallet withdrawals
- **Invites**: Event invitation system
- **Tickets**: Event ticket sales
- **Friend Requests**: Social connections
- **Notifications**: System notifications

### Database Tables
- `users` - User accounts (phone, name, role, pin_hash)
- `wallets` - User wallets (balance, naira_balance)
- `events` - Events (celebrant_id, name, date, total_bu_received, withdrawn)
- `gateways` - Vendor gateways (vendor_id, event_name, qr_code_data)
- `transfers` - BU transfers (sender_id, receiver_id, event_id, amount, status)
- `vendor_pending_sales` - Vendor sales (transfer_id, gateway_id, guest_name, status)
- `withdrawals` - Withdrawal requests (user_id, bu_amount, naira_amount, type, status)
- `notifications` - User notifications
- `invites` - Event invites
- `friend_requests` - Friend requests
- `contacts` - User contacts

## Super Admin Dashboard Requirements

### 1. Authentication & Authorization
- Separate admin login system
- Role-based access (super_admin role)
- JWT authentication (shared with main app)
- Session management

### 2. Dashboard Overview
- **Key Metrics**:
  - Total users (by role)
  - Total BU in circulation
  - Total transactions
  - Active events
  - Pending withdrawals
  - Revenue (Paystack payments)
- **Charts & Analytics**:
  - User growth over time
  - Transaction volume
  - Revenue trends
  - Event statistics
  - Withdrawal trends

### 3. User Management
- View all users (search, filter by role)
- View user details (wallet, transactions, events)
- Edit user information
- Suspend/activate users
- View user activity logs
- Fund/adjust user wallets
- View user transfers history

### 4. Event Management
- View all events
- View event details (celebrant, transfers, withdrawals)
- Edit/delete events
- View event transfers
- Monitor event BU received

### 5. Transaction Management
- View all transfers
- Filter by type, status, date range
- View transfer details
- Refund transactions
- Export transaction data

### 6. Withdrawal Management
- View all withdrawal requests
- Filter by status (pending, processing, completed, failed)
- Approve/reject withdrawals
- Process withdrawals
- View withdrawal history

### 7. Payment Management
- View Paystack transactions
- Monitor payment success/failure rates
- View payment logs
- Refund payments

### 8. Gateway Management
- View all gateways
- View gateway QR codes
- Monitor gateway activity
- Deactivate gateways

### 9. Vendor Sales Management
- View all vendor sales
- Monitor pending sales
- View sales statistics
- Export sales data

### 10. System Settings
- Configure system parameters
- Manage Paystack keys
- View system logs
- Database maintenance tools

### 11. Reports & Analytics
- Generate reports (users, transactions, events, revenue)
- Export data (CSV, PDF)
- Custom date ranges
- Financial reports

### 12. Security & Monitoring
- View authentication logs
- Monitor suspicious activity
- System health monitoring
- Error tracking

## Technical Stack

### Frontend
- Next.js 16 (App Router)
- React 19
- TypeScript
- Tailwind CSS
- shadcn/ui components
- Recharts for analytics
- React Query for data fetching

### Backend
- Next.js API Routes
- Shared Supabase database
- JWT authentication
- Admin-specific API endpoints

### Structure
```
admin-dashboard/
├── app/
│   ├── (auth)/
│   │   └── login/
│   ├── (dashboard)/
│   │   ├── layout.tsx
│   │   ├── page.tsx (overview)
│   │   ├── users/
│   │   ├── events/
│   │   ├── transactions/
│   │   ├── withdrawals/
│   │   ├── payments/
│   │   ├── gateways/
│   │   ├── reports/
│   │   └── settings/
│   └── api/
│       └── admin/
│           ├── stats/
│           ├── users/
│           ├── events/
│           ├── transactions/
│           ├── withdrawals/
│           └── payments/
├── components/
│   ├── admin/
│   ├── charts/
│   └── ui/
└── lib/
    ├── admin-api.ts
    └── admin-auth.ts
```

## Implementation Plan

1. Create separate Next.js app structure
2. Implement admin authentication
3. Build admin API endpoints
4. Create dashboard UI components
5. Add analytics and charts
6. Implement management features
7. Add reporting functionality
