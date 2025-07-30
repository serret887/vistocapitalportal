'use client'

import { useOnboarding } from '@/contexts/OnboardingContext'
import { StepIndicator } from '@/components/StepIndicator'
import { Step1PartnerType } from '@/components/steps/Step1PartnerType'
import { Step2PhoneNumber } from '@/components/steps/Step2PhoneNumber'
import { Step3BusinessInfo } from '@/components/steps/Step3BusinessInfo'
import { Step4LicenseInfo } from '@/components/steps/Step4LicenseInfo'
import { OnboardingProvider } from '@/contexts/OnboardingContext'
import { useEffect } from 'react'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

// Generate a unique request ID for this component instance
const generateRequestId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

function OnboardingContent() {
  const { currentStep, isLoading } = useOnboarding()
  const requestId = generateRequestId()

  console.log(`[${requestId}] OnboardingContent component initialized`, {
    currentStep,
    isLoading
  })

  useEffect(() => {
    console.log(`[${requestId}] Onboarding step changed`, { currentStep })
  }, [currentStep, requestId])

  const renderStep = () => {
    console.log(`[${requestId}] Rendering step`, { currentStep })
    
    switch (currentStep) {
      case 1:
        console.log(`[${requestId}] Rendering Step1PartnerType`)
        return <Step1PartnerType />
      case 2:
        console.log(`[${requestId}] Rendering Step2PhoneNumber`)
        return <Step2PhoneNumber />
      case 3:
        console.log(`[${requestId}] Rendering Step3BusinessInfo`)
        return <Step3BusinessInfo />
      case 4:
        console.log(`[${requestId}] Rendering Step4LicenseInfo`)
        return <Step4LicenseInfo onSubmit={() => {
          console.log(`[${requestId}] Onboarding completed`)
        }} />
      default:
        console.log(`[${requestId}] Rendering default Step1PartnerType`)
        return <Step1PartnerType />
    }
  }

  // Show loading state while checking authentication
  if (isLoading) {
    console.log(`[${requestId}] Showing loading state`)
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-lg text-gray-600">Setting up your onboarding session...</p>
        </div>
      </div>
    )
  }

  console.log(`[${requestId}] Rendering onboarding content`, { currentStep })

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <StepIndicator />
        {renderStep()}
      </div>
    </div>
  )
}

export default function OnboardingPage() {
  const requestId = generateRequestId()
  
  console.log(`[${requestId}] OnboardingPage component initialized`)
  
  return (
    <OnboardingProvider>
      <OnboardingContent />
    </OnboardingProvider>
  )
} 