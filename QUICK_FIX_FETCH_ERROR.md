# ⚡ Quick Fix: "TypeError: fetch failed"

## The Error:
"Database error: TypeError: fetch failed"

This means the app **cannot reach Supabase**. 

## 🔍 Most Common Cause:
**Supabase Project is Paused** (Free tier projects pause after inactivity)

## ✅ Quick Fix:

### Step 1: Check Project Status

1. **Go to:** https://eugnepzbjrvqzmldhrql.supabase.co
2. **Look for:**
   - "Project Paused" message → Click **"Restore"** or **"Resume"**
   - "Project Active" → Go to Step 2
   - Can't access → Project might not exist, use other project

### Step 2: Wait for Project to Start

- After resuming, wait **2-3 minutes**
- Project needs time to start up

### Step 3: Test Connection

Visit: `http://192.168.2.100:3000/api/test-supabase-connection`

Should show connection success.

### Step 4: Try Registration Again

Should work now!

## 🚨 If Project Doesn't Exist:

If you can't access `eugnepzbjrvqzmldhrql`:

1. **Use the other project:** `cmqtnppqpksvyhtqrcqi`
2. **Get API keys from that project**
3. **Update `.env.local`** with correct URL and keys
4. **Restart dev server**

## ✅ Verification:

After fixing:
- Test: `http://192.168.2.100:3000/api/test-supabase-connection`
- Should show `"success": true`
- Try registration - should work!

**Most likely:** Project is paused. Resume it and wait 2-3 minutes! 🚀
