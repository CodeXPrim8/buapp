# Vercel Environment Variables Checklist

This document lists all environment variables required for successful deployment on Vercel.

## 🔴 CRITICAL - Required for Production

These variables **MUST** be set in Vercel for the app to function:

### Authentication & Security
- **`JWT_SECRET`** ⚠️ **REQUIRED**
  - **Type**: Secret (server-side only)
  - **Length**: Minimum 32 characters
  - **Description**: Secret key for signing and verifying JWT tokens
  - **Generate**: `openssl rand -base64 32`
  - **⚠️ WARNING**: Must NOT be a placeholder value. Must be a strong random string.
  - **Example**: `aB3dEf9gHiJkLmNoPqRsTuVwXyZ1234567890AbCdEfGhIjKlMnOpQrStUvWxYz`

### Supabase Configuration
- **`NEXT_PUBLIC_SUPABASE_URL`** ⚠️ **REQUIRED**
  - **Type**: Public (exposed to client)
  - **Description**: Your Supabase project URL
  - **Example**: `https://cmqtnppqpksvyhtqrcqi.supabase.co`
  - **Note**: Currently defaults to the example URL if not set (not recommended for production)

- **`NEXT_PUBLIC_SUPABASE_ANON_KEY`** ⚠️ **REQUIRED**
  - **Type**: Public (exposed to client)
  - **Description**: Supabase anonymous/public key
  - **Length**: Should be ~100+ characters
  - **⚠️ WARNING**: Must NOT be a placeholder. Must be your actual Supabase anon key.

- **`SUPABASE_SERVICE_ROLE_KEY`** (Optional but Recommended)
  - **Type**: Secret (server-side only)
  - **Description**: Supabase service role key (bypasses RLS)
  - **Use**: Server-side operations that need to bypass Row Level Security
  - **⚠️ WARNING**: Keep this secret! Never expose to client-side code.

### Application URL
- **`NEXT_PUBLIC_APP_URL`** ⚠️ **REQUIRED**
  - **Type**: Public
  - **Description**: Your production app URL (used for Paystack callbacks)
  - **Example**: `https://your-app.vercel.app` or `https://yourdomain.com`
  - **Note**: Used in payment callbacks and redirects

## 🟡 IMPORTANT - Required for Payment Features

### Paystack Configuration
- **`PAYSTACK_SECRET_KEY`** ⚠️ **REQUIRED** (if using payments)
  - **Type**: Secret (server-side only)
  - **Description**: Paystack secret key for server-side API calls
  - **Example**: `sk_test_xxxxxxxxxxxxx` or `sk_live_xxxxxxxxxxxxx`

- **`NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY`** ⚠️ **REQUIRED** (if using payments)
  - **Type**: Public (exposed to client)
  - **Description**: Paystack public key for client-side initialization
  - **Example**: `pk_test_xxxxxxxxxxxxx` or `pk_live_xxxxxxxxxxxxx`

## 🟢 OPTIONAL - Configuration & Security

### Token Expiration (Optional)
- **`JWT_EXPIRES_IN`** (Optional)
  - **Default**: `1h`
  - **Description**: Access token expiration time
  - **Example**: `1h`, `24h`, `7d`

- **`JWT_REFRESH_EXPIRES_IN`** (Optional)
  - **Default**: `7d`
  - **Description**: Refresh token expiration time
  - **Example**: `7d`, `30d`

### CORS Configuration (Optional)
- **`ALLOWED_ORIGINS`** (Optional)
  - **Description**: Comma-separated list of allowed origins for CORS
  - **Example**: `https://yourdomain.com,https://admin.yourdomain.com`
  - **Default**: `*` in development, `https://yourdomain.com` in production
  - **⚠️ WARNING**: Don't use `*` in production!

### Admin Security (Optional)
- **`ADMIN_IP_WHITELIST`** (Optional)
  - **Description**: Comma-separated list of IP addresses allowed to access admin dashboard
  - **Example**: `192.168.1.100,10.0.0.50`
  - **Note**: Leave empty to allow all IPs (NOT recommended for production)

