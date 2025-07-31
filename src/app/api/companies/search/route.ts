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

// GET /api/companies/search - Search companies
export async function GET(request: NextRequest) {
  const correlationId = getCorrelationId(request)
  
  logRequest(correlationId, request.method, request.url, 
    Object.fromEntries(request.headers.entries()))

  try {
    const { user, error: userError } = await getAuthenticatedUser(request)
    
    if (userError || !user) {
      logWithCorrelation(correlationId, 'warn', 'User not authenticated for company search')
      
      const response = NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
      response.headers.set('x-correlation-id', correlationId)
      logResponse(correlationId, 401, 'Authentication required')
      return response
    }

    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q')

    if (!query || query.length < 2) {
      logWithCorrelation(correlationId, 'warn', 'Invalid search query', { query })
      
      const response = NextResponse.json([])
      response.headers.set('x-correlation-id', correlationId)
      logResponse(correlationId, 200, 'Empty search results')
      return response
    }

    const serverSupabase = createServerSupabaseClient()

    // Search companies by name, type, or business email
    const { data: companies, error } = await serverSupabase
      .from('companies')
      .select('*')
      .or(`company_name.ilike.%${query}%,company_type.ilike.%${query}%,business_email.ilike.%${query}%`)
      .eq('user_id', user.id)
      .limit(10)

    if (error) {
      logWithCorrelation(correlationId, 'error', 'Failed to search companies', {
        error: error.message,
        query,
        userId: user.id
      })
      
      const response = NextResponse.json(
        { error: 'Failed to search companies' },
        { status: 500 }
      )
      response.headers.set('x-correlation-id', correlationId)
      logResponse(correlationId, 500, 'Failed to search companies')
      return response
    }

    logWithCorrelation(correlationId, 'info', 'Companies search completed', {
      query,
      userId: user.id,
      resultCount: companies?.length || 0
    })

    const response = NextResponse.json(companies || [])
    response.headers.set('x-correlation-id', correlationId)
    logResponse(correlationId, 200, 'Companies search completed')
    return response

  } catch (error) {
    logError(correlationId, error as Error, { endpoint: '/api/companies/search GET' })
    
    const response = NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
    response.headers.set('x-correlation-id', correlationId)
    logResponse(correlationId, 500, 'Internal server error')
    return response
  }
} 