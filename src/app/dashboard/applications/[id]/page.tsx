'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { LoanApplication, Loan } from '@/types'
import { 
  ArrowLeft, 
  FileText, 
  DollarSign, 
  Calendar,
  Edit,
  Trash2,
  Building2
} from 'lucide-react'
import { toast } from 'sonner'
import { format } from 'date-fns'

interface ApplicationWithLoans extends LoanApplication {
  loans: Loan[]
}

export default function ViewApplicationPage() {
  const params = useParams()
  const router = useRouter()
  const [application, setApplication] = useState<ApplicationWithLoans | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [editedApplication, setEditedApplication] = useState<ApplicationWithLoans | null>(null)

  const applicationId = params.id as string

  useEffect(() => {
    const loadApplication = async () => {
      if (!applicationId) return

      setIsLoading(true)
      try {
        const response = await fetch(`/api/applications/${applicationId}`)
        
        if (!response.ok) {
          const error = await response.json()
          toast.error(error.error || 'Failed to load application')
          router.push('/dashboard')
          return
        }

        const data = await response.json()
        setApplication(data.application)
        setEditedApplication(data.application)
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
  }

  const handleSave = async () => {
    if (!editedApplication) return
    
    try {
      const response = await fetch(`/api/applications/${applicationId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          application_name: editedApplication.application_name,
          application_type: editedApplication.application_type,
          notes: editedApplication.notes,
          status: editedApplication.status
        })
      })

      if (!response.ok) {
        const error = await response.json()
        toast.error(error.error || 'Failed to update application')
        return
      }

      const data = await response.json()
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
      const response = await fetch(`/api/applications/${applicationId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const error = await response.json()
        toast.error(error.error || 'Failed to delete application')
        return
      }

      toast.success('Application deleted successfully')
      router.push('/dashboard')
    } catch (error) {
      console.error('Error deleting application:', error)
      toast.error('Failed to delete application')
    }
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