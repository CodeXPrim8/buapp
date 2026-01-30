# Live Paystack Payment Setup Guide

## ⚠️ IMPORTANT: Switching to Live Payments

This guide will help you configure **LIVE** Paystack payment keys for real user transactions.

## Prerequisites

1. **Paystack Account**: You must have a verified Paystack business account
2. **Business Verification**: Complete Paystack business verification (required for live keys)
3. **Bank Account**: Add and verify your bank account in Paystack dashboard

## Step 1: Get Live Paystack Keys

1. Log in to your Paystack Dashboard: https://dashboard.paystack.com
2. Go to **Settings** → **API Keys & Webhooks**
3. **Switch to Live Mode** (toggle in the top right)
4. Copy your **Live Secret Key** (starts with `sk_live_...`)
5. Copy your **Live Public Key** (starts with `pk_live_...`)

⚠️ **Security Warning**: 
- Never commit these keys to git
- Keep your secret key secure (server-side only)
- Public key can be exposed in frontend code

## Step 2: Update Environment Variables

### For Local Development (.env.local)

Create or update `.env.local` file in the project root:

```env
# Paystack Live Configuration
PAYSTACK_SECRET_KEY=sk_live_YOUR_LIVE_SECRET_KEY_HERE
NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY=pk_live_YOUR_LIVE_PUBLIC_KEY_HERE

# Production App URL (update with your actual domain)
NEXT_PUBLIC_APP_URL=https://your-domain.com

# Other required variables (keep existing values)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_key
JWT_SECRET=your_jwt_secret
```

### For Production Deployment

**Vercel/Netlify:**
1. Go to your project settings
2. Navigate to **Environment Variables**
3. Add/Update:
   - `PAYSTACK_SECRET_KEY` = `sk_live_...`
   - `NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY` = `pk_live_...`
   - `NEXT_PUBLIC_APP_URL` = `https://your-domain.com`

**Other Hosting:**
- Set environment variables in your hosting platform's dashboard
- Ensure `.env.local` is NOT committed to git (should be in `.gitignore`)

## Step 3: Verify Configuration

After updating environment variables:

1. **Restart your development server**:
   ```bash
   # Stop the server (Ctrl+C)
   # Then restart:
   npm run dev
   ```

2. **Verify keys are loaded**:
   - Check server console for any "Paystack keys not configured" errors
   - If you see this error, your keys aren't being read correctly

3. **Test with a small amount first**:
   - Use a real card with a small amount (e.g., ₦100)
   - Verify payment goes through
   - Check wallet balance updates correctly

## Step 4: Test Payment Flow

### Before Going Live:

1. **Test with small amount** (₦100 minimum)
2. **Verify wallet balance updates** after payment
3. **Check transfer records** are created correctly
4. **Test payment verification** works properly

### Live Payment Testing:

⚠️ **Real money will be charged!**

1. Use a real debit/credit card
2. Complete a test payment
3. Verify:
   - Payment appears in Paystack dashboard
   - Wallet balance updates in app
   - Transfer record is created
   - User receives confirmation

## Step 5: Monitor Payments

### Paystack Dashboard:
- Monitor all transactions in real-time
- View payment analytics
- Download transaction reports
- Handle refunds if needed

### App Monitoring:
- Check server logs for payment verification errors
- Monitor wallet balance updates
- Track transfer records in database

## Security Checklist

- ✅ Secret key stored in environment variables (never in code)
- ✅ Public key exposed only in frontend (safe)
- ✅ Payment verification happens server-side
- ✅ Duplicate payment prevention enabled
- ✅ User authentication required for all payments
- ✅ `.env.local` in `.gitignore` (not committed)

## Troubleshooting

### Payment Not Initializing:
- ✅ Check `PAYSTACK_SECRET_KEY` is set correctly
- ✅ Check `NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY` is set correctly
- ✅ Verify `NEXT_PUBLIC_APP_URL` matches your domain
- ✅ Restart server after changing env variables

### Payment Verification Failing:
- ✅ Verify secret key is correct (live key, not test key)
- ✅ Check Paystack dashboard for transaction status
- ✅ Review server logs for detailed errors

### Wallet Not Updating:
- ✅ Check database connection
- ✅ Verify user authentication
- ✅ Check transfer records table for errors
- ✅ Review payment verification endpoint logs

## Important Notes

1. **Test vs Live Keys**: 
   - Test keys start with `sk_test_` and `pk_test_`
   - Live keys start with `sk_live_` and `pk_live_`
   - Never mix test and live keys

2. **Transaction Fees**:
   - Paystack charges transaction fees (check current rates)
   - Fees are deducted from received amount
   - Consider this in your pricing

3. **Refunds**:
   - Handle refunds through Paystack dashboard
   - Update wallet balance manually if needed
   - Keep records of all refunds

4. **Webhooks** (Recommended for Production):
   - Set up Paystack webhooks for payment notifications
   - Webhook URL: `https://your-domain.com/api/payments/paystack/webhook`
   - Events: `charge.success`, `charge.failed`

## Support

- **Paystack Support**: https://paystack.com/help
- **Paystack Documentation**: https://paystack.com/docs
- **Paystack Status**: https://status.paystack.com

---

**⚠️ Remember**: Once live keys are active, all payments will be REAL transactions. Test thoroughly before going live!
