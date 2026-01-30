# ⚠️ Database Tables Not Created Yet!

## Error Message:
"Could not find the table 'public.users' in the schema cache"

## ✅ Solution: Create Tables in Supabase

You need to run the SQL schema in your Supabase project.

### Step-by-Step:

1. **Go to your Supabase project:**
   - Open: https://cmqtnppqpksvyhtqrcqi.supabase.co
   - Login to your Supabase account

2. **Open SQL Editor:**
   - Click on "SQL Editor" in the left sidebar
   - Click "New query"

3. **Copy and paste the schema:**
   - Open the file: `database/schema.sql`
   - Copy ALL the SQL code
   - Paste it into the SQL Editor

4. **Run the SQL:**
   - Click "Run" button (or press Ctrl+Enter)
   - Wait for "Success" message

5. **Verify tables were created:**
   - Go to "Table Editor" in left sidebar
   - You should see 8 tables:
     - users
     - wallets
     - gateways
     - events
     - transfers
     - vendor_pending_sales
     - notifications
     - withdrawals

6. **Restart your dev server:**
   ```bash
   # Stop server (Ctrl+C)
   npm run dev
   ```

7. **Test again on your phone:**
   - Refresh browser
   - Try registering
   - Should work now!

## 🚨 Important Notes

- The SQL file is at: `database/schema.sql`
- You must run ALL the SQL, not just part of it
- Wait for "Success" message before closing
- Restart dev server after creating tables

## ✅ Quick Checklist

- [ ] Opened Supabase project
- [ ] Opened SQL Editor
- [ ] Copied `database/schema.sql` content
- [ ] Pasted and ran SQL
- [ ] Saw "Success" message
- [ ] Verified tables exist in Table Editor
- [ ] Restarted dev server
- [ ] Tested registration on phone
