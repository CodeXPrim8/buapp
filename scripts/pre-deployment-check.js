#!/usr/bin/env node

/**
 * Pre-Deployment Verification Script
 * Comprehensive check before deploying to Vercel
 */

const fs = require('fs')
const path = require('path')

console.log('🚀 Pre-Deployment Verification\n')
console.log('='.repeat(60))

const checks = {
  passed: 0,
  failed: 0,
  warnings: 0
}

// Check 1: Verify env.example exists
console.log('\n1️⃣  Checking project files...')
try {
  if (fs.existsSync('env.example') || fs.existsSync('.env.example')) {
    console.log('   ✅ env.example exists')
    checks.passed++
  } else {
    console.log('   ⚠️  env.example not found')
    checks.warnings++
  }
} catch (e) {
  console.log('   ❌ Error checking env.example')
  checks.failed++
}

// Check 2: Verify .gitignore excludes .env files
console.log('\n2️⃣  Checking .gitignore...')
try {
  const gitignore = fs.readFileSync('.gitignore', 'utf8')
  if (gitignore.includes('.env')) {
    console.log('   ✅ .env files are ignored')
    checks.passed++
  } else {
    console.log('   ⚠️  .env files may not be ignored')
    checks.warnings++
  }
} catch (e) {
  console.log('   ❌ Error reading .gitignore')
  checks.failed++
}

// Check 3: Verify next.config.mjs exists
console.log('\n3️⃣  Checking Next.js configuration...')
try {
  if (fs.existsSync('next.config.mjs')) {
    const config = fs.readFileSync('next.config.mjs', 'utf8')
    console.log('   ✅ next.config.mjs exists')
    
    if (config.includes('ignoreBuildErrors: true')) {
      console.log('   ⚠️  TypeScript build errors are ignored')
      checks.warnings++
    } else {
      console.log('   ✅ TypeScript errors will fail build')
      checks.passed++
    }
    
    checks.passed++
  } else {
    console.log('   ❌ next.config.mjs not found')
    checks.failed++
  }
} catch (e) {
  console.log('   ❌ Error checking next.config.mjs')
  checks.failed++
}

// Check 4: Verify package.json has build script
console.log('\n4️⃣  Checking package.json...')
try {
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'))
  if (packageJson.scripts && packageJson.scripts.build) {
    console.log('   ✅ Build script exists:', packageJson.scripts.build)
    checks.passed++
  } else {
    console.log('   ❌ Build script not found')
    checks.failed++
  }
} catch (e) {
  console.log('   ❌ Error reading package.json')
  checks.failed++
}

// Check 5: Verify API routes structure
console.log('\n5️⃣  Checking API routes...')
try {
  const apiDir = path.join('app', 'api')
  if (fs.existsSync(apiDir)) {
    const routes = fs.readdirSync(apiDir, { recursive: true })
    const routeFiles = routes.filter(f => f.endsWith('route.ts'))
    console.log(`   ✅ Found ${routeFiles.length} API route files`)
    checks.passed++
  } else {
    console.log('   ⚠️  API directory not found')
    checks.warnings++
  }
} catch (e) {
  console.log('   ⚠️  Error checking API routes')
  checks.warnings++
}

// Check 6: Verify critical files exist
console.log('\n6️⃣  Checking critical files...')
const criticalFiles = [
  'lib/jwt.ts',
  'lib/supabase.ts',
  'lib/security.ts',
  'app/layout.tsx',
  'app/page.tsx'
]

let criticalFilesFound = 0
for (const file of criticalFiles) {
  if (fs.existsSync(file)) {
    criticalFilesFound++
  } else {
    console.log(`   ❌ Missing: ${file}`)
    checks.failed++
  }
}

if (criticalFilesFound === criticalFiles.length) {
  console.log(`   ✅ All ${criticalFiles.length} critical files found`)
  checks.passed++
}

// Check 7: Verify documentation exists
console.log('\n7️⃣  Checking documentation...')
const docs = [
  'VERCEL_ENV_CHECKLIST.md',
  'DEPLOYMENT_ISSUES_CHECK.md',
  'DEPLOYMENT_SUMMARY.md'
]

let docsFound = 0
for (const doc of docs) {
  if (fs.existsSync(doc)) {
    docsFound++
  }
}

if (docsFound > 0) {
  console.log(`   ✅ Found ${docsFound}/${docs.length} documentation files`)
  checks.passed++
} else {
  console.log('   ⚠️  Documentation files not found')
  checks.warnings++
}

// Summary
console.log('\n' + '='.repeat(60))
console.log('\n📊 VERIFICATION SUMMARY:\n')
console.log(`✅ Passed: ${checks.passed}`)
console.log(`⚠️  Warnings: ${checks.warnings}`)
console.log(`❌ Failed: ${checks.failed}`)

if (checks.failed > 0) {
  console.log('\n❌ DEPLOYMENT NOT READY: Fix failed checks before deploying')
  process.exit(1)
} else if (checks.warnings > 0) {
  console.log('\n⚠️  DEPLOYMENT READY WITH WARNINGS: Review warnings before production')
  console.log('\n📋 Next Steps:')
  console.log('1. Run: node scripts/verify-env.js (to check environment variables)')
  console.log('2. Configure environment variables in Vercel')
  console.log('3. Deploy to Vercel')
  process.exit(0)
} else {
  console.log('\n✅ ALL CHECKS PASSED: Ready for deployment!')
  console.log('\n📋 Next Steps:')
  console.log('1. Run: node scripts/verify-env.js (to check environment variables)')
  console.log('2. Configure environment variables in Vercel')
  console.log('3. Deploy to Vercel')
  process.exit(0)
}
