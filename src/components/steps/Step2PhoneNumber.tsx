'use client'

import { useOnboarding } from '@/contexts/OnboardingContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export function Step2PhoneNumber() {
  const { formData, updateFormData, nextStep, prevStep } = useOnboarding()

  const handlePhoneNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateFormData({ phone_number: e.target.value })
  }

  const handleContinue = () => {
    if (formData.phone_number) {
      nextStep()
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-16">
        <h1 className="text-5xl font-bold visto-dark-blue mb-4 tracking-tight">
          Stay connected
        </h1>
        <p className="text-xl visto-slate leading-relaxed">
          Your direct line to exclusive opportunities
        </p>
      </div>

      <Card className="border-2 border-border shadow-2xl bg-card">
        <CardHeader className="text-center pb-8">
          <CardTitle className="text-3xl font-semibold visto-dark-blue tracking-tight">Contact Information</CardTitle>
          <CardDescription className="text-lg visto-slate mt-3">
            We'll reach out when premium deals match your criteria
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-8 px-8 pb-8">
          <div className="space-y-4">
            <Label htmlFor="phone" className="text-lg font-medium visto-dark-blue">
              Primary business number
            </Label>
            <Input
              id="phone"
              type="tel"
              placeholder="(555) 123-4567"
              value={formData.phone_number}
              onChange={handlePhoneNumberChange}
              className="text-lg py-4 px-5 border-2 focus:ring-2 focus:ring-primary focus:border-primary transition-all duration-200"
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-between mt-16">
        <Button
          onClick={prevStep}
          variant="outline"
          className="px-8 py-4 text-lg border-2 border-primary text-primary hover:bg-primary/5 transition-all duration-200 font-semibold"
        >
          Back
        </Button>
        <Button
          onClick={handleContinue}
          disabled={!formData.phone_number}
          className="px-12 py-4 text-lg bg-primary hover:bg-primary/90 disabled:bg-muted-foreground/20 disabled:text-muted-foreground text-primary-foreground font-semibold tracking-wide transition-all duration-200 shadow-lg hover:shadow-xl"
        >
          Continue
        </Button>
      </div>
    </div>
  )
} 