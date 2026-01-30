# 🔑 Get Correct Supabase API Key

## Current Issue:
Your `.env.local` has a key starting with `sb_publishable_...` which might not be the correct key for the REST API.

## ✅ Get the Correct Key:

### Step 1: Open Supabase Dashboard
1. Go to: https://cmqtnppqpksvyhtqrcqi.supabase.co
2. Sign in

### Step 2: Get API Key
1. Click **"Settings"** (gear icon) in left sidebar
2. Click **"API"** in the settings menu
3. Look for **"Project API keys"** section
4. Find the **"anon"** or **"public"** key
   - It should be a long JWT token (starts with `eyJ...`)
   - NOT the "service_role" key (that's admin only)
   - NOT keys starting with `sb_` (those are for Auth)

### Step 3: Update .env.local
Replace the current key with the anon key:

```env
NEXT_PUBLIC_SUPABASE_URL=https://cmqtnppqpksvyhtqrcqi.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNtcXRucHBxcGtzdnlodHFyY3FpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MT... (full key)
```

### Step 4: Restart Server
```bash
# Stop server (Ctrl+C)
npm run dev
```

### Step 5: Test
Try registration again - should work now!

## 🔍 How to Identify Correct Key:

**✅ Correct (anon/public key):**
- Long JWT token (200+ characters)
- Starts with `eyJ...`
- Found in Settings → API → Project API keys → anon/public

**❌ Wrong (publishable key):**
- Starts with `sb_publishable_...`
- This is for Supabase Auth, not REST API

**❌ Wrong (service_role):**
- Starts with `eyJ...` but marked as "service_role"
- This is admin-only, don't use in frontend

## ✅ After Updating:

1. Restart dev server
2. Test: `http://192.168.2.100:3000/api/debug-supabase`
3. Should show connection OK
4. Try registration - should work!

The tables exist, so once you have the correct API key, it will work immediately! 🎉
