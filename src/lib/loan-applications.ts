import type { LoanApplicationFormData, LoanApplication, DashboardStats, LoanApplicationStatus } from '@/types'
import { apiClient } from './api-client'

// Create a new loan application
export async function createLoanApplication(formData: LoanApplicationFormData) {
  try {
    const response = await apiClient.post<{ application: LoanApplication; success: boolean; message: string }>(
      '/applications',
      formData
    )
    
    if (response.error) {
      return { application: null, error: response.error }
    }

    return { application: response.data?.application || null, error: null }
  } catch (error) {
    console.error('Error creating loan application:', error)
    return { application: null, error: 'Network error occurred' }
  }
}

// Get all loan applications for the current partner
export async function getLoanApplications() {
  try {
    const response = await apiClient.get<{ applications: LoanApplication[]; success: boolean }>('/applications')
    
    if (response.error) {
      return { applications: null, error: response.error }
    }

    return { applications: response.data?.applications || [], error: null }
  } catch (error) {
    console.error('Error fetching loan applications:', error)
    return { applications: null, error: 'Network error occurred' }
  }
}

// Get a specific loan application
export async function getLoanApplication(id: string) {
  try {
    const response = await apiClient.get<{ application: LoanApplication; success: boolean }>(`/applications/${id}`)
    
    if (response.error) {
      return { application: null, error: response.error }
    }

    return { application: response.data?.application || null, error: null }
  } catch (error) {
    console.error('Error fetching loan application:', error)
    return { application: null, error: 'Network error occurred' }
  }
}

// Update a loan application
export async function updateLoanApplication(id: string, formData: Partial<LoanApplicationFormData>) {
  try {
    const response = await apiClient.put<{ application: LoanApplication; success: boolean }>(
      `/applications/${id}`,
      formData
    )
    
    if (response.error) {
      return { application: null, error: response.error }
    }

    return { application: response.data?.application || null, error: null }
  } catch (error) {
    console.error('Error updating loan application:', error)
    return { application: null, error: 'Network error occurred' }
  }
}

// Update application status
export async function updateApplicationStatus(id: string, status: LoanApplicationStatus) {
  try {
    const response = await apiClient.patch<{ application: LoanApplication; success: boolean }>(
      `/applications/${id}/status`,
      { status }
    )
    
    if (response.error) {
      return { application: null, error: response.error }
    }

    return { application: response.data?.application || null, error: null }
  } catch (error) {
    console.error('Error updating application status:', error)
    return { application: null, error: 'Network error occurred' }
  }
}

// Delete a loan application
export async function deleteLoanApplication(id: string) {
  try {
    const response = await apiClient.delete<{ success: boolean }>(`/applications/${id}`)
    
    if (response.error) {
      return { success: false, error: response.error }
    }

    return { success: true, error: null }
  } catch (error) {
    console.error('Error deleting loan application:', error)
    return { success: false, error: 'Network error occurred' }
  }
}

// Get dashboard statistics
export async function getDashboardStats() {
  try {
    const response = await apiClient.get<{ stats: DashboardStats; success: boolean }>('/dashboard/stats')
    
    if (response.error) {
      return { stats: null, error: response.error }
    }

    return { stats: response.data?.stats || null, error: null }
  } catch (error) {
    console.error('Error fetching dashboard stats:', error)
    return { stats: null, error: 'Network error occurred' }
  }
}

// Upload a file
export async function uploadFile(file: File, documentType: string, applicationId?: string) {
  try {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('document_type', documentType)
    if (applicationId) {
      formData.append('application_id', applicationId)
    }

    const response = await apiClient.uploadFile<{ 
      success: boolean; 
      file: { id: string; name: string; size: number; type: string; url: string; uploaded_at: string; };
      message: string;
    }>('/upload', formData)
    
    if (response.error) {
      return { file: null, error: response.error }
    }

    return { file: response.data?.file || null, error: null }
  } catch (error) {
    console.error('Error uploading file:', error)
    return { file: null, error: 'Network error occurred' }
  }
}

// Get file by ID
export async function getFile(fileId: string, applicationId?: string, documentType?: string) {
  try {
    let endpoint = `/files/${fileId}`
    const params = new URLSearchParams()
    if (applicationId) params.append('application_id', applicationId)
    if (documentType) params.append('document_type', documentType)
    if (params.toString()) {
      endpoint += `?${params.toString()}`
    }

    const response = await apiClient.get<{ 
      file: { id: string; name: string; size: number; type: string; url: string; uploaded_at: string; };
      success: boolean;
    }>(endpoint)
    
    if (response.error) {
      return { file: null, error: response.error }
    }

    return { file: response.data?.file || null, error: null }
  } catch (error) {
    console.error('Error fetching file:', error)
    return { file: null, error: 'Network error occurred' }
  }
} 