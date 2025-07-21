'use client'

import { useOnboarding } from '@/contexts/OnboardingContext'
import { PARTNER_TYPES, PartnerType } from '@/types'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export function Step1PartnerType() {
  const { formData, updateFormData, nextStep } = useOnboarding()

  const handlePartnerTypeSelect = (partnerType: PartnerType) => {
    updateFormData({ partner_type: partnerType })
  }

  const handleContinue = () => {
    if (formData.partner_type) {
      nextStep()
    }
  }

  const getPartnerDescription = (partnerType: PartnerType) => {
    switch (partnerType) {
      case 'Wholesaler':
        return 'Find, contract, and assign deals quickly'
      case 'Investor':
        return 'Build wealth through strategic property investments'
      case 'Real Estate Agent':
        return 'Connect clients with their perfect investments'
      case 'Marketing Partner':
        return 'Generate quality leads for real estate and lending professionals'
      default:
        return ''
    }
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-16">
        <h1 className="text-5xl font-bold visto-dark-blue mb-4 tracking-tight">
          Choose your path
        </h1>
        <p className="text-xl visto-slate max-w-2xl mx-auto leading-relaxed">
          Select the partnership that best describes your business and unlock exclusive opportunities
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
        {PARTNER_TYPES.map((partnerType) => (
          <Card
            key={partnerType}
            className={`cursor-pointer transition-all duration-300 hover:shadow-2xl hover:scale-[1.02] border-2 ${
              formData.partner_type === partnerType
                ? 'ring-2 ring-primary bg-gradient-visto-subtle shadow-2xl scale-[1.02] border-primary'
                : 'hover:bg-card/80 border-border hover:border-primary/30'
            }`}
            onClick={() => handlePartnerTypeSelect(partnerType)}
          >
            <CardHeader className="pb-6">
              <CardTitle className={`text-2xl font-semibold tracking-tight ${
                formData.partner_type === partnerType ? 'visto-gold' : 'visto-dark-blue'
              }`}>
                {partnerType}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-lg visto-slate leading-relaxed">
                {getPartnerDescription(partnerType)}
              </CardDescription>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex justify-center">
        <Button
          onClick={handleContinue}
          disabled={!formData.partner_type}
          className="px-12 py-4 text-lg bg-primary hover:bg-primary/90 disabled:bg-muted-foreground/20 disabled:text-muted-foreground text-primary-foreground font-semibold tracking-wide transition-all duration-200 shadow-lg hover:shadow-xl"
        >
          Continue
        </Button>
      </div>
    </div>
  )
} 