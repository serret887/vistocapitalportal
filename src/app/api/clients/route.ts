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

// POST /api/clients - Create a new client with RBA
export async function POST(request: NextRequest) {
  const correlationId = getCorrelationId(request)
  
  // Log the incoming request
  logRequest(correlationId, request.method, request.url, 
    Object.fromEntries(request.headers.entries()))

  try {
    logWithCorrelation(correlationId, 'info', 'Creating new client')
    
    const { user, error: userError } = await getAuthenticatedUser(request)
    
    if (userError || !user) {
      logWithCorrelation(correlationId, 'warn', 'User not authenticated for client creation', {
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

    logWithCorrelation(correlationId, 'info', 'User authenticated for client creation', {
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

    // Parse request body
    const clientData = await request.json()

    // Basic validation
    if (!clientData.first_name || !clientData.last_name || !clientData.email) {
      logWithCorrelation(correlationId, 'warn', 'Missing required client fields', {
        hasFirstName: !!clientData.first_name,
        hasLastName: !!clientData.last_name,
        hasEmail: !!clientData.email
      })
      
      const response = NextResponse.json(
        { error: 'Missing required fields: first_name, last_name, email' },
        { status: 400 }
      )
      response.headers.set('x-correlation-id', correlationId)
      logResponse(correlationId, 400, 'Missing required fields')
      return response
    }

    logWithCorrelation(correlationId, 'debug', 'Creating client in database', {
      clientName: `${clientData.first_name} ${clientData.last_name}`,
      clientEmail: clientData.email,
      userId: user.id
    })

    // Create client with RBA - associate with current user
    const { data: client, error: clientError } = await serverSupabase
      .from('clients')
      .insert({
        user_id: user.id, // RBA: Associate client with current user
        first_name: clientData.first_name,
        last_name: clientData.last_name,
        email: clientData.email,
        phone_number: clientData.phone_number || null,
        ssn: clientData.ssn || null,
        date_of_birth: clientData.date_of_birth || null,
        current_residence: clientData.current_residence || null,
        total_income: clientData.total_income || 0,
        income_sources: clientData.income_sources || [],
        income_documents: clientData.income_documents || [],
        total_assets: clientData.total_assets || 0,
        bank_accounts: clientData.bank_accounts || [],
        bank_statements: clientData.bank_statements || []
      })
      .select()
      .single()

    if (clientError) {
      logWithCorrelation(correlationId, 'error', 'Failed to create client', {
        error: clientError.message,
        userId: user.id
      })
      
      const response = NextResponse.json(
        { error: 'Failed to create client' },
        { status: 500 }
      )
      response.headers.set('x-correlation-id', correlationId)
      logResponse(correlationId, 500, 'Failed to create client')
      return response
    }

    logWithCorrelation(correlationId, 'info', 'Client created successfully', {
      clientId: client.id,
      clientName: `${client.first_name} ${client.last_name}`,
      userId: user.id
    })

    const response = NextResponse.json({
      client,
      success: true,
      message: 'Client created successfully'
    })
    response.headers.set('x-correlation-id', correlationId)
    logResponse(correlationId, 201, 'Client created successfully')
    return response

  } catch (error) {
    logError(correlationId, error as Error, { endpoint: '/api/clients POST' })
    
    const response = NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
    response.headers.set('x-correlation-id', correlationId)
    logResponse(correlationId, 500, 'Internal server error')
    return response
  }
} 

// GET /api/clients - Get all clients for the current user
export async function GET(request: NextRequest) {
  const correlationId = getCorrelationId(request)
  
  logRequest(correlationId, request.method, request.url, 
    Object.fromEntries(request.headers.entries()))

  try {
    logWithCorrelation(correlationId, 'info', 'Getting clients for user')
    
    const { user, error: userError } = await getAuthenticatedUser(request)
    
    if (userError || !user) {
      logWithCorrelation(correlationId, 'warn', 'User not authenticated for clients')
      
      const response = NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
      response.headers.set('x-correlation-id', correlationId)
      logResponse(correlationId, 401, 'Authentication required')
      return response
    }

    const serverSupabase = createServerSupabaseClient()

    // Get all clients for this user
    const { data: clients, error } = await serverSupabase
      .from('clients')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      logWithCorrelation(correlationId, 'error', 'Failed to fetch clients', {
        error: error.message,
        userId: user.id
      })
      
      const response = NextResponse.json(
        { error: 'Failed to fetch clients' },
        { status: 500 }
      )
      response.headers.set('x-correlation-id', correlationId)
      logResponse(correlationId, 500, 'Failed to fetch clients')
      return response
    }

    logWithCorrelation(correlationId, 'info', 'Clients fetched successfully', {
      userId: user.id,
      clientCount: clients?.length || 0
    })

    const response = NextResponse.json(clients || [])
    response.headers.set('x-correlation-id', correlationId)
    logResponse(correlationId, 200, 'Clients fetched successfully')
    return response

  } catch (error) {
    logError(correlationId, error as Error, { endpoint: '/api/clients GET' })
    
    const response = NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
    response.headers.set('x-correlation-id', correlationId)
    logResponse(correlationId, 500, 'Internal server error')
    return response
  }
} 