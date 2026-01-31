# Security Quick Start Guide

## 🚀 Quick Setup (5 minutes)

### Step 1: Generate Strong JWT Secret

```bash
# Generate a secure 32+ character secret
openssl rand -base64 32
```

### Step 2: Update .env.local

```bash
# Add to .env.local (replace with your generated secret)
JWT_SECRET=<paste-generated-secret-here>
```

### Step 3: Create Audit Logs Table

1. Open Supabase Dashboard → SQL Editor
2. Run: `database/create-audit-logs-table.sql`
3. Verify table was created

### Step 4: Restart Server

```bash
# Stop server (Ctrl+C)
# Start again
npm run dev
```

---

## ✅ Verification

### Test 1: JWT Secret Validation
- Server should start without errors
- If you see "JWT_SECRET validation failed", check your secret length

### Test 2: Account Lockout
1. Try logging in with wrong PIN 5 times
2. Account should lock for 15 minutes
3. Error message should indicate lockout

### Test 3: CSRF Protection
1. Login successfully (CSRF token should be set)
2. Make a POST request without CSRF token header
3. Should receive 403 error

### Test 4: Audit Logging
1. Check Supabase → audit_logs table
2. Should see login attempts logged
3. Check console for audit log entries

---

## 🔧 Client-Side Updates Needed

### Add CSRF Token Helper

```typescript
// Add to your API client or utils
function getCSRFToken(): string | null {
  if (typeof document === 'undefined') return null
  const cookies = document.cookie.split(';')
  const csrfCookie = cookies.find(c => c.trim().startsWith('csrf-token='))
  return csrfCookie ? csrfCookie.split('=')[1] : null
}
```

### Update API Calls

```typescript
// Before
fetch('/api/endpoint', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(data),
})

// After
fetch('/api/endpoint', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-csrf-token': getCSRFToken() || '',
  },
  credentials: 'include',
  body: JSON.stringify(data),
})
```

---

## 📋 Security Features Now Active

✅ **Strong Secrets** - JWT_SECRET validation enforced  
✅ **CSRF Protection** - All state-changing requests protected  
✅ **Account Lockout** - 5 failed attempts = 15 min lockout  
✅ **Short-Lived Tokens** - Access tokens expire in 1 hour  
✅ **Refresh Tokens** - Secure token refresh mechanism  
✅ **Audit Logging** - All security events logged  

---

## 🆘 Troubleshooting

### "JWT_SECRET validation failed"
- Ensure JWT_SECRET is at least 32 characters
- Remove any weak default values
- Generate new secret: `openssl rand -base64 32`

### "Invalid CSRF token" errors
- Ensure CSRF token cookie is set (check browser dev tools)
- Include `x-csrf-token` header in requests
- Check that `credentials: 'include'` is set

### Account locked unexpectedly
- Wait 15 minutes for automatic unlock
- Or manually clear lockout in database (for testing only)

### Audit logs not appearing
- Verify `audit_logs` table exists in Supabase
- Check RLS policies allow inserts
- Check console for error messages

---

## 📚 Full Documentation

See `SECURITY_IMPROVEMENTS.md` for complete details.
