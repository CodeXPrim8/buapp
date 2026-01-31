# 🔑 Your Environment Variables for Vercel

This document contains the **exact values** you need to set in Vercel.

## 📋 Required Variables

### 1. JWT_SECRET ✅ Generated Below

**Key**: `JWT_SECRET`  
**Value**: See generated value below  
**☑️ Encrypted**: YES (check this box!)  
**Environments**: Production, Preview, Development

**Generated Secret**:
```
UMAE/pfdirzUt0Nl+MHMpy62CvkZ8xqlPcy9xJiCmoM=
```

**⚠️ COPY THIS EXACT VALUE** - This is your unique JWT secret (44 characters)

---

### 2. NEXT_PUBLIC_SUPABASE_URL

**Key**: `NEXT_PUBLIC_SUPABASE_URL`  
**Value**: `https://cmqtnppqpksvyhtqrcqi.supabase.co`  
**☑️ Encrypted**: NO  
**Environments**: Production, Preview, Development

**How to get your actual value**:
1. Go to: https://supabase.com/dashboard
2. Select your project
3. Go to: Settings → API
4. Copy the "Project URL" value
5. Replace the value above if different

---

### 3. NEXT_PUBLIC_SUPABASE_ANON_KEY

**Key**: `NEXT_PUBLIC_SUPABASE_ANON_KEY`  
**Value**: `[YOUR_SUPABASE_ANON_KEY_HERE]`  
**☑️ Encrypted**: NO  
**Environments**: Production, Preview, Development

**How to get this value**:
1. Go to: https://supabase.com/dashboard
2. Select your project
3. Go to: Settings → API
4. Under "Project API keys", find the **"anon"** or **"public"** key
5. Click "Reveal" or copy the key
6. It should look like: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNtcXRucHBxcGtzdnlodHFyY3FpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3M...`
7. **⚠️ IMPORTANT**: This is a LONG string (100+ characters). Copy the ENTIRE value.

---

### 4. NEXT_PUBLIC_APP_URL

**Key**: `NEXT_PUBLIC_APP_URL`  
**Value**: `https://bu-app.vercel.app` (or your Vercel-assigned URL)  
**☑️ Encrypted**: NO  
**Environments**: Production, Preview

**How to set this**:
1. **First deploy**: Use `https://bu-app.vercel.app` (or whatever Vercel assigns)
2. **After first deploy**: 
   - Go to Vercel Dashboard → Your Project → Deployments
   - Copy the deployment URL (e.g., `https://bu-app-abc123.vercel.app`)
   - Update this variable with the actual URL
   - Redeploy

**Note**: You can update this after the first successful deployment.

---

## 🎯 Quick Copy-Paste Checklist

When setting up in Vercel, use this checklist:

### Variable 1: JWT_SECRET
- [ ] Key: `JWT_SECRET`
- [ ] Value: [Copy from generated value below]
- [ ] ☑️ Encrypted: YES
- [ ] Environments: Production, Preview, Development

### Variable 2: NEXT_PUBLIC_SUPABASE_URL
- [ ] Key: `NEXT_PUBLIC_SUPABASE_URL`
- [ ] Value: `https://cmqtnppqpksvyhtqrcqi.supabase.co`
- [ ] ☑️ Encrypted: NO
- [ ] Environments: Production, Preview, Development

### Variable 3: NEXT_PUBLIC_SUPABASE_ANON_KEY
- [ ] Key: `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- [ ] Value: [Get from Supabase Dashboard → Settings → API → anon key]
- [ ] ☑️ Encrypted: NO
- [ ] Environments: Production, Preview, Development

### Variable 4: NEXT_PUBLIC_APP_URL
- [ ] Key: `NEXT_PUBLIC_APP_URL`
- [ ] Value: `https://bu-app.vercel.app` (update after first deploy)
- [ ] ☑️ Encrypted: NO
- [ ] Environments: Production, Preview

---

## 📝 Step-by-Step: Getting Supabase Keys

### If you don't have Supabase keys yet:

1. **Go to Supabase Dashboard**
   - Visit: https://supabase.com/dashboard
   - Sign in or create account

2. **Select or Create Project**
   - If you have a project: Select it
   - If not: Create new project

3. **Get Project URL**
   - Go to: Settings → API
   - Copy "Project URL" (looks like: `https://xxxxx.supabase.co`)

4. **Get Anon Key**
   - Same page: Settings → API
   - Under "Project API keys"
   - Find "anon" or "public" key
   - Click "Reveal" to see full key
   - Copy the ENTIRE key (it's very long!)

---

## ⚠️ Important Notes

1. **JWT_SECRET**: 
   - Must be at least 32 characters
   - Keep it secret! Never share or commit to git
   - Mark as "Encrypted" in Vercel

2. **NEXT_PUBLIC_SUPABASE_ANON_KEY**:
   - This is a PUBLIC key (safe to expose)
   - But it should be YOUR actual key, not a placeholder
   - Should be 100+ characters long

3. **NEXT_PUBLIC_APP_URL**:
   - Can be updated after first deployment
   - Use the actual Vercel deployment URL

4. **All variables**:
   - Set them BEFORE clicking "Deploy"
   - Double-check spelling (case-sensitive!)
   - No extra spaces before/after values

---

## 🔍 Verification

After setting variables, verify:

1. All 4 required variables are set
2. JWT_SECRET is marked as encrypted
3. Supabase keys are your actual keys (not placeholders)
4. Values don't have extra spaces

---

**Ready to set these in Vercel?** Follow the checklist above! ✅
