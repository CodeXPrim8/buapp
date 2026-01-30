# Troubleshooting Guide

## Error: "Unexpected token '<', "<!DOCTYPE "... is not valid JSON"

This error means the API returned HTML (an error page) instead of JSON.

### Common Causes:

1. **Missing Supabase API Key**
   - Check if `.env.local` exists
   - Verify `NEXT_PUBLIC_SUPABASE_ANON_KEY` or `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY` is set
   - Restart dev server after adding environment variables

2. **Supabase Connection Error**
   - Test connection: Visit `http://192.168.2.100:3000/api/test`
   - Check Supabase project is active
   - Verify database tables exist

3. **Server-Side Error**
   - Check terminal/console for error messages
   - Look for import errors or runtime errors

### Quick Fixes:

1. **Create/Update `.env.local`:**
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://cmqtnppqpksvyhtqrcqi.supabase.co
   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY=sb_publishable_gGbUtLAZjrI2qj1KxnAjRA_muVC7rfw
   NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_gGbUtLAZjrI2qj1KxnAjRA_muVC7rfw
   ```

2. **Restart Dev Server:**
   ```bash
   # Stop current server (Ctrl+C)
   npm run dev
   ```

3. **Test API Connection:**
   - Visit: `http://192.168.2.100:3000/api/test`
   - Should return JSON with connection status

4. **Check Server Logs:**
   - Look at terminal where `npm run dev` is running
   - Check for error messages

### Debug Steps:

1. Test Supabase connection:
   ```
   http://192.168.2.100:3000/api/test
   ```

2. Check browser console for detailed errors

3. Check server terminal for error logs

4. Verify environment variables are loaded
