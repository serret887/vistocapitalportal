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
import { Checkbox } from '@/components/ui/checkbox'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
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
  ClientSearchResult,
  Company,
  Client
} from '@/types'
import { INCOME_SOURCE_TYPES } from '@/types'
import { toast } from 'sonner'
import { Plus, Trash2, Search, Building, Users, DollarSign, FileText, X, CheckCircle, Loader2, ChevronLeft, ChevronRight } from 'lucide-react'
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
  
  // Company and client selection state
  const [selectedCompanies, setSelectedCompanies] = useState<Company[]>([])
  const [selectedClients, setSelectedClients] = useState<Client[]>([])
  const [companySearchResults, setCompanySearchResults] = useState<Company[]>([])
  const [isCompanySearching, setIsCompanySearching] = useState(false)
  
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
      title: 'Company Management',
      description: 'Search and create companies',
      icon: Building
    },
    {
      id: 1,
      title: 'Client Management',
      description: 'Search and create clients',
      icon: Users
    },
    {
      id: 2,
      title: 'Application Creation',
      description: 'Create application from selected companies and clients',
      icon: FileText
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
      case 0: // Company Management
        // No validation needed for company management
        break

      case 1: // Client Management
        // No validation needed for client management
        break

      case 2: // Application Creation
        if (selectedCompanies.length === 0 && selectedClients.length === 0) {
          newErrors.selection = 'Please select at least one company or client'
        }
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

  const performCompanySearch = async (query: string) => {
    if (query.length < 2) {
      setCompanySearchResults([])
      return
    }

    setIsCompanySearching(true)
    try {
      const response = await fetch(`/api/companies/search?q=${encodeURIComponent(query)}`)
      if (response.ok) {
        const results = await response.json()
        setCompanySearchResults(results)
      } else {
        setCompanySearchResults([])
      }
    } catch (error) {
      console.error('Error searching companies:', error)
      toast.error('Failed to search companies')
      setCompanySearchResults([])
    } finally {
      setIsCompanySearching(false)
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
      const result = await getClient(client.id)
      if (result.client && !result.error) {
        if (!selectedClients.find(c => c.id === result.client!.id)) {
          setSelectedClients(prev => [...prev, result.client!])
        }
        setSearchQuery('')
        setSearchResults([])
      } else {
        toast.error('Failed to fetch client details')
      }
    } catch (error) {
      console.error('Error fetching client details:', error)
      toast.error('Failed to fetch client details')
    }
  }

  const handleInputChange = (field: keyof EnhancedApplicationFormData) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setFormData(prev => ({ ...prev, [field]: e.target.value }))
  }

  const handleSelectChange = (field: keyof EnhancedApplicationFormData) => (value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSwitchChange = (field: keyof EnhancedApplicationFormData) => (checked: boolean) => {
    if (field === 'has_company') {
      setFormData(prev => ({
        ...prev,
        has_company: checked,
        company: checked ? {
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
        } : undefined
      }))
    } else {
      setFormData(prev => ({ ...prev, [field]: checked }))
    }
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
    if (selectedCompanies.length === 0 && selectedClients.length === 0) {
      toast.error('Please select at least one company or client')
      return
    }

    setIsLoading(true)
    try {
      const applicationData = {
        companies: selectedCompanies.map(c => c.id),
        clients: selectedClients.map(c => c.id),
        application_name: `Application - ${new Date().toLocaleDateString()}`,
        application_type: 'loan_application',
        notes: ''
      }

      const response = await fetch('/api/applications/from-selection', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(applicationData)
      })

      if (!response.ok) {
        const result = await response.json()
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
      <div>
        <h4 className="text-lg font-semibold visto-dark-blue">Company Management</h4>
        <p className="text-base visto-slate">Search and select companies for this application</p>
      </div>
      
      <Card className="border-2 border-primary/20 p-6">
        <div className="space-y-4">
          {/* Company Search */}
          <div>
            <Label className="text-sm font-medium visto-dark-blue">Search Companies</Label>
            <div className="relative mt-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search by company name, type, or email..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value)
                  if (e.target.value.length >= 2) {
                    performCompanySearch(e.target.value)
                  }
                }}
                className="pl-10"
              />
            </div>
            
            {/* Search Results */}
            {companySearchResults.length > 0 && (
              <div className="mt-2 space-y-2">
                {companySearchResults.map((company) => (
                  <div
                    key={company.id}
                    className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
                    onClick={() => {
                      if (!selectedCompanies.find(c => c.id === company.id)) {
                        setSelectedCompanies(prev => [...prev, company])
                      }
                      setSearchQuery('')
                      setCompanySearchResults([])
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h5 className="font-medium visto-dark-blue">{company.company_name}</h5>
                        <p className="text-sm visto-slate">{company.company_type || 'Company'}</p>
                      </div>
                      <Plus className="h-4 w-4 text-visto-gold" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {/* Selected Companies */}
          {selectedCompanies.length > 0 && (
            <div>
              <Label className="text-sm font-medium visto-dark-blue">Selected Companies</Label>
              <div className="mt-2 space-y-2">
                {selectedCompanies.map((company) => (
                  <div
                    key={company.id}
                    className="p-3 border border-visto-gold rounded-lg bg-visto-gold/10"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h5 className="font-medium visto-dark-blue">{company.company_name}</h5>
                        <p className="text-sm visto-slate">{company.company_type || 'Company'}</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedCompanies(prev => prev.filter(c => c.id !== company.id))}
                        className="text-red-600 hover:text-red-700"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  )

  const renderClientInfo = () => (
    <div className="space-y-6">
      <div>
        <h4 className="text-lg font-semibold visto-dark-blue">Client Management</h4>
        <p className="text-base visto-slate">Search and select clients for this application</p>
      </div>
      
      <Card className="border-2 border-primary/20 p-6">
        <div className="space-y-4">
          {/* Client Search */}
          <div>
            <Label className="text-sm font-medium visto-dark-blue">Search Clients</Label>
            <div className="relative mt-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search by client name or email..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value)
                  if (e.target.value.length >= 2) {
                    performClientSearch(e.target.value)
                  }
                }}
                className="pl-10"
              />
            </div>
            
            {/* Search Results */}
            {searchResults.length > 0 && (
              <div className="mt-2 space-y-2">
                {searchResults.map((client) => (
                  <div
                    key={client.id}
                    className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
                    onClick={() => selectExistingClient(client)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h5 className="font-medium visto-dark-blue">{client.first_name} {client.last_name}</h5>
                        <p className="text-sm visto-slate">{client.email}</p>
                      </div>
                      <Plus className="h-4 w-4 text-visto-gold" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {/* Selected Clients */}
          {selectedClients.length > 0 && (
            <div>
              <Label className="text-sm font-medium visto-dark-blue">Selected Clients</Label>
              <div className="mt-2 space-y-2">
                {selectedClients.map((client) => (
                  <div
                    key={client.id}
                    className="p-3 border border-visto-gold rounded-lg bg-visto-gold/10"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h5 className="font-medium visto-dark-blue">{client.first_name} {client.last_name}</h5>
                        <p className="text-sm visto-slate">{client.email}</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedClients(prev => prev.filter(c => c.id !== client.id))}
                        className="text-red-600 hover:text-red-700"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  )

  const renderApplicationCreation = () => (
    <div className="space-y-6">
      <div>
        <h4 className="text-lg font-semibold visto-dark-blue">Application Creation</h4>
        <p className="text-base visto-slate">Review selected companies and clients, then create the application</p>
      </div>
      
      <Card className="border-2 border-primary/20 p-6">
        <div className="space-y-6">
          {/* Selected Companies */}
          {selectedCompanies.length > 0 && (
            <div>
              <Label className="text-sm font-medium visto-dark-blue">Selected Companies ({selectedCompanies.length})</Label>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Company Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>EIN</TableHead>
                    <TableHead>Phone</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {selectedCompanies.map((company) => (
                    <TableRow key={company.id}>
                      <TableCell className="font-medium">{company.company_name}</TableCell>
                      <TableCell>{company.company_type}</TableCell>
                      <TableCell>{company.ein}</TableCell>
                      <TableCell>{company.business_phone}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
          
          {/* Selected Clients */}
          {selectedClients.length > 0 && (
            <div>
              <Label className="text-sm font-medium visto-dark-blue">Selected Clients ({selectedClients.length})</Label>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>SSN</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {selectedClients.map((client) => (
                    <TableRow key={client.id}>
                      <TableCell className="font-medium">{client.first_name} {client.last_name}</TableCell>
                      <TableCell>{client.email}</TableCell>
                      <TableCell>{client.phone_number}</TableCell>
                      <TableCell>***-**-{client.ssn?.slice(-4)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
          
          {/* Create Application Button */}
          <div className="flex justify-center pt-4">
            <Button
              onClick={handleSubmit}
              disabled={isLoading || (selectedCompanies.length === 0 && selectedClients.length === 0)}
              className="px-8 py-3 text-lg"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating Application...
                </>
              ) : (
                <>
                  <FileText className="mr-2 h-4 w-4" />
                  Create Application
                </>
              )}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  )

  const renderCurrentSection = () => {
    switch (currentSection) {
      case 0:
        return renderCompanyInfo()
      case 1:
        return renderClientInfo()
      case 2:
        return renderApplicationCreation()
      default:
        return null
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-8">
        <h2 className="text-2xl font-bold visto-dark-blue mb-2">
          {isEditing ? 'Edit Application' : 'Create New Application'}
        </h2>
        <p className="text-base visto-slate">
          {isEditing ? 'Update application details' : 'Select companies and clients to create a new application'}
        </p>
      </div>

      {/* Progress Steps */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {sections.map((section, index) => (
            <div key={section.id} className="flex items-center">
              <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                index <= currentSection 
                  ? 'border-visto-gold bg-visto-gold text-white' 
                  : 'border-gray-300 bg-white text-gray-400'
              }`}>
                {index < currentSection ? (
                  <CheckCircle className="w-5 h-5" />
                ) : (
                  <section.icon className="w-5 h-5" />
                )}
              </div>
              <div className="ml-3">
                <h3 className={`text-sm font-medium ${
                  index <= currentSection ? 'text-visto-dark-blue' : 'text-gray-400'
                }`}>
                  {section.title}
                </h3>
                <p className={`text-xs ${
                  index <= currentSection ? 'text-visto-slate' : 'text-gray-400'
                }`}>
                  {section.description}
                </p>
              </div>
              {index < sections.length - 1 && (
                <div className={`w-16 h-0.5 mx-4 ${
                  index < currentSection ? 'bg-visto-gold' : 'bg-gray-300'
                }`} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Form Content */}
      <Card className="border-2 border-primary/20">
        <CardContent className="p-6">
          {renderCurrentSection()}
        </CardContent>
      </Card>

      {/* Navigation Buttons */}
      <div className="flex justify-between mt-6">
        <Button
          variant="outline"
          onClick={prevSection}
          disabled={currentSection === 0}
          className="px-6"
        >
          <ChevronLeft className="mr-2 h-4 w-4" />
          Previous
        </Button>

        <div className="flex space-x-3">
          {onCancel && (
            <Button
              variant="outline"
              onClick={onCancel}
              className="px-6"
            >
              Cancel
            </Button>
          )}
          
          {currentSection < sections.length - 1 ? (
            <Button
              onClick={nextSection}
              className="px-6"
            >
              Next
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={isLoading || (selectedCompanies.length === 0 && selectedClients.length === 0)}
              className="px-6"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <FileText className="mr-2 h-4 w-4" />
                  Create Application
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  )
} 