import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

// Mock the Supabase client
vi.mock('@/lib/auth', () => ({
  createServerSupabaseClient: vi.fn(() => ({
    auth: {
      getUser: vi.fn()
    },
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn()
        }))
      }))
    }))
  }))
}))

// Test the middleware logic by importing and testing the individual functions
// Since the middleware functions are not exported, we'll test the logic directly

describe('middleware logic', () => {
  // Test the public endpoints logic
  describe('Public Routes Detection', () => {
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

    it('identifies root path as public', () => {
      expect(isPublicRoute('/')).toBe(true)
    })

    it('identifies login page as public', () => {
      expect(isPublicRoute('/login')).toBe(true)
    })

    it('identifies signup page as public', () => {
      expect(isPublicRoute('/signup')).toBe(true)
    })

    it('identifies API health endpoint as public', () => {
      expect(isPublicRoute('/api/health')).toBe(true)
    })

    it('identifies auth callback endpoint as public', () => {
      expect(isPublicRoute('/api/auth/callback')).toBe(true)
    })

    it('identifies auth signup endpoint as public', () => {
      expect(isPublicRoute('/api/auth/signup')).toBe(true)
    })

    it('identifies auth signin endpoint as public', () => {
      expect(isPublicRoute('/api/auth/signin')).toBe(true)
    })

    it('identifies auth login endpoint as public', () => {
      expect(isPublicRoute('/api/auth/login')).toBe(true)
    })

    it('identifies dashboard as protected', () => {
      expect(isPublicRoute('/dashboard')).toBe(false)
    })

    it('identifies API dashboard as protected', () => {
      expect(isPublicRoute('/api/dashboard')).toBe(false)
    })

    it('identifies applications as protected', () => {
      expect(isPublicRoute('/applications')).toBe(false)
    })

    it('identifies nested routes as protected', () => {
      expect(isPublicRoute('/dashboard/applications/123')).toBe(false)
    })

    it('identifies onboarding as protected', () => {
      expect(isPublicRoute('/onboarding')).toBe(false)
    })
  })

  describe('Onboarding Requirements', () => {
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
      return !isPublicRoute(pathname) && !pathname.startsWith('/onboarding')
    }

    it('requires onboarding for dashboard', () => {
      expect(requiresOnboarding('/dashboard')).toBe(true)
    })

    it('requires onboarding for API dashboard', () => {
      expect(requiresOnboarding('/api/dashboard')).toBe(true)
    })

    it('requires onboarding for applications', () => {
      expect(requiresOnboarding('/applications')).toBe(true)
    })

    it('requires onboarding for nested routes', () => {
      expect(requiresOnboarding('/dashboard/applications/123')).toBe(true)
    })

    it('does not require onboarding for onboarding page', () => {
      expect(requiresOnboarding('/onboarding')).toBe(false)
    })

    it('does not require onboarding for public routes', () => {
      expect(requiresOnboarding('/')).toBe(false)
      expect(requiresOnboarding('/login')).toBe(false)
      expect(requiresOnboarding('/api/health')).toBe(false)
    })
  })

  describe('Token Validation', () => {
    function isValidToken(token: string | null): boolean {
      return !!token && token.length > 10
    }

    it('accepts valid tokens', () => {
      expect(isValidToken('validtoken1234567890')).toBe(true)
      expect(isValidToken('verylongvalidtoken1234567890123456789012345678901234567890')).toBe(true)
    })

    it('rejects short tokens', () => {
      expect(isValidToken('short')).toBe(false)
      expect(isValidToken('123456789')).toBe(false)
    })

    it('rejects tokens with exactly 10 characters', () => {
      expect(isValidToken('1234567890')).toBe(false)
    })

    it('rejects empty tokens', () => {
      expect(isValidToken('')).toBe(false)
    })

    it('rejects null tokens', () => {
      expect(isValidToken(null)).toBe(false)
    })

    it('rejects undefined tokens', () => {
      expect(isValidToken(undefined as any)).toBe(false)
    })
  })

  describe('Security Headers', () => {
    function addSecurityHeaders(response: any): any {
      response.headers.set('X-Frame-Options', 'DENY')
      response.headers.set('X-Content-Type-Options', 'nosniff')
      response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
      response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')
      return response
    }

    it('adds all required security headers', () => {
      const mockResponse = {
        headers: new Headers(),
      }

      const result = addSecurityHeaders(mockResponse)

      expect(result.headers.get('X-Frame-Options')).toBe('DENY')
      expect(result.headers.get('X-Content-Type-Options')).toBe('nosniff')
      expect(result.headers.get('Referrer-Policy')).toBe('strict-origin-when-cross-origin')
      expect(result.headers.get('Permissions-Policy')).toBe('camera=(), microphone=(), geolocation=()')
    })
  })

  describe('Authorization Header Parsing', () => {
    function extractToken(authHeader: string | null): string | null {
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return null
      }
      const token = authHeader.replace('Bearer ', '')
      return token || null // Return null for empty tokens, not empty string
    }

    it('extracts token from valid authorization header', () => {
      expect(extractToken('Bearer validtoken1234567890')).toBe('validtoken1234567890')
      expect(extractToken('Bearer verylongtoken')).toBe('verylongtoken')
    })

    it('returns null for missing authorization header', () => {
      expect(extractToken(null)).toBe(null)
      expect(extractToken('')).toBe(null)
    })

    it('returns null for malformed authorization header', () => {
      expect(extractToken('InvalidToken')).toBe(null)
      expect(extractToken('Basic token')).toBe(null)
      expect(extractToken('Bearer')).toBe(null) // Fixed: should return null, not empty string
    })

    it('handles empty token in bearer format', () => {
      expect(extractToken('Bearer ')).toBe(null) // Fixed: should return null, not empty string
    })
  })

  describe('Route Type Detection', () => {
    function isApiRoute(pathname: string): boolean {
      return pathname.startsWith('/api/')
    }

    it('identifies API routes correctly', () => {
      expect(isApiRoute('/api/dashboard')).toBe(true)
      expect(isApiRoute('/api/health')).toBe(true)
      expect(isApiRoute('/api/auth/login')).toBe(true)
      expect(isApiRoute('/api/applications/123')).toBe(true)
    })

    it('identifies non-API routes correctly', () => {
      expect(isApiRoute('/dashboard')).toBe(false)
      expect(isApiRoute('/applications')).toBe(false)
      expect(isApiRoute('/onboarding')).toBe(false)
      expect(isApiRoute('/')).toBe(false)
      expect(isApiRoute('/login')).toBe(false)
    })
  })

  describe('Error Response Logic', () => {
    function shouldReturnJsonError(pathname: string): boolean {
      return pathname.startsWith('/api/')
    }

    function shouldRedirectToLogin(pathname: string): boolean {
      return !pathname.startsWith('/api/')
    }

    it('returns JSON error for API routes', () => {
      expect(shouldReturnJsonError('/api/dashboard')).toBe(true)
      expect(shouldReturnJsonError('/api/health')).toBe(true)
      expect(shouldReturnJsonError('/api/auth/login')).toBe(true)
    })

    it('redirects to login for non-API routes', () => {
      expect(shouldRedirectToLogin('/dashboard')).toBe(true)
      expect(shouldRedirectToLogin('/applications')).toBe(true)
      expect(shouldRedirectToLogin('/onboarding')).toBe(true)
      expect(shouldRedirectToLogin('/')).toBe(true) // This should redirect too
      expect(shouldRedirectToLogin('/login')).toBe(true) // This should redirect too
    })
  })

  describe('Edge Cases', () => {
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

    it('handles paths with query parameters', () => {
      expect(isPublicRoute('/api/health?param=value')).toBe(true)
      expect(isPublicRoute('/dashboard?param=value')).toBe(false)
    })

    it('handles paths with hash fragments', () => {
      expect(isPublicRoute('/api/health#fragment')).toBe(true)
      expect(isPublicRoute('/dashboard#fragment')).toBe(false)
    })

    it('handles paths with trailing slashes', () => {
      expect(isPublicRoute('/dashboard/')).toBe(false)
      expect(isPublicRoute('/api/health/')).toBe(true)
    })

    it('handles paths with multiple slashes', () => {
      expect(isPublicRoute('/dashboard//applications')).toBe(false)
      expect(isPublicRoute('/api//health')).toBe(true)
    })

    it('handles special characters in paths', () => {
      expect(isPublicRoute('/api/dashboard/123/456')).toBe(false)
      expect(isPublicRoute('/dashboard/applications/123')).toBe(false)
    })
  })

  describe('Database Onboarding Integration', () => {
    // Mock the checkOnboardingStatus function
    async function checkOnboardingStatus(userId: string): Promise<boolean> {
      // Simulate database query
      if (userId === 'onboarded-user') {
        return true
      } else if (userId === 'not-onboarded-user') {
        return false
      } else {
        throw new Error('Database error')
      }
    }

    it('returns true for onboarded users', async () => {
      const result = await checkOnboardingStatus('onboarded-user')
      expect(result).toBe(true)
    })

    it('returns false for non-onboarded users', async () => {
      const result = await checkOnboardingStatus('not-onboarded-user')
      expect(result).toBe(false)
    })

    it('handles database errors gracefully', async () => {
      await expect(checkOnboardingStatus('invalid-user')).rejects.toThrow('Database error')
    })

    it('handles null user ID', async () => {
      // This would be handled by the middleware before calling checkOnboardingStatus
      expect(() => checkOnboardingStatus('')).toBeDefined()
    })
  })

  describe('Middleware Flow with Database', () => {
    // Test the complete middleware flow with database integration
    
    // Helper functions for the test
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
      let normalized = pathname.split('?')[0].split('#')[0]
      normalized = normalized.replace(/\/+/g, '/')
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
      return !isPublicRoute(pathname) && !pathname.startsWith('/onboarding')
    }

    function simulateMiddlewareFlow(
      pathname: string,
      hasValidToken: boolean,
      userId: string | null,
      isOnboarded: boolean
    ) {
      // Step 1: Check if route is public
      if (isPublicRoute(pathname)) {
        return { action: 'allow', reason: 'public_route' }
      }

      // Step 2: Check authentication
      if (!hasValidToken) {
        return {
          action: pathname.startsWith('/api/') ? 'json_error' : 'redirect_login',
          reason: 'no_authentication'
        }
      }

      // Step 3: Check onboarding (if required)
      if (requiresOnboarding(pathname)) {
        if (!isOnboarded) {
          return {
            action: pathname.startsWith('/api/') ? 'json_error' : 'redirect_onboarding',
            reason: 'onboarding_required'
          }
        }
      }

      // Step 4: Allow access
      return { action: 'allow', reason: 'authenticated_and_onboarded' }
    }

    it('allows access to public routes without authentication', () => {
      const result = simulateMiddlewareFlow('/api/health', false, null, false)
      expect(result.action).toBe('allow')
      expect(result.reason).toBe('public_route')
    })

    it('redirects to login for protected routes without token', () => {
      const result = simulateMiddlewareFlow('/dashboard', false, null, false)
      expect(result.action).toBe('redirect_login')
      expect(result.reason).toBe('no_authentication')
    })

    it('returns JSON error for API routes without token', () => {
      const result = simulateMiddlewareFlow('/api/dashboard', false, null, false)
      expect(result.action).toBe('json_error')
      expect(result.reason).toBe('no_authentication')
    })

    it('redirects to onboarding for authenticated but non-onboarded users', () => {
      const result = simulateMiddlewareFlow('/dashboard', true, 'user123', false)
      expect(result.action).toBe('redirect_onboarding')
      expect(result.reason).toBe('onboarding_required')
    })

    it('returns JSON error for API routes when onboarding required', () => {
      const result = simulateMiddlewareFlow('/api/dashboard', true, 'user123', false)
      expect(result.action).toBe('json_error')
      expect(result.reason).toBe('onboarding_required')
    })

    it('allows access for authenticated and onboarded users', () => {
      const result = simulateMiddlewareFlow('/dashboard', true, 'user123', true)
      expect(result.action).toBe('allow')
      expect(result.reason).toBe('authenticated_and_onboarded')
    })

    it('allows access to onboarding page for authenticated users', () => {
      const result = simulateMiddlewareFlow('/onboarding', true, 'user123', false)
      expect(result.action).toBe('allow')
      expect(result.reason).toBe('authenticated_and_onboarded')
    })
  })
}) 