import { apiClient } from './api-client'

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
  updated_at: string
}

// Client-side authentication functions that work through the API

// Sign up a new user
export async function signUp(data: SignupData) {
  try {
    const response = await apiClient.post<{ user?: User; message?: string }>('/auth/signup', data)
    
    if (response.error) {
      return { user: null, error: new Error(response.error) }
    }

    // Signup doesn't return a token - user needs to sign in separately
    return { user: response.data?.user || null, error: null }
  } catch (error) {
    console.error('Error signing up:', error)
    return { user: null, error: error as Error }
  }
}

// Sign in an existing user
export async function signIn(data: LoginData) {
  try {
    const response = await apiClient.post<{ token?: string; user?: User }>('/auth/signin', data)
    
    if (response.error) {
      return { user: null, error: new Error(response.error) }
    }

    // Store the token if provided
    if (response.data?.token) {
      localStorage.setItem('auth_token', response.data.token)
    }

    return { user: response.data?.user || null, error: null }
  } catch (error) {
    console.error('Error signing in:', error)
    return { user: null, error: error as Error }
  }
}

// Sign out the current user
export async function signOut() {
  try {
    // Call the signout API endpoint
    await apiClient.post('/auth/signout', {})
    
    // Clear stored token
    localStorage.removeItem('auth_token')
    sessionStorage.removeItem('auth_token')
    
    return { error: null }
  } catch (error) {
    console.error('Error signing out:', error)
    // Still clear the token even if API call fails
    localStorage.removeItem('auth_token')
    sessionStorage.removeItem('auth_token')
    return { error: error as Error }
  }
}

// Get the current user (client-side)
export async function getCurrentUser() {
  try {
    const response = await apiClient.get<{ user?: User }>('/auth/me')
    
    if (response.error) {
      return { user: null, error: new Error(response.error) }
    }

    return { user: response.data?.user || null, error: null }
  } catch (error) {
    console.error('Error getting current user:', error)
    return { user: null, error: error as Error }
  }
}

// Get partner profile
export async function getPartnerProfile(userId: string) {
  try {
    const response = await apiClient.get<{ profile?: PartnerProfile }>(`/auth/profile/${userId}`)
    
    if (response.error) {
      return { profile: null, error: new Error(response.error) }
    }

    return { profile: response.data?.profile || null, error: null }
  } catch (error) {
    console.error('Error getting partner profile:', error)
    return { profile: null, error: error as Error }
  }
}

// Check if user has completed onboarding
export async function hasCompletedOnboarding(userId: string) {
  try {
    const response = await apiClient.get<{ completed?: boolean }>(`/auth/onboarding-status/${userId}`)
    
    if (response.error) {
      return { completed: false, error: new Error(response.error) }
    }

    return { completed: response.data?.completed || false, error: null }
  } catch (error) {
    console.error('Error checking onboarding status:', error)
    return { completed: false, error: error as Error }
  }
}

 