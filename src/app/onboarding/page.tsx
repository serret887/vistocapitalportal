'use client'

import { useOnboarding } from '@/contexts/OnboardingContext'
import { StepIndicator } from '@/components/StepIndicator'
import { Step1PartnerType } from '@/components/steps/Step1PartnerType'
import { Step2PhoneNumber } from '@/components/steps/Step2PhoneNumber'
import { Step3BusinessInfo } from '@/components/steps/Step3BusinessInfo'
import { Step4LicenseInfo } from '@/components/steps/Step4LicenseInfo'
import { OnboardingProvider } from '@/contexts/OnboardingContext'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

function OnboardingContent() {
  const { currentStep, isLoading } = useOnboarding()

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return <Step1PartnerType />
      case 2:
        return <Step2PhoneNumber />
      case 3:
        return <Step3BusinessInfo />
      case 4:
        return <Step4LicenseInfo onSubmit={() => {}} />
      default:
        return <Step1PartnerType />
    }
  }

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-lg text-gray-600">Setting up your onboarding session...</p>
        </div>
      </div>
    )
  }

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
  return (
    <OnboardingProvider>
      <OnboardingContent />
    </OnboardingProvider>
  )
} 