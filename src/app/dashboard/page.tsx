'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { toast } from 'sonner'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ApplicationsTable } from '@/components/dashboard/applications-table'
import { EnhancedApplicationForm } from '@/components/dashboard/enhanced-application-form'
import { getDashboardStats, getLoanApplications, deleteLoanApplication } from '@/lib/loan-applications'
import type { DashboardStats, LoanApplicationWithBorrower, LoanApplicationStatus } from '@/types'
import { Plus, Users, TrendingUp, DollarSign, FileText } from 'lucide-react'

export const dynamic = 'force-dynamic'

// Generate a unique request ID for this component instance
const generateRequestId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

export default function DashboardPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [applications, setApplications] = useState<LoanApplicationWithBorrower[]>([])
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
      // Load both stats and applications
      console.log(`[${requestId}] Fetching dashboard stats and applications`)
      const [statsResult, applicationsResult] = await Promise.all([
        getDashboardStats(),
        getLoanApplications()
      ])
      
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

      console.log(`[${requestId}] Applications result`, {
        hasError: !!applicationsResult.error,
        error: applicationsResult.error,
        applicationsCount: applicationsResult.applications?.length || 0
      })

      if (applicationsResult.error) {
        if (applicationsResult.error.includes('Authentication required')) {
          console.log(`[${requestId}] Authentication required for applications, redirecting to login`)
          toast.error('Please log in to access applications')
          router.push('/login')
          return
        } else if (applicationsResult.error.includes('Onboarding required')) {
          console.log(`[${requestId}] Onboarding required for applications, redirecting to onboarding`)
          // User needs to complete onboarding, redirect them
          router.push('/onboarding')
          return
        } else {
          console.log(`[${requestId}] Applications error`, { error: applicationsResult.error })
          toast.error(`Failed to load applications: ${applicationsResult.error}`)
        }
        console.error('Applications error:', applicationsResult.error)
      } else {
        console.log(`[${requestId}] Setting applications`, {
          count: applicationsResult.applications?.length || 0
        })
        setApplications(applicationsResult.applications || [])
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

  const handleStatusClick = useCallback((status: LoanApplicationStatus) => {
    console.log(`[${requestId}] Status clicked`, { status })
    // Future: Navigate to filtered view of applications by status
    console.log(`Clicked on ${status} status`)
    toast.info(`Viewing ${status} applications - Coming soon!`)
  }, [requestId])

  const handleApplicationSuccess = useCallback(() => {
    console.log(`[${requestId}] Application created successfully`)
    setShowApplicationForm(false)
    setDataLoaded(false) // Reset to trigger data reload
    loadDashboardData() // Refresh data after new application
    toast.success('Application created successfully!')
  }, [loadDashboardData, requestId])

  const handleViewApplication = useCallback((application: LoanApplicationWithBorrower) => {
    console.log(`[${requestId}] Viewing application`, {
      applicationId: application.id,
      borrowerName: application.first_name,
      status: application.status
    })
    // Navigate to the view application page
    router.push(`/dashboard/applications/${application.id}`)
  }, [router, requestId])

  const handleDeleteApplication = useCallback(async (application: LoanApplicationWithBorrower) => {
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
        setDataLoaded(false) // Reset to trigger data reload
        loadDashboardData() // Refresh data
      }
    } catch (error) {
      console.error('Error deleting application:', error)
      toast.error('Failed to delete application')
    }
  }, [loadDashboardData])

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
    <div className="flex-1 space-y-8 p-8">
      {/* Dashboard Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold visto-dark-blue tracking-tight">
            My Clients
          </h1>
          <p className="text-xl visto-slate mt-2">
            Manage your loan applications and track client progress
          </p>
        </div>
        
        <Button
          onClick={() => setShowApplicationForm(true)}
          className="px-8 py-4 text-lg bg-primary hover:bg-primary/90 text-primary-foreground font-semibold tracking-wide transition-all duration-200 shadow-lg hover:shadow-xl"
        >
          <Plus className="w-5 h-5 mr-3" />
          Create New Application
        </Button>
      </div>

      {/* Quick Stats Overview */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="border-2 border-primary/20 bg-gradient-visto-subtle">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-semibold visto-dark-blue">
                  Total Clients
                </CardTitle>
                <Users className="h-6 w-6 visto-gold" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold visto-dark-blue">
                {stats.total}
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 border-green-200 bg-green-50">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-semibold visto-dark-blue">
                  Approved
                </CardTitle>
                <TrendingUp className="h-6 w-6 text-green-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-700">
                {stats.approved}
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 border-blue-200 bg-blue-50">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-semibold visto-dark-blue">
                  In Review
                </CardTitle>
                <FileText className="h-6 w-6 text-blue-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-700">
                {stats.in_review}
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 border-yellow-200 bg-yellow-50">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-semibold visto-dark-blue">
                  Pending Docs
                </CardTitle>
                <DollarSign className="h-6 w-6 text-yellow-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-yellow-700">
                {stats.missing_conditions + (stats.pending_documents || 0)}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Status Cards */}
      {stats && (
        <div>
          <h2 className="text-2xl font-semibold visto-dark-blue tracking-tight mb-6">
            Application Status Overview
          </h2>
          {/* StatusCards component was removed, so this section is now empty */}
        </div>
      )}

      {/* Applications Table */}
      <div>
        <ApplicationsTable
          applications={applications}
          isLoading={isLoading}
          onViewApplication={handleViewApplication}
          onDeleteApplication={handleDeleteApplication}
          onExportData={handleExportData}
        />
      </div>

      {/* Empty State */}
      {stats && stats.total === 0 && (
        <Card className="border-2 border-dashed border-primary/30 bg-gradient-visto-subtle">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <FileText className="h-16 w-16 visto-gold mb-6" />
            <h3 className="text-2xl font-semibold visto-dark-blue mb-3">
              No client applications yet
            </h3>
            <p className="text-lg visto-slate mb-8 max-w-lg">
              Start building your client portfolio by creating your first comprehensive loan application. 
              Track progress and manage all applications in one place.
            </p>
            <Button
              onClick={() => setShowApplicationForm(true)}
              className="px-12 py-4 text-lg bg-primary hover:bg-primary/90 text-primary-foreground font-semibold tracking-wide transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              <Plus className="w-5 h-5 mr-3" />
              Create First Application
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
