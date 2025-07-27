import { createClient } from '@supabase/supabase-js'

let supabase: any = null

// Only create client if environment variables are available and valid
if (typeof window !== 'undefined' || process.env.NODE_ENV === 'development') {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  
  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Missing Supabase environment variables:', {
      url: supabaseUrl ? 'SET' : 'MISSING',
      key: supabaseAnonKey ? 'SET' : 'MISSING'
    })
  }  else {
    try {
      supabase = createClient(supabaseUrl, supabaseAnonKey, {
        auth: {
          autoRefreshToken: true,
          persistSession: true,
          detectSessionInUrl: true,
          // Set longer session expiry (24 hours instead of default 1 hour)
          storage: typeof window !== 'undefined' ? window.localStorage : undefined,
          storageKey: 'visto-capital-auth-token'
        },
        global: {
          headers: {
            'X-Client-Info': 'visto-capital-partner-portal'
          }
        }
      })
      console.log('Supabase client initialized successfully')
    } catch (error) {
      console.error('Failed to create Supabase client:', error)
    }
  }
}

export { supabase } 