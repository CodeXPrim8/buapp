# Vercel Environment Variable Troubleshooting

## Critical: Check Your Variable Name

The code expects the environment variable to be named exactly:
```
SUPABASE_SERVICE_ROLE_KEY
```

**NOT:**
- `service_role secret` ❌
- `SERVICE_ROLE_KEY` ❌
- `SUPABASE_SERVICE_KEY` ❌
- Any other variation ❌

## Step-by-Step Verification

### 1. Check Variable Name in Vercel
1. Go to Vercel Dashboard → Your Project (`buapp`)
2. Go to **Settings** → **Environment Variables**
3. Look for a variable named exactly: `SUPABASE_SERVICE_ROLE_KEY`
4. If it's named something else, **delete it** and create a new one with the correct name

### 2. Verify Environment Selection
Make sure `SUPABASE_SERVICE_ROLE_KEY` is set for:
- ✅ **Production** (required)
- ✅ **Preview** (recommended)
- ❌ **Development** (not needed, sensitive vars can't be used here)

### 3. Verify "Sensitive" Toggle
- The "Sensitive" toggle should be **ON** (blue/active)
- This encrypts the value and makes it available in Production/Preview

### 4. Check the Value
- The value should be the full service_role key from Supabase
- Should start with `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
- Should be 200+ characters long
- Should be the **service_role** key, NOT the anon key

### 5. Redeploy After Adding/Changing Variables
**IMPORTANT:** After adding or changing environment variables:
1. Go to **Deployments** tab
2. Click the **three dots** (⋯) on the latest deployment
3. Click **Redeploy**
4. Or push a new commit to trigger a redeploy

Environment variables are only loaded during deployment, so changes won't take effect until you redeploy!

## How to Get Service Role Key from Supabase

1. Go to https://supabase.com/dashboard
2. Select your project
3. Go to **Settings** → **API**
4. Under "Project API keys", find **"service_role"** (NOT "anon" or "public")
5. Click **"Reveal"** to show the full key
6. Copy the entire key (it's very long, 200+ characters)

## Verify It's Working

After redeploying, check Vercel logs:

1. Go to Vercel Dashboard → Your Project → **Logs** tab
2. Look for: `[Supabase] Server-side client initialized`
3. You should see:
   ```
   hasServiceRoleKey: true
   usingServiceRole: true
   serviceRoleKeyLength: [200+]
   ```

If you see `hasServiceRoleKey: false` or `usingServiceRole: false`, the variable isn't being picked up.

## Common Issues

### Issue: Variable not found after adding
**Solution:** Redeploy! Variables only load during deployment.

### Issue: Still seeing RLS errors
**Solution:** 
1. Verify variable name is exactly `SUPABASE_SERVICE_ROLE_KEY`
2. Verify it's set for Production environment
3. Verify "Sensitive" toggle is ON
4. Redeploy

### Issue: Variable shows in Vercel but logs say it's not set
**Solution:**
1. Check you're looking at Production logs (not Development)
2. Verify the variable is set for Production environment
3. Make sure you redeployed after adding the variable

## Quick Checklist

- [ ] Variable name is exactly: `SUPABASE_SERVICE_ROLE_KEY`
- [ ] Value is the full service_role key from Supabase (200+ chars)
- [ ] Set for **Production** environment (and Preview if desired)
- [ ] "Sensitive" toggle is **ON**
- [ ] Clicked **Save** after creating/editing
- [ ] **Redeployed** the app after adding the variable
- [ ] Checked Vercel logs to verify it's being used
