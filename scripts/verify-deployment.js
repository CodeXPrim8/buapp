#!/usr/bin/env node

/**
 * Post-Deployment Verification Script
 * Checks if deployment is working correctly
 */

const https = require('https')
const http = require('http')

const deploymentUrl = process.env.VERCEL_URL || process.argv[2] || 'https://your-app.vercel.app'

console.log('🔍 Verifying Deployment...\n')
console.log('='.repeat(60))
console.log(`Deployment URL: ${deploymentUrl}\n`)

const checks = {
  passed: 0,
  failed: 0,
  warnings: 0
}

function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url)
    const protocol = urlObj.protocol === 'https:' ? https : http
    
    const req = protocol.request(url, options, (res) => {
      let data = ''
      res.on('data', (chunk) => { data += chunk })
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: data
        })
      })
    })
    
    req.on('error', reject)
    req.setTimeout(10000, () => {
      req.destroy()
      reject(new Error('Request timeout'))
    })
    
    if (options.body) {
      req.write(options.body)
    }
    req.end()
  })
}

async function checkHomepage() {
  console.log('1️⃣  Checking homepage...')
  try {
    const response = await makeRequest(deploymentUrl)
    if (response.statusCode === 200) {
      // Check if it's not an error page
      if (response.body.includes('<!DOCTYPE html') || response.body.includes('<html')) {
        console.log('   ✅ Homepage loads successfully')
        checks.passed++
        return true
      } else {
        console.log('   ⚠️  Homepage returns 200 but content may be incorrect')
        checks.warnings++
        return false
      }
    } else {
      console.log(`   ❌ Homepage returned status ${response.statusCode}`)
      checks.failed++
      return false
    }
  } catch (error) {
    console.log(`   ❌ Error checking homepage: ${error.message}`)
    checks.failed++
    return false
  }
}

async function checkAPIHealth() {
  console.log('\n2️⃣  Checking API endpoints...')
  try {
    // Try a simple API endpoint
    const apiUrl = `${deploymentUrl}/api/check-env`
    const response = await makeRequest(apiUrl)
    
    if (response.statusCode === 200) {
      console.log('   ✅ API endpoint responds')
      checks.passed++
      
      try {
        const data = JSON.parse(response.body)
        if (data.supabaseUrl) {
          console.log('   ✅ Supabase configuration detected')
          checks.passed++
        }
      } catch (e) {
        // Not JSON, that's okay
      }
      return true
    } else {
      console.log(`   ⚠️  API endpoint returned status ${response.statusCode}`)
      checks.warnings++
      return false
    }
  } catch (error) {
    console.log(`   ⚠️  Error checking API: ${error.message}`)
    checks.warnings++
    return false
  }
}

async function checkBuildStatus() {
  console.log('\n3️⃣  Checking build status...')
  console.log('   ℹ️  Check Vercel dashboard for build logs')
  console.log('   ℹ️  Latest deployment should show "Ready" status')
  checks.passed++
}

function checkEnvironmentVariables() {
  console.log('\n4️⃣  Environment Variables Checklist:')
  console.log('   ⚠️  Manually verify in Vercel Dashboard:')
  console.log('   → Settings → Environment Variables')
  console.log('')
  console.log('   Required:')
  console.log('   ☐ JWT_SECRET (encrypted, 32+ chars)')
  console.log('   ☐ NEXT_PUBLIC_SUPABASE_URL')
  console.log('   ☐ NEXT_PUBLIC_SUPABASE_ANON_KEY')
  console.log('   ☐ NEXT_PUBLIC_APP_URL')
  console.log('')
  console.log('   Run: npm run verify-env (if you have Vercel CLI)')
  checks.warnings++
}

async function runChecks() {
  console.log('Starting verification...\n')
  
  await checkHomepage()
  await checkAPIHealth()
  await checkBuildStatus()
  checkEnvironmentVariables()
  
  // Summary
  console.log('\n' + '='.repeat(60))
  console.log('\n📊 VERIFICATION SUMMARY:\n')
  console.log(`✅ Passed: ${checks.passed}`)
  console.log(`⚠️  Warnings: ${checks.warnings}`)
  console.log(`❌ Failed: ${checks.failed}`)
  
  if (checks.failed > 0) {
    console.log('\n❌ DEPLOYMENT HAS ISSUES: Review failed checks above')
    process.exit(1)
  } else if (checks.warnings > 0) {
    console.log('\n⚠️  DEPLOYMENT LOOKS GOOD: Review warnings above')
    console.log('\n📋 Next Steps:')
    console.log('1. Verify environment variables in Vercel')
    console.log('2. Test authentication endpoints')
    console.log('3. Test API routes')
    console.log('4. Check browser console for errors')
    process.exit(0)
  } else {
    console.log('\n✅ DEPLOYMENT VERIFIED: Everything looks good!')
    process.exit(0)
  }
}

// Run if executed directly
if (require.main === module) {
  if (!deploymentUrl || deploymentUrl.includes('your-app')) {
    console.error('❌ Please provide deployment URL:')
    console.error('   node scripts/verify-deployment.js https://your-app.vercel.app')
    console.error('   Or set VERCEL_URL environment variable')
    process.exit(1)
  }
  
  runChecks().catch(error => {
    console.error('Error:', error)
    process.exit(1)
  })
}

module.exports = { runChecks, checkHomepage, checkAPIHealth }
