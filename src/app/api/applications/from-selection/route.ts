import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser, createServerSupabaseClient } from '@/lib/auth'
import { 
  getCorrelationId, 
  logRequest, 
  logResponse, 
  logError, 
  logDebug,
  logWithCorrelation 
} from '@/lib/utils'

// POST /api/applications/from-selection - Create application from selected companies and clients
export async function POST(request: NextRequest) {
  const correlationId = getCorrelationId(request)
  
  logRequest(correlationId, request.method, request.url, 
    Object.fromEntries(request.headers.entries()))

  try {
    const { user, error: userError } = await getAuthenticatedUser(request)
    
    if (userError || !user) {
      logWithCorrelation(correlationId, 'warn', 'User not authenticated for application creation')
      
      const response = NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
      response.headers.set('x-correlation-id', correlationId)
      logResponse(correlationId, 401, 'Authentication required')
      return response
    }

    const body = await request.json()
    const { companies, clients, application_name, application_type, notes } = body

    if (!companies && !clients) {
      logWithCorrelation(correlationId, 'warn', 'No companies or clients provided')
      
      const response = NextResponse.json(
        { error: 'At least one company or client is required' },
        { status: 400 }
      )
      response.headers.set('x-correlation-id', correlationId)
      logResponse(correlationId, 400, 'No companies or clients provided')
      return response
    }

    const serverSupabase = createServerSupabaseClient()

    // Check for existing applications with the same companies and clients
    let existingApplication = null
    if (companies && companies.length > 0) {
      const { data: existingApps, error: checkError } = await serverSupabase
        .from('applications')
        .select('id, application_name')
        .eq('user_id', user.id)
        .in('id', 
          serverSupabase
            .from('client_applications')
            .select('application_id')
            .in('client_id', clients || [])
        )

      if (checkError) {
        logWithCorrelation(correlationId, 'error', 'Failed to check existing applications', {
          error: checkError.message,
          userId: user.id
        })
      } else if (existingApps && existingApps.length > 0) {
        existingApplication = existingApps[0]
      }
    }

    if (existingApplication) {
      logWithCorrelation(correlationId, 'warn', 'Application already exists', {
        existingApplicationId: existingApplication.id,
        userId: user.id
      })
      
      const response = NextResponse.json(
        { 
          error: 'An application with these companies and clients already exists',
          existingApplicationId: existingApplication.id
        },
        { status: 409 }
      )
      response.headers.set('x-correlation-id', correlationId)
      logResponse(correlationId, 409, 'Application already exists')
      return response
    }

    // Create the application
    const { data: application, error: appError } = await serverSupabase
      .from('applications')
      .insert({
        user_id: user.id,
        application_name: application_name || `Application - ${new Date().toLocaleDateString()}`,
        application_type: application_type || 'loan_application',
        notes: notes || '',
        status: 'pending'
      })
      .select()
      .single()

    if (appError) {
      logWithCorrelation(correlationId, 'error', 'Failed to create application', {
        error: appError.message,
        userId: user.id
      })
      
      const response = NextResponse.json(
        { error: 'Failed to create application' },
        { status: 500 }
      )
      response.headers.set('x-correlation-id', correlationId)
      logResponse(correlationId, 500, 'Failed to create application')
      return response
    }

    // Link companies to the application
    if (companies && companies.length > 0) {
      const companyLinks = companies.map((companyId: string) => ({
        application_id: application.id,
        company_id: companyId
      }))

      const { error: companyLinkError } = await serverSupabase
        .from('client_applications')
        .insert(companyLinks)

      if (companyLinkError) {
        logWithCorrelation(correlationId, 'error', 'Failed to link companies to application', {
          error: companyLinkError.message,
          applicationId: application.id
        })
      }
    }

    // Link clients to the application
    if (clients && clients.length > 0) {
      const clientLinks = clients.map((clientId: string) => ({
        application_id: application.id,
        client_id: clientId,
        client_role: 'primary'
      }))

      const { error: clientLinkError } = await serverSupabase
        .from('client_applications')
        .insert(clientLinks)

      if (clientLinkError) {
        logWithCorrelation(correlationId, 'error', 'Failed to link clients to application', {
          error: clientLinkError.message,
          applicationId: application.id
        })
      }
    }

    logWithCorrelation(correlationId, 'info', 'Application created successfully', {
      applicationId: application.id,
      userId: user.id,
      companiesCount: companies?.length || 0,
      clientsCount: clients?.length || 0
    })

    const response = NextResponse.json({
      success: true,
      application: application
    })
    response.headers.set('x-correlation-id', correlationId)
    logResponse(correlationId, 200, 'Application created successfully')
    return response

  } catch (error) {
    logError(correlationId, error as Error, { endpoint: '/api/applications/from-selection POST' })
    
    const response = NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
    response.headers.set('x-correlation-id', correlationId)
    logResponse(correlationId, 500, 'Internal server error')
    return response
  }
} 