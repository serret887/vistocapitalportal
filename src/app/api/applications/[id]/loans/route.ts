import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient, getAuthenticatedUser } from '@/lib/auth'
import { 
  getCorrelationId, 
  logRequest, 
  logResponse, 
  logError, 
  logDebug,
  logWithCorrelation 
} from '@/lib/utils'
// import { sendLoanNotification } from '@/lib/slack-notifications'

// GET /api/applications/[id]/loans - Get all loans for an application
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const correlationId = getCorrelationId(request)
  const { id: applicationId } = await params
  
  // Log the incoming request
  logRequest(correlationId, request.method, request.url, 
    Object.fromEntries(request.headers.entries()))

  try {
    logWithCorrelation(correlationId, 'info', 'Getting loans for application', {
      applicationId
    })
    
    const { user, error: userError } = await getAuthenticatedUser(request)
    
    if (userError || !user) {
      logWithCorrelation(correlationId, 'warn', 'User not authenticated for loan access', {
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

    logWithCorrelation(correlationId, 'info', 'User authenticated for loan access', {
      userId: user.id,
      userEmail: user.email,
      applicationId
    })

    const supabase = createServerSupabaseClient()

    // First verify the application belongs to the current user
    logWithCorrelation(correlationId, 'debug', 'Verifying application ownership')
    
    const { data: application, error: appError } = await supabase
      .from('applications')
      .select('id, user_id')
      .eq('id', applicationId)
      .single()

    if (appError || !application) {
      logWithCorrelation(correlationId, 'warn', 'Application not found', {
        applicationId,
        error: appError?.message
      })
      
      const response = NextResponse.json(
        { error: 'Application not found' },
        { status: 404 }
      )
      response.headers.set('x-correlation-id', correlationId)
      logResponse(correlationId, 404, 'Application not found')
      return response
    }

    // Check if the application belongs to the current user
    if (application.user_id !== user.id) {
      logWithCorrelation(correlationId, 'warn', 'Unauthorized access to application', {
        applicationId,
        applicationUserId: application.user_id,
        currentUserId: user.id
      })
      
      const response = NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      )
      response.headers.set('x-correlation-id', correlationId)
      logResponse(correlationId, 403, 'Unauthorized access')
      return response
    }

    // Get all loans for this application
    logWithCorrelation(correlationId, 'debug', 'Fetching loans from database')
    
    const { data: loans, error } = await supabase
      .from('loans')
      .select('*')
      .eq('application_id', applicationId)
      .order('created_at', { ascending: false })

    if (error) {
      logError(correlationId, error, {
        applicationId,
        operation: 'fetch_loans'
      })
      
      const response = NextResponse.json(
        { error: 'Failed to fetch loans' },
        { status: 500 }
      )
      response.headers.set('x-correlation-id', correlationId)
      logResponse(correlationId, 500, 'Failed to fetch loans')
      return response
    }

    logWithCorrelation(correlationId, 'info', 'Loans retrieved successfully', {
      applicationId,
      loanCount: loans?.length || 0
    })

    const response = NextResponse.json({ loans: loans || [] })
    response.headers.set('x-correlation-id', correlationId)
    logResponse(correlationId, 200, 'Loans retrieved', { count: loans?.length || 0 })
    return response
  } catch (error) {
    logError(correlationId, error as Error, {
      applicationId,
      operation: 'get_loans'
    })
    
    const response = NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
    response.headers.set('x-correlation-id', correlationId)
    logResponse(correlationId, 500, 'Internal server error')
    return response
  }
}

// POST /api/applications/[id]/loans - Create a new loan for an application
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const correlationId = getCorrelationId(request)
  const { id: applicationId } = await params
  
  // Log the incoming request
  logRequest(correlationId, request.method, request.url, 
    Object.fromEntries(request.headers.entries()))

  try {
    logWithCorrelation(correlationId, 'info', 'Creating new loan for application', {
      applicationId
    })
    
    const { user, error: userError } = await getAuthenticatedUser(request)
    
    if (userError || !user) {
      logWithCorrelation(correlationId, 'warn', 'User not authenticated for loan creation', {
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

    logWithCorrelation(correlationId, 'info', 'User authenticated for loan creation', {
      userId: user.id,
      userEmail: user.email,
      applicationId
    })

    const loanData = await request.json()
    logWithCorrelation(correlationId, 'debug', 'Loan data received', {
      applicationId,
      loanDataKeys: Object.keys(loanData),
      hasLoanData: !!loanData
    })

    const supabase = createServerSupabaseClient()

    // First verify the application belongs to the current user
    logWithCorrelation(correlationId, 'debug', 'Verifying application ownership')
    
    const { data: application, error: appError } = await supabase
      .from('applications')
      .select('id, user_id, application_name')
      .eq('id', applicationId)
      .single()

    if (appError || !application) {
      logWithCorrelation(correlationId, 'warn', 'Application not found for loan creation', {
        applicationId,
        error: appError?.message
      })
      
      const response = NextResponse.json(
        { error: 'Application not found' },
        { status: 404 }
      )
      response.headers.set('x-correlation-id', correlationId)
      logResponse(correlationId, 404, 'Application not found')
      return response
    }

    // Check if the application belongs to the current user
    if (application.user_id !== user.id) {
      logWithCorrelation(correlationId, 'warn', 'Unauthorized access to application for loan creation', {
        applicationId,
        applicationUserId: application.user_id,
        currentUserId: user.id
      })
      
      const response = NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      )
      response.headers.set('x-correlation-id', correlationId)
      logResponse(correlationId, 403, 'Unauthorized access')
      return response
    }

    logWithCorrelation(correlationId, 'info', 'Creating loan in database', {
      userId: user.id,
      applicationId,
      applicationName: application.application_name,
      loanDataKeys: Object.keys(loanData)
    })

    // Create the new loan
    const { data: loan, error } = await supabase
      .from('loans')
      .insert({
        user_id: user.id,
        application_id: applicationId,
        ...loanData
      })
      .select()
      .single()

    if (error) {
      logError(correlationId, error, {
        applicationId,
        userId: user.id,
        operation: 'create_loan',
        loanDataKeys: Object.keys(loanData)
      })
      
      const response = NextResponse.json(
        { error: 'Failed to create loan' },
        { status: 500 }
      )
      response.headers.set('x-correlation-id', correlationId)
      logResponse(correlationId, 500, 'Failed to create loan')
      return response
    }

    logWithCorrelation(correlationId, 'info', 'Loan created successfully', {
      loanId: loan.id,
      applicationId,
      applicationName: application.application_name
    })

    // Send Slack notification
    try {
      // await sendLoanNotification(loan, application, partnerProfile)
      logWithCorrelation(correlationId, 'debug', 'Slack notification skipped (commented out)')
    } catch (notificationError) {
      logError(correlationId, notificationError as Error, {
        operation: 'slack_notification',
        loanId: loan.id
      })
      // Don't fail the request if notification fails
    }

    const response = NextResponse.json({ loan })
    response.headers.set('x-correlation-id', correlationId)
    logResponse(correlationId, 201, 'Loan created successfully', { loanId: loan.id })
    return response
  } catch (error) {
    logError(correlationId, error as Error, {
      applicationId,
      operation: 'create_loan'
    })
    
    const response = NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
    response.headers.set('x-correlation-id', correlationId)
    logResponse(correlationId, 500, 'Internal server error')
    return response
  }
} 