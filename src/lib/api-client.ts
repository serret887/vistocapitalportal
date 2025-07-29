import { api as apiConfig } from './config'

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
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      'X-Client-Version': '1.0.0',
      'X-Request-ID': this.generateRequestId(),
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
      
      if (apiConfig.logRequests) {
        console.log(`[API Response] ${requestId}:`, {
          status: response.status,
          statusText: response.statusText,
          url: response.url,
          success: response.ok
        })
      }
      
      if (!response.ok) {
        // Return the actual server error message
        const serverError = result.error || result.message || result.detail || `HTTP ${response.status}`
        
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
    retries: number = apiConfig.maxRetries
  ): Promise<ApiResponse<T>> {
    try {
      return await requestFn()
    } catch (error) {
      if (retries > 0) {
        console.warn(`Request failed, retrying... (${retries} attempts left)`)
        await new Promise(resolve => setTimeout(resolve, apiConfig.retryDelay))
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
      headers: customHeaders = {},
      isFormData = false,
      timeout = apiConfig.timeout,
      retries = apiConfig.maxRetries
    } = options

    const requestId = this.generateRequestId()

    return this.retryRequest(async () => {
      try {
        const authHeaders = await this.getAuthHeaders()
        
        let requestHeaders: HeadersInit = {
          ...authHeaders,
          ...customHeaders
        }

        // Remove Content-Type for FormData requests
        if (isFormData) {
          const { 'Content-Type': _, ...headersWithoutContentType } = requestHeaders as Record<string, string>
          requestHeaders = headersWithoutContentType
        }

        const requestOptions: RequestInit = {
          method,
          headers: requestHeaders,
        }

        if (body) {
          if (isFormData) {
            requestOptions.body = body
          } else {
            requestOptions.body = JSON.stringify(body)
          }
        }

        if (apiConfig.logRequests) {
          console.log(`[API Request] ${requestId}:`, {
            method,
            url: `${API_BASE}${endpoint}`,
            body: body ? (isFormData ? '[FormData]' : body) : undefined
          })
        }

        // Create abort controller for timeout
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), timeout)

        const response = await fetch(`${API_BASE}${endpoint}`, {
          ...requestOptions,
          signal: controller.signal
        })

        clearTimeout(timeoutId)

        return await this.handleApiResponse<T>(response, requestId)
      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
          throw new Error('Request timeout')
        }
        throw error
      }
    }, retries)
  }

  // Convenience methods for common HTTP methods
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

  // File upload method with progress tracking
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

  // Health check method
  async healthCheck(): Promise<boolean> {
    try {
      const response = await this.get('/health')
      return response.success || false
    } catch (error) {
      console.error('Health check failed:', error)
      return false
    }
  }
}

// Create and export a singleton instance
export const apiClient = new ApiClient()

// Export the class for testing purposes
export { ApiClient } 