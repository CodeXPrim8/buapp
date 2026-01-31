#!/usr/bin/env node

/**
 * Environment Variables Verification Script
 * Checks if all required environment variables are set and valid
 */

const requiredVars = {
  // Critical - Required for production
  JWT_SECRET: {
    required: true,
    minLength: 32,
    description: 'JWT secret for token signing',
    generate: 'openssl rand -base64 32',
    check: (val) => {
      if (!val) return { valid: false, error: 'JWT_SECRET is required' }
      if (val.length < 32) return { valid: false, error: `JWT_SECRET must be at least 32 characters (current: ${val.length})` }
      if (val === 'your_jwt_secret_here_minimum_32_characters') return { valid: false, error: 'JWT_SECRET is still using placeholder value' }
      if (val.includes('change-in-production')) return { valid: false, error: 'JWT_SECRET contains weak default value' }
      return { valid: true }
    }
  },
  NEXT_PUBLIC_SUPABASE_URL: {
    required: true,
    description: 'Supabase project URL',
    check: (val) => {
      if (!val) return { valid: false, error: 'NEXT_PUBLIC_SUPABASE_URL is required' }
      if (val === 'https://cmqtnppqpksvyhtqrcqi.supabase.co') return { valid: false, warning: 'Using example Supabase URL - ensure this is your actual project URL' }
      if (!val.startsWith('https://') || !val.includes('.supabase.co')) return { valid: false, error: 'Invalid Supabase URL format' }
      return { valid: true }
    }
  },
  NEXT_PUBLIC_SUPABASE_ANON_KEY: {
    required: true,
    minLength: 50,
    description: 'Supabase anonymous/public key',
    check: (val) => {
      if (!val) return { valid: false, error: 'NEXT_PUBLIC_SUPABASE_ANON_KEY is required' }
      if (val.includes('your_supabase')) return { valid: false, error: 'NEXT_PUBLIC_SUPABASE_ANON_KEY is still using placeholder value' }
      if (val.length < 50) return { valid: false, error: `NEXT_PUBLIC_SUPABASE_ANON_KEY seems too short (current: ${val.length})` }
      return { valid: true }
    }
  },
  NEXT_PUBLIC_APP_URL: {
    required: true,
    description: 'Production app URL (for Paystack callbacks)',
    check: (val) => {
      if (!val) return { valid: false, error: 'NEXT_PUBLIC_APP_URL is required' }
      if (val === 'http://localhost:3000') return { valid: false, warning: 'Using localhost - update to production URL for deployment' }
      if (!val.startsWith('http://') && !val.startsWith('https://')) return { valid: false, error: 'NEXT_PUBLIC_APP_URL must start with http:// or https://' }
      return { valid: true }
    }
  }
}

const optionalVars = {
  PAYSTACK_SECRET_KEY: {
    description: 'Paystack secret key (required if using payments)',
    check: (val) => {
      if (!val) return { valid: true, warning: 'PAYSTACK_SECRET_KEY not set (required for payment features)' }
      if (!val.startsWith('sk_')) return { valid: false, error: 'Invalid Paystack secret key format (should start with sk_)' }
      return { valid: true }
    }
  },
  NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY: {
    description: 'Paystack public key (required if using payments)',
    check: (val) => {
      if (!val) return { valid: true, warning: 'NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY not set (required for payment features)' }
      if (!val.startsWith('pk_')) return { valid: false, error: 'Invalid Paystack public key format (should start with pk_)' }
      return { valid: true }
    }
  },
  SUPABASE_SERVICE_ROLE_KEY: {
    description: 'Supabase service role key (recommended for admin operations)',
    check: (val) => {
      if (!val) return { valid: true, warning: 'SUPABASE_SERVICE_ROLE_KEY not set (recommended for admin operations)' }
      return { valid: true }
    }
  },
  ALLOWED_ORIGINS: {
    description: 'CORS allowed origins',
    check: (val) => {
      if (!val) return { valid: true, warning: 'ALLOWED_ORIGINS not set (will use default: https://yourdomain.com in production)' }
      return { valid: true }
    }
  },
  ADMIN_IP_WHITELIST: {
    description: 'Admin IP whitelist (recommended for production)',
    check: (val) => {
      if (!val) return { valid: true, warning: 'ADMIN_IP_WHITELIST not set (allows all IPs - not recommended for production)' }
      return { valid: true }
    }
  },
  CLEANUP_SECRET_KEY: {
    description: 'Database cleanup secret key',
    check: (val) => {
      if (!val || val === 'cleanup-secret-key-change-in-production') {
        return { valid: true, warning: 'CLEANUP_SECRET_KEY using default value (change in production)' }
      }
      return { valid: true }
    }
  },
  JWT_EXPIRES_IN: {
    description: 'JWT access token expiration',
    check: (val) => {
      if (!val) return { valid: true, info: 'Using default: 1h' }
      return { valid: true }
    }
  },
  JWT_REFRESH_EXPIRES_IN: {
    description: 'JWT refresh token expiration',
    check: (val) => {
      if (!val) return { valid: true, info: 'Using default: 7d' }
      return { valid: true }
    }
  }
}

