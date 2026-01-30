# Database Cleanup Instructions

## ⚠️ WARNING
This will **DELETE ALL DATA** from your database including:
- All users
- All wallets and balances
- All transfers
- All events
- All invites
- All contacts and friend requests
- All notifications
- Everything else

**This action cannot be undone!**

---

## Method 1: Using SQL Script (Recommended - Easiest)

1. Open your Supabase Dashboard: https://supabase.com/dashboard
2. Select your project
3. Go to **SQL Editor** (left sidebar)
4. Click **New Query**
5. Copy and paste the contents of `database/cleanup-all-data.sql`
6. Click **Run** (or press Ctrl+Enter)
7. Verify all counts are 0 in the verification query results

**This is the fastest and most reliable method.**

---

## Method 2: Using API Endpoint

1. Make sure you have `.env.local` file with:
   ```env
   CLEANUP_SECRET_KEY=your-secret-key-here
   ```

2. Start your development server:
   ```bash
   npm run dev
   ```

3. Call the cleanup endpoint (using curl, Postman, or browser):
   ```bash
   curl -X POST http://localhost:3000/api/admin/cleanup-database \
     -H "Authorization: Bearer your-secret-key-here"
   ```

   Or use Postman/Thunder Client:
   - Method: POST
   - URL: http://localhost:3000/api/admin/cleanup-database
   - Headers: `Authorization: Bearer your-secret-key-here`

**Note:** Default secret key is `cleanup-secret-key-change-in-production`. Change it in `.env.local` for security.

---

## Method 3: Using Node.js Script

1. Install dotenv if not already installed:
   ```bash
   npm install dotenv
   ```

2. Make sure you have `.env.local` file with:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   ```

3. Run the cleanup script:
   ```bash
   node scripts/cleanup-database.js
   ```

**Note:** You need the Service Role Key (not the anon key) to delete all data.
Get it from: Supabase Dashboard → Project Settings → API → service_role key

---

## Method 4: Manual Deletion via Supabase Dashboard

1. Go to Supabase Dashboard → Table Editor
2. Delete rows from tables in this order:
   - transfers
   - withdrawals
   - tickets
   - friend_requests
   - contacts
   - notifications
   - invites
   - gateways
   - events
   - wallets
   - users

---

## After Cleanup

✅ All users deleted  
✅ All balances reset to 0  
✅ All data cleared  
✅ Users can now register with 6-digit PINs  

**Next Steps:**
1. Test registration with a 6-digit PIN
2. Test login with the new 6-digit PIN
3. Verify all features work correctly

---

*Last Updated: January 2026*
