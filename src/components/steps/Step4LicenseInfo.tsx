'use client'

import { useOnboarding } from '@/contexts/OnboardingContext'
import { US_STATES } from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useRouter } from 'next/navigation'

interface Step4LicenseInfoProps {
  onSubmit: () => void
}

// Define the volume ranges (same as in Step3BusinessInfo)
const VOLUME_RANGES = [
  { label: '100K to 500K', value: '100000-500000' },
  { label: '501K to 1M', value: '501000-1000000' },
  { label: '1M+', value: '1000000+' }
]

export function Step4LicenseInfo({ onSubmit }: Step4LicenseInfoProps) {
  const { formData, updateFormData, prevStep, submitOnboarding, isLoading } = useOnboarding()
  const router = useRouter()

  const handleLicenseNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateFormData({ license_number: e.target.value })
  }

  const handleLicenseStateChange = (value: string) => {
    updateFormData({ license_state: value })
  }

  // Function to get volume range display based on numeric value
  const getVolumeRangeDisplay = (volume: number): string => {
    if (volume >= 100000 && volume <= 500000) {
      return '100K to 500K'
    } else if (volume >= 501000 && volume <= 1000000) {
      return '501K to 1M'
    } else if (volume > 1000000) {
      return '1M+'
    }
    return 'Not specified'
  }

  const handleSubmit = async () => {
    try {
      await submitOnboarding()
      // Redirect will happen automatically in submitOnboarding context
    } catch (error) {
      console.error('Onboarding submission failed:', error)
    }
  }

  const isRealEstateAgent = formData.partner_type === 'Real Estate Agent'

  return (
    <div className="max-w-3xl mx-auto">
      <div className="text-center mb-16">
        <h1 className="text-5xl font-bold visto-dark-blue mb-4 tracking-tight">
          You're all set
        </h1>
        <p className="text-xl visto-slate leading-relaxed">
          Your partnership is activated and ready for exclusive opportunities
        </p>
      </div>

      {/* Success-focused summary */}
      <Card className="border-2 border-primary/20 bg-gradient-visto-subtle mb-12">
        <CardHeader className="text-center pb-8">
          <CardTitle className="text-3xl font-semibold visto-gold tracking-tight">
            Ready to Launch
          </CardTitle>
          <CardDescription className="text-lg visto-dark-blue mt-3 font-medium">
            Your premium profile is complete and ready for high-value opportunities
          </CardDescription>
        </CardHeader>
        <CardContent className="px-8 pb-8">
          <div className="space-y-4 text-lg">
            <div className="flex justify-between">
              <span className="font-medium visto-dark-blue">Contact:</span>
              <span className="visto-slate">{formData.phone_number}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium visto-dark-blue">Monthly deals:</span>
              <span className="visto-slate">{formData.monthly_deal_volume}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium visto-dark-blue">Volume:</span>
              <span className="visto-slate">{getVolumeRangeDisplay(formData.transaction_volume || 0)}</span>
            </div>
            <div className="pt-3">
              <span className="font-medium visto-dark-blue">Specialties:</span>
              <div className="mt-4 flex flex-wrap gap-3">
                {formData.transaction_types.map((type) => (
                  <span 
                    key={type} 
                    className="px-4 py-2 bg-primary/10 visto-gold rounded-lg text-base font-medium border border-primary/20"
                  >
                    {type}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-between">
        <Button
          onClick={prevStep}
          variant="outline"
          className="px-8 py-4 text-lg border-2 border-primary text-primary hover:bg-primary/5 transition-all duration-200 font-semibold"
          disabled={isLoading}
        >
          Back
        </Button>
        <Button
          onClick={handleSubmit}
          className="px-16 py-4 text-xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold tracking-wide transition-all duration-200 shadow-xl hover:shadow-2xl"
          disabled={isLoading}
        >
          {isLoading ? 'Launching Partnership...' : 'Launch Partnership'}
        </Button>
      </div>
    </div>
  )
} 