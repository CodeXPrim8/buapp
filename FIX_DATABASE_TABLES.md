# 🔧 Fix Database Tables Error

## Current Error:
"Could not find the table 'public.users' in the schema cache"

## ✅ Solution: Create Tables in Supabase

The tables don't exist in your Supabase database. Follow these steps:

### Step 1: Verify Current Status

Visit this URL to check which tables exist:
```
http://192.168.2.100:3000/api/verify-tables
```

This will show you which tables are missing.

### Step 2: Create Tables in Supabase

1. **Open Supabase Dashboard:**
   - Go to: https://cmqtnppqpksvyhtqrcqi.supabase.co
   - Sign in to your account

2. **Open SQL Editor:**
   - Click **"SQL Editor"** in the left sidebar
   - Click **"New query"** button

3. **Copy the SQL Schema:**
   - Open file: `database/schema-no-rls.sql` in your project
   - **Select ALL** the content (Ctrl+A)
   - **Copy** it (Ctrl+C)

4. **Paste and Run:**
   - **Paste** into Supabase SQL Editor (Ctrl+V)
   - Click **"Run"** button (or press Ctrl+Enter)
   - **Wait** for "Success. No rows returned" message

5. **Verify Tables Were Created:**
   - Click **"Table Editor"** in left sidebar
   - You should see **8 tables**:
     - ✅ users
     - ✅ wallets
     - ✅ gateways
     - ✅ events
     - ✅ transfers
     - ✅ vendor_pending_sales
     - ✅ notifications
     - ✅ withdrawals

### Step 3: Test Again

1. **Check tables:**
   - Visit: `http://192.168.2.100:3000/api/verify-tables`
   - Should show: `"allTablesExist": true`

2. **Test registration:**
   - Refresh your phone browser
   - Try registering again
   - Should work! ✅

## 🚨 If Tables Still Don't Exist:

### Option 1: Check Supabase Project
- Make sure you're in the correct Supabase project
- URL should be: `https://cmqtnppqpksvyhtqrcqi.supabase.co`

### Option 2: Check Environment Variables
Make sure `.env.local` has:
```
NEXT_PUBLIC_SUPABASE_URL=https://cmqtnppqpksvyhtqrcqi.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key_here
```

### Option 3: Run SQL Again
- Sometimes Supabase needs a moment to update
- Wait 30 seconds after running SQL
- Refresh Table Editor
- Try running SQL again if tables don't appear

## ✅ Quick Checklist:

- [ ] Opened Supabase dashboard
- [ ] Opened SQL Editor → New query
- [ ] Copied `database/schema-no-rls.sql` (entire file)
- [ ] Pasted and ran SQL
- [ ] Saw "Success" message
- [ ] Verified 8 tables exist in Table Editor
- [ ] Tested `/api/verify-tables` endpoint
- [ ] Restarted dev server (if needed)
- [ ] Tested registration on phone

## 📝 Important Notes:

- **"No rows returned"** is normal - it means tables were created successfully
- **Wait 10-30 seconds** after running SQL before checking Table Editor
- **Restart dev server** after creating tables: `npm run dev`
- Make sure you're using `schema-no-rls.sql` (NOT `schema.sql`)

After creating the tables, registration should work! 🎉
