// Security utilities and helpers

import crypto from 'crypto'

/**
 * Validates that JWT_SECRET is set and strong enough
 * Throws error if secret is missing or weak
 */
export function validateJWTSecret(): void {
  const secret = process.env.JWT_SECRET
  
  if (!secret) {
    throw new Error(
      'JWT_SECRET environment variable is required. ' +
      'Generate a strong secret: openssl rand -base64 32'
    )
  }
  
  if (secret.length < 32) {
    throw new Error(
      `JWT_SECRET must be at least 32 characters long. Current length: ${secret.length}. ` +
      'Generate a strong secret: openssl rand -base64 32'
    )
  }
  
  // Check for weak defaults
  const weakDefaults = [
    'your-super-secret-jwt-key-change-in-production',
    'change-in-production',
    'secret',
    'password',
    '123456',
  ]
  
  if (weakDefaults.some(weak => secret.toLowerCase().includes(weak.toLowerCase()))) {
    throw new Error(
      'JWT_SECRET contains a weak default value. ' +
      'Please set a strong random secret: openssl rand -base64 32'
    )
  }
}

/**
 * Generate CSRF token
 */
export function generateCSRFToken(): string {
  return crypto.randomBytes(32).toString('hex')
}

/**
 * Verify CSRF token
 */
export function verifyCSRFToken(token: string, expectedToken: string): boolean {
  if (!token || !expectedToken) return false
  return crypto.timingSafeEqual(
    Buffer.from(token),
    Buffer.from(expectedToken)
  )
}

/**
 * Generate secure random string
 */
export function generateSecureRandom(length: number = 32): string {
  return crypto.randomBytes(length).toString('base64')
}
