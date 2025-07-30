import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/auth'

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

function requiresOnboarding(pathname: string): boolean {
  // All authenticated routes require onboarding, except /onboarding itself
  return !isPublicRoute(pathname) && !pathname.startsWith('/onboarding')
}

// Minimal token validation (replace with real JWT validation in production)
function isValidToken(token: string | null): boolean {
  return !!token && token.length > 10
}

function extractToken(authHeader: string | null): string | null {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null
  }
  const token = authHeader.replace('Bearer ', '')
  return token || null // Return null for empty tokens, not empty string
}

function addSecurityHeaders(response: NextResponse): NextResponse {
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')
  return response
}

// Check if user has completed onboarding by querying the database
async function checkOnboardingStatus(userId: string): Promise<boolean> {
  try {
    const serverSupabase = createServerSupabaseClient()
    
    const { data: profile, error } = await serverSupabase
      .from('partner_profiles')
      .select('onboarded')
      .eq('user_id', userId)
      .single()

    if (error) {
      console.error('Error checking onboarding status:', error)
      return false
    }

    return profile?.onboarded || false
  } catch (error) {
    console.error('Error checking onboarding status:', error)
    return false
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Allow public routes
  if (isPublicRoute(pathname)) {
    return addSecurityHeaders(NextResponse.next())
  }

  // Check for authentication
  const authHeader = request.headers.get('authorization')
  const token = extractToken(authHeader)

  if (!isValidToken(token)) {
    // API routes: return JSON error, others: redirect to login
    if (pathname.startsWith('/api/')) {
      return addSecurityHeaders(
        NextResponse.json({ error: 'Authentication required' }, { status: 401 })
      )
    } else {
      return addSecurityHeaders(
        NextResponse.redirect(new URL('/login', request.url))
      )
    }
  }

  // Get user from token to check onboarding status
  try {
    const serverSupabase = createServerSupabaseClient()
    
    if (!token) {
      if (pathname.startsWith('/api/')) {
        return addSecurityHeaders(
          NextResponse.json({ error: 'Invalid token' }, { status: 401 })
        )
      } else {
        return addSecurityHeaders(
          NextResponse.redirect(new URL('/login', request.url))
        )
      }
    }
    
    const { data: { user }, error } = await serverSupabase.auth.getUser(token)
    
    if (error || !user) {
      if (pathname.startsWith('/api/')) {
        return addSecurityHeaders(
          NextResponse.json({ error: 'Invalid token' }, { status: 401 })
        )
      } else {
        return addSecurityHeaders(
          NextResponse.redirect(new URL('/login', request.url))
        )
      }
    }

    // Check onboarding status from database
    const onboarded = await checkOnboardingStatus(user.id)
    
    if (requiresOnboarding(pathname) && !onboarded) {
      if (pathname.startsWith('/api/')) {
        return addSecurityHeaders(
          NextResponse.json({ error: 'Onboarding required', needsOnboarding: true }, { status: 403 })
        )
      } else {
        return addSecurityHeaders(
          NextResponse.redirect(new URL('/onboarding', request.url))
        )
      }
    }

    // Add user info to headers for API routes
    const response = NextResponse.next()
    response.headers.set('x-user-id', user.id)
    response.headers.set('x-user-email', user.email || '')

    // All checks passed
    return addSecurityHeaders(response)
  } catch (error) {
    console.error('Error in middleware:', error)
    if (pathname.startsWith('/api/')) {
      return addSecurityHeaders(
        NextResponse.json({ error: 'Authentication error' }, { status: 500 })
      )
    } else {
      return addSecurityHeaders(
        NextResponse.redirect(new URL('/login', request.url))
      )
    }
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
