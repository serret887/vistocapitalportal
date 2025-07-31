import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser, createServerSupabaseClient } from '@/lib/auth'
import type { Company } from '@/types'
import { 
  getCorrelationId, 
  logRequest, 
  logResponse, 
  logError, 
  logDebug,
  logWithCorrelation 
} from '@/lib/utils'

// GET /api/companies - Get all companies for the current user
export async function GET(request: NextRequest) {
  const correlationId = getCorrelationId(request)
  
  logRequest(correlationId, request.method, request.url, 
    Object.fromEntries(request.headers.entries()))

  try {
    logWithCorrelation(correlationId, 'info', 'Getting companies for user')
    
    const { user, error: userError } = await getAuthenticatedUser(request)
    
    if (userError || !user) {
      logWithCorrelation(correlationId, 'warn', 'User not authenticated for companies')
      
      const response = NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
      response.headers.set('x-correlation-id', correlationId)
      logResponse(correlationId, 401, 'Authentication required')
      return response
    }

    const serverSupabase = createServerSupabaseClient()

    // Get all companies for this user
    const { data: companies, error } = await serverSupabase
      .from('companies')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      logWithCorrelation(correlationId, 'error', 'Failed to fetch companies', {
        error: error.message,
        userId: user.id
      })
      
      const response = NextResponse.json(
        { error: 'Failed to fetch companies' },
        { status: 500 }
      )
      response.headers.set('x-correlation-id', correlationId)
      logResponse(correlationId, 500, 'Failed to fetch companies')
      return response
    }

    logWithCorrelation(correlationId, 'info', 'Companies fetched successfully', {
      userId: user.id,
      companyCount: companies?.length || 0
    })

    const response = NextResponse.json(companies || [])
    response.headers.set('x-correlation-id', correlationId)
    logResponse(correlationId, 200, 'Companies fetched successfully')
    return response

  } catch (error) {
    logError(correlationId, error as Error, { endpoint: '/api/companies GET' })
    
    const response = NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
    response.headers.set('x-correlation-id', correlationId)
    logResponse(correlationId, 500, 'Internal server error')
    return response
  }
} 