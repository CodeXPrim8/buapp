# Verify Database Setup

## Quick Check: Do Tables Exist?

**Test URL:** `http://192.168.2.100:3000/api/check-db`

Visit this URL on your phone or computer. It will tell you if the `users` table exists.

## If Tables Don't Exist:

### Option 1: Run Full Schema (Recommended)

1. **Open Supabase:** https://cmqtnppqpksvyhtqrcqi.supabase.co
2. **SQL Editor** → **New query**
3. **Open file:** `database/schema.sql` in your project
4. **Copy ALL** the SQL code
5. **Paste** in Supabase SQL Editor
6. **Click "Run"**
7. **Wait for "Success"**

### Option 2: Quick Test (Create Users Table Only)

If you want to test quickly, run this SQL first:

```sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  phone_number TEXT UNIQUE NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT,
  role TEXT NOT NULL CHECK (role IN ('user', 'celebrant', 'vendor')),
  pin_hash TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone_number);
```

Then test registration. If it works, run the full schema for other tables.

## After Creating Tables:

1. **Restart dev server:**
   ```bash
   # Stop (Ctrl+C)
   npm run dev
   ```

2. **Test connection:**
   - Visit: `http://192.168.2.100:3000/api/check-db`
   - Should show: `{"success": true, "tableExists": true}`

3. **Test registration on phone:**
   - Refresh browser
   - Try registering
   - Should work!

## Common Issues:

**"Table already exists" error:**
- Good! Tables are created, skip to restarting server

**"Permission denied" error:**
- Make sure you're logged into Supabase
- Check you're in the correct project

**Still getting error after creating tables:**
- Restart dev server (environment variables need reload)
- Clear browser cache on phone
- Check Supabase project is active (not paused)
