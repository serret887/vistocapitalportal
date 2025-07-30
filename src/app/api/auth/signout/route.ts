import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser } from '@/lib/auth'
import { 
  getCorrelationId, 
  logRequest, 
  logResponse, 
  logError, 
  logDebug,
  logWithCorrelation 
} from '@/lib/utils'

export async function POST(request: NextRequest) {
  const correlationId = getCorrelationId(request)
  
  // Log the incoming request
  logRequest(correlationId, request.method, request.url, 
    Object.fromEntries(request.headers.entries()))

  try {
    logWithCorrelation(correlationId, 'info', 'Signout attempt')
    
    // Get the authenticated user
    const { user, error } = await getAuthenticatedUser(request)

    if (error || !user) {
      logWithCorrelation(correlationId, 'warn', 'User not authenticated for signout', {
        error: error?.message,
        hasUser: !!user
      })
      
      const response = NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
      response.headers.set('x-correlation-id', correlationId)
      logResponse(correlationId, 401, 'Not authenticated')
      return response
    }

    logWithCorrelation(correlationId, 'info', 'User signed out successfully', {
      userId: user.id,
      userEmail: user.email
    })

    // For server-side signout, we just return success
    // The client will clear the token from localStorage
    const response = NextResponse.json({
      message: 'Signed out successfully',
    })
    response.headers.set('x-correlation-id', correlationId)
    logResponse(correlationId, 200, 'Signout successful')
    return response
  } catch (error) {
    logError(correlationId, error as Error, { endpoint: '/api/auth/signout' })
    
    const response = NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
    response.headers.set('x-correlation-id', correlationId)
    logResponse(correlationId, 500, 'Internal server error')
    return response
  }
} 