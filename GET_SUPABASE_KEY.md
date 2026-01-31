# 🔑 How to Get Your Supabase Anon Key

Follow these steps to get your `NEXT_PUBLIC_SUPABASE_ANON_KEY` value.

## 📋 Step-by-Step Instructions

### Step 1: Go to Supabase Dashboard
1. Visit: https://supabase.com/dashboard
2. Sign in with your account
3. If you don't have an account, create one (it's free)

### Step 2: Select Your Project
1. If you already have a project:
   - Click on your project name in the dashboard
   - Skip to Step 3

2. If you need to create a project:
   - Click "New Project"
   - Enter project name (e.g., "Bison Note")
   - Enter database password (save this!)
   - Select region closest to you
   - Click "Create new project"
   - Wait 2-3 minutes for project to initialize

### Step 3: Get Your API Keys
1. In your project dashboard, click **"Settings"** (gear icon in left sidebar)
2. Click **"API"** in the settings menu
3. You'll see two sections:
   - **Project URL**: This is your `NEXT_PUBLIC_SUPABASE_URL`
   - **Project API keys**: This is where your keys are

### Step 4: Copy the Anon Key
1. Under **"Project API keys"**, you'll see:
   - **anon** or **public** key (this is what you need!)
   - **service_role** key (optional, for admin operations)

2. For the **anon/public** key:
   - Click the **"Reveal"** button or eye icon
   - The full key will be displayed
   - Click **"Copy"** button to copy it
   - **⚠️ IMPORTANT**: Copy the ENTIRE key - it's very long (100+ characters)

3. The key should look like:
   ```
   eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNtcXRucHBxcGtzdnlodHFyY3FpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mjk4NzY1NDAsImV4cCI6MjA0NTQ1MjU0MH0.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   ```

### Step 5: Use in Vercel
1. Go back to Vercel Dashboard
2. Go to your project → Settings → Environment Variables
3. Add new variable:
   - **Key**: `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **Value**: [Paste the copied key here]
   - **☑️ Encrypted**: NO (this is a public key, safe to expose)
   - **Environments**: Production, Preview, Development
4. Click "Save"

## ✅ Verification

After setting the key, verify:
- [ ] Key is 100+ characters long
- [ ] Key starts with `eyJ` (base64 encoded JWT)
- [ ] No extra spaces before/after the key
- [ ] Key is your actual key (not "your_supabase_anon_key_here")

## 🆘 Troubleshooting

### "I don't see the Reveal button"
- Make sure you're logged into Supabase
- Try refreshing the page
- The key might already be visible - just copy it

### "The key seems too short"
- Make sure you copied the ENTIRE key
- It should be 100+ characters
- Try copying again, sometimes it gets truncated

### "I don't have a Supabase project"
- Create a free account at https://supabase.com
- Click "New Project"
- Follow the setup wizard
- Wait for project to initialize (2-3 minutes)

### "I'm not sure which key to use"
- Use the **"anon"** or **"public"** key
- This is the one that says "anon" or "public" in the name
- Do NOT use the "service_role" key for this variable

## 📝 Quick Checklist

- [ ] Logged into Supabase Dashboard
- [ ] Selected your project
- [ ] Went to Settings → API
- [ ] Found "anon" or "public" key
- [ ] Clicked "Reveal" to show full key
- [ ] Copied the ENTIRE key (100+ characters)
- [ ] Pasted into Vercel as `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- [ ] Saved in Vercel

---

**Need help?** Check the Supabase documentation: https://supabase.com/docs
