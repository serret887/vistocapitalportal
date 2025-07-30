import { createClient } from '@supabase/supabase-js'
import { NextRequest } from 'next/server'

export interface User {
  id: string
  email: string
  firstName: string
  lastName: string
}

export interface PartnerProfile {
  id: string
  user_id: string
  first_name: string
  last_name: string
  email: string
  partner_type: string | null
  phone_number: string | null
  monthly_deal_volume: number | null
  transaction_volume: number | null
  transaction_types: string[]
  license_number: string | null
  license_state: string | null
  onboarded: boolean
  created_at: string
}

// Create a server-side Supabase client for API routes
export function createServerSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
  
  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })
}

// Get user from request headers (for API routes)
export async function getCurrentUserFromRequest(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return { user: null, error: new Error('No authorization header') }
    }

    const token = authHeader.replace('Bearer ', '')
    
    // Create server-side client
    const serverSupabase = createServerSupabaseClient()
    
    // Verify the token and get user
    const { data: { user }, error } = await serverSupabase.auth.getUser(token)
    
    if (error || !user) {
      return { user: null, error: error || new Error('Invalid token') }
    }

    return { user: user, error: null }
  } catch (error) {
    console.error('Error getting current user from request:', error)
    return { user: null, error: error as Error }
  }
}

// Helper function to get user from request headers (set by middleware)
export function getUserFromRequestHeaders(request: NextRequest) {
  const userId = request.headers.get('x-user-id')
  const userEmail = request.headers.get('x-user-email')
  
  if (!userId) {
    return { user: null, error: new Error('No user ID in request headers') }
  }

  // Create a minimal user object with the information we have
  const user = {
    id: userId,
    email: userEmail || '',
    // Add other user properties as needed
  }

  return { user, error: null }
}

// Updated function to get authenticated user from API request (uses middleware headers)
export async function getAuthenticatedUser(request: NextRequest) {
  try {
    // First try to get user from middleware headers (more efficient)
    const { user: headerUser, error: headerError } = getUserFromRequestHeaders(request)
    
    if (headerUser && !headerError) {
      return { user: headerUser, error: null }
    }

    // Fallback to token verification if headers are not available
    const authHeader = request.headers.get('authorization')
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return { user: null, error: new Error('No authorization header') }
    }

    const token = authHeader.replace('Bearer ', '')
    
    // Create server-side client
    const serverSupabase = createServerSupabaseClient()
    
    // Verify the token and get user
    const { data: { user }, error } = await serverSupabase.auth.getUser(token)
    
    if (error || !user) {
      return { user: null, error: error || new Error('Invalid token') }
    }

    return { user: user, error: null }
  } catch (error) {
    console.error('Error getting authenticated user:', error)
    return { user: null, error: error as Error }
  }
}

 