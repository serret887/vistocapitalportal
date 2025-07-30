'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { BorrowerApplicationsTable } from '@/components/dashboard/borrower-applications-table'
import { Plus } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

interface BorrowerApplication {
  id: string
  application_name: string
  application_type: string
  status: string
  notes?: string
  created_at: string
  updated_at: string
  borrower_applications: Array<{
    borrower_role: string
    borrowers: {
      id: string
      first_name: string
      last_name: string
      email?: string
      phone_number?: string
      borrower_companies?: Array<{
        ownership_percentage?: number
        role_in_company?: string
        companies: {
          id: string
          company_name: string
          company_type?: string
        }
      }>
    }
  }>
}

export default function ApplicationsPage() {
  const [applications, setApplications] = useState<BorrowerApplication[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    fetchApplications()
  }, [])

  const fetchApplications = async () => {
    try {
      const response = await fetch('/api/applications/borrower')
      const data = await response.json()

      if (!response.ok) {
        toast.error(data.error || 'Failed to fetch applications')
        return
      }

      setApplications(data.applications || [])
    } catch (error) {
      console.error('Fetch applications error:', error)
      toast.error('An unexpected error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  const handleViewApplication = (application: BorrowerApplication) => {
    router.push(`/dashboard/applications/${application.id}`)
  }

  const handleEditApplication = (application: BorrowerApplication) => {
    router.push(`/dashboard/applications/${application.id}/edit`)
  }

  const handleDeleteApplication = (applicationId: string) => {
    setApplications(prev => prev.filter(app => app.id !== applicationId))
  }

  const handleCreateNew = () => {
    router.push('/dashboard/applications/new')
  }

  if (isLoading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold visto-dark-blue">Applications</h1>
          <p className="text-lg text-gray-600 mt-2">
            Manage your borrower applications and their associated information
          </p>
        </div>
        <Button onClick={handleCreateNew} className="bg-primary hover:bg-primary/90">
          <Plus className="w-4 h-4 mr-2" />
          New Application
        </Button>
      </div>

      <BorrowerApplicationsTable
        applications={applications}
        onViewApplication={handleViewApplication}
        onEditApplication={handleEditApplication}
        onDeleteApplication={handleDeleteApplication}
      />
    </div>
  )
} 