- **`ENABLE_DEBUG_ENDPOINTS`** (Optional)
  - **Default**: `false`
  - **Description**: Enable debug endpoints in production (NOT recommended)
  - **Values**: `true` or `false`

### Database Cleanup (Optional)
- **`CLEANUP_SECRET_KEY`** (Optional)
  - **Default**: `cleanup-secret-key-change-in-production`
  - **Description**: Secret key for database cleanup endpoint
  - **⚠️ WARNING**: Change this in production! Used to protect `/api/admin/cleanup-database`

### Environment Detection (Auto-set by Vercel)
- **`NODE_ENV`** - Automatically set by Vercel (`production` in production)
- **`VERCEL`** - Automatically set by Vercel (`1` in Vercel deployments)
- **`VERCEL_ENV`** - Automatically set by Vercel (`production`, `preview`, `development`)

## 📋 Quick Setup Checklist

### Step 1: Critical Variables
- [ ] Set `JWT_SECRET` (generate with `openssl rand -base64 32`)
- [ ] Set `NEXT_PUBLIC_SUPABASE_URL` (your actual Supabase URL)
- [ ] Set `NEXT_PUBLIC_SUPABASE_ANON_KEY` (your actual Supabase anon key)
- [ ] Set `NEXT_PUBLIC_APP_URL` (your Vercel deployment URL or custom domain)

### Step 2: Payment Variables (if using Paystack)
- [ ] Set `PAYSTACK_SECRET_KEY` (from Paystack dashboard)
- [ ] Set `NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY` (from Paystack dashboard)

### Step 3: Optional Security Variables
- [ ] Set `SUPABASE_SERVICE_ROLE_KEY` (recommended for admin operations)
- [ ] Set `ALLOWED_ORIGINS` (production only)
- [ ] Set `ADMIN_IP_WHITELIST` (production only)
- [ ] Set `CLEANUP_SECRET_KEY` (if using cleanup endpoint)

### Step 4: Verify Deployment
- [ ] Check Vercel deployment logs for environment variable errors
- [ ] Test authentication endpoints
- [ ] Test payment initialization (if using Paystack)
- [ ] Verify Supabase connection

## 🔍 How to Set Environment Variables in Vercel

1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Add each variable:
   - **Key**: Variable name (e.g., `JWT_SECRET`)
   - **Value**: Variable value
   - **Environment**: Select which environments (Production, Preview, Development)
   - **⚠️ IMPORTANT**: For secrets, mark as "Encrypted"
4. Click **Save**
5. **Redeploy** your application for changes to take effect

## 🚨 Common Deployment Issues

### Issue: Build fails with "JWT_SECRET is required"
**Solution**: 
- Ensure `JWT_SECRET` is set in Vercel environment variables
- The JWT validation code should skip validation during build, but if it fails, check that the variable is set

### Issue: 404 errors or authentication failures
**Solution**:
- Verify `JWT_SECRET` is at least 32 characters
- Ensure `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are correct
- Check that environment variables are set for the correct environment (Production vs Preview)

### Issue: Payment initialization fails
**Solution**:
- Verify `PAYSTACK_SECRET_KEY` and `NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY` are set
- Ensure `NEXT_PUBLIC_APP_URL` matches your actual deployment URL
- Check Paystack dashboard for correct keys (test vs live)

### Issue: Supabase connection errors
**Solution**:
- Verify `NEXT_PUBLIC_SUPABASE_URL` matches your Supabase project URL
- Ensure `NEXT_PUBLIC_SUPABASE_ANON_KEY` is correct (not a placeholder)
- Check Supabase dashboard → Settings → API for correct values

## 📝 Notes

- Variables prefixed with `NEXT_PUBLIC_` are exposed to the client-side code
- Variables without `NEXT_PUBLIC_` are server-side only (more secure)
- Always use strong, random values for secrets
- Never commit `.env` files to git (they're in `.gitignore`)
- After adding/changing environment variables, **redeploy** your application

## 🔗 Related Files

- `env.example` - Example environment file (for local development)
- `lib/jwt.ts` - JWT secret validation
- `lib/supabase.ts` - Supabase configuration
- `next.config.mjs` - Next.js configuration (uses `ALLOWED_ORIGINS`)
