'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { getLoanApplication } from '@/lib/loan-applications'
import { EnhancedApplicationForm } from '@/components/dashboard/enhanced-application-form'
import type { LoanApplicationWithBorrower, LoanObjective } from '@/types'
import { ArrowLeft, Edit, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

export default function EditApplicationPage() {
  const params = useParams()
  const router = useRouter()
  const [application, setApplication] = useState<LoanApplicationWithBorrower | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)

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

  const handleEditSuccess = () => {
    toast.success('Application updated successfully!')
    router.push(`/dashboard/applications/${applicationId}`)
  }

  const handleEditCancel = () => {
    router.push(`/dashboard/applications/${applicationId}`)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-visto-gold" />
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
              onClick={() => router.push(`/dashboard/applications/${applicationId}`)}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Application
            </Button>
            <div>
              <h1 className="text-3xl font-bold visto-dark-blue">
                Edit Application
              </h1>
              <p className="text-lg visto-slate">
                {application.first_name} {application.last_name}
              </p>
            </div>
          </div>
          
          <Badge className="bg-visto-gold text-white">
            <Edit className="h-3 w-3 mr-1" />
            Editing
          </Badge>
        </div>

        {/* Edit Form */}
        <Card className="border-2 border-visto-gold/20">
          <CardHeader>
            <CardTitle className="text-xl font-semibold visto-dark-blue flex items-center gap-2">
              <Edit className="h-5 w-5 text-visto-gold" />
              Application Details
            </CardTitle>
          </CardHeader>
          <CardContent>
            <EnhancedApplicationForm
              onSuccess={handleEditSuccess}
              onCancel={handleEditCancel}
              initialData={{
                application_name: application.application_name || `Application for ${application.first_name || 'Client'}`,
                application_type: 'loan_application',
                notes: application.notes || '',
                has_company: false,
                company: undefined,
                clients: [{
                  first_name: application.first_name || '',
                  last_name: application.last_name || '',
                  email: application.email || '',
                  phone_number: application.phone_number || '',
                  ssn: application.ssn || '',
                  date_of_birth: application.date_of_birth || '',
                  current_residence: application.current_residence || '',
                  total_income: application.total_income || 0,
                  income_sources: application.income_sources || [],
                  income_documents: [],
                  total_assets: application.total_assets || 0,
                  bank_accounts: application.bank_accounts || [],
                  bank_statements: [],
                  has_company: false,
                  company: undefined
                }],

              }}
              isEditing={true}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 