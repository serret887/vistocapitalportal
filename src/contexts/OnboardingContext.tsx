'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'
import { OnboardingFormData } from '@/types'
import { getCurrentUser, getPartnerProfile } from '@/lib/auth-client'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

interface OnboardingContextType {
  formData: OnboardingFormData
  updateFormData: (data: Partial<OnboardingFormData>) => void
  currentStep: number
  setCurrentStep: (step: number) => void
  nextStep: () => void
  prevStep: () => void
  submitOnboarding: () => Promise<void>
  isLoading: boolean
  user: { id: string; firstName: string; lastName: string; email: string } | null
}

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined)

export function OnboardingProvider({ children }: { children: React.ReactNode }) {
  const [formData, setFormData] = useState<OnboardingFormData>({
    first_name: '',
    last_name: '',
    email: '',
    partner_type: '',
    phone_number: '',
    monthly_deal_volume: 0,
    transaction_volume: 0,
    transaction_types: [],
    license_number: '',
    license_state: '',
  })
  const [currentStep, setCurrentStep] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [user, setUser] = useState<{ id: string; firstName: string; lastName: string; email: string } | null>(null)
  const router = useRouter()

  // Check if user is authenticated and load existing profile
  useEffect(() => {
    const loadUserAndProfile = async () => {
      setIsLoading(true)
      try {
        // Add a small delay to ensure session is established after signup
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        const { user: currentUser, error: userError } = await getCurrentUser()
        
        if (userError || !currentUser) {
          console.log('No authenticated user found, redirecting to login')
          toast.error('Please sign in to continue')
          router.push('/login')
          return
        }

        console.log('User authenticated successfully:', currentUser.id)
        setUser(currentUser)

        // Update form data with user information
        setFormData(prev => ({
          ...prev,
          first_name: currentUser.firstName || '',
          last_name: currentUser.lastName || '',
          email: currentUser.email || '',
        }))

        // Try to load existing partner profile
        const { profile, error: profileError } = await getPartnerProfile(currentUser.id)
        
        if (profile) {
          // If profile exists and onboarding is completed, redirect to dashboard
          if (profile.onboarded) {
            toast.success('You have already completed onboarding')
            router.push('/dashboard')
            return
          }
          
          // Load existing partial profile data
          setFormData(prev => ({
            ...prev,
            first_name: profile.first_name || currentUser.firstName || '',
            last_name: profile.last_name || currentUser.lastName || '',
            email: profile.email || currentUser.email || '',
            partner_type: profile.partner_type || '',
            phone_number: profile.phone_number || '',
            monthly_deal_volume: profile.monthly_deal_volume || 0,
            transaction_volume: profile.transaction_volume || 0,
            transaction_types: profile.transaction_types || [],
            license_number: profile.license_number || '',
            license_state: profile.license_state || '',
          }))
        } else {
          console.log('No existing profile found - starting fresh onboarding')
        }
      } catch (error) {
        console.error('Error loading user and profile:', error)
        toast.error('Failed to load user data')
        router.push('/login')
      } finally {
        setIsLoading(false)
      }
    }

    loadUserAndProfile()
  }, [router]) // Add router as dependency

  const updateFormData = (data: Partial<OnboardingFormData>) => {
    setFormData(prev => ({ ...prev, ...data }))
  }

  const nextStep = () => {
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1)
    }
  }

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const submitOnboarding = async () => {
    if (!user) {
      toast.error('User not authenticated')
      return
    }

    setIsLoading(true)
    try {
      // Prepare onboarding data
      const onboardingData = {
        first_name: user.firstName || '',
        last_name: user.lastName || '',
        partner_type: formData.partner_type,
        phone_number: formData.phone_number,
        monthly_deal_volume: formData.monthly_deal_volume,
        transaction_volume: formData.transaction_volume,
        transaction_types: formData.transaction_types,
        license_number: formData.license_number || null,
        license_state: formData.license_state || null,
      }

      // Call the onboarding API endpoint
      const response = await fetch('/api/auth/onboarding', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        },
        body: JSON.stringify(onboardingData),
      })

      const result = await response.json()

      if (!response.ok) {
        console.error('Error saving partner profile:', result.error)
        toast.error(result.error || 'Failed to save partner profile. Please try again.')
        return
      }

      toast.success('Onboarding completed successfully! Welcome to Visto Capital.')
      router.push('/dashboard')
    } catch (error) {
      console.error('Error during onboarding submission:', error)
      toast.error('An unexpected error occurred. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <OnboardingContext.Provider
      value={{
        formData,
        updateFormData,
        currentStep,
        setCurrentStep,
        nextStep,
        prevStep,
        submitOnboarding,
        isLoading,
        user,
      }}
    >
      {children}
    </OnboardingContext.Provider>
  )
}

export function useOnboarding() {
  const context = useContext(OnboardingContext)
  if (context === undefined) {
    throw new Error('useOnboarding must be used within an OnboardingProvider')
  }
  return context
} 