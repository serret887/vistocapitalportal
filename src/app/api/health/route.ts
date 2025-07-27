import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/auth'

export async function GET() {
  try {
    // Check environment variables
    const envCheck = {
      supabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      supabaseAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      supabaseServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      nodeEnv: process.env.NODE_ENV
    }

    // Test database connection
    let dbStatus = 'unknown'
    let dbError = null
    
    try {
      const supabase = createServerSupabaseClient()
      const { data, error } = await supabase.from('lenders').select('count').limit(1)
      
      if (error) {
        dbStatus = 'error'
        dbError = error.message
      } else {
        dbStatus = 'connected'
      }
    } catch (error) {
      dbStatus = 'error'
      dbError = error instanceof Error ? error.message : 'Unknown error'
    }

    return NextResponse.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      environment: envCheck,
      database: {
        status: dbStatus,
        error: dbError
      }
    })
  } catch (error) {
    return NextResponse.json({
      status: 'error',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 