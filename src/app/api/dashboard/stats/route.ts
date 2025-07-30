import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser, createServerSupabaseClient } from '@/lib/auth'
import type { DashboardStats, LoanApplicationStatus } from '@/types'
import { 
  getCorrelationId, 
  logRequest, 
  logResponse, 
  logError, 
  logDebug,
  logWithCorrelation 
} from '@/lib/utils'

// GET /api/dashboard/stats - Get dashboard statistics
export async function GET(request: NextRequest) {
  const correlationId = getCorrelationId(request)
  
  // Log the incoming request
  logRequest(correlationId, request.method, request.url, 
    Object.fromEntries(request.headers.entries()))

  try {
    logWithCorrelation(correlationId, 'info', 'Getting dashboard stats for user')
    
    const { user, error: userError } = await getAuthenticatedUser(request)
    
    if (userError || !user) {
      logWithCorrelation(correlationId, 'warn', 'User not authenticated for dashboard stats', {
        error: userError?.message,
        hasUser: !!user
      })
      
      const response = NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
      response.headers.set('x-correlation-id', correlationId)
      logResponse(correlationId, 401, 'Authentication required')
      return response
    }

    logWithCorrelation(correlationId, 'info', 'User authenticated for dashboard stats', {
      userId: user.id,
      userEmail: user.email
    })

    const serverSupabase = createServerSupabaseClient()

    // Get partner profile
    logWithCorrelation(correlationId, 'debug', 'Fetching partner profile')
    
    const { data: partnerProfile, error: partnerError } = await serverSupabase
      .from('partner_profiles')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (partnerError) {
      // If table doesn't exist or no profile found, user needs onboarding
      if (partnerError.code === '42P01' || partnerError.code === 'PGRST116') {
        logWithCorrelation(correlationId, 'warn', 'Partner profile not found - onboarding required', {
          error: partnerError.message,
          code: partnerError.code
        })
        
        const response = NextResponse.json(
          { error: 'Onboarding required', needsOnboarding: true },
          { status: 403 }
        )
        response.headers.set('x-correlation-id', correlationId)
        logResponse(correlationId, 403, 'Onboarding required')
        return response
      }
      
      logWithCorrelation(correlationId, 'error', 'Partner profile error', {
        error: partnerError.message,
        code: partnerError.code
      })
      
      const response = NextResponse.json(
        { error: 'Partner profile not found' },
        { status: 404 }
      )
      response.headers.set('x-correlation-id', correlationId)
      logResponse(correlationId, 404, 'Partner profile not found')
      return response
    }

    if (!partnerProfile) {
      logWithCorrelation(correlationId, 'warn', 'No partner profile found - onboarding required')
      
      const response = NextResponse.json(
        { error: 'Onboarding required', needsOnboarding: true },
        { status: 403 }
      )
      response.headers.set('x-correlation-id', correlationId)
      logResponse(correlationId, 403, 'Onboarding required')
      return response
    }

    logWithCorrelation(correlationId, 'debug', 'Partner profile found', {
      partnerId: partnerProfile.id
    })

    // Get application counts by status using the correct table name
    logWithCorrelation(correlationId, 'debug', 'Fetching applications from database')
    
    const { data: statusCounts, error: statsError } = await serverSupabase
      .from('applications')
      .select('status')
      .eq('user_id', user.id)

    if (statsError) {
      logWithCorrelation(correlationId, 'error', 'Failed to fetch dashboard stats', {
        error: statsError.message,
        userId: user.id
      })
      
      const response = NextResponse.json(
        { error: 'Failed to fetch dashboard statistics' },
        { status: 500 }
      )
      response.headers.set('x-correlation-id', correlationId)
      logResponse(correlationId, 500, 'Failed to fetch dashboard statistics')
      return response
    }

    logWithCorrelation(correlationId, 'info', 'Applications fetched for stats', {
      userId: user.id,
      applicationCount: statusCounts?.length || 0
    })

    // Calculate stats
    const stats: DashboardStats = {
      in_review: 0,
      approved: 0,
      ineligible: 0,
      denied: 0,
      closed: 0,
      missing_conditions: 0,
      pending_documents: 0,
      total: statusCounts?.length || 0
    }

    // Count applications by status
    statusCounts?.forEach((app: { status: LoanApplicationStatus }) => {
      if (app.status in stats) {
        stats[app.status as keyof DashboardStats] += 1
      }
    })

    logWithCorrelation(correlationId, 'info', 'Dashboard stats calculated', {
      userId: user.id,
      total: stats.total,
      in_review: stats.in_review,
      approved: stats.approved,
      ineligible: stats.ineligible,
      denied: stats.denied,
      closed: stats.closed,
      missing_conditions: stats.missing_conditions,
      pending_documents: stats.pending_documents
    })

    const response = NextResponse.json({
      stats,
      success: true
    })
    response.headers.set('x-correlation-id', correlationId)
    logResponse(correlationId, 200, 'Dashboard stats fetched successfully')
    return response

  } catch (error) {
    logError(correlationId, error as Error, { endpoint: '/api/dashboard/stats GET' })
    
    const response = NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
    response.headers.set('x-correlation-id', correlationId)
    logResponse(correlationId, 500, 'Internal server error')
    return response
  }
} 