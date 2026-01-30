# 🔧 Fix Database Error - Step by Step

## Current Error:
"Could not find the table 'public.users' in the schema cache"

## ✅ Solution: Run SQL Schema in Supabase

### Step 1: Open Supabase Dashboard
1. Go to: **https://cmqtnppqpksvyhtqrcqi.supabase.co**
2. Sign in to your account

### Step 2: Open SQL Editor
1. Click **"SQL Editor"** in the left sidebar
2. Click **"New query"** button (top right)

### Step 3: Copy SQL Schema
**IMPORTANT:** Use the file `database/schema-no-rls.sql` (NOT `schema.sql`)

1. Open file: `database/schema-no-rls.sql` in your project
2. **Select ALL** text (Ctrl+A)
3. **Copy** (Ctrl+C)

### Step 4: Paste and Run
1. **Paste** into Supabase SQL Editor (Ctrl+V)
2. Click **"Run"** button (or press Ctrl+Enter)
3. **Wait** for "Success" message

### Step 5: Verify Tables Created
1. Click **"Table Editor"** in left sidebar
2. You should see 8 tables:
   - ✅ users
   - ✅ wallets
   - ✅ gateways
   - ✅ events
   - ✅ transfers
   - ✅ vendor_pending_sales
   - ✅ notifications
   - ✅ withdrawals

### Step 6: Test Database Connection
Visit this URL on your phone or computer:
```
http://192.168.2.100:3000/api/check-db
```

Should return:
```json
{"success": true, "tableExists": true}
```

### Step 7: Restart Dev Server
```bash
# Stop server (Ctrl+C)
npm run dev
```

### Step 8: Test Registration
- Refresh your phone browser
- Try registering again
- Should work! ✅

## 🚨 Why `schema-no-rls.sql`?

The original `schema.sql` has Row Level Security (RLS) policies that use `auth.uid()`, which requires Supabase Auth. Since we're using custom PIN-based authentication, we need to disable RLS and handle security in API routes instead.

## ✅ Quick Checklist

- [ ] Opened Supabase dashboard
- [ ] Opened SQL Editor → New query
- [ ] Copied `database/schema-no-rls.sql` (entire file)
- [ ] Pasted and ran SQL
- [ ] Saw "Success" message
- [ ] Verified 8 tables exist in Table Editor
- [ ] Tested `/api/check-db` endpoint
- [ ] Restarted dev server
- [ ] Tested registration on phone

## 🔍 Still Having Issues?

If you still get errors after running SQL:

1. **Check if tables exist:**
   - Go to Supabase → Table Editor
   - Do you see the `users` table?

2. **Test connection:**
   - Visit: `http://192.168.2.100:3000/api/check-db`
   - What does it return?

3. **Check environment variables:**
   - Make sure `.env.local` exists
   - Contains: `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`

4. **Restart dev server:**
   - Stop completely (Ctrl+C)
   - Start again: `npm run dev`
