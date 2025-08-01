'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { toast } from 'sonner'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ClientsCompaniesTable } from '@/components/dashboard/clients-companies-table'
import { ApplicationsTable } from '@/components/dashboard/applications-table'
import { EnhancedApplicationForm } from '@/components/dashboard/enhanced-application-form'
import { getDashboardStats } from '@/lib/loan-applications'
import type { DashboardStats, Client, Company } from '@/types'
import { Plus, Users, TrendingUp, DollarSign, FileText, Building } from 'lucide-react'

export const dynamic = 'force-dynamic'

// Generate a unique request ID for this component instance
const generateRequestId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

export default function DashboardPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [showApplicationForm, setShowApplicationForm] = useState(false)
  const [dataLoaded, setDataLoaded] = useState(false)
  const requestId = useMemo(() => generateRequestId(), [])

  console.log(`[${requestId}] DashboardPage component initialized`)

  // Check for query parameter to show application form
  useEffect(() => {
    const shouldShowForm = searchParams.get('showApplicationForm') === 'true'
    console.log(`[${requestId}] Checking search params for application form`, {
      shouldShowForm,
      searchParams: Object.fromEntries(searchParams.entries())
    })
    if (shouldShowForm) {
      console.log(`[${requestId}] Setting showApplicationForm to true`)
      setShowApplicationForm(true)
    }
  }, [searchParams, requestId])

  const loadDashboardData = useCallback(async () => {
    // Prevent multiple simultaneous calls
    if (isLoading && dataLoaded) {
      console.log(`[${requestId}] Skipping data load - already loading or loaded`)
      return
    }

    console.log(`[${requestId}] Loading dashboard data`)
    setIsLoading(true)
    try {
      // Load stats only
      console.log(`[${requestId}] Fetching dashboard stats`)
      const statsResult = await getDashboardStats()
      
      console.log(`[${requestId}] Dashboard stats result`, {
        hasError: !!statsResult.error,
        error: statsResult.error,
        hasStats: !!statsResult.stats
      })
      
      if (statsResult.error) {
        if (statsResult.error.includes('Authentication required')) {
          console.log(`[${requestId}] Authentication required, redirecting to login`)
          toast.error('Please log in to access the dashboard')
          router.push('/login')
          return
        } else if (statsResult.error.includes('Onboarding required')) {
          console.log(`[${requestId}] Onboarding required, redirecting to onboarding`)
          // User needs to complete onboarding, redirect them
          router.push('/onboarding')
          return
        } else {
          console.log(`[${requestId}] Dashboard stats error`, { error: statsResult.error })
          toast.error(`Failed to load dashboard stats: ${statsResult.error}`)
        }
        console.error('Dashboard stats error:', statsResult.error)
      } else {
        console.log(`[${requestId}] Setting dashboard stats`, {
          statsCount: statsResult.stats ? Object.keys(statsResult.stats).length : 0
        })
        setStats(statsResult.stats)
      }
    } catch (error) {
      console.error(`[${requestId}] Unexpected error loading dashboard:`, error)
      toast.error('An unexpected error occurred')
    } finally {
      setIsLoading(false)
      setDataLoaded(true)
      console.log(`[${requestId}] Dashboard data loading completed`)
    }
  }, [router, requestId, isLoading, dataLoaded])

  // Only load data once when component mounts
  useEffect(() => {
    console.log(`[${requestId}] Dashboard useEffect triggered`)
    if (!dataLoaded) {
      loadDashboardData()
    }
  }, [loadDashboardData, dataLoaded, requestId])

  const handleApplicationSuccess = useCallback(() => {
    console.log(`[${requestId}] Application created successfully`)
    setShowApplicationForm(false)
    setDataLoaded(false) // Reset to trigger data reload
    loadDashboardData() // Refresh data after new application
    toast.success('Application created successfully!')
  }, [loadDashboardData, requestId])



  const handleEditClient = useCallback((client: Client) => {
    console.log(`[${requestId}] Edit client clicked`, { clientId: client.id })
    toast.info('Edit client functionality - Coming soon!')
  }, [requestId])

  const handleEditCompany = useCallback((company: Company) => {
    console.log(`[${requestId}] Edit company clicked`, { companyId: company.id })
    toast.info('Edit company functionality - Coming soon!')
  }, [requestId])

  const handleDeleteClient = useCallback((clientId: string) => {
    console.log(`[${requestId}] Delete client clicked`, { clientId })
    toast.info('Delete client functionality - Coming soon!')
  }, [requestId])

  const handleDeleteCompany = useCallback((companyId: string) => {
    console.log(`[${requestId}] Delete company clicked`, { companyId })
    toast.info('Delete company functionality - Coming soon!')
  }, [requestId])



  const handleEditApplication = useCallback((application: any) => {
    console.log(`[${requestId}] Edit application clicked`, { applicationId: application.id })
    router.push(`/dashboard/applications/${application.id}/edit`)
  }, [requestId, router])

  const handleDeleteApplication = useCallback(async (applicationId: string) => {
    console.log(`[${requestId}] Delete application clicked`, { applicationId })
    
    if (!confirm('Are you sure you want to delete this application? This action cannot be undone.')) {
      return
    }

    try {
      const response = await fetch(`/api/applications/${applicationId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        toast.success('Application deleted successfully')
        // Reload the applications table
        setDataLoaded(false)
        loadDashboardData()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to delete application')
      }
    } catch (error) {
      console.error('Error deleting application:', error)
      toast.error('Failed to delete application')
    }
  }, [requestId, loadDashboardData])

  const handleViewApplication = useCallback((application: any) => {
    console.log(`[${requestId}] View application clicked`, { applicationId: application.id })
    router.push(`/dashboard/applications/${application.id}`)
  }, [requestId, router])

  const handleExportData = () => {
    // Future: Export applications to CSV/Excel
    console.log('Exporting data...')
    toast.info('Export functionality - Coming soon!')
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-lg visto-slate">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  if (showApplicationForm) {
    return (
      <div className="container mx-auto p-6">
        <EnhancedApplicationForm
          onSuccess={handleApplicationSuccess}
          onCancel={() => setShowApplicationForm(false)}
        />
      </div>
    )
  }

  return (
    <div className="flex-1 space-y-3 p-4 h-full flex flex-col">
      {/* Dashboard Header */}
      <div className="flex items-center justify-between flex-shrink-0">
        <div>
          <h1 className="text-2xl font-bold visto-dark-blue tracking-tight">
            My Clients
          </h1>
          <p className="text-sm visto-slate mt-1">
            Manage your Opportunities and track client progress
          </p>
        </div>
        
        <Button
          onClick={() => setShowApplicationForm(true)}
          className="px-6 py-2 text-sm bg-primary hover:bg-primary/90 text-primary-foreground font-semibold tracking-wide transition-all duration-200 shadow-lg hover:shadow-xl"
        >
          <Plus className="w-4 h-4 mr-2" />
          Create New Opportunity
        </Button>
      </div>

      {/* Quick Stats Overview */}
      {stats && (
        <div className="flex-shrink-0">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Card className="border-2 border-primary/20 bg-gradient-visto-subtle">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-semibold visto-dark-blue">
                    Total Clients
                  </CardTitle>
                  <Users className="h-4 w-4 visto-gold" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-xl font-bold visto-dark-blue">
                  {stats.in_review}
                </div>
              </CardContent>
            </Card>

            <Card className="border-2 border-green-200 bg-green-50">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-semibold visto-dark-blue">
                    Total Companies
                  </CardTitle>
                  <Building className="h-4 w-4 text-green-600" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-xl font-bold text-green-700">
                  {stats.approved}
                </div>
              </CardContent>
            </Card>

            <Card className="border-2 border-yellow-200 bg-yellow-50">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-semibold visto-dark-blue">
                    Applications
                  </CardTitle>
                  <DollarSign className="h-4 w-4 text-yellow-600" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-xl font-bold text-yellow-700">
                  {stats.ineligible}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Tables Container */}
      <div className="flex-1 flex flex-col gap-3 min-h-0">
        {/* Clients & Companies Table */}
        <div className="flex-1 min-h-0">
          <ClientsCompaniesTable
            onEditClient={handleEditClient}
            onEditCompany={handleEditCompany}
            onDeleteClient={handleDeleteClient}
            onDeleteCompany={handleDeleteCompany}
          />
        </div>

        {/* Applications Table */}
        <div className="flex-1 min-h-0">
          <ApplicationsTable
            onEditApplication={handleEditApplication}
            onDeleteApplication={handleDeleteApplication}
            onViewApplication={handleViewApplication}
          />
        </div>
      </div>
    </div>
  )
}
