import jwt from 'jsonwebtoken'
import { validateJWTSecret } from './security'

// Validate JWT secret on module load
try {
  validateJWTSecret()
} catch (error: any) {
  console.error('❌ JWT_SECRET validation failed:', error.message)
  if (process.env.NODE_ENV === 'production') {
    throw error // Fail fast in production
  }
  console.warn('⚠️  Continuing in development mode, but JWT_SECRET must be set for production')
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
  const payload: RefreshTokenPayload = { userId, tokenId }
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_REFRESH_EXPIRES_IN,
    issuer: 'bu-app',
    audience: 'bu-app-refresh',
  })
}

// Verify refresh token
export function verifyRefreshToken(token: string): RefreshTokenPayload | null {
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
