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
      console.log('Loading clients and companies data...')
      
      const [clientsResponse, companiesResponse] = await Promise.all([
        fetch('/api/clients'),
        fetch('/api/companies')
      ])

      console.log('Clients response status:', clientsResponse.status)
      console.log('Companies response status:', companiesResponse.status)

      if (clientsResponse.ok) {
        const clientsData = await clientsResponse.json()
        console.log('Clients data loaded:', clientsData)
        setClients(clientsData)
      } else {
        console.error('Failed to load clients:', clientsResponse.status, clientsResponse.statusText)
        const errorText = await clientsResponse.text()
        console.error('Error details:', errorText)
      }

      if (companiesResponse.ok) {
        const companiesData = await companiesResponse.json()
        console.log('Companies data loaded:', companiesData)
        setCompanies(companiesData)
      } else {
        console.error('Failed to load companies:', companiesResponse.status, companiesResponse.statusText)
        const errorText = await companiesResponse.text()
        console.error('Error details:', errorText)
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
    <Card className="border-2 border-border shadow-2xl h-full flex flex-col">
      <CardHeader className="pb-3 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg font-bold visto-dark-blue">
              Clients & Companies
            </CardTitle>
            <CardDescription className="text-sm visto-slate">
              Manage your clients and companies
            </CardDescription>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mt-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-3 h-3" />
            <Input
              placeholder="Search by name, email, phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 text-sm"
            />
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-1 overflow-hidden">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
          <TabsList className="grid w-full grid-cols-2 flex-shrink-0">
            <TabsTrigger value="clients" className="flex items-center gap-1 text-sm">
              <Users className="w-3 h-3" />
              Clients ({filteredClients.length})
            </TabsTrigger>
            <TabsTrigger value="companies" className="flex items-center gap-1 text-sm">
              <Building className="w-3 h-3" />
              Companies ({filteredCompanies.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="clients" className="mt-3 flex-1 overflow-hidden">
            {isLoading ? (
              <div className="text-center py-6">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
                <p className="mt-2 text-sm text-gray-600">Loading clients...</p>
              </div>
            ) : filteredClients.length === 0 ? (
              <div className="text-center py-6">
                <Users className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <h3 className="text-sm font-semibold text-gray-900 mb-1">No clients found</h3>
                <p className="text-xs text-gray-600">No clients found</p>
              </div>
            ) : (
              <div className="rounded-md border h-full overflow-auto">
                <Table>
                  <TableHeader className="sticky top-0 bg-white z-10">
                    <TableRow>
                      <TableHead className="text-xs">Name</TableHead>
                      <TableHead className="text-xs">Contact</TableHead>
                      <TableHead className="text-xs">Income</TableHead>
                      <TableHead className="text-xs">Assets</TableHead>
                      <TableHead className="text-xs">Created</TableHead>
                      <TableHead className="text-right text-xs">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredClients.map((client) => (
                      <TableRow key={client.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium text-sm">
                              {client.first_name} {client.last_name}
                            </div>
                            <Badge variant="secondary" className="mt-1 text-xs">
                              Client
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            {client.email && (
                              <div className="flex items-center gap-1 text-xs">
                                <Mail className="w-3 h-3 text-gray-500" />
                                {client.email}
                              </div>
                            )}
                            {client.phone_number && (
                              <div className="flex items-center gap-1 text-xs">
                                <Phone className="w-3 h-3 text-gray-500" />
                                {client.phone_number}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-xs">
                          {client.total_income > 0 ? formatCurrency(client.total_income) : '-'}
                        </TableCell>
                        <TableCell className="text-xs">
                          {client.total_assets > 0 ? formatCurrency(client.total_assets) : '-'}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 text-xs">
                            <Calendar className="w-3 h-3 text-gray-500" />
                            {formatDate(client.created_at)}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-6 w-6 p-0">
                                <span className="sr-only">Open menu</span>
                                <MoreHorizontal className="h-3 w-3" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuItem onClick={() => onEditClient?.(client)}>
                                <Edit className="mr-2 h-3 w-3" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem 
                                onClick={() => onDeleteClient?.(client.id)}
                                className="text-red-600"
                              >
                                <Trash2 className="mr-2 h-3 w-3" />
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

          <TabsContent value="companies" className="mt-3 flex-1 overflow-hidden">
            {isLoading ? (
              <div className="text-center py-6">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
                <p className="mt-2 text-sm text-gray-600">Loading companies...</p>
              </div>
            ) : filteredCompanies.length === 0 ? (
              <div className="text-center py-6">
                <Building className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <h3 className="text-sm font-semibold text-gray-900 mb-1">No companies found</h3>
                <p className="text-xs text-gray-600">No companies found</p>
              </div>
            ) : (
              <div className="rounded-md border h-full overflow-auto">
                <Table>
                  <TableHeader className="sticky top-0 bg-white z-10">
                    <TableRow>
                      <TableHead className="text-xs">Company Name</TableHead>
                      <TableHead className="text-xs">Type</TableHead>
                      <TableHead className="text-xs">Contact</TableHead>
                      <TableHead className="text-xs">Revenue</TableHead>
                      <TableHead className="text-xs">Created</TableHead>
                      <TableHead className="text-right text-xs">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredCompanies.map((company) => (
                      <TableRow key={company.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium text-sm">
                              {company.company_name}
                            </div>
                            <Badge variant="secondary" className="mt-1 text-xs">
                              {company.company_type || 'Company'}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell className="text-xs">
                          {company.company_type || '-'}
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            {company.business_email && (
                              <div className="flex items-center gap-1 text-xs">
                                <Mail className="w-3 h-3 text-gray-500" />
                                {company.business_email}
                              </div>
                            )}
                            {company.business_phone && (
                              <div className="flex items-center gap-1 text-xs">
                                <Phone className="w-3 h-3 text-gray-500" />
                                {company.business_phone}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-xs">
                          {company.annual_revenue && company.annual_revenue > 0 
                            ? formatCurrency(company.annual_revenue) 
                            : '-'
                          }
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 text-xs">
                            <Calendar className="w-3 h-3 text-gray-500" />
                            {formatDate(company.created_at)}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-6 w-6 p-0">
                                <span className="sr-only">Open menu</span>
                                <MoreHorizontal className="h-3 w-3" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuItem onClick={() => onEditCompany?.(company)}>
                                <Edit className="mr-2 h-3 w-3" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem 
                                onClick={() => onDeleteCompany?.(company.id)}
                                className="text-red-600"
                              >
                                <Trash2 className="mr-2 h-3 w-3" />
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