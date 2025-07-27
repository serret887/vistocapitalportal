'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { getLoanApplication, deleteLoanApplication, updateLoanApplication } from '@/lib/loan-applications'
import type { LoanApplication } from '@/types'
import { 
  ArrowLeft, 
  User, 
  Home, 
  Building, 
  FileText, 
  DollarSign, 
  Calendar,
  Phone,
  Mail,
  MapPin,
  CreditCard,
  Banknote,
  TrendingUp,
  Calculator,
  Edit,
  Trash2,
  Download,
  Save,
  X
} from 'lucide-react'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { LOAN_STATUS_LABELS, LOAN_STATUS_COLORS, type LoanObjective } from '@/types'

export default function ViewApplicationPage() {
  const params = useParams()
  const router = useRouter()
  const [application, setApplication] = useState<LoanApplication | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [dscrData, setDscrData] = useState<any>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [editedApplication, setEditedApplication] = useState<LoanApplication | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  const applicationId = params.id as string

  useEffect(() => {
    const loadApplication = async () => {
      if (!applicationId) return

      setIsLoading(true)
      try {
        const { application: app, error } = await getLoanApplication(applicationId)
        
        if (error) {
          toast.error(error)
          router.push('/dashboard')
          return
        }

        if (app) {
          setApplication(app)
          
          // Use saved DSCR data from the application if available
          if (app.dscr_data) {
            setDscrData(app.dscr_data)
          } else if (app.selected_loan_product || app.dscr_results) {
            // Fallback: construct DSCR data from individual fields
            setDscrData({
              estimated_home_value: app.estimated_home_value,
              loan_amount: app.loan_amount,
              down_payment_percentage: app.down_payment_percentage,
              monthly_rental_income: app.monthly_rental_income,
              annual_property_insurance: app.annual_property_insurance,
              annual_property_taxes: app.annual_property_taxes,
              monthly_hoa_fee: app.monthly_hoa_fee,
              is_short_term_rental: app.is_short_term_rental,
              property_state: app.property_state,
              broker_points: app.broker_points,
              broker_admin_fee: app.broker_admin_fee,
              broker_ysp: app.broker_ysp,
              selected_loan: app.selected_loan_product,
              dscr_results: app.dscr_results
            })
          }
        }
      } catch (error) {
        console.error('Error loading application:', error)
        toast.error('Failed to load application')
        router.push('/dashboard')
      } finally {
        setIsLoading(false)
      }
    }

    loadApplication()
  }, [applicationId, router])

  const handleEdit = () => {
    setIsEditing(true)
    setEditedApplication(application)
  }

  const handleSave = async () => {
    if (!editedApplication) return
    
    setIsSaving(true)
    try {
      // Convert LoanApplication to LoanApplicationFormData format
      const updateData = {
        first_name: editedApplication.first_name,
        last_name: editedApplication.last_name,
        email: editedApplication.email || '',
        phone_number: editedApplication.phone_number || '',
        property_address: editedApplication.property_address || '',
        property_is_tbd: editedApplication.property_is_tbd,
        property_type: editedApplication.property_type || '',
        current_residence: editedApplication.current_residence || '',
        loan_objective: (editedApplication.loan_objective as LoanObjective) || '',
        loan_type: editedApplication.loan_type || '',
        ssn: editedApplication.ssn || '',
        date_of_birth: editedApplication.date_of_birth || '',
        total_income: editedApplication.total_income,
        income_sources: editedApplication.income_sources,
        income_documents: [], // We'll handle documents separately
        total_assets: editedApplication.total_assets,
        bank_accounts: editedApplication.bank_accounts,
        bank_statements: [] // We'll handle documents separately
      }
      
      const { application: updatedApp, error } = await updateLoanApplication(applicationId, updateData)
      
      if (error) {
        toast.error(error)
        return
      }
      
      if (updatedApp) {
        setApplication(updatedApp)
        setIsEditing(false)
        setEditedApplication(null)
        toast.success('Application updated successfully!')
      }
    } catch (error) {
      console.error('Error updating application:', error)
      toast.error('Failed to update application')
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancel = () => {
    setIsEditing(false)
    setEditedApplication(null)
  }

  const handleFieldChange = (field: keyof LoanApplication, value: any) => {
    if (!editedApplication) return
    setEditedApplication(prev => prev ? { ...prev, [field]: value } : null)
  }

  const handleDelete = async () => {
    if (!application) return
    
    if (!confirm(`Are you sure you want to delete the application for ${application.first_name} ${application.last_name}?`)) {
      return
    }

    try {
      const { success, error } = await deleteLoanApplication(application.id)
      
      if (error) {
        toast.error(error)
        return
      }

      if (success) {
        toast.success('Application deleted successfully')
        router.push('/dashboard')
      }
    } catch (error) {
      console.error('Error deleting application:', error)
      toast.error('An unexpected error occurred')
    }
  }

  const handleExport = () => {
    // TODO: Implement export functionality
    toast.info('Export functionality coming soon!')
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
                {application.first_name} {application.last_name}
              </h1>
              <p className="text-lg visto-slate">
                Application #{application.id.slice(0, 8)}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <Badge 
              className={`${LOAN_STATUS_COLORS[application.status]} text-white`}
            >
              {LOAN_STATUS_LABELS[application.status]}
            </Badge>
            
            {isEditing ? (
              <>
                <Button 
                  onClick={handleSave} 
                  disabled={isSaving}
                  className="flex items-center gap-2 bg-visto-gold hover:bg-visto-dark-gold text-white"
                >
                  {isSaving ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  {isSaving ? 'Saving...' : 'Save'}
                </Button>
                <Button onClick={handleCancel} variant="outline" className="flex items-center gap-2">
                  <X className="h-4 w-4" />
                  Cancel
                </Button>
              </>
            ) : (
              <>
                <Button onClick={handleEdit} variant="outline" className="flex items-center gap-2">
                  <Edit className="h-4 w-4" />
                  Edit
                </Button>
                <Button onClick={handleExport} variant="outline" className="flex items-center gap-2">
                  <Download className="h-4 w-4" />
                  Export
                </Button>
                <Button onClick={handleDelete} variant="outline" className="flex items-center gap-2 text-red-600 hover:text-red-700">
                  <Trash2 className="h-4 w-4" />
                  Delete
                </Button>
              </>
            )}
          </div>
        </div>

        {/* DSCR Calculator Data Summary */}
        {dscrData && (
          <Card className="mb-6 border-2 border-primary/20 bg-gradient-visto-subtle">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Calculator className="h-5 w-5 text-visto-gold" />
                <CardTitle className="text-lg font-semibold visto-dark-blue">
                  DSCR Calculator Data
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                {/* Loan Information */}
                <div className="space-y-2">
                  <h4 className="font-semibold visto-dark-blue text-sm">Loan Information</h4>
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span className="visto-slate">Objective:</span>
                      <span className="font-medium capitalize">{application.loan_objective || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="visto-slate">Type:</span>
                      <span className="font-medium uppercase">{application.loan_type || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="visto-slate">Amount:</span>
                      <span className="font-medium">{formatCurrency(dscrData.loan_amount)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="visto-slate">Down Payment:</span>
                      <span className="font-medium">{dscrData.down_payment_percentage}%</span>
                    </div>
                  </div>
                </div>
                
                {/* Property Details */}
                <div className="space-y-2">
                  <h4 className="font-semibold visto-dark-blue text-sm">Property Details</h4>
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span className="visto-slate">Value:</span>
                      <span className="font-medium">{formatCurrency(dscrData.estimated_home_value)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="visto-slate">Type:</span>
                      <span className="font-medium">{dscrData.property_type}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="visto-slate">State:</span>
                      <span className="font-medium">{dscrData.property_state}</span>
                    </div>
                    {dscrData.ficoScoreRange && (
                      <div className="flex justify-between">
                        <span className="visto-slate">FICO:</span>
                        <span className="font-medium">{dscrData.ficoScoreRange}</span>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Financial Details */}
                <div className="space-y-2">
                  <h4 className="font-semibold visto-dark-blue text-sm">Financial Details</h4>
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span className="visto-slate">Monthly Rent:</span>
                      <span className="font-medium">{formatCurrency(dscrData.monthly_rental_income)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="visto-slate">Insurance:</span>
                      <span className="font-medium">{formatCurrency(dscrData.annual_property_insurance)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="visto-slate">Taxes:</span>
                      <span className="font-medium">{formatCurrency(dscrData.annual_property_taxes)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="visto-slate">HOA:</span>
                      <span className="font-medium">{formatCurrency(dscrData.monthly_hoa_fee)}</span>
                    </div>
                  </div>
                </div>
                
                {/* DSCR Analysis */}
                <div className="space-y-2">
                  <h4 className="font-semibold visto-dark-blue text-sm">DSCR Analysis</h4>
                  <div className="space-y-1 text-xs">
                    {dscrData.dscr_results && (
                      <>
                        <div className="flex justify-between">
                          <span className="visto-slate">DSCR Ratio:</span>
                          <span className="font-medium text-visto-gold">{dscrData.dscr_results.dscr?.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="visto-slate">NOI:</span>
                          <span className="font-medium">{formatCurrency(dscrData.dscr_results.noi)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="visto-slate">Cash Flow:</span>
                          <span className="font-medium">{formatCurrency(dscrData.dscr_results.cashFlow)}</span>
                        </div>
                      </>
                    )}
                    {dscrData.selected_loan && (
                      <div className="flex justify-between">
                        <span className="visto-slate">Product:</span>
                        <span className="font-medium text-visto-gold">{dscrData.selected_loan.product}</span>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Broker Compensation */}
                <div className="space-y-2">
                  <h4 className="font-semibold visto-dark-blue text-sm">Broker Details</h4>
                  <div className="space-y-1 text-xs">
                    {dscrData.broker_points && (
                      <div className="flex justify-between">
                        <span className="visto-slate">Points:</span>
                        <span className="font-medium">{dscrData.broker_points}%</span>
                      </div>
                    )}
                    {dscrData.broker_admin_fee && (
                      <div className="flex justify-between">
                        <span className="visto-slate">Admin Fee:</span>
                        <span className="font-medium">{formatCurrency(dscrData.broker_admin_fee)}</span>
                      </div>
                    )}
                    {dscrData.broker_ysp && (
                      <div className="flex justify-between">
                        <span className="visto-slate">YSP:</span>
                        <span className="font-medium">{dscrData.broker_ysp}%</span>
                      </div>
                    )}
                    {dscrData.prepaymentPenalty && (
                      <div className="flex justify-between">
                        <span className="visto-slate">Prepayment:</span>
                        <span className="font-medium">{dscrData.prepaymentPenalty}</span>
                      </div>
                    )}
                    {dscrData.discountPoints !== undefined && (
                      <div className="flex justify-between">
                        <span className="visto-slate">Discount:</span>
                        <span className="font-medium">{dscrData.discountPoints}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Personal Information */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <User className="h-5 w-5 text-visto-gold" />
                <CardTitle className="text-xl font-semibold visto-dark-blue">
                  Personal Information
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium visto-slate">First Name</Label>
                  {isEditing ? (
                    <Input
                      value={editedApplication?.first_name || ''}
                      onChange={(e) => handleFieldChange('first_name', e.target.value)}
                      className="mt-1"
                    />
                  ) : (
                    <p className="text-base font-medium visto-dark-blue">{application.first_name}</p>
                  )}
                </div>
                <div>
                  <Label className="text-sm font-medium visto-slate">Last Name</Label>
                  {isEditing ? (
                    <Input
                      value={editedApplication?.last_name || ''}
                      onChange={(e) => handleFieldChange('last_name', e.target.value)}
                      className="mt-1"
                    />
                  ) : (
                    <p className="text-base font-medium visto-dark-blue">{application.last_name}</p>
                  )}
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium visto-slate">Email</Label>
                  {isEditing ? (
                    <Input
                      value={editedApplication?.email || ''}
                      onChange={(e) => handleFieldChange('email', e.target.value)}
                      className="mt-1"
                      placeholder="Enter email address"
                    />
                  ) : (
                    <p className="text-base font-medium visto-dark-blue">
                      {application.email || 'No email provided'}
                    </p>
                  )}
                </div>
                <div>
                  <Label className="text-sm font-medium visto-slate">Phone Number</Label>
                  {isEditing ? (
                    <Input
                      value={editedApplication?.phone_number || ''}
                      onChange={(e) => handleFieldChange('phone_number', e.target.value)}
                      className="mt-1"
                      placeholder="Enter phone number"
                    />
                  ) : (
                    <p className="text-base font-medium visto-dark-blue">
                      {application.phone_number || 'No phone number provided'}
                    </p>
                  )}
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium visto-slate">SSN</Label>
                  {isEditing ? (
                    <Input
                      value={editedApplication?.ssn || ''}
                      onChange={(e) => handleFieldChange('ssn', e.target.value)}
                      className="mt-1"
                      placeholder="Enter SSN"
                    />
                  ) : (
                    <p className="text-base font-medium visto-dark-blue">
                      {application.ssn ? `***-**-${application.ssn.slice(-4)}` : 'No SSN provided'}
                    </p>
                  )}
                </div>
                <div>
                  <Label className="text-sm font-medium visto-slate">Date of Birth</Label>
                  {isEditing ? (
                    <Input
                      type="date"
                      value={editedApplication?.date_of_birth || ''}
                      onChange={(e) => handleFieldChange('date_of_birth', e.target.value)}
                      className="mt-1"
                    />
                  ) : (
                    <p className="text-base font-medium visto-dark-blue">
                      {application.date_of_birth ? formatDate(application.date_of_birth) : 'No date of birth provided'}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Property Information */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Home className="h-5 w-5 text-visto-gold" />
                <CardTitle className="text-xl font-semibold visto-dark-blue">
                  Property Information
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="flex-1">
                  <Label className="text-sm font-medium visto-slate">Property TBD</Label>
                  {isEditing ? (
                    <div className="mt-1">
                      <input
                        type="checkbox"
                        checked={editedApplication?.property_is_tbd || false}
                        onChange={(e) => handleFieldChange('property_is_tbd', e.target.checked)}
                        className="mr-2"
                      />
                      <span className="text-sm">Property to be determined</span>
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      {application.property_is_tbd ? (
                        <Badge variant="outline" className="text-amber-600 border-amber-600">
                          Pre-approval (TBD)
                        </Badge>
                      ) : (
                        <span className="text-sm visto-slate">Property specified</span>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {!application.property_is_tbd && (
                <>
                  <div>
                    <Label className="text-sm font-medium visto-slate">Property Type</Label>
                    {isEditing ? (
                      <Select
                        value={editedApplication?.property_type || ''}
                        onValueChange={(value) => handleFieldChange('property_type', value)}
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder="Select property type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Single Family">Single Family</SelectItem>
                          <SelectItem value="Multi-Family">Multi-Family</SelectItem>
                          <SelectItem value="Condo">Condo</SelectItem>
                          <SelectItem value="Townhouse">Townhouse</SelectItem>
                          <SelectItem value="Commercial">Commercial</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <p className="text-base font-medium visto-dark-blue">
                        {application.property_type || 'No property type specified'}
                      </p>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-visto-slate" />
                    <div className="flex-1">
                      <Label className="text-sm font-medium visto-slate">Property Address</Label>
                      {isEditing ? (
                        <Input
                          value={editedApplication?.property_address || ''}
                          onChange={(e) => handleFieldChange('property_address', e.target.value)}
                          className="mt-1"
                          placeholder="Enter property address"
                        />
                      ) : (
                        <p className="text-base font-medium visto-dark-blue">
                          {application.property_address || 'No property address provided'}
                        </p>
                      )}
                    </div>
                  </div>
                </>
              )}
              
              <div className="flex items-center gap-2">
                <Home className="h-4 w-4 text-visto-slate" />
                <div className="flex-1">
                  <Label className="text-sm font-medium visto-slate">Current Residence</Label>
                  {isEditing ? (
                    <Input
                      value={editedApplication?.current_residence || ''}
                      onChange={(e) => handleFieldChange('current_residence', e.target.value)}
                      className="mt-1"
                      placeholder="Enter current residence"
                    />
                  ) : (
                    <p className="text-base font-medium visto-dark-blue">
                      {application.current_residence || 'No current residence provided'}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>



          {/* Financial Information */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-visto-gold" />
                <CardTitle className="text-xl font-semibold visto-dark-blue">
                  Financial Information
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-sm font-medium visto-slate">Total Annual Income</Label>
                {isEditing ? (
                  <Input
                    type="number"
                    value={editedApplication?.total_income || 0}
                    onChange={(e) => handleFieldChange('total_income', parseFloat(e.target.value) || 0)}
                    className="mt-1"
                    placeholder="Enter total annual income"
                  />
                ) : (
                  <p className="text-base font-medium visto-dark-blue">
                    {application.total_income > 0 ? formatCurrency(application.total_income) : 'No income information provided'}
                  </p>
                )}
              </div>
              
              <div>
                <Label className="text-sm font-medium visto-slate">Total Assets</Label>
                {isEditing ? (
                  <Input
                    type="number"
                    value={editedApplication?.total_assets || 0}
                    onChange={(e) => handleFieldChange('total_assets', parseFloat(e.target.value) || 0)}
                    className="mt-1"
                    placeholder="Enter total assets"
                  />
                ) : (
                  <p className="text-base font-medium visto-dark-blue">
                    {application.total_assets > 0 ? formatCurrency(application.total_assets) : 'No asset information provided'}
                  </p>
                )}
              </div>
              
              {application.income_sources && application.income_sources.length > 0 ? (
                <div>
                  <label className="text-sm font-medium visto-slate">Income Sources</label>
                  <div className="space-y-2 mt-2">
                    {application.income_sources.map((source, index) => (
                      <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                        <span className="text-sm">{source.type}</span>
                        <span className="text-sm font-medium">{formatCurrency(source.amount)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-4">
                  <p className="text-sm visto-slate">No income sources listed</p>
                </div>
              )}
              
              {application.bank_accounts && application.bank_accounts.length > 0 ? (
                <div>
                  <label className="text-sm font-medium visto-slate">Bank Accounts</label>
                  <div className="space-y-2 mt-2">
                    {application.bank_accounts.map((account, index) => (
                      <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                        <div>
                          <span className="text-sm font-medium">{account.bank_name}</span>
                          <span className="text-xs text-gray-500 ml-2">({account.account_type})</span>
                        </div>
                        <span className="text-sm font-medium">{formatCurrency(account.balance)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-4">
                  <p className="text-sm visto-slate">No bank accounts listed</p>
                </div>
              )}
              
              {/* Summary of missing information */}
              {(!application.total_income || application.total_income <= 0) && 
               (!application.total_assets || application.total_assets <= 0) && 
               (!application.income_sources || application.income_sources.length === 0) && 
               (!application.bank_accounts || application.bank_accounts.length === 0) && (
                <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-amber-600" />
                    <p className="text-sm font-medium text-amber-800">
                      Financial information not yet provided
                    </p>
                  </div>
                  <p className="text-xs text-amber-700 mt-1">
                    {dscrData ? 'DSCR calculator data is available above. Financial details can be added when editing the application.' : 'This information can be added when editing the application'}
                  </p>
                </div>
              )}

              {/* Show DSCR financial data if available */}
              {dscrData && (application.total_income <= 0 || application.total_assets <= 0) && (
                <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Calculator className="h-4 w-4 text-blue-600" />
                    <p className="text-sm font-medium text-blue-800">
                      DSCR Calculator Financial Data
                    </p>
                  </div>
                  <div className="mt-2 space-y-1 text-xs text-blue-700">
                    {dscrData.loan_amount && (
                      <div className="flex justify-between">
                        <span>Loan Amount:</span>
                        <span className="font-medium">{formatCurrency(dscrData.loan_amount)}</span>
                      </div>
                    )}
                    {dscrData.monthly_rental_income && (
                      <div className="flex justify-between">
                        <span>Monthly Rental Income:</span>
                        <span className="font-medium">{formatCurrency(dscrData.monthly_rental_income)}</span>
                      </div>
                    )}
                    {dscrData.annual_property_insurance && (
                      <div className="flex justify-between">
                        <span>Annual Insurance:</span>
                        <span className="font-medium">{formatCurrency(dscrData.annual_property_insurance)}</span>
                      </div>
                    )}
                    {dscrData.annual_property_taxes && (
                      <div className="flex justify-between">
                        <span>Annual Taxes:</span>
                        <span className="font-medium">{formatCurrency(dscrData.annual_property_taxes)}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Application Timeline */}
        <Card className="mt-8">
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
    </div>
  )
} 