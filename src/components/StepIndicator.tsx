'use client'

import { useOnboarding } from '@/contexts/OnboardingContext'
import { Check } from 'lucide-react'

const steps = [
  { id: 1, title: 'Partner Type', shortTitle: 'Type' },
  { id: 2, title: 'Contact Info', shortTitle: 'Contact' },
  { id: 3, title: 'Business Info', shortTitle: 'Business' },
  { id: 4, title: 'License Info', shortTitle: 'License' }
]

export function StepIndicator() {
  const { currentStep } = useOnboarding()

  return (
    <div className="flex items-center justify-center mb-20">
      <div className="flex items-center space-x-10">
        {steps.map((step, index) => (
          <div key={step.id} className="flex items-center">
            <div className="flex flex-col items-center">
              <div
                className={`w-14 h-14 rounded-full flex items-center justify-center text-lg font-bold transition-all duration-500 ${
                  currentStep > step.id
                    ? 'bg-primary text-primary-foreground shadow-xl scale-110'
                    : currentStep === step.id
                    ? 'bg-primary text-primary-foreground shadow-xl ring-4 ring-primary/20 scale-110'
                    : 'bg-muted text-muted-foreground shadow-md'
                }`}
              >
                {currentStep > step.id ? (
                  <Check className="w-7 h-7" />
                ) : (
                  step.id
                )}
              </div>
              <span
                className={`mt-4 text-base font-semibold transition-all duration-500 ${
                  currentStep >= step.id ? 'visto-gold' : 'visto-slate'
                }`}
              >
                {step.shortTitle}
              </span>
            </div>
            {index < steps.length - 1 && (
              <div
                className={`w-20 h-1.5 mx-6 rounded-full transition-all duration-500 ${
                  currentStep > step.id ? 'bg-primary shadow-sm' : 'bg-border'
                }`}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  )
} 