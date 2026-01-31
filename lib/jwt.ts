import jwt from 'jsonwebtoken'
import { validateJWTSecret } from './security'

// Validate JWT secret lazily (only when actually used, not during build)
// This prevents build failures when JWT_SECRET is not set or is a placeholder
let jwtSecretValidated = false
function ensureJWTSecretValidated() {
  if (!jwtSecretValidated && typeof window === 'undefined') {
    // Skip validation during build time (Next.js build phase)
    const isBuildTime = process.env.NEXT_PHASE === 'phase-production-build' || 
                        process.env.NEXT_PHASE === 'phase-development' ||
                        process.env.VERCEL === '1' ||
                        !process.env.JWT_SECRET // If not set, likely build time
    
    if (isBuildTime) {
      jwtSecretValidated = true // Skip validation during build
      return
    }
    
    try {
      validateJWTSecret()
      jwtSecretValidated = true
    } catch (error: any) {
      // Only throw in production runtime, not during build
      if (process.env.NODE_ENV === 'production') {
        throw error
      }
      console.warn('⚠️  JWT_SECRET validation warning:', error.message)
      jwtSecretValidated = true // Mark as validated to avoid repeated warnings
    }
  }
}

// JWT secret - REQUIRED, no fallback
const JWT_SECRET = process.env.JWT_SECRET!
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1h' // Reduced from 7d to 1h
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '7d' // Refresh token: 7 days

export interface JWTPayload {
  userId: string
  role: string
  phoneNumber: string
  type?: 'access' | 'refresh' // Token type
}

export interface RefreshTokenPayload {
  userId: string
  tokenId: string // Unique token ID for revocation
}

// Generate access token (short-lived)
export function generateToken(payload: JWTPayload): string {
  ensureJWTSecretValidated()
  return jwt.sign(
    { ...payload, type: 'access' },
    JWT_SECRET,
    {
      expiresIn: JWT_EXPIRES_IN,
      issuer: 'bu-app',
      audience: 'bu-app-users',
    }
  )
}

// Generate refresh token (long-lived)
export function generateRefreshToken(userId: string, tokenId: string): string {
  ensureJWTSecretValidated()
  const payload: RefreshTokenPayload = { userId, tokenId }
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_REFRESH_EXPIRES_IN,
    issuer: 'bu-app',
    audience: 'bu-app-refresh',
  })
}

// Verify refresh token
export function verifyRefreshToken(token: string): RefreshTokenPayload | null {
  ensureJWTSecretValidated()
  try {
    const decoded = jwt.verify(token, JWT_SECRET, {
      issuer: 'bu-app',
      audience: 'bu-app-refresh',
    }) as RefreshTokenPayload
    
    return decoded
  } catch (error) {
    console.error('Refresh token verification failed:', error)
    return null
  }
}

// Verify JWT token
export function verifyToken(token: string): JWTPayload | null {
  ensureJWTSecretValidated()
  try {
    const decoded = jwt.verify(token, JWT_SECRET, {
      issuer: 'bu-app',
      audience: 'bu-app-users',
    }) as JWTPayload
    
    return decoded
  } catch (error) {
    console.error('JWT verification failed:', error)
    return null
  }
}

// Decode token without verification (for debugging only)
export function decodeToken(token: string): JWTPayload | null {
  try {
    return jwt.decode(token) as JWTPayload
  } catch (error) {
    return null
  }
}
