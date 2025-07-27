'use client'

import { useState } from 'react'
import { useOnboarding } from '@/contexts/OnboardingContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { PhoneVerification } from '@/components/phone-verification'

// Phone number formatting utility
const formatPhoneNumber = (value: string): string => {
  // Remove all non-numeric characters
  const numbers = value.replace(/\D/g, '')
  
  // Limit to 10 digits
  const limited = numbers.substring(0, 10)
  
  // Format as (XXX) XXX-XXXX
  if (limited.length >= 6) {
    return `(${limited.slice(0, 3)}) ${limited.slice(3, 6)}-${limited.slice(6)}`
  } else if (limited.length >= 3) {
    return `(${limited.slice(0, 3)}) ${limited.slice(3)}`
  } else if (limited.length > 0) {
    return `(${limited}`
  }
  
  return limited
}

// Extract just numbers from formatted phone
const getPhoneNumbers = (formatted: string): string => {
  return formatted.replace(/\D/g, '')
}

// Validate phone number (must be 10 digits)
const isValidPhoneNumber = (phone: string): boolean => {
  const numbers = getPhoneNumbers(phone)
  return numbers.length === 10
}

export function Step2PhoneNumber() {
  const { formData, updateFormData, nextStep, prevStep } = useOnboarding()
  const [showVerification, setShowVerification] = useState(false)
  const [isVerified, setIsVerified] = useState(false)

  const handlePhoneNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value
    const formatted = formatPhoneNumber(input)
    updateFormData({ phone_number: formatted })
    // Reset verification when phone number changes
    setIsVerified(false)
    setShowVerification(false)
  }

  const handleContinue = () => {
    if (isValidPhoneNumber(formData.phone_number)) {
      setShowVerification(true)
    }
  }

  const handleVerified = (phoneNumber: string) => {
    setIsVerified(true)
    setShowVerification(false)
    nextStep()
  }

  const handleSkipVerification = () => {
    setShowVerification(false)
    nextStep()
  }

  const isPhoneValid = isValidPhoneNumber(formData.phone_number)

  return (
    <div className="max-w-2xl mx-auto">
      {showVerification ? (
        <div className="space-y-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold visto-dark-blue mb-4 tracking-tight">
              Verify your phone number
            </h1>
            <p className="text-lg visto-slate leading-relaxed">
              We'll send a verification code to confirm your number
            </p>
          </div>
          
          <PhoneVerification
            phoneNumber={`+1${getPhoneNumbers(formData.phone_number)}`}
            onVerified={handleVerified}
            onSkip={handleSkipVerification}
          />
        </div>
      ) : (
        <>
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
                  className={`text-lg py-4 px-5 border-2 focus:ring-2 focus:ring-primary focus:border-primary transition-all duration-200 ${
                    formData.phone_number && !isPhoneValid 
                      ? 'border-red-300 focus:border-red-500 focus:ring-red-500' 
                      : ''
                  }`}
                  maxLength={14} // (XXX) XXX-XXXX = 14 characters
                />
                {formData.phone_number && !isPhoneValid && (
                  <p className="text-sm text-red-600 mt-2">
                    Please enter a valid 10-digit phone number
                  </p>
                )}
                {isPhoneValid && (
                  <p className="text-sm text-green-600 mt-2 flex items-center">
                    <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    Valid phone number
                  </p>
                )}
                {isVerified && (
                  <p className="text-sm text-green-600 mt-2 flex items-center">
                    <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    Phone number verified ✓
                  </p>
                )}
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
              disabled={!isPhoneValid}
              className="px-12 py-4 text-lg bg-primary hover:bg-primary/90 disabled:bg-primary/80 disabled:text-primary-foreground text-primary-foreground font-semibold tracking-wide transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              {isVerified ? 'Continue' : 'Verify Phone Number'}
            </Button>
          </div>
        </>
      )}
    </div>
  )
} 