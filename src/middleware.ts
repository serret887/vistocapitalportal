import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/auth'
import { 
  getCorrelationId, 
  logRequest, 
  logResponse, 
  logError, 
  logDebug,
  logWithCorrelation 
} from '@/lib/utils'

// List of public endpoints that do not require authentication
const PUBLIC_ENDPOINTS = [
  '/api/health',
  '/api/auth/callback',
  '/api/auth/signup',
  '/api/auth/signin',
  '/api/auth/login',
  '/login',
  '/signup',
  '/',
]

// List of endpoints that require authentication but not onboarding completion
const AUTH_ONLY_ENDPOINTS = [
  '/api/auth/me',
]

function normalizePathname(pathname: string): string {
  // Remove query parameters and hash fragments
  let normalized = pathname.split('?')[0].split('#')[0]
  
  // Handle multiple consecutive slashes by replacing them with single slash
  normalized = normalized.replace(/\/+/g, '/')
  
  // Ensure the path starts with a single slash
  if (!normalized.startsWith('/')) {
    normalized = '/' + normalized
  }
  
  return normalized
}

function isPublicRoute(pathname: string): boolean {
  const normalizedPath = normalizePathname(pathname)
  return PUBLIC_ENDPOINTS.some(endpoint => 
    normalizedPath === endpoint || normalizedPath.startsWith(endpoint + '/')
  )
}

function isAuthOnlyRoute(pathname: string): boolean {
  const normalizedPath = normalizePathname(pathname)
  return AUTH_ONLY_ENDPOINTS.some(endpoint => 
    normalizedPath === endpoint || normalizedPath.startsWith(endpoint + '/')
  )
}

// Minimal token validation (replace with real JWT validation in production)
function isValidToken(token: string | null): boolean {
  return !!token && token.length > 10
}

function extractToken(request: NextRequest): string | null {
  // First check Authorization header (for API requests)
  const authHeader = request.headers.get('authorization')
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.replace('Bearer ', '')
    return token || null
  }
  
  // Then check cookies (for navigation)
  const cookieToken = request.cookies.get('auth_token')?.value
  if (cookieToken) return cookieToken
  
  return null
}

function addSecurityHeaders(response: NextResponse): NextResponse {
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')
  return response
}

// Check if user has completed onboarding by querying the database
async function checkOnboardingStatus(userId: string, correlationId: string): Promise<boolean> {
  try {
    logDebug(correlationId, 'Checking onboarding status for user', { userId })
    
    const serverSupabase = createServerSupabaseClient()
    
    const { data: profile, error } = await serverSupabase
      .from('partner_profiles')
      .select('onboarded')
      .eq('user_id', userId)
      .single()

    if (error) {
      logError(correlationId, error, { userId })
      return false
    }

    const onboarded = profile?.onboarded || false
    logDebug(correlationId, 'Onboarding status retrieved', { userId, onboarded })
    return onboarded
  } catch (error) {
    logError(correlationId, error as Error, { userId })
    return false
  }
}

// Helper function to create error responses
function createErrorResponse(
  correlationId: string,
  pathname: string,
  status: number,
  message: string,
  data: any,
  request: NextRequest
): NextResponse {
  if (pathname.startsWith('/api/')) {
    const response = NextResponse.json({ error: message, ...data }, { status })
    response.headers.set('x-correlation-id', correlationId)
    logResponse(correlationId, status, message)
    return addSecurityHeaders(response)
  } else {
    const redirectUrl = status === 401 ? '/login' : '/onboarding'
    // Use the request URL as base for proper URL construction
    const response = NextResponse.redirect(new URL(redirectUrl, request.url))
    response.headers.set('x-correlation-id', correlationId)
    logResponse(correlationId, 302, `Redirecting to ${redirectUrl}`)
    return addSecurityHeaders(response)
  }
}

