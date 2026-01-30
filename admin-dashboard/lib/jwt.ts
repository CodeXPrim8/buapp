import jwt from 'jsonwebtoken'

// JWT secret - shared with main app
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production'
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d'

export interface JWTPayload {
  userId: string
  role: string
  phoneNumber: string
}

// Generate JWT token
export function generateToken(payload: JWTPayload): string {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
    issuer: 'bu-app',
    audience: 'bu-app-users',
  })
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
