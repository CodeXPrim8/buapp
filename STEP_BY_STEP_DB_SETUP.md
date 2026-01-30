# Step-by-Step Database Setup

## ⚠️ Current Error:
"Could not find the table 'public.users' in the schema cache"

This means the tables don't exist in your Supabase database yet.

## 📋 Step-by-Step Instructions:

### Step 1: Open Supabase
1. Go to: https://cmqtnppqpksvyhtqrcqi.supabase.co
2. Sign in to your account
3. Make sure you're in the correct project

### Step 2: Open SQL Editor
1. In the left sidebar, click **"SQL Editor"**
2. Click the **"New query"** button (top right)

### Step 3: Copy SQL Schema
1. Open the file: `database/schema.sql` in your project folder
2. **Select ALL** the text (Ctrl+A)
3. **Copy** it (Ctrl+C)

### Step 4: Paste and Run
1. **Paste** the SQL into Supabase SQL Editor (Ctrl+V)
2. Click the **"Run"** button (or press Ctrl+Enter)
3. **Wait** for the result - you should see "Success" message

### Step 5: Verify Tables Were Created
1. In left sidebar, click **"Table Editor"**
2. You should see these tables:
   - ✅ users
   - ✅ wallets
   - ✅ gateways
   - ✅ events
   - ✅ transfers
   - ✅ vendor_pending_sales
   - ✅ notifications
   - ✅ withdrawals

### Step 6: Test Connection
Visit this URL on your phone or computer:
```
http://192.168.2.100:3000/api/check-db
```

Should return: `{"success": true, "tableExists": true}`

### Step 7: Restart Dev Server
```bash
# Stop server (Ctrl+C)
npm run dev
```

### Step 8: Test Registration
- Refresh your phone browser
- Try registering again
- Should work!

## 🚨 If You Get SQL Errors:

**Error: "relation already exists"**
- Tables already exist, skip to Step 6

**Error: "permission denied"**
- Make sure you're logged into Supabase
- Check you're in the correct project

**Error: "syntax error"**
- Make sure you copied the ENTIRE file
- Don't copy just part of it

## 🔍 Quick Test:

After running SQL, test if it worked:
```
http://192.168.2.100:3000/api/check-db
```

If it says `tableExists: true`, you're good to go!
