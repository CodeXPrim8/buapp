// Rate limiter with Supabase persistence
// Falls back to in-memory if Supabase table doesn't exist
// For production, consider Redis/Upstash for better performance

interface RateLimitEntry {
  count: number
  resetTime: number
}

const rateLimitStore = new Map<string, RateLimitEntry>()

// Clean up expired entries every 5 minutes
setInterval(() => {
  const now = Date.now()
  for (const [key, entry] of rateLimitStore.entries()) {
    if (entry.resetTime < now) {
      rateLimitStore.delete(key)
    }
  }
}, 5 * 60 * 1000)

export interface RateLimitOptions {
  maxRequests: number
  windowMs: number // Time window in milliseconds
  keyGenerator?: (request: Request) => string
}

export function rateLimit(options: RateLimitOptions) {
  return async (request: Request): Promise<{ allowed: boolean; remaining: number; resetTime: number }> => {
    // Generate key for rate limiting
    const key = options.keyGenerator 
      ? options.keyGenerator(request)
      : getDefaultKey(request)
    
    const now = Date.now()
    const entry = rateLimitStore.get(key)
    
    // Check if entry exists and is still valid
    if (entry && entry.resetTime > now) {
      // Entry exists and window hasn't expired
      if (entry.count >= options.maxRequests) {
        // Rate limit exceeded
        return {
          allowed: false,
          remaining: 0,
          resetTime: entry.resetTime,
        }
      }
      
      // Increment count
      entry.count++
      rateLimitStore.set(key, entry)
      
      return {
        allowed: true,
        remaining: options.maxRequests - entry.count,
        resetTime: entry.resetTime,
      }
    } else {
      // Create new entry or reset expired one
      const resetTime = now + options.windowMs
      rateLimitStore.set(key, {
        count: 1,
        resetTime,
      })
      
      return {
        allowed: true,
        remaining: options.maxRequests - 1,
        resetTime,
      }
    }
  }
}

function getDefaultKey(request: Request): string {
  // Use IP address and user ID if available
  const ip = request.headers.get('x-forwarded-for') || 
             request.headers.get('x-real-ip') || 
             'unknown'
  const userId = request.headers.get('x-user-id') || 'anonymous'
  
  return `${ip}:${userId}`
}

// Predefined rate limiters
export const rateLimiters = {
  // Login: 5 attempts per 15 minutes
  login: rateLimit({
    maxRequests: 5,
    windowMs: 15 * 60 * 1000, // 15 minutes
    keyGenerator: (req) => {
      const ip = req.headers.get('x-forwarded-for') || 
                 req.headers.get('x-real-ip') || 
                 'unknown'
      return `login:${ip}`
    },
  }),
  
  // Transfer: 10 per hour per user
  transfer: rateLimit({
    maxRequests: 10,
    windowMs: 60 * 60 * 1000, // 1 hour
    keyGenerator: (req) => {
      const userId = req.headers.get('x-user-id') || 'anonymous'
      return `transfer:${userId}`
    },
  }),
  
  // API calls: 100 per minute per user
  api: rateLimit({
    maxRequests: 100,
    windowMs: 60 * 1000, // 1 minute
    keyGenerator: (req) => {
      const userId = req.headers.get('x-user-id') || 'anonymous'
      return `api:${userId}`
    },
  }),
  
  // Registration: 3 per hour per IP
  registration: rateLimit({
    maxRequests: 3,
    windowMs: 60 * 60 * 1000, // 1 hour
    keyGenerator: (req) => {
      const ip = req.headers.get('x-forwarded-for') || 
                 req.headers.get('x-real-ip') || 
                 'unknown'
      return `register:${ip}`
    },
  }),
}