function checkEnvironment() {
  console.log('🔍 Verifying Environment Variables...\n')
  console.log('=' .repeat(60))
  
  const results = {
    required: { passed: 0, failed: 0, warnings: [] },
    optional: { passed: 0, warnings: [], info: [] }
  }
  
  // Check required variables
  console.log('\n📋 REQUIRED VARIABLES:\n')
  for (const [key, config] of Object.entries(requiredVars)) {
    const value = process.env[key]
    const check = config.check(value)
    
    if (check.valid) {
      if (check.warning) {
        console.log(`⚠️  ${key}: ${check.warning}`)
        results.required.warnings.push({ key, message: check.warning })
      } else {
        const masked = value ? value.substring(0, 10) + '...' + value.substring(value.length - 4) : 'NOT SET'
        console.log(`✅ ${key}: ${masked}`)
        results.required.passed++
      }
    } else {
      console.log(`❌ ${key}: ${check.error}`)
      if (config.generate) {
        console.log(`   Generate with: ${config.generate}`)
      }
      results.required.failed++
    }
  }
  
  // Check optional variables
  console.log('\n📋 OPTIONAL VARIABLES:\n')
  for (const [key, config] of Object.entries(optionalVars)) {
    const value = process.env[key]
    const check = config.check(value)
    
    if (check.valid) {
      if (check.warning) {
        console.log(`⚠️  ${key}: ${check.warning}`)
        results.optional.warnings.push({ key, message: check.warning })
      } else if (check.info) {
        console.log(`ℹ️  ${key}: ${check.info}`)
        results.optional.info.push({ key, message: check.info })
      } else {
        const masked = value ? value.substring(0, 10) + '...' + value.substring(value.length - 4) : 'NOT SET'
        console.log(`✅ ${key}: ${masked}`)
        results.optional.passed++
      }
    } else {
      console.log(`❌ ${key}: ${check.error}`)
      results.optional.warnings.push({ key, message: check.error })
    }
  }
  
  // Summary
  console.log('\n' + '='.repeat(60))
  console.log('\n📊 SUMMARY:\n')
  console.log(`Required Variables: ${results.required.passed} passed, ${results.required.failed} failed`)
  console.log(`Optional Variables: ${results.optional.passed} passed`)
  
  if (results.required.warnings.length > 0) {
    console.log(`\n⚠️  Warnings: ${results.required.warnings.length}`)
  }
  
  if (results.optional.warnings.length > 0) {
    console.log(`⚠️  Optional Warnings: ${results.optional.warnings.length}`)
  }
  
  if (results.required.failed > 0) {
    console.log('\n❌ DEPLOYMENT WILL FAIL: Required variables are missing or invalid!')
    console.log('\nPlease set the required variables in Vercel:')
    console.log('1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables')
    console.log('2. Add each missing variable')
    console.log('3. Redeploy your application')
    process.exit(1)
  } else if (results.required.warnings.length > 0 || results.optional.warnings.length > 0) {
    console.log('\n⚠️  DEPLOYMENT MAY HAVE ISSUES: Some warnings detected')
    console.log('Review warnings above and fix before production deployment')
    process.exit(0)
  } else {
    console.log('\n✅ ALL CHECKS PASSED: Ready for deployment!')
    process.exit(0)
  }
}

// Run if executed directly
if (require.main === module) {
  // Load .env.local if it exists (for local testing)
  try {
    require('dotenv').config({ path: '.env.local' })
  } catch (e) {
    // dotenv not installed, that's okay
  }
  
  checkEnvironment()
}

module.exports = { checkEnvironment, requiredVars, optionalVars }
