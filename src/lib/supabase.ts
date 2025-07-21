import { createClient } from '@supabase/supabase-js'

let supabase: any = null

// Only create client if environment variables are available and valid
if (typeof window !== 'undefined' || process.env.NODE_ENV === 'development') {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  
  if (supabaseUrl && supabaseAnonKey && 
      supabaseUrl !== 'your_supabase_project_url' && 
      supabaseAnonKey !== 'your_supabase_anon_key') {
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
    } catch (error) {
      console.warn('Failed to create Supabase client:', error)
    }
  }
}

export { supabase } 