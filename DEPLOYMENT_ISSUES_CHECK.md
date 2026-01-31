# Deployment Issues & Troubleshooting Guide

This document identifies potential deployment issues and provides solutions.

## ✅ Issues Already Fixed

### 1. JWT Build-Time Validation ✅
**Status**: Fixed in recent commits
- **Issue**: JWT validation was failing during Vercel build
- **Solution**: Implemented build-time detection in `lib/jwt.ts` to skip validation during build phase
- **Files**: `lib/jwt.ts` (lines 11-24)
- **Verification**: Check that `ensureJWTSecretValidated()` skips validation when `isBuildTime` is true

## 🔍 Potential Deployment Issues

### 1. Environment Variables Not Set

**Symptoms**:
- Build succeeds but runtime errors occur
- 404 errors on API routes
- Authentication failures
- Supabase connection errors

**Check**:
- Verify all required variables are set in Vercel (see `VERCEL_ENV_CHECKLIST.md`)
- Ensure variables are set for the correct environment (Production vs Preview)
- Check Vercel deployment logs for environment variable warnings

**Solution**:
- Set missing variables in Vercel Settings → Environment Variables
- Redeploy after adding variables

### 2. TypeScript Build Errors (Currently Ignored)

**Current Status**: 
- `ignoreBuildErrors: true` in `next.config.mjs` (line 4)
- This means TypeScript errors won't fail the build, but they may cause runtime issues

**Risk**:
- Runtime errors that could have been caught at build time
- Potential type mismatches causing unexpected behavior

**Recommendation**:
- Fix TypeScript errors gradually
- Consider removing `ignoreBuildErrors: true` after fixing critical errors
- Use `npm run build` locally to identify errors before deploying

### 3. Missing ESLint Configuration

**Status**: ESLint is not installed/configured
- `npm run lint` fails with "eslint is not recognized"
- No linting errors are caught before deployment

**Impact**: Low (linting is not critical for deployment)
**Recommendation**: Optional - install ESLint for code quality:
```bash
npm install --save-dev eslint eslint-config-next
```

### 4. CORS Configuration

**Current Config**: `next.config.mjs` (line 33)
- Uses `ALLOWED_ORIGINS` env var or defaults to `*` in dev, `https://yourdomain.com` in production
- **Issue**: Default production value `https://yourdomain.com` is a placeholder

**Solution**:
- Set `ALLOWED_ORIGINS` in Vercel to your actual domain(s)
- Format: `https://yourdomain.com,https://admin.yourdomain.com` (comma-separated)

### 5. Paystack Callback URL

**Current Config**: `app/api/payments/paystack/initialize/route.ts` (line 47)
- Uses `NEXT_PUBLIC_APP_URL` or defaults to `http://localhost:3000`
- **Issue**: Default will fail in production

**Solution**:
- Set `NEXT_PUBLIC_APP_URL` in Vercel to your production URL
- Example: `https://your-app.vercel.app` or `https://yourdomain.com`

### 6. Admin Dashboard Security

**Current Config**: `lib/admin-middleware.ts`
- Uses `ADMIN_IP_WHITELIST` for IP-based access control
- **Issue**: If not set, allows all IPs in production (security risk)

**Solution**:
- Set `ADMIN_IP_WHITELIST` in Vercel with your admin IP addresses
- Format: `192.168.1.100,10.0.0.50` (comma-separated)

### 7. Database Cleanup Endpoint Security

**Current Config**: `app/api/admin/cleanup-database/route.ts` (line 11)
- Uses `CLEANUP_SECRET_KEY` with weak default: `cleanup-secret-key-change-in-production`
- **Issue**: Weak default could allow unauthorized database deletion

**Solution**:
- Set a strong `CLEANUP_SECRET_KEY` in Vercel
- Generate with: `openssl rand -base64 32`
- Never expose this key publicly

### 8. Supabase Default URL

**Current Config**: `lib/supabase.ts` (line 4)
- Defaults to example URL: `https://cmqtnppqpksvyhtqrcqi.supabase.co`
- **Issue**: If `NEXT_PUBLIC_SUPABASE_URL` is not set, uses example URL

