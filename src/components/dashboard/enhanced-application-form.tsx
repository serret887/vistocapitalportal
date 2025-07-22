'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { createLoanApplication } from '@/lib/loan-applications'
import type { LoanApplicationFormData, BankAccount, LoanObjective, IncomeSource, IncomeSourceType } from '@/types'
import { LOAN_OBJECTIVES, REFI_LOAN_TYPES, PURCHASE_LOAN_TYPES, INCOME_SOURCE_TYPES } from '@/types'
import { toast } from 'sonner'
import { Plus, Trash2, Upload, Building, DollarSign, FileText, User, Home, Receipt } from 'lucide-react'
import { v4 as uuidv4 } from 'uuid'

interface EnhancedApplicationFormProps {
  onSuccess?: () => void
  onCancel?: () => void
}

interface ValidationErrors {
  [key: string]: string
}

export function EnhancedApplicationForm({ onSuccess, onCancel }: EnhancedApplicationFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [currentSection, setCurrentSection] = useState(0)
  const [errors, setErrors] = useState<ValidationErrors>({})
  
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
    
    // Loan Information
    loan_objective: '' as LoanObjective | '',
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

  // Check if income section is needed
  const isHomeOwnerLoan = formData.loan_type === 'homeowner'

  const sections = [
    {
      id: 0,
      title: 'Personal Information',
      description: 'Basic client details and contact information',
      icon: User
    },
    {
      id: 1,
      title: 'Property Information',
      description: 'Subject property and current residence details',
      icon: Home
    },
    {
      id: 2,
      title: 'Loan Details',
      description: 'Loan objective and type selection',
      icon: Building
    },
    {
      id: 3,
      title: 'Personal Details',
      description: 'SSN and date of birth for verification',
      icon: FileText
    },
    // Conditionally add income section for home owner loans
    ...(isHomeOwnerLoan ? [{
      id: 4,
      title: 'Income Documentation',
      description: 'Income sources and supporting documents',
      icon: Receipt
    }] : []),
    {
      id: isHomeOwnerLoan ? 5 : 4,
      title: 'Assets & Banking',
      description: 'Financial assets and bank account information',
      icon: DollarSign
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
    return age >= 18 && age <= 120 // Must be between 18 and 120 years old
  }

  const validateAddress = (address: string): boolean => {
    return address.trim().length >= 10 // Basic address validation
  }

  const validateName = (name: string): boolean => {
    return name.trim().length >= 2 && /^[a-zA-Z\s'-]+$/.test(name)
  }

  const validateBankBalance = (balance: number): boolean => {
    return balance >= 0 && balance <= 999999999 // Reasonable range
  }

  const validateIncomeAmount = (amount: number): boolean => {
    return amount > 0 && amount <= 9999999 // Reasonable income range
  }

  const validateSection = (sectionId: number): ValidationErrors => {
    const newErrors: ValidationErrors = {}

    switch (sectionId) {
      case 0: // Personal Information
        if (!validateName(formData.first_name)) {
          newErrors.first_name = 'First name must be at least 2 characters and contain only letters'
        }
        if (!validateName(formData.last_name)) {
          newErrors.last_name = 'Last name must be at least 2 characters and contain only letters'
        }
        if (!validateEmail(formData.email)) {
          newErrors.email = 'Please enter a valid email address'
        }
        if (!validatePhone(formData.phone_number)) {
          newErrors.phone_number = 'Please enter a valid phone number (e.g., 555-123-4567)'
        }
        break

      case 1: // Property Information
        if (!validateAddress(formData.current_residence)) {
          newErrors.current_residence = 'Please enter a complete current residence address'
        }
        if (!formData.property_is_tbd && !validateAddress(formData.property_address)) {
          newErrors.property_address = 'Please enter a complete property address or select TBD'
        }
        break

      case 2: // Loan Details
        if (!formData.loan_objective) {
          newErrors.loan_objective = 'Please select a loan objective'
        }
        if (!formData.loan_type) {
          newErrors.loan_type = 'Please select a loan type'
        }
        break

      case 3: // Personal Details
        if (!validateSSN(formData.ssn)) {
          newErrors.ssn = 'Please enter a valid SSN (e.g., 123-45-6789)'
        }
        if (!validateDateOfBirth(formData.date_of_birth)) {
          newErrors.date_of_birth = 'Please enter a valid date of birth (must be 18+ years old)'
        }
        break

      case 4: // Income Documentation (for home owner loans)
        if (isHomeOwnerLoan) {
          if (formData.income_sources.length === 0) {
            newErrors.income_sources = 'Please add at least one income source'
          }
          formData.income_sources.forEach((source, index) => {
            if (!source.description.trim()) {
              newErrors[`income_desc_${index}`] = 'Income description is required'
            }
            if (!validateIncomeAmount(source.amount)) {
              newErrors[`income_amount_${index}`] = 'Please enter a valid income amount'
            }
          })
          // Check if each income source has at least one document
          formData.income_sources.forEach((source, index) => {
            if (source.documents.length === 0) {
              newErrors[`income_docs_${index}`] = 'Please upload at least one supporting document for this income source'
          }
          })
        }
        break

      case (isHomeOwnerLoan ? 5 : 4): // Assets & Banking
        if (formData.bank_accounts.length === 0) {
          newErrors.bank_accounts = 'Please add at least one bank account'
        }
        formData.bank_accounts.forEach((account, index) => {
          if (!account.bank_name.trim()) {
            newErrors[`bank_name_${index}`] = 'Bank name is required'
          }
          if (!validateBankBalance(account.balance)) {
            newErrors[`bank_balance_${index}`] = 'Please enter a valid balance'
          }
        })
        break
    }

    return newErrors
  }

  const handleInputChange = (field: keyof LoanApplicationFormData) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    let value: any = e.target.value

    // Format specific fields
    if (field === 'phone_number') {
      // Auto-format phone number
      value = value.replace(/\D/g, '').replace(/(\d{3})(\d{3})(\d{4})/, '($1) $2-$3')
    } else if (field === 'ssn') {
      // Auto-format SSN
      value = value.replace(/\D/g, '').replace(/(\d{3})(\d{2})(\d{4})/, '$1-$2-$3')
    }

    setFormData(prev => ({
      ...prev,
      [field]: value
    }))

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const handleSelectChange = (field: keyof LoanApplicationFormData) => (value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))

    // Clear related errors
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }

    // Reset loan type when objective changes
    if (field === 'loan_objective') {
      setFormData(prev => ({ ...prev, loan_type: '' }))
      if (errors.loan_type) {
        setErrors(prev => ({ ...prev, loan_type: '' }))
      }
    }
  }

  const handleSwitchChange = (field: keyof LoanApplicationFormData) => (checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: checked
    }))

    // Clear property address error if TBD is selected
    if (field === 'property_is_tbd' && checked && errors.property_address) {
      setErrors(prev => ({ ...prev, property_address: '' }))
    }
  }

  // Income source management
  const addIncomeSource = () => {
    const newSource: IncomeSource = {
      id: uuidv4(),
      type: 'w2',
      amount: 0,
      description: '',
      documents: []
    }
    setFormData(prev => ({
      ...prev,
      income_sources: [...prev.income_sources, newSource]
    }))

    // Clear income sources error
    if (errors.income_sources) {
      setErrors(prev => ({ ...prev, income_sources: '' }))
    }
  }

  const updateIncomeSource = (id: string, field: keyof IncomeSource, value: any) => {
    setFormData(prev => ({
      ...prev,
      income_sources: prev.income_sources.map(source =>
        source.id === id ? { ...source, [field]: value } : source
      )
    }))

    // Clear related errors
    const sourceIndex = formData.income_sources.findIndex(src => src.id === id)
    if (field === 'description' && errors[`income_desc_${sourceIndex}`]) {
      setErrors(prev => ({ ...prev, [`income_desc_${sourceIndex}`]: '' }))
    }
    if (field === 'amount' && errors[`income_amount_${sourceIndex}`]) {
      setErrors(prev => ({ ...prev, [`income_amount_${sourceIndex}`]: '' }))
    }

    // Update total income
    if (field === 'amount') {
      const totalIncome = formData.income_sources.reduce((sum, source) => 
        source.id === id ? sum + (value || 0) : sum + source.amount, 0
      )
      setFormData(prev => ({ ...prev, total_income: totalIncome }))
    }
  }

  const removeIncomeSource = (id: string) => {
    setFormData(prev => ({
      ...prev,
      income_sources: prev.income_sources.filter(source => source.id !== id)
    }))

    // Recalculate total income
    const totalIncome = formData.income_sources
      .filter(source => source.id !== id)
      .reduce((sum, source) => sum + source.amount, 0)
    setFormData(prev => ({ ...prev, total_income: totalIncome }))
  }



  // Handle document upload for specific income source
  const handleIncomeSourceFileUpload = (incomeSourceId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files)
      
      // Validate file types and sizes
      const validFiles = files.filter(file => {
        if (file.type !== 'application/pdf') {
          toast.error(`${file.name} is not a PDF file`)
          return false
        }
        if (file.size > 10 * 1024 * 1024) { // 10MB limit
          toast.error(`${file.name} is larger than 10MB`)
          return false
        }
        return true
      })

      setFormData(prev => ({
        ...prev,
        income_sources: prev.income_sources.map(source =>
          source.id === incomeSourceId 
            ? { ...source, documents: [...source.documents, ...validFiles] }
            : source
        )
      }))
    }
  }

  // Remove document from specific income source
  const removeIncomeSourceFile = (incomeSourceId: string, fileIndex: number) => {
    setFormData(prev => ({
      ...prev,
      income_sources: prev.income_sources.map(source =>
        source.id === incomeSourceId 
          ? { ...source, documents: source.documents.filter((_, i) => i !== fileIndex) }
          : source
      )
    }))
  }

  // Existing bank account functions (keeping them the same)
  const addBankAccount = () => {
    const newAccount: BankAccount = {
      id: uuidv4(),
      bank_name: '',
      account_type: 'checking',
      balance: 0,
      statement_months: 2
    }
    setFormData(prev => ({
      ...prev,
      bank_accounts: [...prev.bank_accounts, newAccount]
    }))

    // Clear bank accounts error
    if (errors.bank_accounts) {
      setErrors(prev => ({ ...prev, bank_accounts: '' }))
    }
  }

  const updateBankAccount = (id: string, field: keyof BankAccount, value: any) => {
    setFormData(prev => ({
      ...prev,
      bank_accounts: prev.bank_accounts.map(account =>
        account.id === id ? { ...account, [field]: value } : account
      )
    }))

    // Clear related errors
    const accountIndex = formData.bank_accounts.findIndex(acc => acc.id === id)
    if (field === 'bank_name' && errors[`bank_name_${accountIndex}`]) {
      setErrors(prev => ({ ...prev, [`bank_name_${accountIndex}`]: '' }))
    }
    if (field === 'balance' && errors[`bank_balance_${accountIndex}`]) {
      setErrors(prev => ({ ...prev, [`bank_balance_${accountIndex}`]: '' }))
    }
  }

  const removeBankAccount = (id: string) => {
    setFormData(prev => ({
      ...prev,
      bank_accounts: prev.bank_accounts.filter(account => account.id !== id)
    }))
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files)
      
      // Validate file types and sizes
      const validFiles = files.filter(file => {
        if (file.type !== 'application/pdf') {
          toast.error(`${file.name} is not a PDF file`)
          return false
        }
        if (file.size > 10 * 1024 * 1024) { // 10MB limit
          toast.error(`${file.name} is larger than 10MB`)
          return false
        }
        return true
      })

      setFormData(prev => ({
        ...prev,
        bank_statements: [...prev.bank_statements, ...validFiles]
      }))
    }
  }

  const removeFile = (index: number) => {
    setFormData(prev => ({
      ...prev,
      bank_statements: prev.bank_statements.filter((_, i) => i !== index)
    }))
  }

  const nextSection = () => {
    const sectionErrors = validateSection(currentSection)
    setErrors(sectionErrors)

    if (Object.keys(sectionErrors).length === 0 && currentSection < sections.length - 1) {
      setCurrentSection(currentSection + 1)
    } else if (Object.keys(sectionErrors).length > 0) {
      toast.error('Please fix the errors before continuing')
    }
  }

  const prevSection = () => {
    if (currentSection > 0) {
      setCurrentSection(currentSection - 1)
    }
  }

  const handleSubmit = async () => {
    // Validate all sections
    const allErrors: ValidationErrors = {}
    for (let i = 0; i < sections.length; i++) {
      const sectionErrors = validateSection(i)
      Object.assign(allErrors, sectionErrors)
    }

    if (Object.keys(allErrors).length > 0) {
      setErrors(allErrors)
      toast.error('Please fix all errors before submitting')
      return
    }

    setIsLoading(true)
    
    try {
      const { application, error } = await createLoanApplication(formData)
      
      if (error) {
        toast.error(error)
        return
      }

      if (application) {
        toast.success('Application created successfully!')
        onSuccess?.()
      }
    } catch (error) {
      console.error('Error creating application:', error)
      toast.error('An unexpected error occurred')
    } finally {
      setIsLoading(false)
    }
  }

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
            value={formData.first_name}
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
            value={formData.last_name}
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
        
        <div className="space-y-3">
          <Label htmlFor="email" className="text-lg font-medium visto-dark-blue">
            Email Address *
          </Label>
          <Input
            id="email"
            type="email"
            required
            value={formData.email}
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
            value={formData.phone_number}
            onChange={handleInputChange('phone_number')}
            className={`text-lg py-4 px-5 border-2 focus:ring-2 focus:ring-primary focus:border-primary transition-all duration-200 ${
              errors.phone_number ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''
            }`}
            placeholder="(555) 123-4567"
            maxLength={14}
          />
          {errors.phone_number && (
            <p className="text-sm text-red-600">{errors.phone_number}</p>
          )}
        </div>
      </div>
    </div>
  )

  const renderPropertyInfo = () => (
    <div className="space-y-8">
      {/* Subject Property */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-lg font-semibold visto-dark-blue">Subject Property</h4>
            <p className="text-base visto-slate">Property for loan application</p>
          </div>
        </div>
        
        {/* TBD Toggle - Make it more visible */}
        <Card className="border-2 border-primary/30 p-6">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="property_tbd" className="text-xl font-bold visto-dark-blue cursor-pointer block mb-1">
                TBD (Pre-approval)
              </Label>
              <p className="text-base visto-slate">Property to be determined - for pre-qualification</p>
            </div>
            <Switch
              id="property_tbd"
              checked={formData.property_is_tbd}
              onCheckedChange={handleSwitchChange('property_is_tbd')}
              className="scale-150 data-[state=checked]:bg-primary data-[state=unchecked]:bg-gray-400"
            />
          </div>
        </Card>
        
        {!formData.property_is_tbd && (
          <div className="space-y-3">
            <Label htmlFor="property_address" className="text-lg font-medium visto-dark-blue">
              Property Address *
            </Label>
            <Input
              id="property_address"
              type="text"
              required={!formData.property_is_tbd}
              value={formData.property_address}
              onChange={handleInputChange('property_address')}
              className={`text-lg py-4 px-5 border-2 focus:ring-2 focus:ring-primary focus:border-primary transition-all duration-200 ${
                errors.property_address ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''
              }`}
              placeholder="123 Main St, City, State 12345"
            />
            {errors.property_address && (
              <p className="text-sm text-red-600">{errors.property_address}</p>
            )}
          </div>
        )}
        
        {formData.property_is_tbd && (
          <Card className="border-2 border-primary/20 bg-gradient-visto-subtle p-4">
            <div className="text-center">
              <p className="text-lg font-medium visto-gold">Pre-approval Application</p>
              <p className="text-base visto-slate mt-2">
                Property to be determined - we'll help you find the perfect investment opportunity
              </p>
            </div>
          </Card>
        )}
      </div>

      {/* Current Residence */}
      <div className="space-y-3">
        <Label htmlFor="current_residence" className="text-lg font-medium visto-dark-blue">
          Current Residence Address *
        </Label>
        <Input
          id="current_residence"
          type="text"
          required
          value={formData.current_residence}
          onChange={handleInputChange('current_residence')}
          className={`text-lg py-4 px-5 border-2 focus:ring-2 focus:ring-primary focus:border-primary transition-all duration-200 ${
            errors.current_residence ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''
          }`}
          placeholder="456 Oak Ave, City, State 12345"
        />
        {errors.current_residence && (
          <p className="text-sm text-red-600">{errors.current_residence}</p>
        )}
      </div>
    </div>
  )

  const renderLoanDetails = () => {
    const availableLoanTypes = formData.loan_objective === 'refi' ? REFI_LOAN_TYPES : PURCHASE_LOAN_TYPES

    return (
      <div className="space-y-8">
        {/* Loan Objective */}
        <div className="space-y-3">
          <Label htmlFor="loan_objective" className="text-lg font-medium visto-dark-blue">
            Loan Objective *
          </Label>
          <Select value={formData.loan_objective} onValueChange={handleSelectChange('loan_objective')}>
            <SelectTrigger className={`text-lg py-4 px-5 border-2 focus:ring-2 focus:ring-primary focus:border-primary transition-all duration-200 ${
              errors.loan_objective ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''
            }`}>
              <SelectValue placeholder="Select loan objective" />
            </SelectTrigger>
            <SelectContent>
              {LOAN_OBJECTIVES.map((objective) => (
                <SelectItem key={objective.value} value={objective.value} className="text-base">
                  {objective.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.loan_objective && (
            <p className="text-sm text-red-600">{errors.loan_objective}</p>
          )}
        </div>

        {/* Loan Type - Only show if objective is selected */}
        {formData.loan_objective && (
          <div className="space-y-3">
            <Label htmlFor="loan_type" className="text-lg font-medium visto-dark-blue">
              Loan Type *
            </Label>
            <Select value={formData.loan_type} onValueChange={handleSelectChange('loan_type')}>
              <SelectTrigger className={`text-lg py-4 px-5 border-2 focus:ring-2 focus:ring-primary focus:border-primary transition-all duration-200 ${
                errors.loan_type ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''
              }`}>
                <SelectValue placeholder="Select loan type" />
              </SelectTrigger>
              <SelectContent>
                {availableLoanTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value} className="text-base">
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.loan_type && (
              <p className="text-sm text-red-600">{errors.loan_type}</p>
            )}
          </div>
        )}

        {/* Information card about loan types */}
        {formData.loan_objective && (
          <Card className="border-2 border-primary/20 bg-gradient-visto-subtle p-6">
            <h4 className="text-lg font-semibold visto-dark-blue mb-3">
              Available for {formData.loan_objective === 'refi' ? 'Refinance' : 'Purchase'}
            </h4>
            <div className="space-y-2">
              {availableLoanTypes.map((type) => (
                <div key={type.value} className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-primary rounded-full mt-2"></div>
                  <div>
                    <p className="font-medium visto-dark-blue">{type.label}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Home Owner Loan Notice */}
        {formData.loan_type === 'homeowner' && (
          <Card className="border-2 border-blue-200 bg-blue-50 p-6">
            <div className="flex items-start space-x-3">
              <Receipt className="w-6 h-6 text-blue-600 mt-1" />
              <div>
                <h4 className="text-lg font-semibold text-blue-800 mb-2">Income Documentation Required</h4>
                <p className="text-blue-700">
                  Home Owner loans require comprehensive income documentation. You'll need to provide income sources and supporting documents in the next section.
                </p>
              </div>
            </div>
          </Card>
        )}
      </div>
    )
  }

  const renderPersonalDetails = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-3">
          <Label htmlFor="ssn" className="text-lg font-medium visto-dark-blue">
            Social Security Number *
          </Label>
          <Input
            id="ssn"
            type="text"
            required
            value={formData.ssn}
            onChange={handleInputChange('ssn')}
            className={`text-lg py-4 px-5 border-2 focus:ring-2 focus:ring-primary focus:border-primary transition-all duration-200 ${
              errors.ssn ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''
            }`}
            placeholder="123-45-6789"
            maxLength={11}
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
            value={formData.date_of_birth}
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
    </div>
  )

  const renderIncomeDocumentation = () => (
    <div className="space-y-8">
      {/* Income Sources */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-lg font-semibold visto-dark-blue">Income Sources</h4>
            <p className="text-base visto-slate">Add all sources of income with amounts</p>
          </div>
          <Button
            type="button"
            onClick={addIncomeSource}
            className="px-6 py-3 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold transition-all duration-200"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Income Source
          </Button>
        </div>

        {errors.income_sources && (
          <p className="text-sm text-red-600">{errors.income_sources}</p>
        )}

        {formData.income_sources.map((source, index) => (
          <Card key={source.id} className="border-2 border-border p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
              <div className="space-y-2">
                <Label className="text-base font-medium visto-dark-blue">Income Type *</Label>
                <Select
                  value={source.type}
                  onValueChange={(value) => updateIncomeSource(source.id, 'type', value as IncomeSourceType)}
                >
                  <SelectTrigger className="border-2 focus:ring-2 focus:ring-primary focus:border-primary">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {INCOME_SOURCE_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value} className="text-base">
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-base font-medium visto-dark-blue">Description *</Label>
                <Input
                  value={source.description}
                  onChange={(e) => updateIncomeSource(source.id, 'description', e.target.value)}
                  placeholder="Primary Employment"
                  className={`border-2 focus:ring-2 focus:ring-primary focus:border-primary ${
                    errors[`income_desc_${index}`] ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''
                  }`}
                />
                {errors[`income_desc_${index}`] && (
                  <p className="text-sm text-red-600">{errors[`income_desc_${index}`]}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label className="text-base font-medium visto-dark-blue">Annual Amount *</Label>
                <Input
                  type="text"
                  value={source.amount === 0 ? '' : source.amount.toString()}
                  onChange={(e) => {
                    const value = e.target.value.replace(/[^0-9]/g, '')
                    const numValue = value === '' ? 0 : parseInt(value)
                    if (!isNaN(numValue)) {
                      updateIncomeSource(source.id, 'amount', numValue)
                    }
                  }}
                  placeholder="50000"
                  className={`border-2 focus:ring-2 focus:ring-primary focus:border-primary ${
                    errors[`income_amount_${index}`] ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''
                  }`}
                />
                {errors[`income_amount_${index}`] && (
                  <p className="text-sm text-red-600">{errors[`income_amount_${index}`]}</p>
                )}
              </div>

              <div className="space-y-2 flex items-end">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => removeIncomeSource(source.id)}
                  className="border-red-300 text-red-600 hover:bg-red-50 w-full"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Remove
                </Button>
              </div>
      </div>

            {/* Document Upload Section for this Income Source */}
            <div className="border-t border-border pt-4">
              <div className="flex items-center justify-between mb-3">
                <Label className="text-base font-medium visto-dark-blue">Supporting Documents</Label>
                <div className="flex items-center gap-2">
            <input
              type="file"
              multiple
              accept=".pdf"
                    onChange={(e) => handleIncomeSourceFileUpload(source.id, e)}
              className="hidden"
                    id={`income-docs-${source.id}`}
            />
            <label
                    htmlFor={`income-docs-${source.id}`}
                    className="cursor-pointer"
                  >
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="border-primary text-primary hover:bg-primary/10"
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      Upload Documents
                    </Button>
            </label>
          </div>
        </div>

              {/* Display uploaded documents */}
              {source.documents.length > 0 && (
          <div className="space-y-2">
                  {source.documents.map((file, fileIndex) => (
                    <div key={fileIndex} className="flex items-center justify-between p-2 bg-gray-50 rounded border">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-gray-600" />
                        <span className="text-sm text-gray-700">{file.name}</span>
                        <span className="text-xs text-gray-500">
                          ({(file.size / 1024 / 1024).toFixed(2)} MB)
                  </span>
                </div>
                <Button
                  type="button"
                        variant="ghost"
                  size="sm"
                        onClick={() => removeIncomeSourceFile(source.id, fileIndex)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                        <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            ))}
          </div>
        )}

              {source.documents.length === 0 && (
                <p className="text-sm text-gray-500 italic">
                  No documents uploaded yet. Upload supporting documents for this income source.
                </p>
        )}
      </div>
          </Card>
        ))}
      </div>

      {/* Total Income Display */}
      {formData.income_sources.length > 0 && (
        <Card className="border-2 border-primary/20 bg-gradient-visto-subtle p-6">
          <div className="text-center">
            <h4 className="text-xl font-semibold visto-dark-blue mb-2">Total Annual Income</h4>
            <div className="text-3xl font-bold visto-gold">
              ${formData.total_income.toLocaleString()}
            </div>
          </div>
        </Card>
      )}


    </div>
  )

  const renderAssetsAndBanking = () => (
    <div className="space-y-8">
      {/* Bank Accounts */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-lg font-semibold visto-dark-blue">Bank Accounts</h4>
            <p className="text-base visto-slate">Add all bank accounts with current balances</p>
          </div>
          <Button
            type="button"
            onClick={addBankAccount}
            className="px-6 py-3 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold transition-all duration-200"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Account
          </Button>
        </div>

        {errors.bank_accounts && (
          <p className="text-sm text-red-600">{errors.bank_accounts}</p>
        )}

        {formData.bank_accounts.map((account, index) => (
          <Card key={account.id} className="border-2 border-border p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label className="text-base font-medium visto-dark-blue">Bank Name *</Label>
                <Input
                  value={account.bank_name}
                  onChange={(e) => updateBankAccount(account.id, 'bank_name', e.target.value)}
                  placeholder="Bank of America"
                  className={`border-2 focus:ring-2 focus:ring-primary focus:border-primary ${
                    errors[`bank_name_${index}`] ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''
                  }`}
                />
                {errors[`bank_name_${index}`] && (
                  <p className="text-sm text-red-600">{errors[`bank_name_${index}`]}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label className="text-base font-medium visto-dark-blue">Account Type</Label>
                <Select
                  value={account.account_type}
                  onValueChange={(value) => updateBankAccount(account.id, 'account_type', value)}
                >
                  <SelectTrigger className="border-2 focus:ring-2 focus:ring-primary focus:border-primary">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="checking">Checking</SelectItem>
                    <SelectItem value="savings">Savings</SelectItem>
                    <SelectItem value="money_market">Money Market</SelectItem>
                    <SelectItem value="cd">Certificate of Deposit</SelectItem>
                    <SelectItem value="investment">Investment</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label className="text-base font-medium visto-dark-blue">Balance *</Label>
                <div className="flex items-center space-x-2">
                  <Input
                    type="text"
                    value={account.balance === 0 ? '' : account.balance.toString()}
                    onChange={(e) => {
                      const value = e.target.value.replace(/[^0-9.]/g, '')
                      const numValue = value === '' ? 0 : parseFloat(value)
                      if (!isNaN(numValue)) {
                        updateBankAccount(account.id, 'balance', numValue)
                      }
                    }}
                    placeholder="5000"
                    className={`border-2 focus:ring-2 focus:ring-primary focus:border-primary ${
                      errors[`bank_balance_${index}`] ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''
                    }`}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => removeBankAccount(account.id)}
                    className="border-red-300 text-red-600 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
                {errors[`bank_balance_${index}`] && (
                  <p className="text-sm text-red-600">{errors[`bank_balance_${index}`]}</p>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Bank Statements Upload */}
      <div className="space-y-4">
        <div>
          <h4 className="text-lg font-semibold visto-dark-blue">Bank Statements</h4>
          <p className="text-base visto-slate">Upload 2 months of bank statements for each account (PDF only)</p>
        </div>
        
        <div className="border-2 border-dashed border-primary/30 rounded-lg p-8 text-center">
          <Upload className="w-12 h-12 visto-gold mx-auto mb-4" />
          <div className="space-y-2">
            <p className="text-lg font-medium visto-dark-blue">Upload Bank Statements</p>
            <p className="text-base visto-slate">PDF files only, max 10MB each</p>
            <input
              type="file"
              multiple
              accept=".pdf"
              onChange={handleFileUpload}
              className="hidden"
              id="bank-statements"
            />
            <label
              htmlFor="bank-statements"
              className="inline-block px-6 py-3 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-lg cursor-pointer transition-all duration-200"
            >
              Choose Files
            </label>
          </div>
        </div>

        {formData.bank_statements.length > 0 && (
          <div className="space-y-2">
            <h5 className="font-medium visto-dark-blue">Uploaded Files:</h5>
            {formData.bank_statements.map((file, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <span className="text-sm visto-slate">{file.name}</span>
                  <span className="text-xs text-gray-400 ml-2">
                    ({(file.size / 1024 / 1024).toFixed(1)} MB)
                  </span>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => removeFile(index)}
                  className="border-red-300 text-red-600 hover:bg-red-50"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Total Assets Display */}
      {formData.bank_accounts.length > 0 && (
        <Card className="border-2 border-primary/20 bg-gradient-visto-subtle p-6">
          <div className="text-center">
            <h4 className="text-xl font-semibold visto-dark-blue mb-2">Total Liquid Assets</h4>
            <div className="text-3xl font-bold visto-gold">
              ${formData.bank_accounts.reduce((sum, account) => sum + account.balance, 0).toLocaleString()}
            </div>
          </div>
        </Card>
      )}
    </div>
  )

  const renderCurrentSection = () => {
    switch (currentSection) {
      case 0: return renderPersonalInfo()
      case 1: return renderPropertyInfo()
      case 2: return renderLoanDetails()
      case 3: return renderPersonalDetails()
      case 4: return isHomeOwnerLoan ? renderIncomeDocumentation() : renderAssetsAndBanking()
      case 5: return renderAssetsAndBanking()
      default: return null
    }
  }

  const currentSectionData = sections[currentSection]

  return (
    <Card className="w-full max-w-6xl mx-auto border-2 border-border shadow-2xl bg-card">
      <CardHeader className="pb-8">
        <CardTitle className="text-3xl font-bold visto-dark-blue tracking-tight text-center">
          Enhanced Loan Application
        </CardTitle>
        <CardDescription className="text-lg visto-slate text-center mt-3">
          Comprehensive client information for loan pre-qualification
        </CardDescription>
        
        {/* Section Progress */}
        <div className="flex items-center justify-center mt-8">
          <div className="flex items-center space-x-4">
            {sections.map((section, index) => (
              <div key={section.id} className="flex items-center">
                <div className={`flex flex-col items-center ${
                  index === currentSection ? 'opacity-100' : 'opacity-60'
                }`}>
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold transition-all duration-300 ${
                    index < currentSection
                      ? 'bg-primary text-primary-foreground'
                      : index === currentSection
                      ? 'bg-primary text-primary-foreground ring-4 ring-primary/20'
                      : 'bg-muted text-muted-foreground'
                  }`}>
                    <section.icon className="w-6 h-6" />
                  </div>
                  <span className="mt-2 text-sm font-medium visto-dark-blue text-center max-w-20">
                    {section.title}
                  </span>
                </div>
                {index < sections.length - 1 && (
                  <div className={`w-16 h-1 mx-4 rounded-full transition-all duration-300 ${
                    index < currentSection ? 'bg-primary' : 'bg-border'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="px-8 pb-8">
        {/* Current Section Header */}
        <div className="mb-8 text-center">
          <h3 className="text-2xl font-semibold visto-dark-blue tracking-tight mb-2">
            {currentSectionData.title}
          </h3>
          <p className="text-lg visto-slate">
            {currentSectionData.description}
          </p>
        </div>

        {/* Section Content */}
        <div className="mb-8">
          {renderCurrentSection()}
        </div>

        {/* Navigation */}
        <div className="flex justify-between pt-8 border-t border-border">
          <div className="flex space-x-4">
            {onCancel && (
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={isLoading}
                className="px-8 py-4 text-lg border-2 border-primary text-primary hover:bg-primary/5 transition-all duration-200 font-semibold"
              >
                Cancel
              </Button>
            )}
            
            {currentSection > 0 && (
              <Button
                type="button"
                variant="outline"
                onClick={prevSection}
                disabled={isLoading}
                className="px-8 py-4 text-lg border-2 border-primary text-primary hover:bg-primary/5 transition-all duration-200 font-semibold"
              >
                Previous
              </Button>
            )}
          </div>
          
          <div>
            {currentSection < sections.length - 1 ? (
              <Button
                type="button"
                onClick={nextSection}
                disabled={isLoading}
                className="px-12 py-4 text-lg bg-primary hover:bg-primary/90 text-primary-foreground font-semibold tracking-wide transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                Next Step
              </Button>
            ) : (
              <Button
                type="button"
                onClick={handleSubmit}
                disabled={isLoading}
                className="px-16 py-4 text-xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold tracking-wide transition-all duration-200 shadow-xl hover:shadow-2xl"
              >
                {isLoading ? 'Creating Application...' : 'Submit Application'}
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
} 