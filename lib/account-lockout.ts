// Account lockout management
// Tracks failed login attempts and locks accounts after threshold

import { supabase } from './supabase'

export interface LockoutStatus {
  isLocked: boolean
  attemptsRemaining: number
  lockoutExpiresAt: Date | null
  message?: string
}

const MAX_FAILED_ATTEMPTS = 5
const LOCKOUT_DURATION_MS = 15 * 60 * 1000 // 15 minutes
const ATTEMPT_WINDOW_MS = 15 * 60 * 1000 // Track attempts within 15 minutes

interface FailedAttempt {
  userId: string
  timestamp: number
  ipAddress?: string
}

// In-memory store for failed attempts (in production, use Redis)
const failedAttempts = new Map<string, FailedAttempt[]>()

// Clean up old attempts periodically
setInterval(() => {
  const now = Date.now()
  for (const [key, attempts] of failedAttempts.entries()) {
    const recentAttempts = attempts.filter(
      attempt => now - attempt.timestamp < ATTEMPT_WINDOW_MS
    )
    if (recentAttempts.length === 0) {
      failedAttempts.delete(key)
    } else {
      failedAttempts.set(key, recentAttempts)
    }
  }
}, 5 * 60 * 1000) // Clean up every 5 minutes

/**
 * Record a failed login attempt
 */
export async function recordFailedAttempt(
  userId: string,
  ipAddress?: string
): Promise<LockoutStatus> {
  const key = userId
  const now = Date.now()
  
  // Get existing attempts
  const attempts = failedAttempts.get(key) || []
  
  // Remove old attempts outside the window
  const recentAttempts = attempts.filter(
    attempt => now - attempt.timestamp < ATTEMPT_WINDOW_MS
  )
  
  // Add new attempt
  recentAttempts.push({
    userId,
    timestamp: now,
    ipAddress,
  })
  
  failedAttempts.set(key, recentAttempts)
  
  // Check if account should be locked
  if (recentAttempts.length >= MAX_FAILED_ATTEMPTS) {
    const lockoutExpiresAt = new Date(now + LOCKOUT_DURATION_MS)
    
    // Log lockout event
    await logSecurityEvent({
      event: 'account_locked',
      userId,
      ipAddress,
      metadata: {
        failedAttempts: recentAttempts.length,
        lockoutExpiresAt: lockoutExpiresAt.toISOString(),
      },
    })
    
    return {
      isLocked: true,
      attemptsRemaining: 0,
      lockoutExpiresAt,
      message: `Account locked due to ${MAX_FAILED_ATTEMPTS} failed login attempts. Try again after ${LOCKOUT_DURATION_MS / 60000} minutes.`,
    }
  }
  
  return {
    isLocked: false,
    attemptsRemaining: MAX_FAILED_ATTEMPTS - recentAttempts.length,
    lockoutExpiresAt: null,
  }
}

/**
 * Check if account is locked
 */
export function checkAccountLockout(userId: string): LockoutStatus {
  const key = userId
  const attempts = failedAttempts.get(key) || []
  const now = Date.now()
  
  // Filter to recent attempts
  const recentAttempts = attempts.filter(
    attempt => now - attempt.timestamp < ATTEMPT_WINDOW_MS
  )
  
  if (recentAttempts.length >= MAX_FAILED_ATTEMPTS) {
    // Find the most recent attempt
    const mostRecent = recentAttempts[recentAttempts.length - 1]
    const lockoutExpiresAt = new Date(mostRecent.timestamp + LOCKOUT_DURATION_MS)
    
    if (now < lockoutExpiresAt.getTime()) {
      return {
        isLocked: true,
        attemptsRemaining: 0,
        lockoutExpiresAt,
        message: `Account is locked. Try again after ${Math.ceil((lockoutExpiresAt.getTime() - now) / 60000)} minutes.`,
      }
    } else {
      // Lockout expired, clear attempts
      failedAttempts.delete(key)
      return {
        isLocked: false,
        attemptsRemaining: MAX_FAILED_ATTEMPTS,
        lockoutExpiresAt: null,
      }
    }
  }
  
  return {
    isLocked: false,
    attemptsRemaining: MAX_FAILED_ATTEMPTS - recentAttempts.length,
    lockoutExpiresAt: null,
  }
}

/**
 * Clear failed attempts on successful login
 */
export function clearFailedAttempts(userId: string): void {
  failedAttempts.delete(userId)
}

/**
 * Log security event (placeholder - implement with audit logging)
 */
async function logSecurityEvent(event: {
  event: string
  userId: string
  ipAddress?: string
  metadata?: any
}): Promise<void> {
  // This will be implemented with the audit logging system
  console.log('[SECURITY EVENT]', event)
}
