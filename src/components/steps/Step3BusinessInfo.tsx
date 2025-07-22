'use client'

import { useOnboarding } from '@/contexts/OnboardingContext'
import { TRANSACTION_TYPES, TransactionType } from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'

export function Step3BusinessInfo() {
  const { formData, updateFormData, nextStep, prevStep } = useOnboarding()

  // Utility function to handle number input formatting
  const handleNumberInput = (value: string, setter: (value: number) => void) => {
    // Remove all non-numeric characters except decimal point
    const cleanValue = value.replace(/[^\d.]/g, '');
    
    // Remove leading zeros (but keep single zero)
    const noLeadingZeros = cleanValue.replace(/^0+/, '') || '0';
    
    // Ensure only one decimal point
    const parts = noLeadingZeros.split('.');
    const formattedValue = parts.length > 2 ? parts[0] + '.' + parts.slice(1).join('') : noLeadingZeros;
    
    // Convert to number and update
    const numValue = Number(formattedValue);
    if (!isNaN(numValue)) {
      setter(numValue);
    }
  };

  // Utility function to format display value (remove trailing .0)
  const formatDisplayValue = (value: number): string => {
    return value === 0 ? '0' : value.toString().replace(/\.0$/, '');
  };

  const handleMonthlyDealVolumeChange = (value: number) => {
    updateFormData({ monthly_deal_volume: value })
  }

  const handleTransactionVolumeChange = (value: number) => {
    updateFormData({ transaction_volume: value })
  }

  const handleTransactionTypeToggle = (transactionType: TransactionType) => {
    const currentTypes = formData.transaction_types
    const updatedTypes = currentTypes.includes(transactionType)
      ? currentTypes.filter((type: string) => type !== transactionType)
      : [...currentTypes, transactionType]
    
    updateFormData({ transaction_types: updatedTypes })
  }

  const handleContinue = () => {
    if (formData.monthly_deal_volume > 0 && 
        formData.transaction_volume > 0 && 
        formData.transaction_types.length > 0) {
      nextStep()
    }
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-16">
        <h1 className="text-5xl font-bold visto-dark-blue mb-4 tracking-tight">
          Your business profile
        </h1>
        <p className="text-xl visto-slate max-w-3xl mx-auto leading-relaxed">
          Help us match you with the perfect opportunities tailored to your expertise
        </p>
      </div>

      <div className="space-y-10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <Card className="border-2 border-border shadow-xl bg-card">
            <CardHeader className="pb-6">
              <CardTitle className="text-2xl font-semibold visto-dark-blue tracking-tight">Deal Volume</CardTitle>
              <CardDescription className="text-lg visto-slate">
                Average deals you close monthly
              </CardDescription>
            </CardHeader>
            <CardContent className="px-6 pb-6">
              <div className="space-y-4">
                <Label htmlFor="deals" className="text-lg font-medium visto-dark-blue">Number of deals</Label>
                <Input
                  id="deals"
                  type="text"
                  min="0"
                  placeholder="5"
                  value={formatDisplayValue(formData.monthly_deal_volume || 0)}
                  onChange={(e) => handleNumberInput(e.target.value, handleMonthlyDealVolumeChange)}
                  className="text-lg py-4 px-5 border-2 focus:ring-2 focus:ring-primary focus:border-primary transition-all duration-200"
                />
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 border-border shadow-xl bg-card">
            <CardHeader className="pb-6">
              <CardTitle className="text-2xl font-semibold visto-dark-blue tracking-tight">Transaction Average Volume</CardTitle>
              <CardDescription className="text-lg visto-slate">
                Your typical monthly dollar volume per transaction
              </CardDescription>
            </CardHeader>
            <CardContent className="px-6 pb-6">
              <div className="space-y-4">
                <Label htmlFor="volume" className="text-lg font-medium visto-dark-blue">Monthly Average Volume ($)</Label>
                <Input
                  id="volume"
                  type="text"
                  min="0"
                  step="1000"
                  placeholder="250,000"
                  value={formatDisplayValue(formData.transaction_volume || 0)}
                  onChange={(e) => handleNumberInput(e.target.value, handleTransactionVolumeChange)}
                  className="text-lg py-4 px-5 border-2 focus:ring-2 focus:ring-primary focus:border-primary transition-all duration-200"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="border-2 border-border shadow-xl bg-card">
          <CardHeader className="pb-8">
            <CardTitle className="text-2xl font-semibold visto-dark-blue tracking-tight">Property Types</CardTitle>
            <CardDescription className="text-lg visto-slate">
              Select all transaction types you handle
            </CardDescription>
          </CardHeader>
          <CardContent className="px-6 pb-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {TRANSACTION_TYPES.map((type) => (
                <div
                  key={type}
                  className={`flex items-center space-x-4 p-4 rounded-xl border-2 transition-all duration-200 cursor-pointer ${
                    formData.transaction_types.includes(type)
                      ? 'bg-gradient-visto-subtle border-primary shadow-md'
                      : 'hover:bg-card/80 border-border hover:border-primary/30'
                  }`}
                  onClick={() => handleTransactionTypeToggle(type)}
                >
                  <Checkbox
                    checked={formData.transaction_types.includes(type)}
                    onChange={() => handleTransactionTypeToggle(type)}
                    className="h-5 w-5"
                  />
                  <label className={`text-base font-medium cursor-pointer ${
                    formData.transaction_types.includes(type) ? 'visto-gold' : 'visto-dark-blue'
                  }`}>
                    {type}
                  </label>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

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
          disabled={formData.monthly_deal_volume <= 0 || 
                   formData.transaction_volume <= 0 || 
                   formData.transaction_types.length === 0}
          className="px-12 py-4 text-lg bg-primary hover:bg-primary/90 disabled:bg-muted-foreground/20 disabled:text-muted-foreground text-primary-foreground font-semibold tracking-wide transition-all duration-200 shadow-lg hover:shadow-xl"
        >
          Continue
        </Button>
      </div>
    </div>
  )
} 