export async function middleware(request: NextRequest) {
  const correlationId = getCorrelationId(request)
  const { pathname } = request.nextUrl

  // Log the incoming request
  logRequest(correlationId, request.method, request.url, 
    Object.fromEntries(request.headers.entries()))

  logWithCorrelation(correlationId, 'info', 'Middleware processing request', {
    pathname,
    method: request.method,
    isApiRoute: pathname.startsWith('/api/'),
    isPublicRoute: isPublicRoute(pathname),
    isAuthOnlyRoute: isAuthOnlyRoute(pathname)
  })

  // STEP 1: Check if it's a public route - if yes, allow access
  if (isPublicRoute(pathname)) {
    logWithCorrelation(correlationId, 'info', 'Allowing public route')
    const response = addSecurityHeaders(NextResponse.next())
    response.headers.set('x-correlation-id', correlationId)
    logResponse(correlationId, 200, 'Public route allowed')
    return response
  }

  // STEP 2: Check if token is valid - if not, redirect to login
  const token = extractToken(request)
  
  logWithCorrelation(correlationId, 'debug', 'Token validation', {
    hasToken: !!token,
    tokenLength: token?.length,
    tokenPreview: token ? `${token.substring(0, 20)}...` : null
  })

  if (!isValidToken(token)) {
    logWithCorrelation(correlationId, 'warn', 'Invalid or missing token')
    return createErrorResponse(correlationId, pathname, 401, 'Authentication required', undefined, request)
  }

  // STEP 3: Validate token with Supabase and get user
  try {
    logWithCorrelation(correlationId, 'debug', 'Validating token with Supabase')
    
    const serverSupabase = createServerSupabaseClient()
    const { data: { user }, error } = await serverSupabase.auth.getUser(token!)
    
    logWithCorrelation(correlationId, 'debug', 'Supabase auth result', {
      hasUser: !!user,
      userId: user?.id,
      error: error?.message
    })
    
    if (error || !user) {
      logWithCorrelation(correlationId, 'error', 'Supabase token validation failed', {
        error: error?.message,
        hasUser: !!user
      })
      return createErrorResponse(correlationId, pathname, 401, 'Invalid token', undefined, request)
    }

    logWithCorrelation(correlationId, 'info', 'Token validated successfully', {
      userId: user.id,
      userEmail: user.email
    })

    // STEP 4: Check if this is an auth-only route (doesn't require onboarding)
    if (isAuthOnlyRoute(pathname)) {
      logWithCorrelation(correlationId, 'info', 'Allowing auth-only route', {
        userId: user.id,
        userEmail: user.email,
        pathname
      })

      // Add user info to headers for API routes
      const response = NextResponse.next()
      response.headers.set('x-user-id', user.id)
      response.headers.set('x-user-email', user.email || '')
      response.headers.set('x-correlation-id', correlationId)

      return addSecurityHeaders(response)
    }

    // STEP 5: Check onboarding status for routes that require it
    const onboarded = await checkOnboardingStatus(user.id, correlationId)
    
    logWithCorrelation(correlationId, 'debug', 'Onboarding check result', {
      userId: user.id,
      onboarded,
      currentPath: pathname,
      isOnboardingPage: pathname.startsWith('/onboarding')
    })
    
    // If user is not onboarded and not on onboarding page, redirect to onboarding
    if (!onboarded && !pathname.includes('/onboarding')) {
      logWithCorrelation(correlationId, 'info', 'User needs onboarding, redirecting')
      return createErrorResponse(correlationId, pathname, 403, 'Onboarding required', { needsOnboarding: true }, request)
    }

    // STEP 6: All checks passed - allow access
    logWithCorrelation(correlationId, 'info', 'Request authorized successfully', {
      userId: user.id,
      userEmail: user.email,
      onboarded
    })

    // Add user info to headers for API routes
    const response = NextResponse.next()
    response.headers.set('x-user-id', user.id)
    response.headers.set('x-user-email', user.email || '')
    response.headers.set('x-correlation-id', correlationId)

    return addSecurityHeaders(response)
  } catch (error) {
    logError(correlationId, error as Error, { pathname })
    return createErrorResponse(correlationId, pathname, 500, 'Authentication error', undefined, request)
  }
}

export const config = {
  matcher: [
    '/api/:path*',
    '/dashboard/:path*',
    '/applications/:path*',
    '/dashboard',
    '/applications',
    '/onboarding',
  ],
}
