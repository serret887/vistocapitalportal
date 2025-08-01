// API base URL
const API_BASE = '/api'

// Types for API responses
export interface ApiResponse<T = any> {
  data?: T
  error?: string
  success?: boolean
  message?: string
}

export interface ApiError {
  error: string
  status?: number
}

// Unified API client class
class ApiClient {
  private async getAuthHeaders(): Promise<HeadersInit> {
    // Get token from localStorage or sessionStorage
    const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token')
    
    const requestId = this.generateRequestId()
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      'X-Client-Version': '1.0.0',
      'X-Request-ID': requestId,
      'x-correlation-id': requestId,
    }
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }
    
    return headers
  }

  private generateRequestId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }

  private async handleApiResponse<T>(response: Response, requestId: string): Promise<ApiResponse<T>> {
    try {
      const result = await response.json()
      
      // Log response with correlation ID
      const correlationId = response.headers.get('x-correlation-id') || requestId
      console.log(`[${correlationId}] API Response: ${response.status}`, {
        url: response.url,
        status: response.status,
        hasData: !!result.data,
        hasError: !!result.error
      })
      
      if (!response.ok) {
        // Return the actual server error message
        const serverError = result.error || result.message || result.detail || `HTTP ${response.status}`
        
        console.log(`[${correlationId}] API Error: ${serverError}`, {
          status: response.status,
          url: response.url
        })
        
        // Handle authentication errors specially
        if (response.status === 401) {
          await this.handleAuthError()
        }
        
        return { error: serverError }
      }

      return { data: result, success: true }
    } catch (error) {
      console.error('API response parsing error:', error)
      return { error: 'Failed to parse response' }
    }
  }

  private async handleAuthError(): Promise<void> {
    // Clear stored token
    localStorage.removeItem('auth_token')
    sessionStorage.removeItem('auth_token')
    
    // Redirect to login page
    if (typeof window !== 'undefined') {
      window.location.href = '/login'
    }
  }

  private async retryRequest<T>(
    requestFn: () => Promise<ApiResponse<T>>,
    retries: number = 3
  ): Promise<ApiResponse<T>> {
    try {
      return await requestFn()
    } catch (error) {
      if (retries > 0) {
        console.warn(`Request failed, retrying... (${retries} attempts left)`)
        await new Promise(resolve => setTimeout(resolve, 1000))
        return this.retryRequest(requestFn, retries - 1)
      }
      throw error
    }
  }

  // Generic request method with timeout and retry logic
  async request<T>(
    endpoint: string,
    options: {
      method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
      body?: any
      headers?: HeadersInit
      isFormData?: boolean
      timeout?: number
      retries?: number
    } = {}
  ): Promise<ApiResponse<T>> {
    const {
      method = 'GET',
      body,
      headers: additionalHeaders = {},
      isFormData = false,
      timeout = 30000,
      retries = 3
    } = options

    const requestId = this.generateRequestId()
    
    // Log the request
    console.log(`[${requestId}] API Request: ${method} ${endpoint}`, {
      hasBody: !!body,
      isFormData,
      timeout,
      retries
    })

    return this.retryRequest(async () => {
      const authHeaders = await this.getAuthHeaders()
      
      const requestOptions: RequestInit = {
        method,
        headers: {
          ...authHeaders,
          ...additionalHeaders,
        },
        signal: AbortSignal.timeout(timeout),
      }

      if (body) {
        if (isFormData) {
          requestOptions.body = body
          // Remove Content-Type for FormData to let browser set it
          delete (requestOptions.headers as any)['Content-Type']
        } else {
          requestOptions.body = JSON.stringify(body)
        }
      }

      const url = endpoint.startsWith('http') ? endpoint : `${API_BASE}${endpoint}`
      
      try {
        const response = await fetch(url, requestOptions)
        return await this.handleApiResponse<T>(response, requestId)
      } catch (error) {
        console.error(`[${requestId}] API Request failed:`, error)
        throw error
      }
    }, retries)
  }

  // Convenience methods
  async get<T>(endpoint: string, options?: { timeout?: number; retries?: number }): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'GET', ...options })
  }

  async post<T>(endpoint: string, body: any, options?: { timeout?: number; retries?: number }): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'POST', body, ...options })
  }

  async put<T>(endpoint: string, body: any, options?: { timeout?: number; retries?: number }): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'PUT', body, ...options })
  }

  async patch<T>(endpoint: string, body: any, options?: { timeout?: number; retries?: number }): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'PATCH', body, ...options })
  }

  async delete<T>(endpoint: string, options?: { timeout?: number; retries?: number }): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'DELETE', ...options })
  }

  async uploadFile<T>(
    endpoint: string,
    formData: FormData,
    options?: { 
      timeout?: number; 
      retries?: number;
      onProgress?: (progress: number) => void;
    }
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: formData,
      isFormData: true,
      ...options
    })
  }
}

// Export singleton instance
export const apiClient = new ApiClient()

// Convenience functions for common operations
export const api = {
  // Auth endpoints
  signIn: (email: string, password: string) => 
    apiClient.post('/auth/signin', { email, password }),
  
  signUp: (userData: any) => 
    apiClient.post('/auth/signup', userData),
  
  getCurrentUser: () => 
    apiClient.get('/auth/me'),
  
  signOut: () => 
    apiClient.post('/auth/signout', {}),

  // Application endpoints
  getApplications: () => 
    apiClient.get('/applications'),
  
  getApplication: (id: string) => 
    apiClient.get(`/applications/${id}`),
  
  createApplication: (data: any) => 
    apiClient.post('/applications', data),
  
  updateApplication: (id: string, data: any) => 
    apiClient.put(`/applications/${id}`, data),
  
  deleteApplication: (id: string) => 
    apiClient.delete(`/applications/${id}`),

  // File upload
  uploadFile: (file: File, onProgress?: (progress: number) => void) => {
    const formData = new FormData()
    formData.append('file', file)
    return apiClient.uploadFile('/upload', formData, { onProgress })
  },

  // Health check
  health: () => 
    apiClient.get('/health'),

  // Loan endpoints
  getLoans: (applicationId: string) => 
    apiClient.get(`/applications/${applicationId}/loans`),
  
  createLoan: (applicationId: string, loanData: any) => 
    apiClient.post(`/applications/${applicationId}/loans`, loanData),
  
  deleteLoan: (applicationId: string, loanId: string) => 
    apiClient.delete(`/applications/${applicationId}/loans/${loanId}`),
  
  deleteAllLoans: (applicationId: string) => 
    apiClient.delete(`/applications/${applicationId}/loans`),
} 