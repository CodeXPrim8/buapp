# Quick Deployment Guide

This guide will help you deploy your Bison Note app to Vercel quickly and correctly.

## 🚀 Quick Start (5 Steps)

### Step 1: Generate JWT Secret
```bash
npm run generate-secret
```
Copy the generated secret - you'll need it for Vercel.

### Step 2: Run Pre-Deployment Check
```bash
npm run pre-deploy
```
This verifies your project is ready for deployment.

### Step 3: Get Vercel Setup Instructions
```bash
npm run vercel-setup
```
This shows you exactly what environment variables to set in Vercel.

### Step 4: Configure Vercel Environment Variables
1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project
3. Go to **Settings** → **Environment Variables**
4. Add each variable shown in Step 3
5. **Important**: Mark secrets (JWT_SECRET, PAYSTACK_SECRET_KEY, etc.) as "Encrypted"
6. Click **Save**

### Step 5: Deploy
- **Option A**: Push to GitHub (Vercel auto-deploys)
- **Option B**: Go to Deployments → Click "Redeploy" on latest deployment

## 📋 Available Scripts

### `npm run verify-env`
Checks if all required environment variables are set correctly.
- Use this locally with `.env.local` file
- Or use it to verify Vercel environment variables after deployment

### `npm run generate-secret`
Generates a secure random JWT secret key.
- Use this to create a new `JWT_SECRET` for production
- Never commit the generated secret to git

### `npm run pre-deploy`
Runs comprehensive pre-deployment checks.
- Verifies project structure
- Checks critical files
- Validates configuration

### `npm run vercel-setup`
Shows detailed Vercel setup instructions.
- Lists all required environment variables
- Shows examples and descriptions
- Provides step-by-step setup guide

## 🔑 Required Environment Variables

### Critical (Must Set)
1. **JWT_SECRET** - Generate with `npm run generate-secret`
2. **NEXT_PUBLIC_SUPABASE_URL** - Your Supabase project URL
3. **NEXT_PUBLIC_SUPABASE_ANON_KEY** - Your Supabase anonymous key
4. **NEXT_PUBLIC_APP_URL** - Your production URL (e.g., `https://your-app.vercel.app`)

### Important (If Using Payments)
5. **PAYSTACK_SECRET_KEY** - From Paystack dashboard
6. **NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY** - From Paystack dashboard

### Recommended
7. **SUPABASE_SERVICE_ROLE_KEY** - For admin operations
8. **ALLOWED_ORIGINS** - CORS configuration
9. **ADMIN_IP_WHITELIST** - Admin security

## ✅ Verification Checklist

After deployment:

- [ ] Run `npm run verify-env` (if you have access to Vercel CLI)
- [ ] Check Vercel deployment logs - no errors
- [ ] Test authentication (login/register)
- [ ] Test API endpoints
- [ ] Verify Supabase connection
- [ ] Test payment flow (if applicable)
- [ ] Check browser console - no errors

## 🐛 Troubleshooting

### Build Fails
- Check Vercel deployment logs
- Verify all required environment variables are set
- Run `npm run pre-deploy` locally to check for issues

### Runtime Errors
- Check Vercel Function logs
- Verify environment variables are set for correct environment (Production vs Preview)
- Test endpoints using `/api/check-env` (if debug endpoints enabled)

### Authentication Fails
- Verify `JWT_SECRET` is set and at least 32 characters
- Check Supabase credentials are correct
- Verify `NEXT_PUBLIC_SUPABASE_URL` matches your project

### Payment Issues
- Verify Paystack keys are set correctly
- Check `NEXT_PUBLIC_APP_URL` matches your deployment URL
- Verify Paystack keys match your environment (test vs live)

## 📚 Additional Resources

- **Detailed Environment Variables**: See `VERCEL_ENV_CHECKLIST.md`
- **Deployment Issues**: See `DEPLOYMENT_ISSUES_CHECK.md`
- **Deployment Summary**: See `DEPLOYMENT_SUMMARY.md`

## 🆘 Need Help?

1. Check the documentation files listed above
2. Review Vercel deployment logs
3. Run verification scripts to identify issues
4. Check environment variables match the checklist

---

**Ready to deploy?** Start with `npm run generate-secret` and follow the steps above!
