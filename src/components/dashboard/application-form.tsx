'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { createLoanApplication } from '@/lib/loan-applications'
import type { LoanApplicationFormData, LoanObjective } from '@/types'
import { toast } from 'sonner'

interface ApplicationFormProps {
  onSuccess: () => void
  onCancel: () => void
}

export function ApplicationForm({ onSuccess, onCancel }: ApplicationFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState<LoanApplicationFormData>({
    // Personal Info
    first_name: '',
    last_name: '',
    email: '',
    phone_number: '',
    
    // Property Info
    property_address: '',
    property_is_tbd: false,
    property_type: '',
    current_residence: '',
    
    // Simplified Loan Information
    loan_objective: 'purchase' as LoanObjective,
    loan_type: '',
    
    // Personal Details
    ssn: '',
    date_of_birth: '',
    
    // Income Information (for homeowner loans)
    total_income: 0,
    income_sources: [],
    income_documents: [],
    
    // Assets
    total_assets: 0,
    bank_accounts: [],
    bank_statements: []
  })

  const handleInputChange = (field: keyof LoanApplicationFormData) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setFormData(prev => ({
      ...prev,
      [field]: e.target.value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const { application, error } = await createLoanApplication(formData)
      
      if (error) {
        toast.error(error)
        return
      }

      toast.success('Application created successfully!')
      onSuccess()
    } catch (error) {
      console.error('Application creation error:', error)
      toast.error('An unexpected error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl font-bold visto-dark-blue">
          Create Loan Application
        </CardTitle>
        <CardDescription className="text-lg visto-slate">
          Submit a new client loan application (simplified form)
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="first_name" className="text-base font-medium visto-dark-blue">
                First Name *
              </Label>
              <Input
                id="first_name"
                value={formData.first_name}
                onChange={handleInputChange('first_name')}
                required
                className="border-2 focus:ring-2 focus:ring-primary focus:border-primary"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="last_name" className="text-base font-medium visto-dark-blue">
                Last Name *
              </Label>
              <Input
                id="last_name"
                value={formData.last_name}
                onChange={handleInputChange('last_name')}
                required
                className="border-2 focus:ring-2 focus:ring-primary focus:border-primary"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email" className="text-base font-medium visto-dark-blue">
              Email Address *
            </Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={handleInputChange('email')}
              required
              className="border-2 focus:ring-2 focus:ring-primary focus:border-primary"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone_number" className="text-base font-medium visto-dark-blue">
              Phone Number
            </Label>
            <Input
              id="phone_number"
              type="tel"
              value={formData.phone_number}
              onChange={handleInputChange('phone_number')}
              className="border-2 focus:ring-2 focus:ring-primary focus:border-primary"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="ssn" className="text-base font-medium visto-dark-blue">
              Social Security Number *
            </Label>
            <Input
              id="ssn"
              value={formData.ssn}
              onChange={handleInputChange('ssn')}
              required
              placeholder="XXX-XX-XXXX"
              className="border-2 focus:ring-2 focus:ring-primary focus:border-primary"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="date_of_birth" className="text-base font-medium visto-dark-blue">
              Date of Birth *
            </Label>
            <Input
              id="date_of_birth"
              type="date"
              value={formData.date_of_birth}
              onChange={handleInputChange('date_of_birth')}
              required
              className="border-2 focus:ring-2 focus:ring-primary focus:border-primary"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="property_address" className="text-base font-medium visto-dark-blue">
              Property Address
            </Label>
            <Input
              id="property_address"
              value={formData.property_address}
              onChange={handleInputChange('property_address')}
              placeholder="123 Main St, City, State 12345"
              className="border-2 focus:ring-2 focus:ring-primary focus:border-primary"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="current_residence" className="text-base font-medium visto-dark-blue">
              Current Residence *
            </Label>
            <Input
              id="current_residence"
              value={formData.current_residence}
              onChange={handleInputChange('current_residence')}
              required
              placeholder="456 Current St, City, State 12345"
              className="border-2 focus:ring-2 focus:ring-primary focus:border-primary"
            />
          </div>

          <div className="flex space-x-4 pt-6">
            <Button
              type="submit"
              disabled={isLoading}
              className="flex-1 px-8 py-4 text-lg bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
            >
              {isLoading ? 'Creating...' : 'Create Application'}
            </Button>
            
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              className="px-8 py-4 text-lg border-2 border-primary text-primary hover:bg-primary/5"
            >
              Cancel
            </Button>
          </div>

          <p className="text-sm visto-slate text-center">
            * Required fields. Use the "Create New Application" button on the dashboard for a comprehensive form.
          </p>
        </form>
      </CardContent>
    </Card>
  )
} 