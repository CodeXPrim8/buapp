# ⚠️ API Keys from Wrong Project!

## The Problem:
Your API keys are from project: `eugnepzbjrvqzmldhrql`
But your `.env.local` points to: `cmqtnppqpksvyhtqrcqi`

**The tables exist in `cmqtnppqpksvyhtqrcqi`, but the API keys are from a different project!**

## ✅ Solution: Get API Keys from Correct Project

### Option 1: Get Keys from cmqtnppqpksvyhtqrcqi (Where Tables Exist)

1. **Go to the correct Supabase project:**
   - https://cmqtnppqpksvyhtqrcqi.supabase.co
   - Sign in

2. **Get API Keys:**
   - Settings → API
   - Copy the **"anon public"** key (the long JWT token)

3. **Update `.env.local`:**
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://cmqtnppqpksvyhtqrcqi.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... (from cmqtnppqpksvyhtqrcqi project)
   ```

### Option 2: Use the Project with These Keys (eugnepzbjrvqzmldhrql)

If you want to use the project with these keys:

1. **Update `.env.local`:**
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://eugnepzbjrvqzmldhrql.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV1Z25lcHpianJ2cW16bGRocnFsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMxMzQzMzMsImV4cCI6MjA3ODcxMDMzM30.Zf1uB2FeDXJieiRrMcBq2gGLEKwlv0ZLfh7CG_58bfU
   ```

2. **Create tables in THIS project:**
   - Run `database/schema-no-rls.sql` in this project's SQL Editor

## 🎯 Recommended: Option 1

Since your tables already exist in `cmqtnppqpksvyhtqrcqi`, get the API keys from that project.

## ✅ After Fixing:

1. Update `.env.local` with matching URL and API key
2. Restart dev server: `npm run dev`
3. Test registration - should work!
