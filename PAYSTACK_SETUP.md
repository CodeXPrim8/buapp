# Paystack Payment Integration Setup

## Overview
The app now includes Paystack payment integration for wallet top-ups. When users click "Fund Wallet", they are redirected to a Paystack payment page where they can securely pay using cards, bank transfers, or mobile money.

## Setup Instructions

### 1. Get Paystack API Keys

1. Sign up for a Paystack account at https://paystack.com
2. Go to Settings → API Keys & Webhooks
3. Copy your **Secret Key** and **Public Key**
   - For testing: Use Test keys
   - For production: Use Live keys

### 2. Configure Environment Variables

Add the following to your `.env.local` file:

```env
# Paystack Configuration
PAYSTACK_SECRET_KEY=sk_test_your_secret_key_here
NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY=pk_test_your_public_key_here
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**For Production:**
```env
PAYSTACK_SECRET_KEY=sk_live_your_live_secret_key_here
NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY=pk_live_your_live_public_key_here
NEXT_PUBLIC_APP_URL=https://your-domain.com
```

### 3. How It Works

1. **User clicks "Fund Wallet"** → Navigates to Paystack payment page
2. **User enters amount and email** → Minimum amount is ₦100
3. **User clicks "Pay"** → Paystack payment gateway opens
4. **User completes payment** → Payment is verified on the server
5. **Wallet is credited** → User is redirected back to wallet page

### 4. Payment Flow

```
User → Paystack Payment Page → Paystack Gateway → Payment Verification → Wallet Credit
```

### 5. API Endpoints

- **POST `/api/payments/paystack/initialize`**
  - Initializes a Paystack payment
  - Returns authorization URL and reference
  
- **POST `/api/payments/paystack/verify`**
  - Verifies payment after user completes transaction
  - Credits user's wallet
  - Creates transfer record

### 6. Security Features

- ✅ Payment verification on server-side
- ✅ Duplicate payment prevention
- ✅ User authentication required
- ✅ Payment reference tracking
- ✅ Secure API key storage (server-side only)

### 7. Testing

**Test Cards (Paystack Test Mode):**
- Success: `4084084084084081`
- Decline: `5060666666666666666`
- Insufficient Funds: `5060666666666666667`

**Test Details:**
- CVV: Any 3 digits
- Expiry: Any future date
- PIN: Any 4 digits
- OTP: `123456`

### 8. Webhook Setup (Optional)

For production, you can set up Paystack webhooks to handle payment notifications:

1. Go to Paystack Dashboard → Settings → Webhooks
2. Add webhook URL: `https://your-domain.com/api/payments/paystack/webhook`
3. Select events: `charge.success`, `charge.failed`

### 9. Troubleshooting

**Payment not initializing:**
- Check that Paystack keys are correctly set in `.env.local`
- Verify `NEXT_PUBLIC_APP_URL` matches your domain
- Check browser console for errors

**Payment verification failing:**
- Ensure Paystack secret key is correct
- Check server logs for detailed error messages
- Verify payment reference exists in Paystack dashboard

**Wallet not being credited:**
- Check database connection
- Verify user authentication
- Check transfer records table for errors

---

*Last Updated: January 2026*
