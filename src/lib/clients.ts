import type { ClientSearchResult, Client } from '@/types'
import { apiClient } from './api-client'

// Search clients with RBA protection
export async function searchClients(query: string, limit: number = 10) {
  try {
    const response = await apiClient.get<ClientSearchResult[]>(`/clients/search?q=${encodeURIComponent(query)}&limit=${limit}`)
    
    if (response.error) {
      return { clients: null, error: response.error }
    }

    return { clients: response.data || [], error: null }
  } catch (error) {
    console.error('Error searching clients:', error)
    return { clients: null, error: 'Network error occurred' }
  }
}

// Get specific client by ID with RBA protection
export async function getClient(clientId: string) {
  try {
    const response = await apiClient.get<Client>(`/clients/${clientId}`)
    
    if (response.error) {
      return { client: null, error: response.error }
    }

    return { client: response.data || null, error: null }
  } catch (error) {
    console.error('Error getting client:', error)
    return { client: null, error: 'Network error occurred' }
  }
}

// Create a new client
export async function createClient(clientData: Omit<Client, 'id' | 'created_at' | 'updated_at'>) {
  try {
    const response = await apiClient.post<{ client: Client; success: boolean; message: string }>(
      '/clients',
      clientData
    )
    
    if (response.error) {
      return { client: null, error: response.error }
    }

    return { client: response.data?.client || null, error: null }
  } catch (error) {
    console.error('Error creating client:', error)
    return { client: null, error: 'Network error occurred' }
  }
}

// Update an existing client
export async function updateClient(clientId: string, clientData: Partial<Client>) {
  try {
    const response = await apiClient.put<{ client: Client; success: boolean }>(
      `/clients/${clientId}`,
      clientData
    )
    
    if (response.error) {
      return { client: null, error: response.error }
    }

    return { client: response.data?.client || null, error: null }
  } catch (error) {
    console.error('Error updating client:', error)
    return { client: null, error: 'Network error occurred' }
  }
}

// Delete a client
export async function deleteClient(clientId: string) {
  try {
    const response = await apiClient.delete<{ success: boolean }>(`/clients/${clientId}`)
    
    if (response.error) {
      return { success: false, error: response.error }
    }

    return { success: true, error: null }
  } catch (error) {
    console.error('Error deleting client:', error)
    return { success: false, error: 'Network error occurred' }
  }
} 