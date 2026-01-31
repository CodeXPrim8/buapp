#!/usr/bin/env node

/**
 * Vercel Setup Helper
 * Generates a formatted list of environment variables for easy copy-paste into Vercel
 */

const fs = require('fs')

function generateVercelSetupGuide() {
  console.log('📋 Vercel Environment Variables Setup Guide\n')
  console.log('='.repeat(60))
  console.log('\nFollow these steps to configure your Vercel deployment:\n')
  
  console.log('1️⃣  Go to Vercel Dashboard')
  console.log('   → Select your project')
  console.log('   → Go to Settings → Environment Variables\n')
  
  console.log('2️⃣  Add the following variables:\n')
  console.log('='.repeat(60))
  
  // Read env.example if it exists
  let envExample = {}
  try {
    const envFile = fs.existsSync('env.example') ? 'env.example' : '.env.example'
    if (fs.existsSync(envFile)) {
      const content = fs.readFileSync(envFile, 'utf8')
      content.split('\n').forEach(line => {
        const trimmed = line.trim()
        if (trimmed && !trimmed.startsWith('#')) {
          const [key, ...valueParts] = trimmed.split('=')
          if (key) {
            envExample[key.trim()] = valueParts.join('=').trim()
          }
        }
      })
    }
  } catch (e) {
    // Ignore errors
  }
  
  const requiredVars = [
    {
      key: 'JWT_SECRET',
      description: 'JWT secret for token signing (minimum 32 characters)',
      example: 'Generate with: openssl rand -base64 32',
      encrypted: true,
      environments: ['Production', 'Preview']
    },
    {
      key: 'NEXT_PUBLIC_SUPABASE_URL',
      description: 'Your Supabase project URL',
      example: 'https://your-project.supabase.co',
      encrypted: false,
      environments: ['Production', 'Preview', 'Development']
    },
    {
      key: 'NEXT_PUBLIC_SUPABASE_ANON_KEY',
      description: 'Supabase anonymous/public key',
      example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
      encrypted: false,
      environments: ['Production', 'Preview', 'Development']
    },
    {
      key: 'NEXT_PUBLIC_APP_URL',
      description: 'Your production app URL (for Paystack callbacks)',
      example: 'https://your-app.vercel.app',
      encrypted: false,
      environments: ['Production', 'Preview']
    }
  ]
  
  const optionalVars = [
    {
      key: 'PAYSTACK_SECRET_KEY',
      description: 'Paystack secret key (required if using payments)',
      example: 'sk_test_xxxxxxxxxxxxx or sk_live_xxxxxxxxxxxxx',
      encrypted: true,
      environments: ['Production', 'Preview']
    },
    {
      key: 'NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY',
      description: 'Paystack public key (required if using payments)',
      example: 'pk_test_xxxxxxxxxxxxx or pk_live_xxxxxxxxxxxxx',
      encrypted: false,
      environments: ['Production', 'Preview', 'Development']
    },
    {
      key: 'SUPABASE_SERVICE_ROLE_KEY',
      description: 'Supabase service role key (recommended for admin operations)',
      example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
      encrypted: true,
      environments: ['Production']
    },
    {
      key: 'ALLOWED_ORIGINS',
      description: 'CORS allowed origins (comma-separated)',
      example: 'https://yourdomain.com,https://admin.yourdomain.com',
      encrypted: false,
      environments: ['Production']
    },
    {
      key: 'ADMIN_IP_WHITELIST',
      description: 'Admin IP whitelist (comma-separated)',
      example: '192.168.1.100,10.0.0.50',
      encrypted: false,
      environments: ['Production']
    },
    {
      key: 'CLEANUP_SECRET_KEY',
      description: 'Database cleanup secret key',
      example: 'Generate with: openssl rand -base64 32',
      encrypted: true,
      environments: ['Production']
    }
  ]
  
  console.log('\n🔴 REQUIRED VARIABLES:\n')
  requiredVars.forEach((vars, index) => {
    console.log(`${index + 1}. ${vars.key}`)
    console.log(`   Description: ${vars.description}`)
    console.log(`   Example: ${vars.example}`)
    console.log(`   Encrypted: ${vars.encrypted ? 'Yes ☑️' : 'No'}`)
    console.log(`   Environments: ${vars.environments.join(', ')}`)
    if (envExample[vars.key]) {
      console.log(`   Current value in .env.example: ${envExample[vars.key].substring(0, 30)}...`)
    }
    console.log('')
  })
  
  console.log('\n🟡 OPTIONAL VARIABLES:\n')
  optionalVars.forEach((vars, index) => {
    console.log(`${index + 1}. ${vars.key}`)
    console.log(`   Description: ${vars.description}`)
    console.log(`   Example: ${vars.example}`)
    console.log(`   Encrypted: ${vars.encrypted ? 'Yes ☑️' : 'No'}`)
    console.log(`   Environments: ${vars.environments.join(', ')}`)
    if (envExample[vars.key]) {
      console.log(`   Current value in .env.example: ${envExample[vars.key].substring(0, 30)}...`)
    }
    console.log('')
  })
  
  console.log('='.repeat(60))
  console.log('\n3️⃣  After adding all variables:')
  console.log('   → Click "Save"')
  console.log('   → Go to Deployments tab')
  console.log('   → Click "Redeploy" on the latest deployment')
  console.log('   → Or push a new commit to trigger automatic deployment\n')
  
  console.log('4️⃣  Verify deployment:')
  console.log('   → Check deployment logs for errors')
  console.log('   → Test authentication endpoints')
  console.log('   → Verify Supabase connection')
  console.log('   → Test payment flow (if applicable)\n')
  
  console.log('📚 For detailed information, see:')
  console.log('   → VERCEL_ENV_CHECKLIST.md')
  console.log('   → DEPLOYMENT_ISSUES_CHECK.md')
  console.log('   → DEPLOYMENT_SUMMARY.md\n')
}

// Run if executed directly
if (require.main === module) {
  generateVercelSetupGuide()
}

module.exports = { generateVercelSetupGuide }
