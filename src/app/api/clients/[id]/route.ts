import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser, createServerSupabaseClient } from '@/lib/auth'
import type { Client } from '@/types'
import { 
  getCorrelationId, 
  logRequest, 
  logResponse, 
  logError, 
  logDebug,
  logWithCorrelation 
} from '@/lib/utils'

// GET /api/clients/[id] - Get specific client with RBA
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const correlationId = getCorrelationId(request)
  const { id: clientId } = await params
  
  // Log the incoming request
  logRequest(correlationId, request.method, request.url, 
    Object.fromEntries(request.headers.entries()))

  try {
    logWithCorrelation(correlationId, 'info', 'Getting client by ID', {
      clientId,
      userId: 'to_be_determined'
    })
    
    const { user, error: userError } = await getAuthenticatedUser(request)
    
    if (userError || !user) {
      logWithCorrelation(correlationId, 'warn', 'User not authenticated for client access', {
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

    logWithCorrelation(correlationId, 'info', 'User authenticated for client access', {
      userId: user.id,
      userEmail: user.email,
      clientId
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

    // Get client with RBA - only allow access if client was created by this user
    const { data: client, error: clientError } = await serverSupabase
      .from('clients')
      .select(`
        id,
        first_name,
        last_name,
        email,
        phone_number,
        ssn,
        date_of_birth,
        current_residence,
        total_income,
        income_sources,
        income_documents,
        total_assets,
        bank_accounts,
        bank_statements,
        created_at,
        updated_at
      `)
      .eq('id', clientId)
      .eq('user_id', user.id) // RBA: Only allow access if client was created by this user
      .single()

    if (clientError) {
      if (clientError.code === 'PGRST116') {
        logWithCorrelation(correlationId, 'warn', 'Client not found or access denied', {
          clientId,
          userId: user.id,
          error: clientError.message
        })
        
        const response = NextResponse.json(
          { error: 'Client not found or access denied' },
          { status: 404 }
        )
        response.headers.set('x-correlation-id', correlationId)
        logResponse(correlationId, 404, 'Client not found or access denied')
        return response
      }
      
      logWithCorrelation(correlationId, 'error', 'Failed to get client', {
        error: clientError.message,
        clientId,
        userId: user.id
      })
      
      const response = NextResponse.json(
        { error: 'Failed to get client' },
        { status: 500 }
      )
      response.headers.set('x-correlation-id', correlationId)
      logResponse(correlationId, 500, 'Failed to get client')
      return response
    }

    logWithCorrelation(correlationId, 'info', 'Client retrieved successfully', {
      clientId,
      userId: user.id,
      clientName: `${client.first_name} ${client.last_name}`
    })

    const response = NextResponse.json(client)
    response.headers.set('x-correlation-id', correlationId)
    logResponse(correlationId, 200, 'Client retrieved successfully')
    return response

  } catch (error) {
    logError(correlationId, error as Error, { endpoint: `/api/clients/${clientId} GET` })
    
    const response = NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
    response.headers.set('x-correlation-id', correlationId)
    logResponse(correlationId, 500, 'Internal server error')
    return response
  }
} 