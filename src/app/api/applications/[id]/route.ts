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
  try {
    const { id } = await params
    const { user, error: userError } = await getAuthenticatedUser(request)
    
    if (userError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const serverSupabase = createServerSupabaseClient()

    // Get partner profile
    const { data: partnerProfile, error: partnerError } = await serverSupabase
      .from('partner_profiles')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (partnerError || !partnerProfile) {
      return NextResponse.json(
        { error: 'Partner profile not found' },
        { status: 404 }
      )
    }

    // Get the specific application
    const { data: application, error } = await serverSupabase
      .from('loan_applications')
      .select('*')
      .eq('id', id)
      .eq('partner_id', partnerProfile.id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
      return NextResponse.json(
        { error: 'Application not found' },
        { status: 404 }
        )
      }
      console.error('Error fetching application:', error)
      return NextResponse.json(
        { error: 'Failed to fetch application' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      application,
      success: true
    })

  } catch (error) {
    console.error('Unexpected error in GET /api/applications/[id]:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT /api/applications/[id] - Update a specific application
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const { user, error: userError } = await getAuthenticatedUser(request)
    
    if (userError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const serverSupabase = createServerSupabaseClient()

    // Get partner profile
    const { data: partnerProfile, error: partnerError } = await serverSupabase
      .from('partner_profiles')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (partnerError || !partnerProfile) {
      return NextResponse.json(
        { error: 'Partner profile not found' },
        { status: 404 }
      )
    }

    const updateData = await request.json()

    // Update the application
    const { data: application, error } = await serverSupabase
      .from('loan_applications')
      .update(updateData)
      .eq('id', id)
      .eq('partner_id', partnerProfile.id)
      .select()
      .single()

    if (error) {
      console.error('Error updating application:', error)
      return NextResponse.json(
        { error: 'Failed to update application' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      application,
      success: true
    })

  } catch (error) {
    console.error('Unexpected error in PUT /api/applications/[id]:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE /api/applications/[id] - Delete a specific application
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const correlationId = getCorrelationId(request)
  
  logRequest(correlationId, request.method, request.url, 
    Object.fromEntries(request.headers.entries()))

  try {
    logWithCorrelation(correlationId, 'info', 'Deleting application', { applicationId: params.id })
    
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
      .eq('application_id', params.id)

    if (loansError) {
      logWithCorrelation(correlationId, 'warn', 'Failed to delete associated loans', {
        error: loansError.message,
        applicationId: params.id
      })
      // Continue with application deletion even if loans deletion fails
    }

    // Delete associated client applications
    const { error: clientAppsError } = await serverSupabase
      .from('client_applications')
      .delete()
      .eq('application_id', params.id)

    if (clientAppsError) {
      logWithCorrelation(correlationId, 'warn', 'Failed to delete associated client applications', {
        error: clientAppsError.message,
        applicationId: params.id
      })
      // Continue with application deletion even if client applications deletion fails
    }

    // Delete application conditions
    const { error: conditionsError } = await serverSupabase
      .from('application_conditions')
      .delete()
      .eq('application_id', params.id)

    if (conditionsError) {
      logWithCorrelation(correlationId, 'warn', 'Failed to delete associated conditions', {
        error: conditionsError.message,
        applicationId: params.id
      })
      // Continue with application deletion even if conditions deletion fails
    }

    // Finally, delete the application
    const { error } = await serverSupabase
      .from('applications')
      .delete()
      .eq('id', params.id)
      .eq('user_id', user.id) // Ensure user can only delete their own applications

    if (error) {
      logWithCorrelation(correlationId, 'error', 'Failed to delete application', {
        error: error.message,
        applicationId: params.id,
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
      applicationId: params.id,
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