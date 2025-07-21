'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getCurrentUser, hasCompletedOnboarding } from '@/lib/auth'
import { toast } from 'sonner'

interface ProtectedRouteProps {
  children: React.ReactNode
  requireOnboarding?: boolean
}

export function ProtectedRoute({ children, requireOnboarding = false }: ProtectedRouteProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [isAuthorized, setIsAuthorized] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Check if user is authenticated
        const { user, error } = await getCurrentUser()
        
        if (error || !user) {
          toast.error('Please sign in to continue')
          router.push('/login')
          return
        }

        // If onboarding is required, check completion status
        if (requireOnboarding) {
          const { completed, error: onboardingError } = await hasCompletedOnboarding(user.id)
          
          if (onboardingError) {
            toast.error('Failed to check onboarding status')
            router.push('/login')
            return
          }

          if (!completed) {
            toast.error('Please complete your onboarding first')
            router.push('/onboarding')
            return
          }
        }

        setIsAuthorized(true)
      } catch (error) {
        console.error('Auth check error:', error)
        toast.error('Authentication failed')
        router.push('/login')
      } finally {
        setIsLoading(false)
      }
    }

    checkAuth()
  }, [router, requireOnboarding])

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-blue-600"></div>
          <p className="text-sm text-muted-foreground">Checking authentication...</p>
        </div>
      </div>
    )
  }

  if (!isAuthorized) {
    return null
  }

  return <>{children}</>
} 