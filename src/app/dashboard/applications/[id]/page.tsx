'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { LoanApplication, Loan, Client, Company } from '@/types'
import { 
  ArrowLeft, 
  FileText, 
  DollarSign, 
  Calendar,
  Edit,
  Trash2,
  Building2,
  Users,
  Building,
  Plus,
  ChevronDown,
  ChevronRight
} from 'lucide-react'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { api } from '@/lib/api-client'
import { createLoan } from '@/lib/loans'

interface ApplicationWithLoans extends LoanApplication {
  loans: Loan[]
}

interface ApplicationWithDetails extends ApplicationWithLoans {
  clients?: Client[]
  companies?: Company[]
}

export default function ViewApplicationPage() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [application, setApplication] = useState<ApplicationWithDetails | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [editedApplication, setEditedApplication] = useState<ApplicationWithDetails | null>(null)
  const [expandedClients, setExpandedClients] = useState<Set<string>>(new Set())
  const [expandedCompanies, setExpandedCompanies] = useState<Set<string>>(new Set())

  const applicationId = params.id as string

  const loadApplication = async () => {
    if (!applicationId) return

    setIsLoading(true)
    try {
      const result = await api.getApplication(applicationId)
      
      if (result.error) {
        toast.error(result.error || 'Failed to load application')
        router.push('/dashboard')
        return
      }

      const data = result.data as any
      
      // Process the nested data structure
      const processedApplication = {
        ...data.application,
        clients: data.application.client_applications?.map((ca: any) => ca.clients).filter(Boolean) || [],
        companies: data.application.companies || []
      }
      
      setApplication(processedApplication)
      setEditedApplication(processedApplication)
    } catch (error) {
      console.error('Error loading application:', error)
      toast.error('Failed to load application')
      router.push('/dashboard')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadApplication()
  }, [applicationId, router])

  // Add useEffect to handle loan creation from DSCR calculator
  useEffect(() => {
    const handleAddLoanFromDSCR = async () => {
      const addLoan = searchParams.get('addLoan')
      if (addLoan === 'true') {
        try {
          // Get DSCR data from localStorage
          const dscrDataString = localStorage.getItem('dscrCalculatorData')
          const targetApplicationId = localStorage.getItem('targetApplicationId')
          
          if (!dscrDataString || targetApplicationId !== applicationId) {
            console.log('No DSCR data found or application ID mismatch')
            return
          }

          const dscrData = JSON.parse(dscrDataString)
          console.log('Processing DSCR data for loan creation:', dscrData)

          // Create loan data from DSCR data
          const loanData = {
            loan_name: `${dscrData.selected_loan?.product || 'DSCR Loan'} - ${dscrData.property_type || 'Property'}`,
            loan_type: dscrData.loan_type || 'dscr',
            loan_objective: dscrData.loan_objective || 'purchase',
            property_address: dscrData.property_address || '',
            property_type: dscrData.property_type || '',
            property_state: dscrData.property_state || '',
            property_zip_code: dscrData.propertyZipCode || '',
            property_city: dscrData.propertyCity || '',
            property_occupancy: dscrData.propertyOccupancy || 'Investment',
            estimated_home_value: dscrData.estimated_home_value || 0,
            purchase_price: dscrData.propertyPurchasePrice || 0,
            loan_amount: dscrData.loan_amount || 0,
            down_payment_percentage: dscrData.down_payment_percentage || 0,
            closing_costs: dscrData.propertyClosingCosts || 0,
            seller_concessions: dscrData.propertySellerConcessions || 0,
            repairs_improvements: dscrData.propertyRepairsImprovements || 0,
            reserves: dscrData.propertyReserves || 0,
            monthly_rental_income: dscrData.monthly_rental_income || 0,
            annual_property_insurance: dscrData.annual_property_insurance || 0,
            annual_property_taxes: dscrData.annual_property_taxes || 0,
            monthly_hoa_fee: dscrData.monthly_hoa_fee || 0,
            monthly_mortgage_payment: dscrData.selected_loan?.monthlyPayment || 0,
            noi: dscrData.dscr_results?.noi || 0,
            dscr_ratio: dscrData.dscr_results?.dscr || 0,
            cash_flow: dscrData.dscr_results?.cashFlow || 0,
            interest_rate: dscrData.selected_loan?.rate || 0,
            loan_term_years: dscrData.selected_loan?.term || 30,
            prepayment_penalty: dscrData.prepaymentPenalty || '',
            discount_points: dscrData.discountPoints || 0,
            fico_score_range: dscrData.ficoScoreRange || '',
            broker_points: dscrData.broker_points || 0,
            broker_admin_fee: dscrData.broker_admin_fee || 0,
            broker_ysp: dscrData.broker_ysp || 0,
            lender_name: dscrData.selected_loan?.lender || '',
            loan_product: dscrData.selected_loan?.product || '',
            selected_loan_product: dscrData.selected_loan || null,
            flood_insurance: dscrData.propertyFloodInsurance || 0,
            hazard_insurance: dscrData.propertyHazardInsurance || dscrData.annual_property_insurance || 0,
            title_insurance: dscrData.propertyTitleInsurance || 0,
            survey_fees: dscrData.propertySurveyFees || 0,
            recording_fees: dscrData.propertyRecordingFees || 0,
            transfer_taxes: dscrData.propertyTransferTaxes || 0,
            other_costs: dscrData.propertyOtherCosts || 0,
            is_short_term_rental: dscrData.is_short_term_rental || false,
            escrow_accounts: dscrData.propertyEscrowAccounts || false,
            loan_data: dscrData,
            notes: `Created from DSCR calculator data`
          }

          console.log('Creating loan with data:', loanData)

          // Create the loan
          const result = await createLoan(applicationId, loanData)
          
          if (result.error) {
            console.error('Failed to create loan:', result.error)
            toast.error(`Failed to create loan: ${result.error}`)
            return
          }

          console.log('Loan created successfully:', result.loan)
          toast.success('Loan created successfully!')

          // Clear localStorage data
          localStorage.removeItem('dscrCalculatorData')
          localStorage.removeItem('targetApplicationId')

          // Reload the application to show the new loan
          window.location.reload()

        } catch (error) {
          console.error('Error creating loan from DSCR data:', error)
          toast.error('Failed to create loan from DSCR data')
        }
      }
    }

    // Only run this if we have an application loaded
    if (application && searchParams.get('addLoan') === 'true') {
      handleAddLoanFromDSCR()
    }
  }, [applicationId, searchParams.get('addLoan')]) // Fixed dependency array

  const handleEdit = () => {
    setIsEditing(true)
  }

  const handleSave = async () => {
    if (!editedApplication) return
    
    try {
      const result = await api.updateApplication(applicationId, {
        application_name: editedApplication.application_name,
        application_type: editedApplication.application_type,
        notes: editedApplication.notes,
        status: editedApplication.status
      })

      if (result.error) {
        toast.error(result.error || 'Failed to update application')
        return
      }

      const data = result.data as any
      setApplication(data.application)
      setIsEditing(false)
      toast.success('Application updated successfully!')
    } catch (error) {
      console.error('Error updating application:', error)
      toast.error('Failed to update application')
    }
  }

  const handleCancel = () => {
    setIsEditing(false)
    setEditedApplication(application)
  }

  const handleDelete = async () => {
    if (!application) return
    
    if (!confirm(`Are you sure you want to delete this application? This action cannot be undone.`)) {
      return
    }

    try {
      const result = await api.deleteApplication(applicationId)

      if (result.error) {
        toast.error(result.error || 'Failed to delete application')
        return
      }

      toast.success('Application deleted successfully')
      router.push('/dashboard')
    } catch (error) {
      console.error('Error deleting application:', error)
      toast.error('Failed to delete application')
    }
  }

  const handleCreateLoan = () => {
    router.push(`/dashboard/dscr-calculator?applicationId=${applicationId}`)
  }

  const handleDeleteLoan = async (loanId: string) => {
    if (!confirm('Are you sure you want to delete this loan? This action cannot be undone.')) {
      return
    }

    try {
      const response = await api.deleteLoan(applicationId, loanId)
      
      if (response.error) {
        console.error('Failed to delete loan:', response.error)
        toast.error('Failed to delete loan')
        return
      }

      console.log('Loan deleted successfully')
      toast.success('Loan deleted successfully')
      // Refresh the application data to show updated loans
      await loadApplication()
    } catch (err) {
      console.error('Failed to delete loan:', err)
      toast.error('Failed to delete loan')
    }
  }

  const handleDeleteAllLoans = async () => {
    if (!confirm('Are you sure you want to delete ALL loans for this application? This action cannot be undone.')) {
      return
    }

    try {
      const response = await api.deleteAllLoans(applicationId)
      
      if (response.error) {
        console.error('Failed to delete all loans:', response.error)
        toast.error('Failed to delete all loans')
        return
      }

      console.log('All loans deleted successfully')
      toast.success('All loans deleted successfully')
      // Refresh the application data to show updated loans
      await loadApplication()
    } catch (err) {
      console.error('Failed to delete all loans:', err)
      toast.error('Failed to delete all loans')
    }
  }

  const toggleClientExpansion = (clientId: string) => {
    setExpandedClients(prev => {
      const newSet = new Set(prev)
      if (newSet.has(clientId)) {
        newSet.delete(clientId)
      } else {
        newSet.add(clientId)
      }
      return newSet
    })
  }

  const toggleCompanyExpansion = (companyId: string) => {
    setExpandedCompanies(prev => {
      const newSet = new Set(prev)
      if (newSet.has(companyId)) {
        newSet.delete(companyId)
      } else {
        newSet.add(companyId)
      }
      return newSet
    })
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMM dd, yyyy')
    } catch {
      return dateString
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800'
      case 'in_review': return 'bg-blue-100 text-blue-800'
      case 'denied': return 'bg-red-100 text-red-800'
      case 'closed': return 'bg-gray-100 text-gray-800'
      case 'missing_conditions': return 'bg-yellow-100 text-yellow-800'
      case 'pending_documents': return 'bg-orange-100 text-orange-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-lg visto-slate">Loading application...</p>
        </div>
      </div>
    )
  }

  if (!application) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-lg visto-slate">Application not found</p>
          <Button onClick={() => router.push('/dashboard')} className="mt-4">
            Back to Dashboard
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              onClick={() => router.push('/dashboard')}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </Button>
            <div>
              <h1 className="text-3xl font-bold visto-dark-blue">
                {application.application_name || `Application #${application.id.slice(0, 8)}`}
              </h1>
              <p className="text-lg visto-slate">
                {application.application_type || 'Loan Application'}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <Badge className={getStatusColor(application.status)}>
              {application.status}
            </Badge>
            
            {isEditing ? (
              <>
                <Button 
                  onClick={handleSave} 
                  className="flex items-center gap-2 bg-visto-gold hover:bg-visto-dark-gold text-white"
                >
                  Save
                </Button>
                <Button onClick={handleCancel} variant="outline" className="flex items-center gap-2">
                  Cancel
                </Button>
              </>
            ) : (
              <>
                <Button onClick={handleEdit} variant="outline" className="flex items-center gap-2">
                  <Edit className="h-4 w-4" />
                  Edit
                </Button>
                {application.loans && application.loans.length > 0 && (
                  <Button 
                    onClick={handleDeleteAllLoans} 
                    variant="outline" 
                    className="flex items-center gap-2 text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete All Loans
                  </Button>
                )}
                <Button onClick={handleDelete} variant="outline" className="flex items-center gap-2 text-red-600 hover:text-red-700">
                  <Trash2 className="h-4 w-4" />
                  Delete
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Application Information */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-visto-gold" />
                <CardTitle className="text-xl font-semibold visto-dark-blue">
                  Application Information
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-sm font-medium visto-slate">Application Name</Label>
                {isEditing ? (
                  <Input
                    value={editedApplication?.application_name || ''}
                    onChange={(e) => setEditedApplication(prev => prev ? { ...prev, application_name: e.target.value } : null)}
                    className="mt-1"
                  />
                ) : (
                  <p className="text-base font-medium visto-dark-blue">
                    {application.application_name || 'No name provided'}
                  </p>
                )}
              </div>
              
              <div>
                <Label className="text-sm font-medium visto-slate">Application Type</Label>
                {isEditing ? (
                  <Input
                    value={editedApplication?.application_type || ''}
                    onChange={(e) => setEditedApplication(prev => prev ? { ...prev, application_type: e.target.value } : null)}
                    className="mt-1"
                  />
                ) : (
                  <p className="text-base font-medium visto-dark-blue">
                    {application.application_type || 'No type specified'}
                  </p>
                )}
              </div>
              
              <div>
                <Label className="text-sm font-medium visto-slate">Notes</Label>
                {isEditing ? (
                  <Input
                    value={editedApplication?.notes || ''}
                    onChange={(e) => setEditedApplication(prev => prev ? { ...prev, notes: e.target.value } : null)}
                    className="mt-1"
                  />
                ) : (
                  <p className="text-base font-medium visto-dark-blue">
                    {application.notes || 'No notes provided'}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Application Timeline */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-visto-gold" />
                <CardTitle className="text-xl font-semibold visto-dark-blue">
                  Application Timeline
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-3 h-3 bg-visto-gold rounded-full"></div>
                  <div>
                    <p className="font-medium visto-dark-blue">Application Created</p>
                    <p className="text-sm visto-slate">{formatDate(application.created_at)}</p>
                  </div>
                </div>
                
                {application.updated_at !== application.created_at && (
                  <div className="flex items-center gap-4">
                    <div className="w-3 h-3 bg-visto-slate rounded-full"></div>
                    <div>
                      <p className="font-medium visto-dark-blue">Last Updated</p>
                      <p className="text-sm visto-slate">{formatDate(application.updated_at)}</p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Clients Section */}
        {application.clients && application.clients.length > 0 && (
          <div className="mt-8">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-visto-gold" />
                  <CardTitle className="text-xl font-semibold visto-dark-blue">
                    Clients ({application.clients.length})
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {application.clients.map((client) => (
                    <div key={client.id} className="border border-gray-200 rounded-lg">
                      <button
                        onClick={() => toggleClientExpansion(client.id)}
                        className="w-full p-4 text-left flex items-center justify-between hover:bg-gray-50"
                      >
                        <div className="flex items-center gap-3">
                          <Users className="h-4 w-4 text-visto-gold" />
                          <div>
                            <h4 className="font-semibold visto-dark-blue">
                              {client.first_name} {client.last_name}
                            </h4>
                            <p className="text-sm visto-slate">{client.email}</p>
                          </div>
                        </div>
                        {expandedClients.has(client.id) ? (
                          <ChevronDown className="h-4 w-4 text-gray-500" />
                        ) : (
                          <ChevronRight className="h-4 w-4 text-gray-500" />
                        )}
                      </button>
                      
                      {expandedClients.has(client.id) && (
                        <div className="px-4 pb-4 border-t border-gray-100">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                            <div>
                              <Label className="text-sm font-medium visto-slate">Phone</Label>
                              <p className="text-sm visto-dark-blue">{client.phone_number || 'Not provided'}</p>
                            </div>
                            <div>
                              <Label className="text-sm font-medium visto-slate">SSN</Label>
                              <p className="text-sm visto-dark-blue">
                                {client.ssn ? `***-**-${client.ssn.slice(-4)}` : 'Not provided'}
                              </p>
                            </div>
                            <div>
                              <Label className="text-sm font-medium visto-slate">Date of Birth</Label>
                              <p className="text-sm visto-dark-blue">
                                {client.date_of_birth ? formatDate(client.date_of_birth) : 'Not provided'}
                              </p>
                            </div>
                            <div>
                              <Label className="text-sm font-medium visto-slate">Current Residence</Label>
                              <p className="text-sm visto-dark-blue">{client.current_residence || 'Not provided'}</p>
                            </div>
                            <div>
                              <Label className="text-sm font-medium visto-slate">Total Income</Label>
                              <p className="text-sm visto-dark-blue">
                                {client.total_income > 0 ? formatCurrency(client.total_income) : 'Not provided'}
                              </p>
                            </div>
                            <div>
                              <Label className="text-sm font-medium visto-slate">Total Assets</Label>
                              <p className="text-sm visto-dark-blue">
                                {client.total_assets > 0 ? formatCurrency(client.total_assets) : 'Not provided'}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Companies Section */}
        {application.companies && application.companies.length > 0 && (
          <div className="mt-8">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Building className="h-5 w-5 text-visto-gold" />
                  <CardTitle className="text-xl font-semibold visto-dark-blue">
                    Companies ({application.companies.length})
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {application.companies.map((company) => (
                    <div key={company.id} className="border border-gray-200 rounded-lg">
                      <button
                        onClick={() => toggleCompanyExpansion(company.id)}
                        className="w-full p-4 text-left flex items-center justify-between hover:bg-gray-50"
                      >
                        <div className="flex items-center gap-3">
                          <Building className="h-4 w-4 text-visto-gold" />
                          <div>
                            <h4 className="font-semibold visto-dark-blue">
                              {company.company_name}
                            </h4>
                            <p className="text-sm visto-slate">{company.company_type || 'Company'}</p>
                          </div>
                        </div>
                        {expandedCompanies.has(company.id) ? (
                          <ChevronDown className="h-4 w-4 text-gray-500" />
                        ) : (
                          <ChevronRight className="h-4 w-4 text-gray-500" />
                        )}
                      </button>
                      
                      {expandedCompanies.has(company.id) && (
                        <div className="px-4 pb-4 border-t border-gray-100">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                            <div>
                              <Label className="text-sm font-medium visto-slate">EIN</Label>
                              <p className="text-sm visto-dark-blue">{company.ein || 'Not provided'}</p>
                            </div>
                            <div>
                              <Label className="text-sm font-medium visto-slate">Business Phone</Label>
                              <p className="text-sm visto-dark-blue">{company.business_phone || 'Not provided'}</p>
                            </div>
                            <div>
                              <Label className="text-sm font-medium visto-slate">Business Email</Label>
                              <p className="text-sm visto-dark-blue">{company.business_email || 'Not provided'}</p>
                            </div>
                            <div>
                              <Label className="text-sm font-medium visto-slate">Business Address</Label>
                              <p className="text-sm visto-dark-blue">{company.business_address || 'Not provided'}</p>
                            </div>
                            <div>
                              <Label className="text-sm font-medium visto-slate">Industry</Label>
                              <p className="text-sm visto-dark-blue">{company.industry || 'Not provided'}</p>
                            </div>
                            <div>
                              <Label className="text-sm font-medium visto-slate">Years in Business</Label>
                              <p className="text-sm visto-dark-blue">{company.years_in_business || 'Not provided'}</p>
                            </div>
                            <div>
                              <Label className="text-sm font-medium visto-slate">Annual Revenue</Label>
                              <p className="text-sm visto-dark-blue">
                                {company.annual_revenue && company.annual_revenue > 0 
                                  ? formatCurrency(company.annual_revenue) 
                                  : 'Not provided'
                                }
                              </p>
                            </div>
                            <div>
                              <Label className="text-sm font-medium visto-slate">Number of Employees</Label>
                              <p className="text-sm visto-dark-blue">{company.number_of_employees || 'Not provided'}</p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Loans Section */}
        <div className="mt-8">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-visto-gold" />
                  <CardTitle className="text-xl font-semibold visto-dark-blue">
                    Loans ({application.loans?.length || 0})
                  </CardTitle>
                </div>
                <div className="flex items-center gap-2">
                  {application.loans && application.loans.length > 0 && (
                    <Button 
                      variant="outline"
                      onClick={handleDeleteAllLoans}
                      className="flex items-center gap-2 text-red-600 border-red-200 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                      Delete All
                    </Button>
                  )}
                  <Button 
                    onClick={handleCreateLoan}
                    className="flex items-center gap-2 bg-visto-gold hover:bg-visto-dark-gold text-white"
                  >
                    <Plus className="h-4 w-4" />
                    Create Loan
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {application.loans && application.loans.length > 0 ? (
                <div className="space-y-4">
                  {application.loans.map((loan) => (
                    <div key={loan.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h4 className="font-semibold visto-dark-blue">{loan.loan_name}</h4>
                          <p className="text-sm visto-slate">{loan.loan_type} • {loan.loan_objective}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge 
                            variant={loan.loan_status === 'approved' ? 'default' : 'secondary'}
                            className={loan.loan_status === 'approved' ? 'bg-green-100 text-green-800' : ''}
                          >
                            {loan.loan_status}
                          </Badge>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteLoan(loan.id)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="visto-slate">Loan Amount:</span>
                          <p className="font-medium">{loan.loan_amount ? formatCurrency(loan.loan_amount) : 'N/A'}</p>
                        </div>
                        <div>
                          <span className="visto-slate">Interest Rate:</span>
                          <p className="font-medium">{loan.interest_rate ? `${loan.interest_rate}%` : 'N/A'}</p>
                        </div>
                        <div>
                          <span className="visto-slate">DSCR Ratio:</span>
                          <p className="font-medium">{loan.dscr_ratio ? loan.dscr_ratio.toFixed(2) : 'N/A'}</p>
                        </div>
                        <div>
                          <span className="visto-slate">Cash Flow:</span>
                          <p className="font-medium">{loan.cash_flow ? formatCurrency(loan.cash_flow) : 'N/A'}</p>
                        </div>
                      </div>
                      
                      {loan.property_address && (
                        <div className="mt-3 pt-3 border-t border-gray-100">
                          <p className="text-sm visto-slate">
                            {loan.property_address}
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Building2 className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-lg font-medium visto-slate mb-2">No loans yet</p>
                  <p className="text-sm text-gray-500">
                    Loans will appear here once they are added to this application
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
} 