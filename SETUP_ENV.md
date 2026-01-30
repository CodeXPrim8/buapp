# Environment Setup

## ✅ Supabase Credentials Configured

Your Supabase credentials have been updated in the code. Now you need to create a `.env.local` file in the root directory with the following content:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://cmqtnppqpksvyhtqrcqi.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY=sb_publishable_gGbUtLAZjrI2qj1KxnAjRA_muVC7rfw
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_gGbUtLAZjrI2qj1KxnAjRA_muVC7rfw

# JWT Secret (for custom auth if needed)
JWT_SECRET=your_random_secret_string_here

# Environment
NODE_ENV=development
```

## Quick Setup

1. Create `.env.local` file in the root directory
2. Copy the content above into it
3. Replace `your_random_secret_string_here` with a secure random string for JWT_SECRET
4. Restart your development server

## Next Steps

1. **Set up the database schema:**
   - Go to your Supabase project: https://cmqtnppqpksvyhtqrcqi.supabase.co
   - Navigate to SQL Editor
   - Run the SQL from `database/schema.sql`

2. **Test the connection:**
   ```bash
   npm run dev
   ```

3. **Test an API endpoint:**
   ```bash
   curl http://localhost:3000/api/auth/register
   ```

## Important Notes

- `.env.local` is gitignored and won't be committed
- Never commit your Supabase keys to version control
- The code supports both `NEXT_PUBLIC_SUPABASE_ANON_KEY` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY` variable names
