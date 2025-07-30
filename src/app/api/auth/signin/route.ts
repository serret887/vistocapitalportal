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
    const { email, password } = await request.json()
    
    logWithCorrelation(correlationId, 'info', 'Signin attempt', {
      email: email ? `${email.substring(0, 3)}***@${email.split('@')[1]}` : null,
      hasPassword: !!password
    })

    // Validate required fields
    if (!email || !password) {
      logWithCorrelation(correlationId, 'warn', 'Missing required fields', {
        hasEmail: !!email,
        hasPassword: !!password
      })
      
      const response = NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
      response.headers.set('x-correlation-id', correlationId)
      logResponse(correlationId, 400, 'Missing required fields')
      return response
    }

    // Create server-side Supabase client
    const supabase = createServerSupabaseClient()

    logWithCorrelation(correlationId, 'debug', 'Attempting Supabase signin')

    // Sign in the user
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      logWithCorrelation(correlationId, 'error', 'Supabase signin failed', {
        error: error.message,
        email: `${email.substring(0, 3)}***@${email.split('@')[1]}`
      })
      
      const response = NextResponse.json(
        { error: error.message },
        { status: 401 }
      )
      response.headers.set('x-correlation-id', correlationId)
      logResponse(correlationId, 401, 'Signin failed', { error: error.message })
      return response
    }

    if (!data.user || !data.session) {
      logWithCorrelation(correlationId, 'error', 'Invalid credentials response from Supabase')
      
      const response = NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      )
      response.headers.set('x-correlation-id', correlationId)
      logResponse(correlationId, 401, 'Invalid credentials')
      return response
    }

    logWithCorrelation(correlationId, 'info', 'User signed in successfully', {
      userId: data.user.id,
      userEmail: data.user.email,
      hasSession: !!data.session
    })

    // Create response with user data
    const userData = {
      user: {
        id: data.user.id,
        email: data.user.email,
        firstName: data.user.user_metadata?.first_name || '',
        lastName: data.user.user_metadata?.last_name || '',
      },
      token: data.session.access_token,
    }
    
    const response = NextResponse.json(userData)

    // Set the token as an HTTP-only cookie
    response.cookies.set('auth_token', data.session.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    })

    response.headers.set('x-correlation-id', correlationId)
    
    logWithCorrelation(correlationId, 'info', 'Signin completed successfully', {
      userId: data.user.id,
      userEmail: data.user.email,
      cookieSet: true
    })
    
    logResponse(correlationId, 200, 'Signin successful')
    return response
  } catch (error) {
    logError(correlationId, error as Error, { endpoint: '/api/auth/signin' })
    
    const response = NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
    response.headers.set('x-correlation-id', correlationId)
    logResponse(correlationId, 500, 'Internal server error')
    return response
  }
} 