# ⚡ Quick Fix: Schema Cache Error

## The Error:
"Could not find the table 'public.users' in the schema cache"

## 🔍 Most Likely Causes:

1. **Wrong Supabase Project** - Your `.env.local` points to different project
2. **Tables Not Actually Created** - SQL ran but tables weren't created
3. **API Key Wrong** - Using wrong or expired key
4. **Schema Cache** - Supabase needs time to update

## ✅ Quick Fix Steps:

### Step 1: Verify Tables Exist

1. Go to: https://cmqtnppqpksvyhtqrcqi.supabase.co
2. Click **"Table Editor"**
3. **Do you see `users` table?**
   - ✅ YES → Go to Step 2
   - ❌ NO → Run SQL again (see Step 4)

### Step 2: Check Environment Variables

Open `.env.local` and verify:

```env
NEXT_PUBLIC_SUPABASE_URL=https://cmqtnppqpksvyhtqrcqi.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
```

**Important:**
- No trailing slash on URL
- Get fresh key from: Supabase → Settings → API → anon/public key

### Step 3: Restart Everything

```bash
# Stop server (Ctrl+C)
npm run dev
```

Wait 10 seconds, then test again.

### Step 4: If Tables Don't Exist - Recreate

1. **In Supabase SQL Editor, run:**
```sql
-- Drop all tables
DROP TABLE IF EXISTS withdrawals CASCADE;
DROP TABLE IF EXISTS vendor_pending_sales CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS transfers CASCADE;
DROP TABLE IF EXISTS events CASCADE;
DROP TABLE IF EXISTS gateways CASCADE;
DROP TABLE IF EXISTS wallets CASCADE;
DROP TABLE IF EXISTS users CASCADE;
```

2. **Then run `database/schema-no-rls.sql` again**

3. **Wait 30 seconds**

4. **Check Table Editor** - should see 8 tables

### Step 5: Test Connection

Visit: `http://192.168.2.100:3000/api/debug-supabase`

This will show detailed connection info.

## 🚨 Common Fixes:

**If tables exist but still error:**
- Wait 1-2 minutes (Supabase cache)
- Restart dev server
- Verify `.env.local` URL matches exactly

**If wrong project:**
- Check Supabase dashboard URL matches `.env.local`
- Get fresh API key from correct project

**If API key wrong:**
- Supabase → Settings → API
- Copy "anon" or "public" key
- Update `.env.local`
- Restart server

## ✅ Verification:

After fixing, test:
1. `http://192.168.2.100:3000/api/debug-supabase` - Should show connection OK
2. `http://192.168.2.100:3000/api/verify-tables` - Should show all tables exist
3. Try registration on phone - Should work!
