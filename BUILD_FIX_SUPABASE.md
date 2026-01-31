# Build Fix: Supabase Initialization

## Issue
Build was failing with error:
```
Error: supabaseKey is required.
```

This occurred because Supabase client was being initialized during build time when environment variables weren't available.

## Solution
Updated `lib/supabase.ts` to:
1. Detect build time (similar to JWT validation)
2. Use a dummy key during build time to prevent initialization errors
3. Only validate keys at runtime, not during build

## Changes Made

### `lib/supabase.ts`
- Added build-time detection using same logic as JWT validation
- Use dummy key `'build-time-dummy-key-not-used-in-runtime'` during build
- Skip validation warnings during build time
- Ensure client can be created even without environment variables during build

## How It Works

1. **Build Time**: 
   - Detects build phase using `NEXT_PHASE`, `VERCEL`, `VERCEL_ENV`, or `CI` environment variables
   - Uses dummy key to initialize Supabase client
   - Client won't be used during build, but prevents initialization errors

2. **Runtime**:
   - Uses actual Supabase keys from environment variables
   - Validates keys and shows warnings if placeholders detected
   - Client works normally for API calls

## Testing

After this fix:
- ✅ Build should complete successfully even without environment variables
- ✅ Runtime will use actual Supabase credentials
- ✅ API routes will work correctly when environment variables are set

## Next Steps

1. **Commit this fix**:
   ```bash
   git add lib/supabase.ts
   git commit -m "Fix Supabase initialization during build time"
   git push
   ```

2. **Set environment variables in Vercel** (still required for runtime):
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY` (optional)

3. **Redeploy** - Build should now succeed!

## Related Files
- `lib/jwt.ts` - Similar build-time detection for JWT validation
- `lib/supabase.ts` - Fixed Supabase initialization
