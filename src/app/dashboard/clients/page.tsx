'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { searchClients, getClient, createClient, deleteClient } from '@/lib/clients'
import type { ClientSearchResult, Client } from '@/types'
import { Plus, Search, User, Mail, Phone, Calendar, Edit, Trash2, Eye } from 'lucide-react'

export default function ClientsPage() {
  const router = useRouter()
  const [clients, setClients] = useState<ClientSearchResult[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)
  const [showClientDetails, setShowClientDetails] = useState(false)

  // Load initial clients
  const loadClients = useCallback(async () => {
    setIsLoading(true)
    try {
      const { clients, error } = await searchClients('', 50) // Load up to 50 clients
      
      if (error) {
        if (error.includes('Authentication required')) {
          toast.error('Please log in to access clients')
          router.push('/login')
          return
        } else if (error.includes('Onboarding required')) {
          toast.error('Please complete onboarding first')
          router.push('/onboarding')
          return
        } else {
          toast.error(`Failed to load clients: ${error}`)
        }
        return
      }

      setClients(clients || [])
    } catch (error) {
      console.error('Error loading clients:', error)
      toast.error('An unexpected error occurred')
    } finally {
      setIsLoading(false)
    }
  }, [router])

  useEffect(() => {
    loadClients()
  }, [loadClients])

  // Search clients
  const performSearch = async (query: string) => {
    if (query.length < 2) {
      await loadClients() // Load all clients if search is too short
      return
    }

    setIsSearching(true)
    try {
      const { clients, error } = await searchClients(query, 20)
      
      if (error) {
        toast.error(`Search failed: ${error}`)
        return
      }

      setClients(clients || [])
    } catch (error) {
      console.error('Error searching clients:', error)
      toast.error('Search failed')
    } finally {
      setIsSearching(false)
    }
  }

  // View client details
  const viewClientDetails = async (clientId: string) => {
    try {
      const { client, error } = await getClient(clientId)
      
      if (error) {
        toast.error(`Failed to load client details: ${error}`)
        return
      }

      if (!client) {
        toast.error('Client not found')
        return
      }

      setSelectedClient(client)
      setShowClientDetails(true)
    } catch (error) {
      console.error('Error loading client details:', error)
      toast.error('Failed to load client details')
    }
  }

  // Delete client
  const handleDeleteClient = async (clientId: string, clientName: string) => {
    if (!confirm(`Are you sure you want to delete ${clientName}? This action cannot be undone.`)) {
      return
    }

    try {
      const { success, error } = await deleteClient(clientId)
      
      if (error) {
        toast.error(`Failed to delete client: ${error}`)
        return
      }

      if (success) {
        toast.success('Client deleted successfully')
        loadClients() // Reload the list
      }
    } catch (error) {
      console.error('Error deleting client:', error)
      toast.error('Failed to delete client')
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-lg visto-slate">Loading clients...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 space-y-8 p-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold visto-dark-blue tracking-tight">
            My Clients
          </h1>
          <p className="text-xl visto-slate mt-2">
            Manage your client database and information
          </p>
        </div>
        
        <Button
          onClick={() => setShowCreateForm(true)}
          className="px-8 py-4 text-lg bg-primary hover:bg-primary/90 text-primary-foreground font-semibold tracking-wide transition-all duration-200 shadow-lg hover:shadow-xl"
        >
          <Plus className="w-5 h-5 mr-3" />
          Add New Client
        </Button>
      </div>

      {/* Search Bar */}
      <Card className="border-2 border-primary/20">
        <CardContent className="p-6">
          <div className="flex items-center space-x-4">
            <div className="flex-1">
              <Label htmlFor="search" className="text-lg font-medium visto-dark-blue">
                Search Clients
              </Label>
              <div className="flex items-center space-x-2 mt-2">
                <Input
                  id="search"
                  type="text"
                  placeholder="Search by name, email, or phone..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value)
                    performSearch(e.target.value)
                  }}
                  className="text-lg py-4 px-5 border-2 focus:ring-2 focus:ring-primary focus:border-primary"
                />
                <Button
                  onClick={() => performSearch(searchQuery)}
                  disabled={isSearching}
                  className="px-6 py-4 bg-primary hover:bg-primary/90 text-primary-foreground"
                >
                  <Search className="w-5 h-5" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Clients List */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold visto-dark-blue">
            {searchQuery ? 'Search Results' : 'All Clients'}
          </h2>
          <Badge variant="secondary" className="text-lg px-4 py-2">
            {clients.length} {clients.length === 1 ? 'Client' : 'Clients'}
          </Badge>
        </div>

        {clients.length === 0 ? (
          <Card className="border-2 border-dashed border-primary/30 bg-gradient-visto-subtle">
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <User className="h-16 w-16 visto-gold mb-6" />
              <h3 className="text-2xl font-semibold visto-dark-blue mb-3">
                {searchQuery ? 'No clients found' : 'No clients yet'}
              </h3>
              <p className="text-lg visto-slate mb-8 max-w-lg">
                {searchQuery 
                  ? 'Try adjusting your search terms or create a new client.'
                  : 'Start building your client database by adding your first client.'
                }
              </p>
              <Button
                onClick={() => setShowCreateForm(true)}
                className="px-12 py-4 text-lg bg-primary hover:bg-primary/90 text-primary-foreground font-semibold tracking-wide transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                <Plus className="w-5 h-5 mr-3" />
                Add First Client
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {clients.map((client) => (
              <Card key={client.id} className="border-2 border-border hover:border-primary/50 transition-all duration-200">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-xl font-semibold visto-dark-blue">
                        {client.first_name} {client.last_name}
                      </CardTitle>
                      <CardDescription className="text-base visto-slate mt-1">
                        Client since {new Date(client.created_at).toLocaleDateString()}
                      </CardDescription>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => viewClientDetails(client.id)}
                        className="text-blue-600 border-blue-300 hover:bg-blue-50"
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDeleteClient(client.id, `${client.first_name} ${client.last_name}`)}
                        className="text-red-600 border-red-300 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {client.email && (
                    <div className="flex items-center space-x-2 text-sm">
                      <Mail className="w-4 h-4 text-gray-500" />
                      <span className="visto-slate">{client.email}</span>
                    </div>
                  )}
                  {client.phone_number && (
                    <div className="flex items-center space-x-2 text-sm">
                      <Phone className="w-4 h-4 text-gray-500" />
                      <span className="visto-slate">{client.phone_number}</span>
                    </div>
                  )}
                  <div className="flex items-center space-x-2 text-sm">
                    <Calendar className="w-4 h-4 text-gray-500" />
                    <span className="visto-slate">
                      Added {new Date(client.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Client Details Modal */}
      {showClientDetails && selectedClient && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-2xl font-bold visto-dark-blue">
                  Client Details
                </CardTitle>
                <Button
                  variant="outline"
                  onClick={() => setShowClientDetails(false)}
                  size="sm"
                >
                  Close
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium visto-dark-blue">Name</Label>
                  <p className="text-lg">{selectedClient.first_name} {selectedClient.last_name}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium visto-dark-blue">Email</Label>
                  <p className="text-lg">{selectedClient.email || 'Not provided'}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium visto-dark-blue">Phone</Label>
                  <p className="text-lg">{selectedClient.phone_number || 'Not provided'}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium visto-dark-blue">SSN</Label>
                  <p className="text-lg">{selectedClient.ssn || 'Not provided'}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium visto-dark-blue">Date of Birth</Label>
                  <p className="text-lg">{selectedClient.date_of_birth || 'Not provided'}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium visto-dark-blue">Current Residence</Label>
                  <p className="text-lg">{selectedClient.current_residence || 'Not provided'}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium visto-dark-blue">Total Income</Label>
                  <p className="text-lg">${selectedClient.total_income?.toLocaleString() || '0'}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium visto-dark-blue">Total Assets</Label>
                  <p className="text-lg">${selectedClient.total_assets?.toLocaleString() || '0'}</p>
                </div>
              </div>
              
              <div className="pt-4 border-t border-border">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">
                    Created: {new Date(selectedClient.created_at).toLocaleDateString()}
                  </span>
                  <span className="text-sm text-gray-500">
                    Updated: {new Date(selectedClient.updated_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Create Client Form Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-2xl font-bold visto-dark-blue">
                  Add New Client
                </CardTitle>
                <Button
                  variant="outline"
                  onClick={() => setShowCreateForm(false)}
                  size="sm"
                >
                  Cancel
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <CreateClientForm 
                onSuccess={() => {
                  setShowCreateForm(false)
                  loadClients()
                }}
                onCancel={() => setShowCreateForm(false)}
              />
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}

// Create Client Form Component
interface CreateClientFormProps {
  onSuccess: () => void
  onCancel: () => void
}

function CreateClientForm({ onSuccess, onCancel }: CreateClientFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone_number: '',
    ssn: '',
    date_of_birth: '',
    current_residence: ''
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.first_name || !formData.last_name || !formData.email) {
      toast.error('Please fill in all required fields')
      return
    }

    setIsLoading(true)
    try {
      const { client, error } = await createClient({
        ...formData,
        total_income: 0,
        income_sources: [],
        income_documents: [],
        total_assets: 0,
        bank_accounts: [],
        bank_statements: []
      })

      if (error) {
        toast.error(`Failed to create client: ${error}`)
        return
      }

      if (client) {
        toast.success('Client created successfully')
        onSuccess()
      }
    } catch (error) {
      console.error('Error creating client:', error)
      toast.error('Failed to create client')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="first_name" className="text-base font-medium visto-dark-blue">
            First Name *
          </Label>
          <Input
            id="first_name"
            type="text"
            required
            value={formData.first_name}
            onChange={(e) => setFormData(prev => ({ ...prev, first_name: e.target.value }))}
            className="mt-2"
          />
        </div>
        
        <div>
          <Label htmlFor="last_name" className="text-base font-medium visto-dark-blue">
            Last Name *
          </Label>
          <Input
            id="last_name"
            type="text"
            required
            value={formData.last_name}
            onChange={(e) => setFormData(prev => ({ ...prev, last_name: e.target.value }))}
            className="mt-2"
          />
        </div>
        
        <div>
          <Label htmlFor="email" className="text-base font-medium visto-dark-blue">
            Email *
          </Label>
          <Input
            id="email"
            type="email"
            required
            value={formData.email}
            onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
            className="mt-2"
          />
        </div>
        
        <div>
          <Label htmlFor="phone_number" className="text-base font-medium visto-dark-blue">
            Phone Number
          </Label>
          <Input
            id="phone_number"
            type="tel"
            value={formData.phone_number}
            onChange={(e) => setFormData(prev => ({ ...prev, phone_number: e.target.value }))}
            className="mt-2"
          />
        </div>
        
        <div>
          <Label htmlFor="ssn" className="text-base font-medium visto-dark-blue">
            SSN
          </Label>
          <Input
            id="ssn"
            type="text"
            value={formData.ssn}
            onChange={(e) => setFormData(prev => ({ ...prev, ssn: e.target.value }))}
            className="mt-2"
          />
        </div>
        
        <div>
          <Label htmlFor="date_of_birth" className="text-base font-medium visto-dark-blue">
            Date of Birth
          </Label>
          <Input
            id="date_of_birth"
            type="date"
            value={formData.date_of_birth}
            onChange={(e) => setFormData(prev => ({ ...prev, date_of_birth: e.target.value }))}
            className="mt-2"
          />
        </div>
      </div>
      
      <div>
        <Label htmlFor="current_residence" className="text-base font-medium visto-dark-blue">
          Current Residence
        </Label>
        <Input
          id="current_residence"
          type="text"
          value={formData.current_residence}
          onChange={(e) => setFormData(prev => ({ ...prev, current_residence: e.target.value }))}
          className="mt-2"
        />
      </div>
      
      <div className="flex justify-end space-x-4 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isLoading}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={isLoading}
          className="bg-primary hover:bg-primary/90 text-primary-foreground"
        >
          {isLoading ? 'Creating...' : 'Create Client'}
        </Button>
      </div>
    </form>
  )
} 