# Verify Supabase Connection

## The Error:
"Could not find the table 'public.users' in the schema cache"

This means Supabase can't find the `users` table. Let's diagnose:

## Step 1: Test Database Connection

Visit this URL on your phone or computer:
```
http://192.168.2.100:3000/api/diagnose
```

This will show:
- ✅ If Supabase is connected
- ✅ Which tables exist
- ✅ Detailed error messages

## Step 2: Verify Tables in Supabase Dashboard

1. Go to: https://cmqtnppqpksvyhtqrcqi.supabase.co
2. Click **"Table Editor"** in left sidebar
3. **Do you see 8 tables?**
   - users
   - wallets
   - gateways
   - events
   - transfers
   - vendor_pending_sales
   - notifications
   - withdrawals

## Step 3: If Tables Don't Exist

If you don't see the tables:

1. Go to **SQL Editor** → **New query**
2. Copy **ALL** content from `database/schema-no-rls.sql`
3. Paste and click **"Run"**
4. Wait for **"Success"** message
5. Refresh Table Editor - tables should appear

## Step 4: If Tables Exist But Still Getting Error

1. **Check Supabase Project URL:**
   - Make sure `.env.local` has: `NEXT_PUBLIC_SUPABASE_URL=https://cmqtnppqpksvyhtqrcqi.supabase.co`
   - Restart dev server after changing `.env.local`

2. **Check API Key:**
   - Make sure `.env.local` has the correct `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - Get it from: Supabase Dashboard → Settings → API → anon/public key

3. **Clear Supabase Cache:**
   - Sometimes Supabase caches schema
   - Wait 1-2 minutes and try again
   - Or restart Supabase project (if paused)

## Step 5: Test Again

After fixing, test:
1. Visit: `http://192.168.2.100:3000/api/diagnose`
2. Check the response
3. Try registration again
