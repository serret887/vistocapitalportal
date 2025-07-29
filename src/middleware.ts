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

// Check if user has completed onboarding
async function checkOnboardingStatus(userId: string): Promise<{ onboarded: boolean; error?: string }> {
  try {
    const serverSupabase = createServerSupabaseClient()

    // Get partner profile
    const { data: partnerProfile, error } = await serverSupabase
      .from('partner_profiles')
      .select('onboarded')
      .eq('user_id', userId)
      .single()

    if (error) {
      // If no profile found, user hasn't completed onboarding
      if (error.code === 'PGRST116') {
        return { onboarded: false }
      }
      console.error('Error checking onboarding status:', error)
      return { onboarded: false, error: 'Failed to check onboarding status' }
    }

    return { onboarded: partnerProfile?.onboarded || false }
  } catch (error) {
    console.error('Error checking onboarding status:', error)
    return { onboarded: false, error: 'Failed to check onboarding status' }
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

  console.log(`[Middleware] ${requestId}: ${request.method} ${request.nextUrl.pathname}`)

  // Add security headers to all responses
  const addSecurityHeaders = (response: NextResponse) => {
    response.headers.set('X-Frame-Options', 'DENY')
    response.headers.set('X-Content-Type-Options', 'nosniff')
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
    response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')
    return response
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

    // Check authentication for protected routes
    const authHeader = request.headers.get('authorization')

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log(`[Middleware] ${requestId}: No auth header`)
      if (request.nextUrl.pathname.startsWith('/api/')) {
        const response = NextResponse.json(
          { error: 'Authentication required' },
          { status: 401 }
        )
        return addSecurityHeaders(response)
      } else {
        const response = NextResponse.redirect(new URL('/login', request.url))
        return addSecurityHeaders(response)
      }
    }

    const token = authHeader.replace('Bearer ', '')

    // Verify the token and get user with caching
    const authStart = Date.now()
    const { user, error } = await verifyToken(token)
    const authTime = Date.now() - authStart

    if (error || !user) {
      console.log(`[Middleware] ${requestId}: Auth failed in ${authTime}ms`)
      if (request.nextUrl.pathname.startsWith('/api/')) {
        const response = NextResponse.json(
          { error: 'Invalid or expired token' },
          { status: 401 }
        )
        return addSecurityHeaders(response)
      } else {
        const response = NextResponse.redirect(new URL('/login', request.url))
        return addSecurityHeaders(response)
      }
    }

    console.log(`[Middleware] ${requestId}: Authenticated successfully in ${authTime}ms`)

    // Check onboarding status for protected routes that require onboarding
    const onboardingRequiredRoutes = [
      '/api/dashboard',
      '/api/applications',
      '/api/files'
    ]

    const requiresOnboarding = onboardingRequiredRoutes.some(route =>
      request.nextUrl.pathname.startsWith(route)
    )

    if (requiresOnboarding) {
      const { onboarded, error: onboardingError } = await checkOnboardingStatus(user.id)

      if (onboardingError) {
        const response = NextResponse.json(
          { error: onboardingError },
          { status: 500 }
        )
        return addSecurityHeaders(response)
      }

      if (!onboarded) {
        const response = NextResponse.json(
          { error: 'Onboarding required', needsOnboarding: true },
          { status: 403 }
        )
        return addSecurityHeaders(response)
      }
    }

    // Add user information to request headers for API routes to use
    const requestHeaders = new Headers(request.headers)
    requestHeaders.set('x-user-id', user.id)
    requestHeaders.set('x-user-email', user.email || '')
    requestHeaders.set('x-request-id', requestId)

    // Continue to the next middleware or the final handler
    const response = NextResponse.next()

    // Add user info to headers for API routes
    if (request.nextUrl.pathname.startsWith('/api/')) {
      response.headers.set('x-user-id', user.id)
      response.headers.set('x-user-email', user.email || '')
    }

    const totalTime = Date.now() - startTime
    console.log(`[Middleware] ${requestId}: Completed in ${totalTime}ms`)

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