**Solution**:
- Always set `NEXT_PUBLIC_SUPABASE_URL` in Vercel
- Verify it matches your actual Supabase project URL

### 9. Image Optimization Disabled

**Current Config**: `next.config.mjs` (line 7)
- `images: { unoptimized: true }`
- **Impact**: Images won't be optimized, may affect performance
- **Note**: This is fine for Vercel deployments, but consider enabling optimization for better performance

### 10. React 19 Compatibility

**Current Version**: React 19.2.0
- **Status**: Latest version, should be compatible
- **Note**: Ensure all dependencies support React 19
- **Check**: Monitor for any React 19-specific issues

## 🚨 Critical Checks Before Deployment

### Pre-Deployment Checklist

- [ ] All required environment variables are set in Vercel
- [ ] `JWT_SECRET` is at least 32 characters and not a placeholder
- [ ] `NEXT_PUBLIC_SUPABASE_URL` matches your actual Supabase project
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` is your actual key (not placeholder)
- [ ] `NEXT_PUBLIC_APP_URL` is set to your production URL
- [ ] `PAYSTACK_SECRET_KEY` and `NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY` are set (if using payments)
- [ ] `ALLOWED_ORIGINS` is set to your actual domain(s) (not placeholder)
- [ ] `ADMIN_IP_WHITELIST` is set (if using admin dashboard)
- [ ] `CLEANUP_SECRET_KEY` is changed from default (if using cleanup endpoint)

### Post-Deployment Verification

- [ ] Check Vercel deployment logs for errors
- [ ] Test authentication (login/register)
- [ ] Test API endpoints
- [ ] Verify Supabase connection
- [ ] Test payment flow (if applicable)
- [ ] Check browser console for client-side errors
- [ ] Verify CORS headers are correct
- [ ] Test admin dashboard access (if applicable)

## 🔧 Common Error Messages & Solutions

### "JWT_SECRET is required"
**Cause**: JWT_SECRET not set or too short
**Solution**: Set `JWT_SECRET` in Vercel (minimum 32 characters)

### "Payment gateway not configured"
**Cause**: Paystack keys not set
**Solution**: Set `PAYSTACK_SECRET_KEY` and `NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY` in Vercel

### "Invalid or placeholder Supabase API key"
**Cause**: Supabase key is placeholder or incorrect
**Solution**: Set correct `NEXT_PUBLIC_SUPABASE_ANON_KEY` in Vercel

### CORS errors
**Cause**: `ALLOWED_ORIGINS` not set or incorrect
**Solution**: Set `ALLOWED_ORIGINS` to your actual domain(s) in Vercel

### 404 errors on API routes
**Cause**: Build succeeded but runtime environment variables missing
**Solution**: Check Vercel environment variables and redeploy

## 📊 Monitoring & Debugging

### Check Deployment Logs
1. Go to Vercel Dashboard → Your Project → Deployments
2. Click on the deployment
3. Check "Build Logs" for build-time errors
4. Check "Function Logs" for runtime errors

### Test Environment Variables
- Use `/api/check-env` endpoint (if enabled) to verify environment variables
- Check Vercel Function logs for environment variable warnings

### Debug Endpoints
- `/api/diagnose` - System diagnostics (disabled in production by default)
- `/api/test-supabase-connection` - Test Supabase connection (disabled in production)
- `/api/check-env` - Check environment variables

**Note**: Debug endpoints are disabled in production unless `ENABLE_DEBUG_ENDPOINTS=true`

## 🔗 Related Documentation

- `VERCEL_ENV_CHECKLIST.md` - Complete environment variables checklist
- `env.example` - Example environment file for local development
- `SECURITY_QUICK_START.md` - Security configuration guide

## 📝 Notes

- Always redeploy after changing environment variables
- Test in Preview environment before deploying to Production
- Monitor Vercel Function logs for runtime errors
- Keep environment variables secure (never commit to git)
