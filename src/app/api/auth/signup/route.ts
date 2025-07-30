import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/auth'
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
  
  // Log the incoming request (without sensitive data)
  const safeHeaders = Object.fromEntries(request.headers.entries())
  delete safeHeaders.authorization
  delete safeHeaders.cookie
  
  logRequest(correlationId, request.method, request.url, safeHeaders)

  try {
    const { email, password, firstName, lastName } = await request.json()
    
    logWithCorrelation(correlationId, 'info', 'Signup attempt', {
      email: email ? `${email.substring(0, 3)}***@${email.split('@')[1]}` : null,
      hasPassword: !!password,
      hasFirstName: !!firstName,
      hasLastName: !!lastName
    })

    // Validate required fields
    if (!email || !password || !firstName || !lastName) {
      logWithCorrelation(correlationId, 'warn', 'Missing required fields', {
        hasEmail: !!email,
        hasPassword: !!password,
        hasFirstName: !!firstName,
        hasLastName: !!lastName
      })
      
      const response = NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      )
      response.headers.set('x-correlation-id', correlationId)
      logResponse(correlationId, 400, 'Missing required fields')
      return response
    }

    // Create server-side Supabase client
    const supabase = createServerSupabaseClient()

    logWithCorrelation(correlationId, 'debug', 'Creating user in Supabase')

    // Create the user
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        first_name: firstName,
        last_name: lastName,
      },
    })

    if (error) {
      logWithCorrelation(correlationId, 'error', 'Supabase user creation failed', {
        error: error.message,
        email: `${email.substring(0, 3)}***@${email.split('@')[1]}`
      })
      
      const response = NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
      response.headers.set('x-correlation-id', correlationId)
      logResponse(correlationId, 400, 'User creation failed', { error: error.message })
      return response
    }

    if (!data.user) {
      logWithCorrelation(correlationId, 'error', 'No user data returned from Supabase')
      
      const response = NextResponse.json(
        { error: 'Failed to create user' },
        { status: 500 }
      )
      response.headers.set('x-correlation-id', correlationId)
      logResponse(correlationId, 500, 'Failed to create user')
      return response
    }

    logWithCorrelation(correlationId, 'info', 'User created successfully', {
      userId: data.user.id,
      userEmail: data.user.email
    })

    // Create partner profile with onboarded = false
    logWithCorrelation(correlationId, 'debug', 'Creating partner profile')
    
    const { error: profileError } = await supabase
      .from('partner_profiles')
      .insert([{
        user_id: data.user.id,
        first_name: firstName,
        last_name: lastName,
        email: email,
        onboarded: false,
        created_at: new Date().toISOString(),
      }])

    if (profileError) {
      logWithCorrelation(correlationId, 'warn', 'Partner profile creation failed', {
        error: profileError.message,
        userId: data.user.id
      })
      // Don't fail the signup if profile creation fails
      // The user can still sign in and complete onboarding later
    } else {
      logWithCorrelation(correlationId, 'info', 'Partner profile created successfully', {
        userId: data.user.id
      })
    }

    // Return user data (client will need to sign in separately)
    const userData = {
      user: {
        id: data.user.id,
        email: data.user.email,
        firstName,
        lastName,
      },
      message: 'User created successfully. Please sign in.',
    }
    
    const response = NextResponse.json(userData)
    response.headers.set('x-correlation-id', correlationId)
    
    logWithCorrelation(correlationId, 'info', 'Signup completed successfully', {
      userId: data.user.id,
      userEmail: data.user.email
    })
    
    logResponse(correlationId, 200, 'User created successfully')
    return response
  } catch (error) {
    logError(correlationId, error as Error, { endpoint: '/api/auth/signup' })
    
    const response = NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
    response.headers.set('x-correlation-id', correlationId)
    logResponse(correlationId, 500, 'Internal server error')
    return response
  }
} 