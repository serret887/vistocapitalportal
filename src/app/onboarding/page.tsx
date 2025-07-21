'use client'

import { useOnboarding } from '@/contexts/OnboardingContext'
import { StepIndicator } from '@/components/StepIndicator'
import { Step1PartnerType } from '@/components/steps/Step1PartnerType'
import { Step2PhoneNumber } from '@/components/steps/Step2PhoneNumber'
import { Step3BusinessInfo } from '@/components/steps/Step3BusinessInfo'
import { Step4LicenseInfo } from '@/components/steps/Step4LicenseInfo'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { OnboardingProvider } from '@/contexts/OnboardingContext'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

function OnboardingContent() {
  const { currentStep, formData } = useOnboarding()
  const router = useRouter()

  const handleSubmit = async () => {
    try {
      if (!supabase) {
        toast.error('Database connection not configured. Please check your environment variables.')
        return
      }

      // Generate a placeholder user_id for now
      const placeholderUserId = '00000000-0000-0000-0000-000000000000'
      
      const { error } = await supabase
        .from('partner_profiles')
        .insert({
          user_id: placeholderUserId,
          partner_type: formData.partner_type.toLowerCase().replace(' ', '_'),
          phone_number: formData.phone_number,
          monthly_deal_volume: formData.monthly_deal_volume,
          transaction_volume: formData.transaction_volume,
          transaction_types: formData.transaction_types,
          license_number: formData.license_number || null,
          license_state: formData.license_state || null,
          onboarded: true
        })

      if (error) {
        console.error('Error submitting form:', error)
        toast.error('Failed to submit application. Please try again.')
        return
      }

      toast.success('Application submitted successfully!')
      router.push('/dashboard')
    } catch (error) {
      console.error('Error submitting form:', error)
      toast.error('An unexpected error occurred. Please try again.')
    }
  }

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