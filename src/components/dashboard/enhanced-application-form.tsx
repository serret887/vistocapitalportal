'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { FormInput } from '@/components/ui/form-input'
import { PhoneInput } from '@/components/ui/phone-input'
import { EINInput } from '@/components/ui/ein-input'
import { EmailInput } from '@/components/ui/email-input'
import { SSNInput } from '@/components/ui/ssn-input'
import { createLoanApplication } from '@/lib/loan-applications'
import { searchClients, getClient } from '@/lib/clients'
import type { 
  EnhancedApplicationFormData, 
  ClientFormData, 
  CompanyFormData,
  BankAccount, 
  LoanObjective, 
  IncomeSource, 
  IncomeSourceType,
  ClientSearchResult
} from '@/types'
import { INCOME_SOURCE_TYPES } from '@/types'
import { toast } from 'sonner'
import { Plus, Trash2, Search, Building, Users, DollarSign } from 'lucide-react'
import { v4 as uuidv4 } from 'uuid'

interface EnhancedApplicationFormProps {
  onSuccess?: () => void
  onCancel?: () => void
  initialData?: EnhancedApplicationFormData
  isEditing?: boolean
}

interface ValidationErrors {
  [key: string]: string
}

export function EnhancedApplicationForm({ onSuccess, onCancel, initialData, isEditing = false }: EnhancedApplicationFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [currentSection, setCurrentSection] = useState(0)
  const [errors, setErrors] = useState<ValidationErrors>({})
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<ClientSearchResult[]>([])
  const [isSearching, setIsSearching] = useState(false)
  
  // Initialize form data
  const getInitialFormData = (): EnhancedApplicationFormData => {
    if (isEditing && initialData) {
      return initialData
    }
    
        return {
      application_name: '',
      application_type: 'loan_application',
      notes: '',
      has_company: false,
      company: undefined,
      clients: [getEmptyClientFormData()] // Start with one empty client
    }
  }
  
  const getEmptyClientFormData = (): ClientFormData => ({
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
  })
  
  const [formData, setFormData] = useState<EnhancedApplicationFormData>(getInitialFormData())

  // Debug: Log form data changes
  useEffect(() => {
    console.log('Form data updated:', formData)
  }, [formData])




  const sections = [
    {
      id: 0,
      title: 'Company Information',
      description: 'Add company details if applicable',
      icon: Building
    },
    {
      id: 1,
      title: 'Client Information',
      description: 'Add primary client and additional clients',
      icon: Users
    },
    {
      id: 2,
      title: 'Assets Information',
      description: 'Add bank accounts and asset ownership',
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
    return age >= 18 && age <= 120
  }

  const validateAddress = (address: string): boolean => {
    return address.trim().length >= 10
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

    switch (sectionId) {
      case 0: // Company Information
        if (formData.has_company && formData.company) {
          if (!formData.company.company_name.trim()) {
            newErrors.company_name = 'Company name is required'
          }
          if (formData.company.ein && !/^\d{2}-\d{7}$/.test(formData.company.ein)) {
            newErrors.company_ein = 'Please enter a valid EIN (XX-XXXXXXX)'
          }
        }
        break

      case 1: // Client Information
        if (formData.clients.length === 0) {
          newErrors.clients = 'At least one client is required'
        }
        
        formData.clients.forEach((client, index) => {
          // Only validate essential fields for now
          if (!client.first_name.trim()) {
            newErrors[`client_${index}_first_name`] = 'First name is required'
          }
          if (!client.last_name.trim()) {
            newErrors[`client_${index}_last_name`] = 'Last name is required'
          }
          if (!client.email.trim()) {
            newErrors[`client_${index}_email`] = 'Email is required'
          }
          // Make other fields optional for testing
        })
        break

      case 2: // Assets Information
        // Validate that at least one client has assets
        let hasAssets = false
        formData.clients.forEach((client, index) => {
          if (client.total_assets > 0 || client.bank_accounts.length > 0) {
            hasAssets = true
          }
          
          // Validate bank accounts if they exist
          client.bank_accounts.forEach((account, accountIndex) => {
          if (!account.bank_name.trim()) {
              newErrors[`client_${index}_bank_${accountIndex}_name`] = 'Bank name is required'
          }
          if (!validateBankBalance(account.balance)) {
              newErrors[`client_${index}_bank_${accountIndex}_balance`] = 'Please enter a valid balance'
          }
        })
        })
        
        // Make assets optional for testing
        // if (!hasAssets) {
        //   newErrors.assets = 'At least one client must have assets or bank accounts'
        // }
        break

    }

    return newErrors
  }

  // Client search functionality
  const performClientSearch = async (query: string) => {
    if (query.length < 2) {
      setSearchResults([])
      return
    }

    setIsSearching(true)
    try {
      const { clients, error } = await searchClients(query, 10)
      
      if (error) {
        console.error('Error searching clients:', error)
        toast.error('Failed to search clients')
        setSearchResults([])
        return
      }

      setSearchResults(clients || [])
    } catch (error) {
      console.error('Error searching clients:', error)
      setSearchResults([])
    } finally {
      setIsSearching(false)
    }
  }

  const addClient = () => {
    const newClient = getEmptyClientFormData()
    setFormData(prev => ({
      ...prev,
      clients: [...prev.clients, newClient]
    }))
  }

  const removeClient = (index: number) => {
    setFormData(prev => ({
      ...prev,
      clients: prev.clients.filter((_, i) => i !== index)
    }))
  }

  const updateClient = (index: number, field: keyof ClientFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      clients: prev.clients.map((client, i) => 
        i === index ? { ...client, [field]: value } : client
      )
    }))
  }

  const addBankAccount = (clientIndex: number) => {
    const newAccount: BankAccount = {
      id: uuidv4(),
      bank_name: '',
      account_type: 'checking',
      balance: 0,
      statement_months: 2
    }
    
    setFormData(prev => ({
      ...prev,
      clients: prev.clients.map((client, i) => 
        i === clientIndex 
          ? { ...client, bank_accounts: [...client.bank_accounts, newAccount] }
          : client
      )
    }))
  }

  const updateBankAccount = (clientIndex: number, accountIndex: number, field: keyof BankAccount, value: any) => {
    setFormData(prev => ({
      ...prev,
      clients: prev.clients.map((client, i) => 
        i === clientIndex 
          ? {
              ...client,
              bank_accounts: client.bank_accounts.map((account, j) => 
                j === accountIndex ? { ...account, [field]: value } : account
              )
            }
          : client
      )
    }))
  }

  const removeBankAccount = (clientIndex: number, accountIndex: number) => {
    setFormData(prev => ({
      ...prev,
      clients: prev.clients.map((client, i) => 
        i === clientIndex 
          ? {
              ...client,
              bank_accounts: client.bank_accounts.filter((_, j) => j !== accountIndex)
            }
          : client
      )
    }))
  }

  const selectExistingClient = async (client: ClientSearchResult) => {
    try {
      // Load full client data from API
      const { client: fullClient, error } = await getClient(client.id)
      
      if (error) {
        console.error('Error loading client data:', error)
        toast.error('Failed to load client data')
        return
      }

      if (!fullClient) {
        toast.error('Client not found')
        return
      }

      const newClient: ClientFormData = {
        first_name: fullClient.first_name,
        last_name: fullClient.last_name,
        email: fullClient.email || '',
        phone_number: fullClient.phone_number || '',
        ssn: fullClient.ssn || '',
        date_of_birth: fullClient.date_of_birth || '',
        current_residence: fullClient.current_residence || '',
        total_income: fullClient.total_income || 0,
        income_sources: fullClient.income_sources || [],
        income_documents: fullClient.income_documents || [],
        total_assets: fullClient.total_assets || 0,
        bank_accounts: fullClient.bank_accounts || [],
        bank_statements: fullClient.bank_statements || [],
        has_company: false,
        company: undefined
      }
      
    setFormData(prev => ({
      ...prev,
        clients: [...prev.clients, newClient]
      }))
      
      setSearchQuery('')
      setSearchResults([])
      toast.success(`Added ${fullClient.first_name} ${fullClient.last_name} to application`)
    } catch (error) {
      console.error('Error selecting client:', error)
      toast.error('Failed to add client to application')
    }
  }

  const handleInputChange = (field: keyof EnhancedApplicationFormData) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    let value: any = e.target.value
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSelectChange = (field: keyof EnhancedApplicationFormData) => (value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSwitchChange = (field: keyof EnhancedApplicationFormData) => (checked: boolean) => {
    setFormData(prev => {
      if (field === 'has_company' && checked) {
        // Initialize company object when has_company is turned on
        return {
          ...prev,
          has_company: checked,
          company: {
            company_name: '',
            company_type: '',
            ein: '',
            business_address: '',
            business_phone: '',
            business_email: '',
            industry: '',
            years_in_business: 0,
            annual_revenue: 0,
            number_of_employees: 0,
            ownership_percentage: 0,
            role_in_company: ''
          }
        }
      } else if (field === 'has_company' && !checked) {
        // Clear company object when has_company is turned off
        return {
      ...prev,
          has_company: checked,
          company: undefined
        }
      } else {
        return { ...prev, [field]: checked }
      }
    })
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
    console.log('handleSubmit called')
    console.log('Current form data:', formData)
    
    const allErrors: ValidationErrors = {}
    for (let i = 0; i < sections.length; i++) {
      const sectionErrors = validateSection(i)
      Object.assign(allErrors, sectionErrors)
    }

    console.log('Validation errors:', allErrors)

    if (Object.keys(allErrors).length > 0) {
      setErrors(allErrors)
      toast.error('Please fix all errors before submitting')
      return
    }

    setIsLoading(true)
    
    try {
      // Prepare the application data
      const applicationData = {
        ...formData,
        application_name: formData.application_name || `${formData.clients[0]?.first_name} ${formData.clients[0]?.last_name} - Application`
      }

      console.log('Submitting application data:', applicationData)
      console.log('Form validation errors:', allErrors)
      console.log('Client count:', formData.clients.length)
      console.log('First client data:', formData.clients[0])

      const response = await fetch('/api/applications/enhanced', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(applicationData)
      })

      console.log('Response status:', response.status)
      const result = await response.json()
      console.log('Response result:', result)

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create application')
      }

        toast.success('Application created successfully!')
        onSuccess?.()
    } catch (error) {
      console.error('Error creating application:', error)
      toast.error(error instanceof Error ? error.message : 'An unexpected error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  const renderCompanyInfo = () => (
    <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-lg font-semibold visto-dark-blue">Company Information</h4>
            <p className="text-base visto-slate">Add company details if this application involves a business entity</p>
        </div>
          <div className="flex items-center space-x-3">
            <Label htmlFor="company-toggle" className="text-sm font-medium text-gray-700">
              {formData.has_company ? 'Company Details Enabled' : 'Enable Company Details'}
          </Label>
            <Switch
              id="company-toggle"
              checked={formData.has_company}
              onCheckedChange={handleSwitchChange('has_company')}
              className="scale-150 data-[state=checked]:bg-primary data-[state=unchecked]:bg-gray-300"
            />
        </div>
        </div>
        
      {formData.has_company && (
        <Card className="border-2 border-primary/20 p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormInput
            id="company_name"
            label="Company Name"
            type="text"
            value={formData.company?.company_name || ''}
            onChange={(value) => setFormData(prev => ({
              ...prev,
              company: { 
                ...prev.company, 
                company_name: value,
                company_type: prev.company?.company_type || '',
                ein: prev.company?.ein || '',
                business_address: prev.company?.business_address || '',
                business_phone: prev.company?.business_phone || '',
                business_email: prev.company?.business_email || '',
                industry: prev.company?.industry || '',
                years_in_business: prev.company?.years_in_business || 0,
                annual_revenue: prev.company?.annual_revenue || 0,
                number_of_employees: prev.company?.number_of_employees || 0,
                ownership_percentage: prev.company?.ownership_percentage || 0,
                role_in_company: prev.company?.role_in_company || ''
              }
            }))}
            error={errors.company_name}
            required
            placeholder="ABC Corporation"
          />
        
            <div className="space-y-3">
              <Label htmlFor="company_type" className="text-lg font-medium visto-dark-blue">
                Company Type
              </Label>
              <Select 
                value={formData.company?.company_type || ''} 
                                 onValueChange={(value) => setFormData(prev => ({
                   ...prev,
                   company: { 
                     ...prev.company, 
                     company_type: value,
                     company_name: prev.company?.company_name || '',
                     ein: prev.company?.ein || '',
                     business_address: prev.company?.business_address || '',
                     business_phone: prev.company?.business_phone || '',
                     business_email: prev.company?.business_email || '',
                     industry: prev.company?.industry || '',
                     years_in_business: prev.company?.years_in_business || 0,
                     annual_revenue: prev.company?.annual_revenue || 0,
                     number_of_employees: prev.company?.number_of_employees || 0,
                     ownership_percentage: prev.company?.ownership_percentage || 0,
                     role_in_company: prev.company?.role_in_company || ''
                   }
                 }))}
              >
                <SelectTrigger className="text-lg py-4 px-5 border-2 focus:ring-2 focus:ring-primary focus:border-primary">
                  <SelectValue placeholder="Select company type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="LLC">LLC</SelectItem>
                  <SelectItem value="C Corporation">C Corporation</SelectItem>
                  <SelectItem value="S Corporation">S Corporation</SelectItem>
                  <SelectItem value="Partnership">Partnership</SelectItem>
                  <SelectItem value="Limited Partnership">Limited Partnership</SelectItem>
                  <SelectItem value="Sole Proprietorship">Sole Proprietorship</SelectItem>
                  <SelectItem value="Non-Profit">Non-Profit</SelectItem>
                  <SelectItem value="Trust">Trust</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

                  <EINInput
            id="company_ein"
            label="EIN (Employer Identification Number)"
            value={formData.company?.ein || ''}
            onChange={(value) => setFormData(prev => ({
              ...prev,
              company: { 
                ...prev.company, 
                ein: value,
                company_name: prev.company?.company_name || '',
                company_type: prev.company?.company_type || '',
                business_address: prev.company?.business_address || '',
                business_phone: prev.company?.business_phone || '',
                business_email: prev.company?.business_email || '',
                industry: prev.company?.industry || '',
                years_in_business: prev.company?.years_in_business || 0,
                annual_revenue: prev.company?.annual_revenue || 0,
                number_of_employees: prev.company?.number_of_employees || 0,
                ownership_percentage: prev.company?.ownership_percentage || 0,
                role_in_company: prev.company?.role_in_company || ''
              }
            }))}
            error={errors.company_ein}
          />
        
                  <PhoneInput
            id="company_phone"
            label="Business Phone"
            value={formData.company?.business_phone || ''}
            onChange={(value) => setFormData(prev => ({
              ...prev,
              company: { 
                ...prev.company, 
                business_phone: value,
                company_name: prev.company?.company_name || '',
                company_type: prev.company?.company_type || '',
                ein: prev.company?.ein || '',
                business_address: prev.company?.business_address || '',
                business_email: prev.company?.business_email || '',
                industry: prev.company?.industry || '',
                years_in_business: prev.company?.years_in_business || 0,
                annual_revenue: prev.company?.annual_revenue || 0,
                number_of_employees: prev.company?.number_of_employees || 0,
                ownership_percentage: prev.company?.ownership_percentage || 0,
                role_in_company: prev.company?.role_in_company || ''
              }
            }))}
            error={errors.company_phone}
          />
            </div>
          </Card>
        )}
      </div>
  )

  const renderClientInfo = () => (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
          <h4 className="text-lg font-semibold visto-dark-blue">Client Information</h4>
          <p className="text-base visto-slate">Add primary client and additional clients</p>
      </div>
          <Button
            type="button"
          onClick={addClient}
          className="px-6 py-3 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
          >
            <Plus className="w-4 h-4 mr-2" />
          Add Client
          </Button>
    </div>
        
      {/* Client Search */}
      <Card className="border-2 border-primary/20 p-6">
            <div className="space-y-4">
          <Label className="text-lg font-medium visto-dark-blue">Search Existing Clients</Label>
          <div className="flex space-x-2">
                <Input
                  type="text"
              placeholder="Search by name, email, or phone..."
              value={searchQuery}
                  onChange={(e) => {
                setSearchQuery(e.target.value)
                performClientSearch(e.target.value)
              }}
              className="flex-1"
            />
                <Button
                  type="button"
                  variant="outline"
              onClick={() => performClientSearch(searchQuery)}
              disabled={isSearching}
                >
              <Search className="w-4 h-4" />
                </Button>
              </div>
            
          {searchResults.length > 0 && (
                <div className="space-y-2">
              {searchResults.map((client) => (
                <div
                  key={client.id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
                  onClick={() => selectExistingClient(client)}
                >
                  <div>
                    <p className="font-medium">{client.first_name} {client.last_name}</p>
                    <p className="text-sm text-gray-600">{client.email}</p>
                  </div>
                  <Button size="sm" variant="outline">
                    Select
                  </Button>
                  </div>
              ))}
                    </div>
                  )}
            </div>
          </Card>

      {/* Client List */}
      {formData.clients.map((client, index) => (
        <Card key={index} className="border-2 border-border p-6">
          <div className="flex items-center justify-between mb-4">
            <h5 className="text-lg font-semibold visto-dark-blue">
              {index === 0 ? 'Primary Client' : `Client ${index + 1}`}
            </h5>
            {index > 0 && (
          <Button
            type="button"
                variant="outline"
                size="sm"
                onClick={() => removeClient(index)}
                className="text-red-600 border-red-300 hover:bg-red-50"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Remove
          </Button>
          )}
        </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormInput
              id={`client_${index}_first_name`}
              label="First Name"
              value={client.first_name}
              onChange={(value) => updateClient(index, 'first_name', value)}
              error={errors[`client_${index}_first_name`]}
              required
              placeholder="John"
            />
            
            <FormInput
              id={`client_${index}_last_name`}
              label="Last Name"
              value={client.last_name}
              onChange={(value) => updateClient(index, 'last_name', value)}
              error={errors[`client_${index}_last_name`]}
              required
              placeholder="Doe"
            />
              
                    <EmailInput
              id={`client_${index}_email`}
              label="Email"
              value={client.email}
              onChange={(value) => updateClient(index, 'email', value)}
              error={errors[`client_${index}_email`]}
              required
            />

            <PhoneInput
              id={`client_${index}_phone`}
              label="Phone Number"
              value={client.phone_number}
              onChange={(value) => updateClient(index, 'phone_number', value)}
              error={errors[`client_${index}_phone`]}
            required
            />
            
                    <SSNInput
              id={`client_${index}_ssn`}
              label="SSN"
              value={client.ssn}
              onChange={(value) => updateClient(index, 'ssn', value)}
              error={errors[`client_${index}_ssn`]}
              required
            />
            
            <FormInput
              id={`client_${index}_dob`}
              label="Date of Birth"
            type="date"
              value={client.date_of_birth}
              onChange={(value) => updateClient(index, 'date_of_birth', value)}
              error={errors[`client_${index}_dob`]}
            required
            />

            <FormInput
              id={`client_${index}_residence`}
              label="Current Residence Address"
              value={client.current_residence}
              onChange={(value) => updateClient(index, 'current_residence', value)}
              error={errors[`client_${index}_residence`]}
              required
              placeholder="456 Oak Ave, City, State 12345"
              className="md:col-span-2"
            />
        </div>
        </Card>
      ))}
    </div>
  )

  const renderAssetsInfo = () => (
      <div className="space-y-6">
          <div>
        <h4 className="text-lg font-semibold visto-dark-blue">Assets Information</h4>
        <p className="text-base visto-slate">Add bank accounts and asset ownership for each client</p>
        </div>

      {formData.clients.map((client, clientIndex) => (
        <Card key={clientIndex} className="border-2 border-primary/20 p-6">
          <div className="flex items-center justify-between mb-4">
            <h5 className="text-lg font-semibold visto-dark-blue">
              {client.first_name} {client.last_name} - Assets
            </h5>
              </div>

          <div className="space-y-6">
            {/* Total Assets */}
            <div className="space-y-3">
              <Label className="text-base font-medium visto-dark-blue">Total Assets</Label>
                <Input
                type="number"
                value={client.total_assets}
                onChange={(e) => updateClient(clientIndex, 'total_assets', parseFloat(e.target.value) || 0)}
                className="border-2 focus:ring-2 focus:ring-primary focus:border-primary"
                placeholder="0"
              />
              </div>
              
            {/* Bank Accounts */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-base font-medium visto-dark-blue">Bank Accounts</Label>
                <Button
                  type="button"
                  onClick={() => addBankAccount(clientIndex)}
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Add Bank Account
                </Button>
            </div>
            
              {client.bank_accounts.map((account, accountIndex) => (
                <Card key={account.id} className="border border-gray-200 p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h6 className="font-medium visto-dark-blue">Bank Account {accountIndex + 1}</h6>
          <Button
            type="button"
                      onClick={() => removeBankAccount(clientIndex, accountIndex)}
                      variant="outline"
                      size="sm"
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
          </Button>
        </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <Label className="text-sm font-medium visto-dark-blue">Bank Name *</Label>
                <Input
                  value={account.bank_name}
                        onChange={(e) => updateBankAccount(clientIndex, accountIndex, 'bank_name', e.target.value)}
                        className="border-2 focus:ring-2 focus:ring-primary focus:border-primary"
                  placeholder="Bank of America"
                />
              </div>
              
                    <div className="space-y-3">
                      <Label className="text-sm font-medium visto-dark-blue">Account Type</Label>
                <Select
                  value={account.account_type}
                        onValueChange={(value) => updateBankAccount(clientIndex, accountIndex, 'account_type', value)}
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
              
                    <div className="space-y-3">
                      <Label className="text-sm font-medium visto-dark-blue">Balance *</Label>
                  <Input
                        type="number"
                        value={account.balance}
                        onChange={(e) => updateBankAccount(clientIndex, accountIndex, 'balance', parseFloat(e.target.value) || 0)}
                        className="border-2 focus:ring-2 focus:ring-primary focus:border-primary"
                        placeholder="0"
                      />
                </div>

                    <div className="space-y-3">
                      <Label className="text-sm font-medium visto-dark-blue">Statement Months</Label>
                      <Input
                        type="number"
                        value={account.statement_months}
                        onChange={(e) => updateBankAccount(clientIndex, accountIndex, 'statement_months', parseInt(e.target.value) || 2)}
                        className="border-2 focus:ring-2 focus:ring-primary focus:border-primary"
                        placeholder="2"
                        min="1"
                        max="12"
                      />
              </div>
            </div>
          </Card>
        ))}
            </div>
          </div>
        </Card>
      ))}
    </div>
  )

  const renderCurrentSection = () => {
    switch (currentSection) {
      case 0: return renderCompanyInfo()
      case 1: return renderClientInfo()
      case 2: return renderAssetsInfo()
      default: return null
    }
  }

  const currentSectionData = sections[currentSection]

  return (
    <Card className="w-full max-w-6xl mx-auto border-2 border-border shadow-2xl bg-card">
      <CardHeader className="pb-8">
        <CardTitle className="text-3xl font-bold visto-dark-blue tracking-tight text-center">
          {isEditing ? 'Edit Application' : 'Enhanced Loan Application'}
        </CardTitle>
        <CardDescription className="text-lg visto-slate text-center mt-3">
          {isEditing ? 'Update the application details below' : 'Comprehensive application with company and client information'}
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
                {isLoading ? (isEditing ? 'Updating Application...' : 'Creating Application...') : (isEditing ? 'Update Application' : 'Submit Application')}
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
} 