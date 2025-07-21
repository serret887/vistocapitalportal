import { supabase } from './supabase'

export interface SignupData {
  email: string
  password: string
  firstName: string
  lastName: string
}

export interface LoginData {
  email: string
  password: string
}

export interface User {
  id: string
  email: string
  firstName: string
  lastName: string
}

export interface PartnerProfile {
  id: string
  user_id: string
  partner_type: string | null
  phone_number: string | null
  monthly_deal_volume: number | null
  transaction_volume: number | null
  transaction_types: string[]
  license_number: string | null
  license_state: string | null
  onboarded: boolean
  created_at: string
  updated_at: string
}

// Sign up a new user
export async function signUp({ email, password, firstName, lastName }: SignupData) {
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          first_name: firstName,
          last_name: lastName,
        },
      },
    })

    if (error) {
      throw error
    }

    return { user: data.user, error: null }
  } catch (error) {
    console.error('Error signing up:', error)
    return { user: null, error: error as Error }
  }
}

// Sign in an existing user
export async function signIn({ email, password }: LoginData) {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      throw error
    }

    return { user: data.user, error: null }
  } catch (error) {
    console.error('Error signing in:', error)
    return { user: null, error: error as Error }
  }
}

// Sign out the current user
export async function signOut() {
  try {
    const { error } = await supabase.auth.signOut()
    if (error) {
      throw error
    }
    return { error: null }
  } catch (error) {
    console.error('Error signing out:', error)
    return { error: error as Error }
  }
}

// Refresh the user session
export async function refreshSession() {
  try {
    const { data: { session }, error } = await supabase.auth.refreshSession()
    if (error) {
      console.error('Error refreshing session:', error)
      return { session: null, error }
    }
    return { session, error: null }
  } catch (error) {
    console.error('Unexpected error refreshing session:', error)
    return { session: null, error: error as Error }
  }
}

// Get the current user with session validation
export async function getCurrentUser() {
  try {
    // First try to get the current session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError) {
      console.error('Session error:', sessionError)
      return { user: null, error: sessionError }
    }

    // If no session, return null user
    if (!session) {
      return { user: null, error: null }
    }

    // If session is expiring soon (less than 5 minutes), refresh it
    if (session.expires_at && (session.expires_at * 1000 - Date.now()) < 5 * 60 * 1000) {
      console.log('Session expiring soon, refreshing...')
      await refreshSession()
    }

    const { data: { user }, error } = await supabase.auth.getUser()
    
    if (error) {
      throw error
    }

    if (!user) {
      return { user: null, error: null }
    }

    // Get user profile data
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (profileError) {
      console.error('Error fetching user profile:', profileError)
      return { user: null, error: profileError }
    }

    const userData: User = {
      id: user.id,
      email: user.email!,
      firstName: profile.first_name,
      lastName: profile.last_name,
    }

    return { user: userData, error: null }
  } catch (error) {
    console.error('Error getting current user:', error)
    return { user: null, error: error as Error }
  }
}

// Get partner profile
export async function getPartnerProfile(userId: string) {
  try {
    const { data, error } = await supabase
      .from('partner_profiles')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (error) {
      // If no partner profile exists, return null (not an error)
      if (error.code === 'PGRST116') {
        return { profile: null, error: null }
      }
      throw error
    }

    return { profile: data as PartnerProfile, error: null }
  } catch (error) {
    console.error('Error getting partner profile:', error)
    return { profile: null, error: error as Error }
  }
}

// Check if user has completed onboarding
export async function hasCompletedOnboarding(userId: string) {
  try {
    const { profile, error } = await getPartnerProfile(userId)
    
    if (error) {
      return { completed: false, error }
    }

    return { completed: profile?.onboarded || false, error: null }
  } catch (error) {
    console.error('Error checking onboarding status:', error)
    return { completed: false, error: error as Error }
  }
} 