# 🆕 Create New Vercel Project - Step by Step

Follow these exact steps to create a NEW Vercel deployment that will **actually work**.

## ⚠️ Before You Start

1. **Ensure fixes are pushed to GitHub**
   ```bash
   git status
   # If you see modified files, commit and push them first
   git add .
   git commit -m "Prepare for new Vercel deployment"
   git push origin main
   ```

2. **Have these ready**:
   - ✅ GitHub repository URL: `https://github.com/CodeXPrim8/BU`
   - ✅ Supabase project URL and API keys
   - ✅ JWT secret (generate with `npm run generate-secret`)

## 🚀 Step-by-Step Instructions

### Step 1: Generate JWT Secret

```bash
npm run generate-secret
```

**Copy the generated secret** - you'll need it in Step 3.

### Step 2: Go to Vercel Dashboard

1. Visit: https://vercel.com/dashboard
2. Click **"Add New..."** button (top right)
3. Select **"Project"**

### Step 3: Import Your Repository

1. **Connect GitHub** (if not already connected)
   - Click "Import Git Repository"
   - Authorize Vercel to access your GitHub account
   - Select repository: `CodeXPrim8/BU`

2. **Configure Project Settings**
   - **Project Name**: `bu-app` (or your choice)
   - **Framework Preset**: `Next.js` (should auto-detect)
   - **Root Directory**: `./` (leave as root)
   - **Build Command**: `next build` (default)
   - **Output Directory**: `.next` (default)
   - **Install Command**: `pnpm install` (or `npm install`)

### Step 4: Set Environment Variables (CRITICAL!)

**⚠️ DO THIS BEFORE CLICKING "DEPLOY"!**

Click **"Environment Variables"** section and add:

#### Variable 1: JWT_SECRET
- **Key**: `JWT_SECRET`
- **Value**: [paste the secret from Step 1]
- **☑️ Encrypted**: Yes (check this box!)
- **Environments**: ☑️ Production, ☑️ Preview, ☑️ Development

#### Variable 2: NEXT_PUBLIC_SUPABASE_URL
- **Key**: `NEXT_PUBLIC_SUPABASE_URL`
- **Value**: `https://cmqtnppqpksvyhtqrcqi.supabase.co` (or your actual Supabase URL)
- **☑️ Encrypted**: No
- **Environments**: ☑️ Production, ☑️ Preview, ☑️ Development

#### Variable 3: NEXT_PUBLIC_SUPABASE_ANON_KEY
- **Key**: `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- **Value**: [your actual Supabase anon key from Supabase dashboard]
- **☑️ Encrypted**: No
- **Environments**: ☑️ Production, ☑️ Preview, ☑️ Development

#### Variable 4: NEXT_PUBLIC_APP_URL
- **Key**: `NEXT_PUBLIC_APP_URL`
- **Value**: `https://bu-app.vercel.app` (or whatever Vercel assigns)
- **Note**: You can update this after first deploy with actual URL
- **☑️ Encrypted**: No
- **Environments**: ☑️ Production, ☑️ Preview

#### Optional Variables (Recommended):

**SUPABASE_SERVICE_ROLE_KEY**
- **Key**: `SUPABASE_SERVICE_ROLE_KEY`
- **Value**: [your Supabase service role key]
- **☑️ Encrypted**: Yes
- **Environments**: ☑️ Production only

**PAYSTACK_SECRET_KEY** (if using payments)
- **Key**: `PAYSTACK_SECRET_KEY`
- **Value**: `sk_test_...` or `sk_live_...`
- **☑️ Encrypted**: Yes
- **Environments**: ☑️ Production, ☑️ Preview

**NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY** (if using payments)
- **Key**: `NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY`
- **Value**: `pk_test_...` or `pk_live_...`
- **☑️ Encrypted**: No
- **Environments**: ☑️ Production, ☑️ Preview, ☑️ Development

### Step 5: Deploy

1. Click **"Deploy"** button
2. Wait for build to complete (2-5 minutes)
3. Watch the build logs - should show:
   - ✅ Installing dependencies
   - ✅ Building application
   - ✅ Build successful

### Step 6: Verify Deployment

After deployment completes:

1. **Check Build Status**
   - Should show: ✅ "Ready" or "Building"
   - Click on deployment to see logs
   - Should NOT show "supabaseKey is required" error

2. **Visit Your App**
   - Click the deployment URL (e.g., `https://bu-app.vercel.app`)
   - Should see your application homepage
   - Should NOT see error page

3. **Test Key Features**
   - [ ] Homepage loads
   - [ ] No console errors (F12 → Console)
   - [ ] Authentication page accessible
   - [ ] API endpoints respond

## 🔍 Troubleshooting

### Build Fails with "supabaseKey is required"

**Solution**: 
- Ensure `lib/supabase.ts` has the build-time fix
- Check that the fix is pushed to GitHub
- Verify commit includes the Supabase initialization fix

### App Shows Error Page

**Check**:
1. Environment variables are set correctly
2. `NEXT_PUBLIC_SUPABASE_ANON_KEY` is not a placeholder
3. `JWT_SECRET` is at least 32 characters
4. Check browser console for specific errors

### Authentication Not Working

**Check**:
1. `JWT_SECRET` is set and encrypted
2. Supabase credentials are correct
3. Check Vercel Function logs for errors

## ✅ Success Checklist

Your deployment is successful when:

- [ ] Build completes without errors
- [ ] Deployment shows "Ready" status
- [ ] Application URL shows your app (not error page)
- [ ] Homepage loads correctly
- [ ] No console errors in browser
- [ ] Environment variables are set correctly

## 📝 Post-Deployment

After successful deployment:

1. **Update NEXT_PUBLIC_APP_URL**
   - Go to Settings → Environment Variables
   - Update `NEXT_PUBLIC_APP_URL` with actual deployment URL
   - Redeploy

2. **Test Application**
   - Test authentication
   - Test API endpoints
   - Test payment flow (if applicable)

3. **Set Up Custom Domain** (optional)
   - Go to Settings → Domains
   - Add your custom domain
   - Follow DNS configuration instructions

## 🎯 Quick Reference

**Generate JWT Secret**:
```bash
npm run generate-secret
```

**Get Setup Instructions**:
```bash
npm run vercel-setup
```

**Verify Deployment** (after deploy):
```bash
npm run verify-deployment https://your-app.vercel.app
```

## 📚 Additional Help

- **Environment Variables**: See `VERCEL_ENV_CHECKLIST.md`
- **Deployment Issues**: See `DEPLOYMENT_ISSUES_CHECK.md`
- **Quick Guide**: See `QUICK_DEPLOYMENT_GUIDE.md`

---

**Ready?** Follow the steps above and your app will be live! 🚀
