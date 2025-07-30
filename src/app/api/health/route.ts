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

export async function GET(request: NextRequest) {
  const correlationId = getCorrelationId(request)
  
  // Log the incoming request
  logRequest(correlationId, request.method, request.url, 
    Object.fromEntries(request.headers.entries()))

  try {
    logWithCorrelation(correlationId, 'info', 'Health check request')

    // Check environment variables
    const envCheck = {
      supabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      supabaseAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      supabaseServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      nodeEnv: process.env.NODE_ENV
    }

    logWithCorrelation(correlationId, 'debug', 'Environment check', envCheck)

    // Test database connection
    let dbStatus = 'unknown'
    let dbError = null
    
    try {
      logWithCorrelation(correlationId, 'debug', 'Testing database connection')
      
      const supabase = createServerSupabaseClient()
      const { data, error } = await supabase.from('lenders').select('count').limit(1)
      
      if (error) {
        dbStatus = 'error'
        dbError = error.message
        logWithCorrelation(correlationId, 'error', 'Database connection failed', {
          error: error.message
        })
      } else {
        dbStatus = 'connected'
        logWithCorrelation(correlationId, 'info', 'Database connection successful')
      }
    } catch (error) {
      dbStatus = 'error'
      dbError = error instanceof Error ? error.message : 'Unknown error'
      logWithCorrelation(correlationId, 'error', 'Database connection error', {
        error: dbError
      })
    }

    const healthData = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      environment: envCheck,
      database: {
        status: dbStatus,
        error: dbError
      }
    }

    const response = NextResponse.json(healthData)
    response.headers.set('x-correlation-id', correlationId)
    
    logWithCorrelation(correlationId, 'info', 'Health check completed', {
      status: 'ok',
      dbStatus
    })
    
    logResponse(correlationId, 200, 'Health check successful')
    return response
  } catch (error) {
    logError(correlationId, error as Error, { endpoint: '/api/health' })
    
    const errorData = {
      status: 'error',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error'
    }
    
    const response = NextResponse.json(errorData, { status: 500 })
    response.headers.set('x-correlation-id', correlationId)
    logResponse(correlationId, 500, 'Health check failed')
    return response
  }
} 