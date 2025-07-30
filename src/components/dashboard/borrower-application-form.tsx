'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { createLoanApplication } from '@/lib/loan-applications'
import type { BorrowerFormData, CompanyFormData, ApplicationFormData, BankAccount, IncomeSource, IncomeSourceType } from '@/types'
import { INCOME_SOURCE_TYPES } from '@/types'
import { toast } from 'sonner'
import { Plus, Trash2, Upload, DollarSign, FileText, User, Building, ChevronLeft, ChevronRight } from 'lucide-react'
import { v4 as uuidv4 } from 'uuid'

interface BorrowerApplicationFormProps {
  onSuccess?: () => void
  onCancel?: () => void
  initialData?: ApplicationFormData
  isEditing?: boolean
}

interface ValidationErrors {
  [key: string]: string
}

export function BorrowerApplicationForm({ onSuccess, onCancel, initialData, isEditing = false }: BorrowerApplicationFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [currentSection, setCurrentSection] = useState(0)
  const [errors, setErrors] = useState<ValidationErrors>({})
  
  // Initialize form data
  const getInitialFormData = (): ApplicationFormData => {
    if (isEditing && initialData) {
      return initialData
    }
    
    const defaultBorrower: BorrowerFormData = {
      first_name: '',
      last_name: '',
      email: '',
      phone_number: '',
      ssn: '',
      date_of_birth: '',
      current_residence: '',
      total_income: 0,
      income_sources: [],
      income_documents: [],
      total_assets: 0,
      bank_accounts: [],
      bank_statements: [],
      has_company: false,
      company: undefined
    }
    
    return {
      application_name: '',
      application_type: 'loan_application',
      notes: '',
      borrowers: [defaultBorrower],
      primary_borrower: defaultBorrower
    }
  }
  
  const [formData, setFormData] = useState<ApplicationFormData>(getInitialFormData())
  
  const sections = [
    {
      id: 0,
      title: 'Application Information',
      description: 'Basic application details',
      icon: FileText
    },
    {
      id: 1,
      title: 'Primary Borrower',
      description: 'Personal information and contact details',
      icon: User
    },
    {
      id: 2,
      title: 'Income & Employment',
      description: 'Income sources and employment information',
      icon: DollarSign
    },
    {
      id: 3,
      title: 'Assets & Banking',
      description: 'Financial assets and bank account information',
      icon: DollarSign
    },
    {
      id: 4,
      title: 'Company Information',
      description: 'Business ownership and company details',
      icon: Building
    }
  ]

  // Validation functions
  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  const validatePhone = (phone: string): boolean => {
    const phoneRegex = /^\(?([0-9]{3})\)?[-. ]?([0-9]{3})[-. ]?([0-9]{4})$/
    return phoneRegex.test(phone.replace(/\s/g, ''))
  }

  const validateSSN = (ssn: string): boolean => {
    const ssnRegex = /^\d{3}-?\d{2}-?\d{4}$/
    return ssnRegex.test(ssn.replace(/\s/g, ''))
  }

  const validateDateOfBirth = (dob: string): boolean => {
    if (!dob) return false
    const today = new Date()
    const birthDate = new Date(dob)
    const age = today.getFullYear() - birthDate.getFullYear()
    return age >= 18 && age <= 120
  }

  const validateName = (name: string): boolean => {
    return name.trim().length >= 2 && /^[a-zA-Z\s'-]+$/.test(name)
  }

  const validateBankBalance = (balance: number): boolean => {
    return balance >= 0 && balance <= 999999999
  }

  const validateIncomeAmount = (amount: number): boolean => {
    return amount > 0 && amount <= 9999999
  }

  const validateSection = (sectionId: number): ValidationErrors => {
    const newErrors: ValidationErrors = {}
    const primaryBorrower = formData.primary_borrower

    switch (sectionId) {
      case 0: // Application Information
        if (!formData.application_name.trim()) {
          newErrors.application_name = 'Application name is required'
        }
        break

      case 1: // Primary Borrower
        if (!validateName(primaryBorrower.first_name)) {
          newErrors.first_name = 'First name must be at least 2 characters and contain only letters'
        }
        if (!validateName(primaryBorrower.last_name)) {
          newErrors.last_name = 'Last name must be at least 2 characters and contain only letters'
        }
        if (!validateEmail(primaryBorrower.email)) {
          newErrors.email = 'Please enter a valid email address'
        }
        if (!validatePhone(primaryBorrower.phone_number)) {
          newErrors.phone_number = 'Please enter a valid phone number (e.g., 555-123-4567)'
        }
        if (!validateSSN(primaryBorrower.ssn)) {
          newErrors.ssn = 'Please enter a valid SSN (e.g., 123-45-6789)'
        }
        if (!validateDateOfBirth(primaryBorrower.date_of_birth)) {
          newErrors.date_of_birth = 'Please enter a valid date of birth (must be 18 or older)'
        }
        break

      case 2: // Income & Employment
        if (primaryBorrower.income_sources.length === 0) {
          newErrors.income_sources = 'At least one income source is required'
        }
        break

      case 3: // Assets & Banking
        if (primaryBorrower.bank_accounts.length === 0) {
          newErrors.bank_accounts = 'At least one bank account is required'
        }
        break

      case 4: // Company Information
        if (primaryBorrower.has_company && primaryBorrower.company) {
          if (!primaryBorrower.company.company_name.trim()) {
            newErrors.company_name = 'Company name is required'
          }
          if (primaryBorrower.company.ownership_percentage !== undefined) {
            if (primaryBorrower.company.ownership_percentage < 0 || primaryBorrower.company.ownership_percentage > 100) {
              newErrors.ownership_percentage = 'Ownership percentage must be between 0 and 100'
            }
          }
        }
        break
    }

    return newErrors
  }

  const handleInputChange = (field: keyof BorrowerFormData) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setFormData(prev => ({
      ...prev,
      primary_borrower: {
        ...prev.primary_borrower,
        [field]: e.target.value
      }
    }))
  }

  const handleApplicationInputChange = (field: keyof ApplicationFormData) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData(prev => ({
      ...prev,
      [field]: e.target.value
    }))
  }

  const handleSelectChange = (field: keyof BorrowerFormData) => (value: string) => {
    setFormData(prev => ({
      ...prev,
      primary_borrower: {
        ...prev.primary_borrower,
        [field]: value
      }
    }))
  }

  const handleSwitchChange = (field: keyof BorrowerFormData) => (checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      primary_borrower: {
        ...prev.primary_borrower,
        [field]: checked
      }
    }))
  }

  const addIncomeSource = () => {
    const newIncomeSource: IncomeSource = {
      id: uuidv4(),
      type: 'w2',
      amount: 0,
      description: '',
      documents: []
    }
    
    setFormData(prev => ({
      ...prev,
      primary_borrower: {
        ...prev.primary_borrower,
        income_sources: [...prev.primary_borrower.income_sources, newIncomeSource]
      }
    }))
  }

  const updateIncomeSource = (id: string, field: keyof IncomeSource, value: any) => {
    setFormData(prev => ({
      ...prev,
      primary_borrower: {
        ...prev.primary_borrower,
        income_sources: prev.primary_borrower.income_sources.map(source =>
          source.id === id ? { ...source, [field]: value } : source
        )
      }
    }))
  }

  const removeIncomeSource = (id: string) => {
    setFormData(prev => ({
      ...prev,
      primary_borrower: {
        ...prev.primary_borrower,
        income_sources: prev.primary_borrower.income_sources.filter(source => source.id !== id)
      }
    }))
  }

  const addBankAccount = () => {
    const newBankAccount: BankAccount = {
      id: uuidv4(),
      bank_name: '',
      account_type: 'checking',
      balance: 0,
      statement_months: 2
    }
    
    setFormData(prev => ({
      ...prev,
      primary_borrower: {
        ...prev.primary_borrower,
        bank_accounts: [...prev.primary_borrower.bank_accounts, newBankAccount]
      }
    }))
  }

  const updateBankAccount = (id: string, field: keyof BankAccount, value: any) => {
    setFormData(prev => ({
      ...prev,
      primary_borrower: {
        ...prev.primary_borrower,
        bank_accounts: prev.primary_borrower.bank_accounts.map(account =>
          account.id === id ? { ...account, [field]: value } : account
        )
      }
    }))
  }

  const removeBankAccount = (id: string) => {
    setFormData(prev => ({
      ...prev,
      primary_borrower: {
        ...prev.primary_borrower,
        bank_accounts: prev.primary_borrower.bank_accounts.filter(account => account.id !== id)
      }
    }))
  }

  const updateCompanyField = (field: keyof CompanyFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      primary_borrower: {
        ...prev.primary_borrower,
        company: {
          ...prev.primary_borrower.company!,
          [field]: value
        }
      }
    }))
  }

  const nextSection = () => {
    const sectionErrors = validateSection(currentSection)
    if (Object.keys(sectionErrors).length > 0) {
      setErrors(sectionErrors)
      return
    }
    
    setErrors({})
    if (currentSection < sections.length - 1) {
      setCurrentSection(currentSection + 1)
    }
  }

  const prevSection = () => {
    setErrors({})
    if (currentSection > 0) {
      setCurrentSection(currentSection - 1)
    }
  }

  const handleSubmit = async () => {
    const sectionErrors = validateSection(currentSection)
    if (Object.keys(sectionErrors).length > 0) {
      setErrors(sectionErrors)
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch('/api/applications/borrower', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      const result = await response.json()

      if (!response.ok) {
        toast.error(result.error || 'Failed to create application')
        return
      }

      toast.success('Application created successfully!')
      onSuccess?.()
    } catch (error) {
      console.error('Application creation error:', error)
      toast.error('An unexpected error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  const renderApplicationInfo = () => (
    <div className="space-y-6">
      <div className="space-y-3">
        <Label htmlFor="application_name" className="text-lg font-medium visto-dark-blue">
          Application Name *
        </Label>
        <Input
          id="application_name"
          type="text"
          required
          value={formData.application_name}
          onChange={handleApplicationInputChange('application_name')}
          className={`text-lg py-4 px-5 border-2 focus:ring-2 focus:ring-primary focus:border-primary transition-all duration-200 ${
            errors.application_name ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''
          }`}
          placeholder="e.g., Smith Family Loan Application"
        />
        {errors.application_name && (
          <p className="text-sm text-red-600">{errors.application_name}</p>
        )}
      </div>

      <div className="space-y-3">
        <Label htmlFor="application_type" className="text-lg font-medium visto-dark-blue">
          Application Type *
        </Label>
        <Select
          value={formData.application_type}
          onValueChange={(value) => setFormData(prev => ({ ...prev, application_type: value as any }))}
        >
          <SelectTrigger className="text-lg py-4 px-5 border-2 focus:ring-2 focus:ring-primary focus:border-primary">
            <SelectValue placeholder="Select application type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="loan_application">Loan Application</SelectItem>
            <SelectItem value="refinance_application">Refinance Application</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-3">
        <Label htmlFor="notes" className="text-lg font-medium visto-dark-blue">
          Notes
        </Label>
        <Textarea
          id="notes"
          value={formData.notes}
          onChange={handleApplicationInputChange('notes')}
          className="text-lg py-4 px-5 border-2 focus:ring-2 focus:ring-primary focus:border-primary"
          placeholder="Any additional notes about this application..."
          rows={4}
        />
      </div>
    </div>
  )

  const renderPersonalInfo = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-3">
          <Label htmlFor="first_name" className="text-lg font-medium visto-dark-blue">
            First Name *
          </Label>
          <Input
            id="first_name"
            type="text"
            required
            value={formData.primary_borrower.first_name}
            onChange={handleInputChange('first_name')}
            className={`text-lg py-4 px-5 border-2 focus:ring-2 focus:ring-primary focus:border-primary transition-all duration-200 ${
              errors.first_name ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''
            }`}
            placeholder="John"
          />
          {errors.first_name && (
            <p className="text-sm text-red-600">{errors.first_name}</p>
          )}
        </div>
        
        <div className="space-y-3">
          <Label htmlFor="last_name" className="text-lg font-medium visto-dark-blue">
            Last Name *
          </Label>
          <Input
            id="last_name"
            type="text"
            required
            value={formData.primary_borrower.last_name}
            onChange={handleInputChange('last_name')}
            className={`text-lg py-4 px-5 border-2 focus:ring-2 focus:ring-primary focus:border-primary transition-all duration-200 ${
              errors.last_name ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''
            }`}
            placeholder="Smith"
          />
          {errors.last_name && (
            <p className="text-sm text-red-600">{errors.last_name}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-3">
          <Label htmlFor="email" className="text-lg font-medium visto-dark-blue">
            Email Address *
          </Label>
          <Input
            id="email"
            type="email"
            required
            value={formData.primary_borrower.email}
            onChange={handleInputChange('email')}
            className={`text-lg py-4 px-5 border-2 focus:ring-2 focus:ring-primary focus:border-primary transition-all duration-200 ${
              errors.email ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''
            }`}
            placeholder="john.smith@email.com"
          />
          {errors.email && (
            <p className="text-sm text-red-600">{errors.email}</p>
          )}
        </div>
        
        <div className="space-y-3">
          <Label htmlFor="phone_number" className="text-lg font-medium visto-dark-blue">
            Phone Number *
          </Label>
          <Input
            id="phone_number"
            type="tel"
            required
            value={formData.primary_borrower.phone_number}
            onChange={handleInputChange('phone_number')}
            className={`text-lg py-4 px-5 border-2 focus:ring-2 focus:ring-primary focus:border-primary transition-all duration-200 ${
              errors.phone_number ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''
            }`}
            placeholder="(555) 123-4567"
          />
          {errors.phone_number && (
            <p className="text-sm text-red-600">{errors.phone_number}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-3">
          <Label htmlFor="ssn" className="text-lg font-medium visto-dark-blue">
            Social Security Number *
          </Label>
          <Input
            id="ssn"
            type="text"
            required
            value={formData.primary_borrower.ssn}
            onChange={handleInputChange('ssn')}
            className={`text-lg py-4 px-5 border-2 focus:ring-2 focus:ring-primary focus:border-primary transition-all duration-200 ${
              errors.ssn ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''
            }`}
            placeholder="123-45-6789"
          />
          {errors.ssn && (
            <p className="text-sm text-red-600">{errors.ssn}</p>
          )}
        </div>
        
        <div className="space-y-3">
          <Label htmlFor="date_of_birth" className="text-lg font-medium visto-dark-blue">
            Date of Birth *
          </Label>
          <Input
            id="date_of_birth"
            type="date"
            required
            value={formData.primary_borrower.date_of_birth}
            onChange={handleInputChange('date_of_birth')}
            className={`text-lg py-4 px-5 border-2 focus:ring-2 focus:ring-primary focus:border-primary transition-all duration-200 ${
              errors.date_of_birth ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''
            }`}
          />
          {errors.date_of_birth && (
            <p className="text-sm text-red-600">{errors.date_of_birth}</p>
          )}
        </div>
      </div>

      <div className="space-y-3">
        <Label htmlFor="current_residence" className="text-lg font-medium visto-dark-blue">
          Current Residence Address *
        </Label>
        <Input
          id="current_residence"
          type="text"
          required
          value={formData.primary_borrower.current_residence}
          onChange={handleInputChange('current_residence')}
          className="text-lg py-4 px-5 border-2 focus:ring-2 focus:ring-primary focus:border-primary transition-all duration-200"
          placeholder="123 Main St, City, State 12345"
        />
      </div>
    </div>
  )

  const renderIncomeDocumentation = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold visto-dark-blue">Income Sources</h3>
        <Button
          type="button"
          onClick={addIncomeSource}
          className="bg-primary hover:bg-primary/90 text-white"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Income Source
        </Button>
      </div>

      {formData.primary_borrower.income_sources.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <DollarSign className="w-12 h-12 mx-auto mb-4 text-gray-300" />
          <p>No income sources added yet.</p>
          <p className="text-sm">Click "Add Income Source" to get started.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {formData.primary_borrower.income_sources.map((source, index) => (
            <Card key={source.id} className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-medium">Income Source {index + 1}</h4>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => removeIncomeSource(source.id)}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Type</Label>
                  <Select
                    value={source.type}
                    onValueChange={(value) => updateIncomeSource(source.id, 'type', value as IncomeSourceType)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {INCOME_SOURCE_TYPES.map(type => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label>Monthly Amount</Label>
                  <Input
                    type="number"
                    value={source.amount}
                    onChange={(e) => updateIncomeSource(source.id, 'amount', parseFloat(e.target.value) || 0)}
                    placeholder="0.00"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Input
                    type="text"
                    value={source.description}
                    onChange={(e) => updateIncomeSource(source.id, 'description', e.target.value)}
                    placeholder="e.g., W2 Employment"
                  />
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {errors.income_sources && (
        <p className="text-sm text-red-600">{errors.income_sources}</p>
      )}
    </div>
  )

  const renderAssetsAndBanking = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold visto-dark-blue">Bank Accounts</h3>
        <Button
          type="button"
          onClick={addBankAccount}
          className="bg-primary hover:bg-primary/90 text-white"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Bank Account
        </Button>
      </div>

      {formData.primary_borrower.bank_accounts.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <DollarSign className="w-12 h-12 mx-auto mb-4 text-gray-300" />
          <p>No bank accounts added yet.</p>
          <p className="text-sm">Click "Add Bank Account" to get started.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {formData.primary_borrower.bank_accounts.map((account, index) => (
            <Card key={account.id} className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-medium">Bank Account {index + 1}</h4>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => removeBankAccount(account.id)}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label>Bank Name</Label>
                  <Input
                    type="text"
                    value={account.bank_name}
                    onChange={(e) => updateBankAccount(account.id, 'bank_name', e.target.value)}
                    placeholder="Bank Name"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Account Type</Label>
                  <Select
                    value={account.account_type}
                    onValueChange={(value) => updateBankAccount(account.id, 'account_type', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="checking">Checking</SelectItem>
                      <SelectItem value="savings">Savings</SelectItem>
                      <SelectItem value="money_market">Money Market</SelectItem>
                      <SelectItem value="cd">CD</SelectItem>
                      <SelectItem value="investment">Investment</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label>Balance</Label>
                  <Input
                    type="number"
                    value={account.balance}
                    onChange={(e) => updateBankAccount(account.id, 'balance', parseFloat(e.target.value) || 0)}
                    placeholder="0.00"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Statement Months</Label>
                  <Input
                    type="number"
                    value={account.statement_months}
                    onChange={(e) => updateBankAccount(account.id, 'statement_months', parseInt(e.target.value) || 2)}
                    placeholder="2"
                  />
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {errors.bank_accounts && (
        <p className="text-sm text-red-600">{errors.bank_accounts}</p>
      )}
    </div>
  )

  const renderCompanyInformation = () => (
    <div className="space-y-6">
      <div className="flex items-center space-x-2">
        <Switch
          checked={formData.primary_borrower.has_company}
          onCheckedChange={handleSwitchChange('has_company')}
        />
        <Label className="text-lg font-medium visto-dark-blue">
          Does the primary borrower own or have ownership in a company?
        </Label>
      </div>

      {formData.primary_borrower.has_company && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <Label htmlFor="company_name" className="text-lg font-medium visto-dark-blue">
                Company Name *
              </Label>
              <Input
                id="company_name"
                type="text"
                required
                value={formData.primary_borrower.company?.company_name || ''}
                onChange={(e) => updateCompanyField('company_name', e.target.value)}
                className={`text-lg py-4 px-5 border-2 focus:ring-2 focus:ring-primary focus:border-primary transition-all duration-200 ${
                  errors.company_name ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''
                }`}
                placeholder="Company Name"
              />
              {errors.company_name && (
                <p className="text-sm text-red-600">{errors.company_name}</p>
              )}
            </div>
            
            <div className="space-y-3">
              <Label htmlFor="company_type" className="text-lg font-medium visto-dark-blue">
                Company Type
              </Label>
              <Select
                value={formData.primary_borrower.company?.company_type || ''}
                onValueChange={(value) => updateCompanyField('company_type', value)}
              >
                <SelectTrigger className="text-lg py-4 px-5 border-2 focus:ring-2 focus:ring-primary focus:border-primary">
                  <SelectValue placeholder="Select company type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="LLC">LLC</SelectItem>
                  <SelectItem value="Corporation">Corporation</SelectItem>
                  <SelectItem value="Partnership">Partnership</SelectItem>
                  <SelectItem value="Sole Proprietorship">Sole Proprietorship</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <Label htmlFor="ein" className="text-lg font-medium visto-dark-blue">
                EIN (Employer Identification Number)
              </Label>
              <Input
                id="ein"
                type="text"
                value={formData.primary_borrower.company?.ein || ''}
                onChange={(e) => updateCompanyField('ein', e.target.value)}
                className="text-lg py-4 px-5 border-2 focus:ring-2 focus:ring-primary focus:border-primary transition-all duration-200"
                placeholder="12-3456789"
              />
            </div>
            
            <div className="space-y-3">
              <Label htmlFor="ownership_percentage" className="text-lg font-medium visto-dark-blue">
                Ownership Percentage
              </Label>
              <Input
                id="ownership_percentage"
                type="number"
                min="0"
                max="100"
                value={formData.primary_borrower.company?.ownership_percentage || ''}
                onChange={(e) => updateCompanyField('ownership_percentage', parseFloat(e.target.value) || 0)}
                className={`text-lg py-4 px-5 border-2 focus:ring-2 focus:ring-primary focus:border-primary transition-all duration-200 ${
                  errors.ownership_percentage ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''
                }`}
                placeholder="0-100"
              />
              {errors.ownership_percentage && (
                <p className="text-sm text-red-600">{errors.ownership_percentage}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <Label htmlFor="role_in_company" className="text-lg font-medium visto-dark-blue">
                Role in Company
              </Label>
              <Select
                value={formData.primary_borrower.company?.role_in_company || ''}
                onValueChange={(value) => updateCompanyField('role_in_company', value)}
              >
                <SelectTrigger className="text-lg py-4 px-5 border-2 focus:ring-2 focus:ring-primary focus:border-primary">
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Owner">Owner</SelectItem>
                  <SelectItem value="Partner">Partner</SelectItem>
                  <SelectItem value="Manager">Manager</SelectItem>
                  <SelectItem value="Employee">Employee</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-3">
              <Label htmlFor="annual_revenue" className="text-lg font-medium visto-dark-blue">
                Annual Revenue
              </Label>
              <Input
                id="annual_revenue"
                type="number"
                value={formData.primary_borrower.company?.annual_revenue || ''}
                onChange={(e) => updateCompanyField('annual_revenue', parseFloat(e.target.value) || 0)}
                className="text-lg py-4 px-5 border-2 focus:ring-2 focus:ring-primary focus:border-primary transition-all duration-200"
                placeholder="0.00"
              />
            </div>
          </div>

          <div className="space-y-3">
            <Label htmlFor="business_address" className="text-lg font-medium visto-dark-blue">
              Business Address
            </Label>
            <Input
              id="business_address"
              type="text"
              value={formData.primary_borrower.company?.business_address || ''}
              onChange={(e) => updateCompanyField('business_address', e.target.value)}
              className="text-lg py-4 px-5 border-2 focus:ring-2 focus:ring-primary focus:border-primary transition-all duration-200"
              placeholder="123 Business St, City, State 12345"
            />
          </div>
        </div>
      )}
    </div>
  )

  const renderCurrentSection = () => {
    switch (currentSection) {
      case 0:
        return renderApplicationInfo()
      case 1:
        return renderPersonalInfo()
      case 2:
        return renderIncomeDocumentation()
      case 3:
        return renderAssetsAndBanking()
      case 4:
        return renderCompanyInformation()
      default:
        return renderApplicationInfo()
    }
  }

  return (
    <div className="max-w-4xl mx-auto">
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-2xl font-bold visto-dark-blue">
            {isEditing ? 'Edit Application' : 'Create New Application'}
          </CardTitle>
          <CardDescription className="text-lg visto-slate">
            {isEditing ? 'Update the application information' : 'Collect borrower information and assets'}
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Progress Indicator */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {sections.map((section, index) => (
            <div key={section.id} className="flex items-center">
              <div
                className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                  index <= currentSection
                    ? 'bg-primary border-primary text-white'
                    : 'border-gray-300 text-gray-500'
                }`}
              >
                {index < currentSection ? (
                  <span className="text-sm">✓</span>
                ) : (
                  <span className="text-sm">{index + 1}</span>
                )}
              </div>
              <div className="ml-3">
                <p className={`text-sm font-medium ${
                  index <= currentSection ? 'text-primary' : 'text-gray-500'
                }`}>
                  {section.title}
                </p>
                <p className="text-xs text-gray-400">{section.description}</p>
              </div>
              {index < sections.length - 1 && (
                <div className={`w-16 h-0.5 mx-4 ${
                  index < currentSection ? 'bg-primary' : 'bg-gray-300'
                }`} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Form Content */}
      <Card>
        <CardContent className="p-6">
          {renderCurrentSection()}
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between mt-6">
        <Button
          type="button"
          variant="outline"
          onClick={currentSection === 0 ? onCancel : prevSection}
          disabled={isLoading}
          className="flex items-center"
        >
          <ChevronLeft className="w-4 h-4 mr-2" />
          {currentSection === 0 ? 'Cancel' : 'Previous'}
        </Button>

        <div className="flex space-x-2">
          {currentSection < sections.length - 1 ? (
            <Button
              type="button"
              onClick={nextSection}
              disabled={isLoading}
              className="flex items-center"
            >
              Next
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <Button
              type="button"
              onClick={handleSubmit}
              disabled={isLoading}
              className="bg-primary hover:bg-primary/90 text-white"
            >
              {isLoading ? 'Creating...' : 'Create Application'}
            </Button>
          )}
        </div>
      </div>
    </div>
  )
} 