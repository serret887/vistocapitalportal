import type { LoanApplicationFormData, LoanApplication, DashboardStats, LoanApplicationStatus } from '@/types'
import { supabase } from './supabase'

// API base URL
const API_BASE = '/api'

// Helper function to get auth headers
async function getAuthHeaders(): Promise<HeadersInit> {
  const { data: { session } } = await supabase.auth.getSession()
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  }
  
  if (session?.access_token) {
    headers['Authorization'] = `Bearer ${session.access_token}`
  }
  
  return headers
}

// Helper function to handle API responses
async function handleApiResponse<T>(response: Response): Promise<{ data?: T; error?: string }> {
  try {
    const result = await response.json()
    
    if (!response.ok) {
      // Better error handling for different status codes
      if (response.status === 401) {
        return { error: 'Authentication required. Please log in.' }
      } else if (response.status === 404) {
        return { error: 'Resource not found' }
      } else if (response.status === 403) {
        return { error: 'Access denied' }
      } else if (response.status >= 500) {
        return { error: 'Server error. Please try again later.' }
      } else {
        return { error: result.error || `HTTP ${response.status}: ${result.message || 'Unknown error'}` }
      }
    }

    return { data: result }
  } catch (error) {
    console.error('API response parsing error:', error)
    return { error: 'Failed to parse response' }
  }
}

// Create a new loan application
export async function createLoanApplication(formData: LoanApplicationFormData) {
  try {
    const headers = await getAuthHeaders()
    
    const response = await fetch(`${API_BASE}/applications`, {
      method: 'POST',
      headers,
      body: JSON.stringify(formData),
    })

    const { data, error } = await handleApiResponse<{ application: LoanApplication; success: boolean; message: string }>(response)
    
    if (error) {
      return { application: null, error }
    }

    return { application: data?.application || null, error: null }
  } catch (error) {
    console.error('Error creating loan application:', error)
    return { application: null, error: 'Network error occurred' }
  }
}

// Get all loan applications for the current partner
export async function getLoanApplications() {
  try {
    const headers = await getAuthHeaders()
    
    const response = await fetch(`${API_BASE}/applications`, {
      method: 'GET',
      headers,
    })

    const { data, error } = await handleApiResponse<{ applications: LoanApplication[]; success: boolean }>(response)
    
    if (error) {
      return { applications: null, error }
    }

    return { applications: data?.applications || [], error: null }
  } catch (error) {
    console.error('Error fetching loan applications:', error)
    return { applications: null, error: 'Network error occurred' }
  }
}

// Get a specific loan application
export async function getLoanApplication(id: string) {
  try {
    const headers = await getAuthHeaders()
    
    const response = await fetch(`${API_BASE}/applications/${id}`, {
      method: 'GET',
      headers,
    })

    const { data, error } = await handleApiResponse<{ application: LoanApplication; success: boolean }>(response)
    
    if (error) {
      return { application: null, error }
    }

    return { application: data?.application || null, error: null }
  } catch (error) {
    console.error('Error fetching loan application:', error)
    return { application: null, error: 'Network error occurred' }
  }
}

// Update a loan application
export async function updateLoanApplication(id: string, updateData: Partial<LoanApplicationFormData>) {
  try {
    const headers = await getAuthHeaders()
    
    const response = await fetch(`${API_BASE}/applications/${id}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(updateData),
    })

    const { data, error } = await handleApiResponse<{ application: LoanApplication; success: boolean }>(response)
    
    if (error) {
      return { application: null, error }
    }

    return { application: data?.application || null, error: null }
  } catch (error) {
    console.error('Error updating loan application:', error)
    return { application: null, error: 'Network error occurred' }
  }
}

// Update loan application status
export async function updateLoanApplicationStatus(id: string, status: LoanApplicationStatus) {
  try {
    const headers = await getAuthHeaders()
    
    const response = await fetch(`${API_BASE}/applications/${id}/status`, {
      method: 'PUT',
      headers,
      body: JSON.stringify({ status }),
    })

    const { data, error } = await handleApiResponse<{ success: boolean; message: string }>(response)
    
    if (error) {
      return { success: false, error }
    }

    return { success: data?.success || false, error: null }
  } catch (error) {
    console.error('Error updating loan application status:', error)
    return { success: false, error: 'Network error occurred' }
  }
}

// Delete a loan application
export async function deleteLoanApplication(id: string) {
  try {
    const headers = await getAuthHeaders()
    
    const response = await fetch(`${API_BASE}/applications/${id}`, {
      method: 'DELETE',
      headers,
    })

    const { data, error } = await handleApiResponse<{ success: boolean; message: string }>(response)
    
    if (error) {
      return { success: false, error }
    }

    return { success: data?.success || false, error: null }
  } catch (error) {
    console.error('Error deleting loan application:', error)
    return { success: false, error: 'Network error occurred' }
  }
}

// Get dashboard statistics
export async function getDashboardStats() {
  try {
    const headers = await getAuthHeaders()
    
    const response = await fetch(`${API_BASE}/dashboard/stats`, {
      method: 'GET',
      headers,
    })

    const { data, error } = await handleApiResponse<{ stats: DashboardStats; success: boolean }>(response)
    
    if (error) {
      return { stats: null, error }
    }

    return { stats: data?.stats || null, error: null }
  } catch (error) {
    console.error('Error fetching dashboard stats:', error)
    return { stats: null, error: 'Network error occurred' }
  }
}

// Upload a file
export async function uploadFile(file: File, documentType: string, applicationId?: string) {
  try {
    const { data: { session } } = await supabase.auth.getSession()
    
    const formData = new FormData()
    formData.append('file', file)
    formData.append('document_type', documentType)
    if (applicationId) {
      formData.append('application_id', applicationId)
    }

    const headers: HeadersInit = {}
    if (session?.access_token) {
      headers['Authorization'] = `Bearer ${session.access_token}`
    }

    const response = await fetch(`${API_BASE}/upload`, {
      method: 'POST',
      headers,
      body: formData,
    })

    const { data, error } = await handleApiResponse<{ 
      success: boolean; 
      file: { id: string; name: string; size: number; type: string; url: string; uploaded_at: string; };
      message: string;
    }>(response)
    
    if (error) {
      return { file: null, error }
    }

    return { file: data?.file || null, error: null }
  } catch (error) {
    console.error('Error uploading file:', error)
    return { file: null, error: 'Network error occurred' }
  }
}

// Delete a file
export async function deleteFile(fileId: string, applicationId: string, documentType: string) {
  try {
    const headers = await getAuthHeaders()
    
    const response = await fetch(`${API_BASE}/files/${fileId}?application_id=${applicationId}&document_type=${documentType}`, {
      method: 'DELETE',
      headers,
    })

    const { data, error } = await handleApiResponse<{ success: boolean; message: string }>(response)
    
    if (error) {
      return { success: false, error }
    }

    return { success: data?.success || false, error: null }
  } catch (error) {
    console.error('Error deleting file:', error)
    return { success: false, error: 'Network error occurred' }
  }
} 