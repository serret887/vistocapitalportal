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

export async function GET(request: NextRequest) {
  const correlationId = getCorrelationId(request)
  
  // Log the incoming request
  logRequest(correlationId, request.method, request.url, 
    Object.fromEntries(request.headers.entries()))

  try {
    logWithCorrelation(correlationId, 'info', 'Getting authenticated user')
    
    // Get the authenticated user
    const { user, error } = await getAuthenticatedUser(request)

    if (error || !user) {
      logWithCorrelation(correlationId, 'warn', 'User not authenticated', {
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

    logWithCorrelation(correlationId, 'info', 'User authenticated successfully', {
      userId: user.id,
      userEmail: user.email
    })

    // Return user data
    const userData = {
      user: {
        id: user.id,
        email: user.email,
        firstName: (user as any).user_metadata?.first_name || '',
        lastName: (user as any).user_metadata?.last_name || '',
      },
    }
    
    const response = NextResponse.json(userData)
    response.headers.set('x-correlation-id', correlationId)
    logResponse(correlationId, 200, 'User data retrieved', userData)
    return response
  } catch (error) {
    logError(correlationId, error as Error, { endpoint: '/api/auth/me' })
    
    const response = NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
    response.headers.set('x-correlation-id', correlationId)
    logResponse(correlationId, 500, 'Internal server error')
    return response
  }
} 