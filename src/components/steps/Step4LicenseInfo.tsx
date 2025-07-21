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

export function Step4LicenseInfo({ onSubmit }: Step4LicenseInfoProps) {
  const { formData, updateFormData, prevStep, submitOnboarding, isLoading } = useOnboarding()
  const router = useRouter()

  const handleLicenseNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateFormData({ license_number: e.target.value })
  }

  const handleLicenseStateChange = (value: string) => {
    updateFormData({ license_state: value })
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

  if (isRealEstateAgent) {
    return (
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold visto-dark-blue mb-4 tracking-tight">
            License verification
          </h1>
          <p className="text-xl visto-slate leading-relaxed">
            Complete your professional credentials to unlock premium opportunities
          </p>
        </div>

        <Card className="border-2 border-border shadow-2xl bg-card mb-10">
          <CardHeader className="text-center pb-8">
            <CardTitle className="text-3xl font-semibold visto-dark-blue tracking-tight">Real Estate License</CardTitle>
            <CardDescription className="text-lg visto-slate mt-3">
              We'll verify your credentials to activate exclusive partner benefits
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-8 px-8 pb-8">
            <div className="space-y-4">
              <Label htmlFor="license" className="text-lg font-medium visto-dark-blue">
                License number
              </Label>
              <Input
                id="license"
                type="text"
                placeholder="Enter your license number"
                value={formData.license_number || ''}
                onChange={handleLicenseNumberChange}
                className="text-lg py-4 px-5 border-2 focus:ring-2 focus:ring-primary focus:border-primary transition-all duration-200"
                required
              />
            </div>
            
            <div className="space-y-4">
              <Label htmlFor="state" className="text-lg font-medium visto-dark-blue">
                License state
              </Label>
              <Select value={formData.license_state || ''} onValueChange={handleLicenseStateChange}>
                <SelectTrigger className="text-lg py-4 px-5 border-2 focus:ring-2 focus:ring-primary focus:border-primary transition-all duration-200">
                  <SelectValue placeholder="Select your state" />
                </SelectTrigger>
                <SelectContent>
                  {US_STATES.map((state) => (
                    <SelectItem key={state} value={state} className="text-base">
                      {state}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Profile Summary */}
        <Card className="border-2 border-primary/20 bg-gradient-visto-subtle mb-12">
          <CardHeader className="pb-6">
            <CardTitle className="text-2xl font-semibold visto-gold tracking-tight">Partnership Summary</CardTitle>
          </CardHeader>
          <CardContent className="px-6 pb-6">
            <div className="space-y-3 text-lg">
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
                <span className="visto-slate">${formData.transaction_volume.toLocaleString()}</span>
              </div>
              <div className="pt-2">
                <span className="font-medium visto-dark-blue">Specialties:</span>
                <div className="mt-3 flex flex-wrap gap-3">
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
            disabled={isLoading || !formData.license_number || !formData.license_state}
          >
            {isLoading ? 'Activating Partnership...' : 'Activate Partnership'}
          </Button>
        </div>
      </div>
    )
  }

  // Non-Real Estate Agent path
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
              <span className="visto-slate">${formData.transaction_volume.toLocaleString()}</span>
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