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

    // Use the database transaction function for opportunity creation
    logWithCorrelation(correlationId, 'info', 'Starting opportunity creation via database transaction')
    
    const { data: result, error: transactionError } = await serverSupabase.rpc('create_opportunity_with_transaction', {
      p_user_id: user.id,
      p_companies: companies || [],
      p_clients: clients || [],
      p_application_name: application_name || `Application - ${new Date().toLocaleDateString()}`,
      p_application_type: application_type || 'loan_application',
      p_notes: notes || ''
    })

    if (transactionError) {
      logWithCorrelation(correlationId, 'error', 'Opportunity creation failed', {
        error: transactionError.message,
        userId: user.id
      })
      
      // Check if it's a duplicate application error
      if (transactionError.message.includes('already exists')) {
        const response = NextResponse.json(
          { error: 'An application with these companies and clients already exists' },
          { status: 409 }
        )
        response.headers.set('x-correlation-id', correlationId)
        logResponse(correlationId, 409, 'Application already exists')
        return response
      }
      
      const response = NextResponse.json(
        { error: 'Failed to create application' },
        { status: 500 }
      )
      response.headers.set('x-correlation-id', correlationId)
      logResponse(correlationId, 500, 'Opportunity creation failed')
      return response
    }

    logWithCorrelation(correlationId, 'info', 'Opportunity created successfully via database transaction', {
      applicationId: result.application_id,
      userId: user.id,
      companiesCount: result.processed_company_ids?.length || 0,
      clientsCount: result.processed_client_ids?.length || 0
    })

    const response = NextResponse.json({
      success: true,
      application: {
        id: result.application_id,
        processed_client_ids: result.processed_client_ids,
        processed_company_ids: result.processed_company_ids
      }
    })
    response.headers.set('x-correlation-id', correlationId)
    logResponse(correlationId, 200, 'Opportunity created successfully')
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