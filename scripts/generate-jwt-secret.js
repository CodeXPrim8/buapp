#!/usr/bin/env node

/**
 * JWT Secret Generator
 * Generates a secure random JWT secret key
 */

const crypto = require('crypto')

function generateJWTSecret() {
  // Generate a 32-byte random string and encode as base64
  // This gives us ~44 characters, which is more than the minimum 32 required
  const secret = crypto.randomBytes(32).toString('base64')
  
  console.log('🔐 Generated JWT Secret:\n')
  console.log('='.repeat(60))
  console.log(secret)
  console.log('='.repeat(60))
  console.log(`\nLength: ${secret.length} characters (minimum required: 32)`)
  console.log('\n📋 To use this secret:')
  console.log('1. Copy the secret above')
  console.log('2. Go to Vercel Dashboard → Your Project → Settings → Environment Variables')
  console.log('3. Add new variable:')
  console.log('   Key: JWT_SECRET')
  console.log('   Value: [paste the secret above]')
  console.log('   Environment: Production (and Preview if needed)')
  console.log('   ☑️  Mark as "Encrypted"')
  console.log('4. Click Save')
  console.log('5. Redeploy your application')
  console.log('\n⚠️  IMPORTANT: Keep this secret secure! Never commit it to git.')
  
  return secret
}

// Run if executed directly
if (require.main === module) {
  generateJWTSecret()
}

module.exports = { generateJWTSecret }
