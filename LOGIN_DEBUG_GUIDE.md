# Login Debug Guide - "Invalid phone number or PIN" Error

## Most Likely Causes

### 1. **Supabase RLS (Row Level Security) Issue** ⚠️ MOST LIKELY
If Row Level Security is enabled on the `users` table, the anon key may not have permission to read users.

**Check:**
- Go to Supabase Dashboard → Authentication → Policies
- Check if RLS is enabled on the `users` table
- If RLS is enabled, you need to either:
  - **Option A:** Add a service role key to Vercel (bypasses RLS)
  - **Option B:** Create a policy that allows SELECT on users table for anon users

**Fix Option A (Recommended for production):**
1. Go to Supabase Dashboard → Settings → API
2. Copy the "service_role" key (NOT the anon key - this is secret!)
3. In Vercel Dashboard → Your Project → Settings → Environment Variables
4. Add: `SUPABASE_SERVICE_ROLE_KEY` = [paste service_role key]
5. Mark as "Encrypted"
6. Redeploy

**Fix Option B (Alternative):**
Create a policy in Supabase SQL Editor:
```sql
-- Allow anon users to read users table (for login)
CREATE POLICY "Allow anon read users for login"
ON users FOR SELECT
TO anon
USING (true);
```

### 2. **Missing or Invalid Supabase Anon Key**
The `NEXT_PUBLIC_SUPABASE_ANON_KEY` might be missing or incorrect on Vercel.

**Check:**
- Vercel Dashboard → Your Project → Settings → Environment Variables
- Verify `NEXT_PUBLIC_SUPABASE_ANON_KEY` exists and is the full key (100+ characters)
- Should start with `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

### 3. **Phone Number Format Mismatch**
The user might have been registered with a different phone format than what's being queried.

**What I've fixed:**
- Added support for trying local format (`08131074911`) when querying with international format (`+2348131074911`)
- Enhanced logging to show which formats are being tried

### 4. **Database Connection Issue**
Supabase project might be paused or URL might be incorrect.

**Check:**
- Supabase Dashboard → Settings → General
- Verify project is active (not paused)
- Verify `NEXT_PUBLIC_SUPABASE_URL` matches your project URL

## How to Debug

### Check Vercel Logs:
1. Go to Vercel Dashboard → Your Project
2. Click "Logs" tab
3. Look for:
   - `[Supabase] Server-side client initialized` - shows which key is being used
   - `[LOGIN] User lookup result` - shows if user was found
   - `getUserByPhone` logs - shows which formats were tried
   - Any RLS/permission errors

### Check Browser Console:
1. Open browser DevTools (F12)
2. Go to Console tab
3. Try logging in
4. Look for any errors or network failures

## Quick Fixes Applied

✅ Added local format (`08131074911`) to phone lookup when input is `+2348131074911`
✅ Enhanced error logging for RLS/permission issues
✅ Added logging to show which Supabase key is being used
✅ Better error messages for database connection issues

## Next Steps

1. **Check Vercel environment variables** - ensure all are set correctly
2. **Check Vercel logs** - look for RLS/permission errors
3. **Add service role key** if RLS is enabled (recommended)
4. **Test locally** with `npm run dev` to see if issue reproduces locally

## Testing Locally

If you want to test locally to see the debug logs:

1. Run: `npm run dev`
2. Open: `http://localhost:3000`
3. Try logging in
4. Check `.cursor/debug.log` for detailed logs
5. Check terminal console for Supabase initialization logs
