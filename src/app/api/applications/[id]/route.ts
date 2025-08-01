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

interface RouteParams {
  params: Promise<{ id: string }>
}

// GET /api/applications/[id] - Get a specific application
export async function GET(request: NextRequest, { params }: RouteParams) {
  const correlationId = getCorrelationId(request)
  
  logRequest(correlationId, request.method, request.url, 
    Object.fromEntries(request.headers.entries()))

  try {
    const { id } = await params
    logWithCorrelation(correlationId, 'info', 'Fetching application', { applicationId: id })
    
    const { user, error: userError } = await getAuthenticatedUser(request)
    
    if (userError || !user) {
      logWithCorrelation(correlationId, 'warn', 'User not authenticated for application fetch')
      
      const response = NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
      response.headers.set('x-correlation-id', correlationId)
      logResponse(correlationId, 401, 'Authentication required')
      return response
    }

    const serverSupabase = createServerSupabaseClient()

    // Get the specific application with loans, clients, and companies
    const { data: application, error } = await serverSupabase
      .from('applications')
      .select(`
        *,
        loans (*),
        client_applications (
          client_id,
          clients (
            *,
            client_companies (
              company_id,
              companies (*)
            )
          )
        )
      `)
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        logWithCorrelation(correlationId, 'warn', 'Application not found', { applicationId: id })
        
        const response = NextResponse.json(
          { error: 'Application not found' },
          { status: 404 }
        )
        response.headers.set('x-correlation-id', correlationId)
        logResponse(correlationId, 404, 'Application not found')
        return response
      }
      
      logWithCorrelation(correlationId, 'error', 'Failed to fetch application', {
        error: error.message,
        applicationId: id,
        userId: user.id
      })
      
      const response = NextResponse.json(
        { error: 'Failed to fetch application' },
        { status: 500 }
      )
      response.headers.set('x-correlation-id', correlationId)
      logResponse(correlationId, 500, 'Failed to fetch application')
      return response
    }

    logWithCorrelation(correlationId, 'info', 'Application fetched successfully', {
      applicationId: id,
      userId: user.id
    })

    const response = NextResponse.json({
      application,
      success: true
    })
    response.headers.set('x-correlation-id', correlationId)
    logResponse(correlationId, 200, 'Application fetched successfully')
    return response

  } catch (error) {
    logError(correlationId, error as Error, { endpoint: '/api/applications/[id] GET' })
    
    const response = NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
    response.headers.set('x-correlation-id', correlationId)
    logResponse(correlationId, 500, 'Internal server error')
    return response
  }
}

// PUT /api/applications/[id] - Update a specific application
export async function PUT(request: NextRequest, { params }: RouteParams) {
  const correlationId = getCorrelationId(request)
  
  logRequest(correlationId, request.method, request.url, 
    Object.fromEntries(request.headers.entries()))

  try {
    const { id } = await params
    logWithCorrelation(correlationId, 'info', 'Updating application', { applicationId: id })
    
    const { user, error: userError } = await getAuthenticatedUser(request)
    
    if (userError || !user) {
      logWithCorrelation(correlationId, 'warn', 'User not authenticated for application update')
      
      const response = NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
      response.headers.set('x-correlation-id', correlationId)
      logResponse(correlationId, 401, 'Authentication required')
      return response
    }

    const serverSupabase = createServerSupabaseClient()
    const updateData = await request.json()

    // Update the application
    const { data: application, error } = await serverSupabase
      .from('applications')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single()

    if (error) {
      logWithCorrelation(correlationId, 'error', 'Failed to update application', {
        error: error.message,
        applicationId: id,
        userId: user.id
      })
      
      const response = NextResponse.json(
        { error: 'Failed to update application' },
        { status: 500 }
      )
      response.headers.set('x-correlation-id', correlationId)
      logResponse(correlationId, 500, 'Failed to update application')
      return response
    }

    logWithCorrelation(correlationId, 'info', 'Application updated successfully', {
      applicationId: id,
      userId: user.id
    })

    const response = NextResponse.json({
      application,
      success: true
    })
    response.headers.set('x-correlation-id', correlationId)
    logResponse(correlationId, 200, 'Application updated successfully')
    return response

  } catch (error) {
    logError(correlationId, error as Error, { endpoint: '/api/applications/[id] PUT' })
    
    const response = NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
    response.headers.set('x-correlation-id', correlationId)
    logResponse(correlationId, 500, 'Internal server error')
    return response
  }
}

// DELETE /api/applications/[id] - Delete a specific application
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const correlationId = getCorrelationId(request)
  const { id } = await params
  logRequest(correlationId, request.method, request.url, 
    Object.fromEntries(request.headers.entries()))

  try {
    logWithCorrelation(correlationId, 'info', 'Deleting application', { applicationId: id })
    
    const { user, error: userError } = await getAuthenticatedUser(request)
    
    if (userError || !user) {
      logWithCorrelation(correlationId, 'warn', 'User not authenticated for application deletion')
      
      const response = NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
      response.headers.set('x-correlation-id', correlationId)
      logResponse(correlationId, 401, 'Authentication required')
      return response
    }

    const serverSupabase = createServerSupabaseClient()

    // First, delete associated loans
    const { error: loansError } = await serverSupabase
      .from('loans')
      .delete()
      .eq('application_id', id)

    if (loansError) {
      logWithCorrelation(correlationId, 'warn', 'Failed to delete associated loans', {
        error: loansError.message,
        applicationId: id
      })
      // Continue with application deletion even if loans deletion fails
    }

    // Delete associated client applications
    const { error: clientAppsError } = await serverSupabase
      .from('client_applications')
      .delete()
      .eq('application_id', id)

    if (clientAppsError) {
      logWithCorrelation(correlationId, 'warn', 'Failed to delete associated client applications', {
        error: clientAppsError.message,
        applicationId: id
      })
      // Continue with application deletion even if client applications deletion fails
    }

    // Delete application conditions
    const { error: conditionsError } = await serverSupabase
      .from('application_conditions')
      .delete()
      .eq('application_id', id)

    if (conditionsError) {
      logWithCorrelation(correlationId, 'warn', 'Failed to delete associated conditions', {
        error: conditionsError.message,
        applicationId: id
      })
      // Continue with application deletion even if conditions deletion fails
    }

    // Finally, delete the application
    const { error } = await serverSupabase
      .from('applications')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id) // Ensure user can only delete their own applications

    if (error) {
      logWithCorrelation(correlationId, 'error', 'Failed to delete application', {
        error: error.message,
        applicationId: id,
        userId: user.id
      })
      
      const response = NextResponse.json(
        { error: 'Failed to delete application' },
        { status: 500 }
      )
      response.headers.set('x-correlation-id', correlationId)
      logResponse(correlationId, 500, 'Failed to delete application')
      return response
    }

    logWithCorrelation(correlationId, 'info', 'Application deleted successfully', {
      applicationId: id,
      userId: user.id
    })

    const response = NextResponse.json({ success: true })
    response.headers.set('x-correlation-id', correlationId)
    logResponse(correlationId, 200, 'Application deleted successfully')
    return response

  } catch (error) {
    logError(correlationId, error as Error, { endpoint: '/api/applications/[id] DELETE' })
    
    const response = NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
    response.headers.set('x-correlation-id', correlationId)
    logResponse(correlationId, 500, 'Internal server error')
    return response
  }
} 