# 🔧 Fix "Could not find the table public.users in the schema cache"

## The Error:
Even after running SQL, you're still getting: "Could not find the table 'public.users' in the schema cache"

## Possible Causes:

1. **Wrong Supabase Project** - Connection pointing to different project
2. **Tables in Wrong Schema** - Tables created in wrong schema
3. **API Key Permissions** - API key doesn't have access
4. **Schema Cache** - Supabase needs time to update cache

## ✅ Step-by-Step Fix:

### Step 1: Verify Tables Actually Exist

1. **Go to Supabase Dashboard:**
   - https://cmqtnppqpksvyhtqrcqi.supabase.co
   - Click **"Table Editor"** in left sidebar

2. **Do you see the `users` table?**
   - ✅ If YES → Go to Step 2
   - ❌ If NO → Tables weren't created, run SQL again

### Step 2: Check Supabase Project URL

Make sure `.env.local` has the **EXACT** URL:
```
NEXT_PUBLIC_SUPABASE_URL=https://cmqtnppqpksvyhtqrcqi.supabase.co
```

**Important:** 
- No trailing slash
- Exact match with your Supabase project

### Step 3: Verify API Key

1. **In Supabase Dashboard:**
   - Go to **Settings** → **API**
   - Copy the **"anon"** or **"public"** key
   - Make sure `.env.local` has:
   ```
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
   ```

2. **Restart dev server** after changing `.env.local`

### Step 4: Clear Schema Cache

Sometimes Supabase caches the schema. Try:

1. **Wait 1-2 minutes** after creating tables
2. **Restart Supabase project** (if paused)
3. **Run this test:**
   ```
   http://192.168.2.100:3000/api/test-connection
   ```

### Step 5: Verify Table Schema

Run this SQL in Supabase SQL Editor to verify:
```sql
SELECT table_name, table_schema 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name = 'users';
```

Should return 1 row with `table_schema = 'public'` and `table_name = 'users'`

### Step 6: Recreate Tables (if needed)

If tables don't exist or are in wrong schema:

1. **Drop existing tables:**
```sql
DROP TABLE IF EXISTS withdrawals CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS vendor_pending_sales CASCADE;
DROP TABLE IF EXISTS transfers CASCADE;
DROP TABLE IF EXISTS events CASCADE;
DROP TABLE IF EXISTS gateways CASCADE;
DROP TABLE IF EXISTS wallets CASCADE;
DROP TABLE IF EXISTS users CASCADE;
```

2. **Run `database/schema-no-rls.sql` again**

3. **Wait 30 seconds**

4. **Verify in Table Editor**

### Step 7: Test Connection

Visit: `http://192.168.2.100:3000/api/test-connection`

Check the response for detailed error information.

## 🚨 Common Issues:

**Issue:** Tables exist but still getting error
- **Fix:** Restart dev server, wait 1-2 minutes, try again

**Issue:** Wrong Supabase project
- **Fix:** Check `.env.local` URL matches your project exactly

**Issue:** API key wrong
- **Fix:** Get fresh key from Supabase → Settings → API → anon key

**Issue:** Tables in wrong schema
- **Fix:** Run SQL again, make sure it's in `public` schema

## ✅ Quick Checklist:

- [ ] Tables visible in Supabase Table Editor
- [ ] `.env.local` has correct Supabase URL (no trailing slash)
- [ ] `.env.local` has correct anon key
- [ ] Dev server restarted after changing `.env.local`
- [ ] Waited 1-2 minutes after creating tables
- [ ] Tested `/api/test-connection` endpoint
- [ ] Verified table schema is `public`

## 📝 Next Steps:

After fixing, test registration again. If still not working, share the output from `/api/test-connection` endpoint.
