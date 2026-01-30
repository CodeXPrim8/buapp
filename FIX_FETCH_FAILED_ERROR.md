# 🔧 Fix "TypeError: fetch failed" Error

## The Error:
"Database error: TypeError: fetch failed"

This means the app **cannot connect** to Supabase. This is a network/connection issue.

## 🔍 Possible Causes:

1. **Supabase Project Paused** - Free tier projects pause after inactivity
2. **Wrong Supabase URL** - URL doesn't match the API keys
3. **Network/Firewall Issue** - Can't reach Supabase servers
4. **SSL/Certificate Issue** - HTTPS connection problem

## ✅ Step-by-Step Fix:

### Step 1: Check if Supabase Project is Active

1. **Go to:** https://eugnepzbjrvqzmldhrql.supabase.co
2. **Check if project is paused:**
   - If you see "Project Paused" → Click "Restore" or "Resume"
   - Wait 1-2 minutes for project to start
3. **If project doesn't exist** → You might need to use the other project

### Step 2: Verify Supabase URL

Make sure `.env.local` has the **EXACT** URL:

```env
NEXT_PUBLIC_SUPABASE_URL=https://eugnepzbjrvqzmldhrql.supabase.co
```

**Important:**
- No trailing slash
- Must start with `https://`
- Must match the project where API keys are from

### Step 3: Test Connection

Visit this URL to see detailed connection info:
```
http://192.168.2.100:3000/api/test-supabase-connection
```

This will show:
- ✅ If connection works
- ❌ Detailed error messages if it fails

### Step 4: Check Network Connectivity

If you're behind a firewall or VPN:
- Try disabling VPN temporarily
- Check if you can access Supabase dashboard in browser
- Try from a different network

### Step 5: Verify Project Status

1. **Go to Supabase Dashboard:**
   - https://eugnepzbjrvqzmldhrql.supabase.co
2. **Check project status:**
   - Should show "Active" or "Running"
   - If paused, resume it
3. **Check API settings:**
   - Settings → API
   - Make sure REST API is enabled

## 🚨 Common Fixes:

**If project is paused:**
- Resume it in Supabase dashboard
- Wait 2-3 minutes
- Try again

**If wrong URL:**
- Get correct URL from Supabase dashboard
- Update `.env.local`
- Restart dev server

**If network issue:**
- Check internet connection
- Try from different network
- Check firewall settings

## ✅ Quick Checklist:

- [ ] Supabase project is active (not paused)
- [ ] `.env.local` has correct URL (no trailing slash)
- [ ] `.env.local` has correct anon key
- [ ] Can access Supabase dashboard in browser
- [ ] Tested `/api/test-supabase-connection` endpoint
- [ ] Restarted dev server after changes
- [ ] Internet connection is working

## 📝 Next Steps:

1. **Check project status** in Supabase dashboard
2. **Test connection:** `http://192.168.2.100:3000/api/test-supabase-connection`
3. **Share the output** if still having issues

The most common cause is a **paused Supabase project**. Check that first!
