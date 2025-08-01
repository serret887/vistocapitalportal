'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table'
import type { Client, Company } from '@/types'
import { Search, Plus, Edit, Trash2, Building, Users, Mail, Phone, Calendar, MoreHorizontal } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface ClientsCompaniesTableProps {
  onEditClient?: (client: Client) => void
  onEditCompany?: (company: Company) => void
  onDeleteClient?: (clientId: string) => void
  onDeleteCompany?: (companyId: string) => void
}

export function ClientsCompaniesTable({
  onEditClient,
  onEditCompany,
  onDeleteClient,
  onDeleteCompany
}: ClientsCompaniesTableProps) {
  const [clients, setClients] = useState<Client[]>([])
  const [companies, setCompanies] = useState<Company[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeTab, setActiveTab] = useState('clients')

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setIsLoading(true)
    try {
      const [clientsResponse, companiesResponse] = await Promise.all([
        fetch('/api/clients'),
        fetch('/api/companies')
      ])

      if (clientsResponse.ok) {
        const clientsData = await clientsResponse.json()
        setClients(clientsData)
      }

      if (companiesResponse.ok) {
        const companiesData = await companiesResponse.json()
        setCompanies(companiesData)
      }
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const filteredClients = clients.filter(client =>
    client.first_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    client.last_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    client.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    client.phone_number?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const filteredCompanies = companies.filter(company =>
    company.company_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    company.company_type?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    company.business_email?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString()
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  return (
    <Card className="border-2 border-border shadow-2xl">
      <CardHeader className="pb-6">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-2xl font-bold visto-dark-blue">
              Clients & Companies
            </CardTitle>
            <CardDescription className="text-lg visto-slate">
              Manage your clients and companies
            </CardDescription>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mt-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search by name, email, phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="clients" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Clients ({filteredClients.length})
            </TabsTrigger>
            <TabsTrigger value="companies" className="flex items-center gap-2">
              <Building className="w-4 h-4" />
              Companies ({filteredCompanies.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="clients" className="mt-6">
            {isLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p className="mt-2 text-gray-600">Loading clients...</p>
              </div>
            ) : filteredClients.length === 0 ? (
              <div className="text-center py-8">
                <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No clients found</h3>
                <p className="text-gray-600 mb-4">No clients found</p>
              </div>
            ) : (
              <div className="rounded-md border max-h-96 overflow-auto">
                <Table>
                  <TableHeader className="sticky top-0 bg-white z-10">
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead>Income</TableHead>
                      <TableHead>Assets</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredClients.map((client) => (
                      <TableRow key={client.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">
                              {client.first_name} {client.last_name}
                            </div>
                            <Badge variant="secondary" className="mt-1">
                              Client
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            {client.email && (
                              <div className="flex items-center gap-2 text-sm">
                                <Mail className="w-3 h-3 text-gray-500" />
                                {client.email}
                              </div>
                            )}
                            {client.phone_number && (
                              <div className="flex items-center gap-2 text-sm">
                                <Phone className="w-3 h-3 text-gray-500" />
                                {client.phone_number}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {client.total_income > 0 ? formatCurrency(client.total_income) : '-'}
                        </TableCell>
                        <TableCell>
                          {client.total_assets > 0 ? formatCurrency(client.total_assets) : '-'}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2 text-sm">
                            <Calendar className="w-3 h-3 text-gray-500" />
                            {formatDate(client.created_at)}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <span className="sr-only">Open menu</span>
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuItem onClick={() => onEditClient?.(client)}>
                                <Edit className="mr-2 h-4 w-4" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem 
                                onClick={() => onDeleteClient?.(client.id)}
                                className="text-red-600"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </TabsContent>

          <TabsContent value="companies" className="mt-6">
            {isLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p className="mt-2 text-gray-600">Loading companies...</p>
              </div>
            ) : filteredCompanies.length === 0 ? (
              <div className="text-center py-8">
                <Building className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No companies found</h3>
                <p className="text-gray-600 mb-4">No companies found</p>
              </div>
            ) : (
              <div className="rounded-md border max-h-96 overflow-auto">
                <Table>
                  <TableHeader className="sticky top-0 bg-white z-10">
                    <TableRow>
                      <TableHead>Company Name</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead>Revenue</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredCompanies.map((company) => (
                      <TableRow key={company.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">
                              {company.company_name}
                            </div>
                            <Badge variant="secondary" className="mt-1">
                              {company.company_type || 'Company'}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell>
                          {company.company_type || '-'}
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            {company.business_email && (
                              <div className="flex items-center gap-2 text-sm">
                                <Mail className="w-3 h-3 text-gray-500" />
                                {company.business_email}
                              </div>
                            )}
                            {company.business_phone && (
                              <div className="flex items-center gap-2 text-sm">
                                <Phone className="w-3 h-3 text-gray-500" />
                                {company.business_phone}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {company.annual_revenue && company.annual_revenue > 0 
                            ? formatCurrency(company.annual_revenue) 
                            : '-'
                          }
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2 text-sm">
                            <Calendar className="w-3 h-3 text-gray-500" />
                            {formatDate(company.created_at)}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <span className="sr-only">Open menu</span>
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuItem onClick={() => onEditCompany?.(company)}>
                                <Edit className="mr-2 h-4 w-4" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem 
                                onClick={() => onDeleteCompany?.(company.id)}
                                className="text-red-600"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
} 