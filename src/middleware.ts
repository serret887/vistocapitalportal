import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/auth'

// In-memory rate limiting (use Redis in production)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>()

// Rate limiting function
function checkRateLimit(identifier: string): boolean {
  const now = Date.now()
  const windowStart = now - (60 * 1000) // 1 minute window
  
  const current = rateLimitMap.get(identifier)
  
  if (!current || current.resetTime < now) {
    rateLimitMap.set(identifier, { count: 1, resetTime: now + (60 * 1000) })
    return true
  }
  
  if (current.count >= 100) { // 100 requests per minute
    return false
  }
  
  current.count++
  return true
}

// Verify JWT token and get user with caching
const tokenCache = new Map<string, { user: any; expires: number }>()

async function verifyToken(token: string) {
  try {
    // Check cache first
    const cached = tokenCache.get(token)
    if (cached && cached.expires > Date.now()) {
      return { user: cached.user, error: null }
    }

    const serverSupabase = createServerSupabaseClient()
    const { data: { user }, error } = await serverSupabase.auth.getUser(token)
    
    if (error || !user) {
      return { user: null, error: error || new Error('Invalid token') }
    }

    // Cache the result for 5 minutes
    tokenCache.set(token, { 
      user, 
      expires: Date.now() + (5 * 60 * 1000) // 5 minutes
    })

    return { user, error: null }
  } catch (error) {
    console.error('Error verifying token:', error)
    return { user: null, error: error as Error }
  }
}

// Add security headers
function addSecurityHeaders(response: NextResponse): NextResponse {
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-XSS-Protection', '1; mode=block')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')
  
  // Add CORS headers for API routes
  response.headers.set('Access-Control-Allow-Origin', process.env.NEXT_PUBLIC_FRONTEND_URL || '*')
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  
  return response
}

export async function middleware(request: NextRequest) {
  const startTime = Date.now()
  const requestId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

  // Log request in development
  if (process.env.NODE_ENV === 'development') {
    console.log(`[Middleware] ${requestId}: ${request.method} ${request.nextUrl.pathname}`)
  }

  // Handle CORS preflight requests
  if (request.method === 'OPTIONS') {
    const response = NextResponse.next()
    return addSecurityHeaders(response)
  }

  // Only apply to API routes
  if (!request.nextUrl.pathname.startsWith('/api/')) {
    const response = NextResponse.next()
    return addSecurityHeaders(response)
  }

  // Skip authentication for public API endpoints
  const publicEndpoints = [
    '/api/health',
    '/api/auth/callback',
    '/api/auth/signup',
    '/api/auth/signin',
    '/api/auth/login',
    '/api/loan-pricing' // Loan pricing is public for demo purposes
  ]
  
  if (publicEndpoints.some(endpoint => request.nextUrl.pathname.startsWith(endpoint))) {
    const response = NextResponse.next()
    return addSecurityHeaders(response)
  }

  try {
    // Rate limiting
    const clientIp = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
    if (!checkRateLimit(clientIp)) {
      const response = NextResponse.json(
        { error: 'Rate limit exceeded. Please try again later.' },
        { status: 429 }
      )
      return addSecurityHeaders(response)
    }

    // Get authorization header
    const authHeader = request.headers.get('authorization')
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      const response = NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
      return addSecurityHeaders(response)
    }

    const token = authHeader.replace('Bearer ', '')
    
    // Basic token validation
    if (token.length < 10) {
      const response = NextResponse.json(
        { error: 'Invalid token format' },
        { status: 401 }
      )
      return addSecurityHeaders(response)
    }
    
    // Verify the token
    const { user, error } = await verifyToken(token)
    
    if (error || !user) {
      const response = NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      )
      return addSecurityHeaders(response)
    }

    // Add user information to request headers for API routes to use
    const requestHeaders = new Headers(request.headers)
    requestHeaders.set('x-user-id', user.id)
    requestHeaders.set('x-user-email', user.email || '')
    requestHeaders.set('x-request-id', requestId)

    // Return the request with user information added
    const response = NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    })

    // Log successful authentication
    if (process.env.NODE_ENV === 'development') {
      const duration = Date.now() - startTime
      console.log(`[Middleware] ${requestId}: Authenticated successfully in ${duration}ms`)
    }

    return addSecurityHeaders(response)

  } catch (error) {
    console.error('Middleware authentication error:', error)
    const response = NextResponse.json(
      { error: 'Authentication failed' },
      { status: 401 }
    )
    return addSecurityHeaders(response)
  }
}

export const config = {
  matcher: [
    /*
     * Match only API routes
     */
    '/api/:path*',
  ],
} 
 