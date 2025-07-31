import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser, createServerSupabaseClient } from '@/lib/auth'
import type { ClientSearchResult } from '@/types'
import { 
  getCorrelationId, 
  logRequest, 
  logResponse, 
  logError, 
  logDebug,
  logWithCorrelation 
} from '@/lib/utils'

// GET /api/clients/search - Search clients with RBA
export async function GET(request: NextRequest) {
  const correlationId = getCorrelationId(request)
  
  // Log the incoming request
  logRequest(correlationId, request.method, request.url, 
    Object.fromEntries(request.headers.entries()))

  try {
    logWithCorrelation(correlationId, 'info', 'Searching clients for user')
    
    const { user, error: userError } = await getAuthenticatedUser(request)
    
    if (userError || !user) {
      logWithCorrelation(correlationId, 'warn', 'User not authenticated for client search', {
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

    logWithCorrelation(correlationId, 'info', 'User authenticated for client search', {
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

    // Get search query from URL parameters
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q') || ''
    const limit = parseInt(searchParams.get('limit') || '10')

    logWithCorrelation(correlationId, 'debug', 'Searching clients', {
      query,
      limit,
      userId: user.id
    })

    // Search clients with RBA - only show clients created by this user
    let clientsQuery = serverSupabase
      .from('clients')
      .select(`
        id,
        first_name,
        last_name,
        email,
        phone_number,
        created_at
      `)
      .eq('user_id', user.id) // RBA: Only show clients created by this user
      .order('created_at', { ascending: false })
      .limit(limit)

    // Add search filters if query provided
    if (query.trim()) {
      const searchTerm = query.trim()
      clientsQuery = clientsQuery.or(`
        first_name.ilike.%${searchTerm}%,
        last_name.ilike.%${searchTerm}%,
        email.ilike.%${searchTerm}%,
        phone_number.ilike.%${searchTerm}%
      `)
    }

    const { data: clients, error: clientsError } = await clientsQuery

    if (clientsError) {
      logWithCorrelation(correlationId, 'error', 'Failed to search clients', {
        error: clientsError.message,
        userId: user.id
      })
      
      const response = NextResponse.json(
        { error: 'Failed to search clients' },
        { status: 500 }
      )
      response.headers.set('x-correlation-id', correlationId)
      logResponse(correlationId, 500, 'Failed to search clients')
      return response
    }

    logWithCorrelation(correlationId, 'info', 'Clients search completed', {
      userId: user.id,
      clientCount: clients?.length || 0,
      query
    })

    // Transform to ClientSearchResult format
    const searchResults: ClientSearchResult[] = (clients || []).map(client => ({
      id: client.id,
      first_name: client.first_name,
      last_name: client.last_name,
      email: client.email || undefined,
      phone_number: client.phone_number || undefined,
      created_at: client.created_at
    }))

    const response = NextResponse.json(searchResults)
    response.headers.set('x-correlation-id', correlationId)
    logResponse(correlationId, 200, 'Client search completed successfully')
    return response

  } catch (error) {
    logError(correlationId, error as Error, { endpoint: '/api/clients/search GET' })
    
    const response = NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
    response.headers.set('x-correlation-id', correlationId)
    logResponse(correlationId, 500, 'Internal server error')
    return response
  }
} 