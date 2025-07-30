'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { MoreHorizontal, Eye, Edit, Trash2, User, Building, Users } from 'lucide-react'
import { format } from 'date-fns'
import { toast } from 'sonner'

interface BorrowerApplication {
  id: string
  application_name: string
  application_type: string
  status: string
  notes?: string
  created_at: string
  updated_at: string
  borrower_applications: Array<{
    borrower_role: string
    borrowers: {
      id: string
      first_name: string
      last_name: string
      email?: string
      phone_number?: string
      borrower_companies?: Array<{
        ownership_percentage?: number
        role_in_company?: string
        companies: {
          id: string
          company_name: string
          company_type?: string
        }
      }>
    }
  }>
}

interface BorrowerApplicationsTableProps {
  applications: BorrowerApplication[]
  onViewApplication?: (application: BorrowerApplication) => void
  onEditApplication?: (application: BorrowerApplication) => void
  onDeleteApplication?: (applicationId: string) => void
}

export function BorrowerApplicationsTable({ 
  applications, 
  onViewApplication, 
  onEditApplication, 
  onDeleteApplication 
}: BorrowerApplicationsTableProps) {
  const [isLoading, setIsLoading] = useState(false)

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'in_review':
        return 'bg-yellow-100 text-yellow-800'
      case 'approved':
        return 'bg-green-100 text-green-800'
      case 'ineligible':
        return 'bg-red-100 text-red-800'
      case 'denied':
        return 'bg-red-100 text-red-800'
      case 'closed':
        return 'bg-gray-100 text-gray-800'
      case 'missing_conditions':
        return 'bg-orange-100 text-orange-800'
      case 'pending_documents':
        return 'bg-blue-100 text-blue-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'in_review':
        return 'In Review'
      case 'approved':
        return 'Approved'
      case 'ineligible':
        return 'Ineligible'
      case 'denied':
        return 'Denied'
      case 'closed':
        return 'Closed'
      case 'missing_conditions':
        return 'Missing Conditions'
      case 'pending_documents':
        return 'Pending Documents'
      default:
        return status
    }
  }

  const getBorrowerRoleLabel = (role: string) => {
    switch (role) {
      case 'primary':
        return 'Primary'
      case 'co_borrower':
        return 'Co-Borrower'
      case 'guarantor':
        return 'Guarantor'
      default:
        return role
    }
  }

  const getPrimaryBorrower = (application: BorrowerApplication) => {
    return application.borrower_applications.find(ba => ba.borrower_role === 'primary')?.borrowers
  }

  const getAdditionalBorrowers = (application: BorrowerApplication) => {
    return application.borrower_applications.filter(ba => ba.borrower_role !== 'primary')
  }

  const getCompanyInfo = (borrower: any) => {
    if (!borrower.borrower_companies || borrower.borrower_companies.length === 0) {
      return null
    }
    return borrower.borrower_companies[0]
  }

  const handleDelete = async (applicationId: string) => {
    if (!confirm('Are you sure you want to delete this application? This action cannot be undone.')) {
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch(`/api/applications/${applicationId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        toast.error('Failed to delete application')
        return
      }

      toast.success('Application deleted successfully')
      onDeleteApplication?.(applicationId)
    } catch (error) {
      console.error('Delete error:', error)
      toast.error('An unexpected error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  if (applications.length === 0) {
    return (
      <Card>
        <CardContent className="p-8">
          <div className="text-center">
            <Users className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Applications Yet</h3>
            <p className="text-gray-500 mb-4">
              You haven't created any borrower applications yet.
            </p>
            <Button onClick={() => window.location.href = '/dashboard/applications/new'}>
              Create Your First Application
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl font-bold visto-dark-blue">
          Borrower Applications
        </CardTitle>
        <CardDescription>
          Manage your borrower applications and their associated information
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Application</TableHead>
                <TableHead>Primary Borrower</TableHead>
                <TableHead>Additional Borrowers</TableHead>
                <TableHead>Company</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {applications.map((application) => {
                const primaryBorrower = getPrimaryBorrower(application)
                const additionalBorrowers = getAdditionalBorrowers(application)
                const primaryCompany = primaryBorrower ? getCompanyInfo(primaryBorrower) : null

                return (
                  <TableRow key={application.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{application.application_name}</div>
                        <div className="text-sm text-gray-500">
                          {application.application_type === 'loan_application' ? 'Loan Application' : 'Refinance Application'}
                        </div>
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      {primaryBorrower ? (
                        <div className="flex items-center space-x-2">
                          <User className="w-4 h-4 text-gray-400" />
                          <div>
                            <div className="font-medium">
                              {primaryBorrower.first_name} {primaryBorrower.last_name}
                            </div>
                            <div className="text-sm text-gray-500">
                              {primaryBorrower.email}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <span className="text-gray-400">No primary borrower</span>
                      )}
                    </TableCell>
                    
                    <TableCell>
                      {additionalBorrowers.length > 0 ? (
                        <div className="space-y-1">
                          {additionalBorrowers.map((ba, index) => (
                            <div key={ba.borrowers.id} className="flex items-center space-x-2">
                              <Badge variant="outline" className="text-xs">
                                {getBorrowerRoleLabel(ba.borrower_role)}
                              </Badge>
                              <span className="text-sm">
                                {ba.borrowers.first_name} {ba.borrowers.last_name}
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span className="text-gray-400">None</span>
                      )}
                    </TableCell>
                    
                    <TableCell>
                      {primaryCompany ? (
                        <div className="flex items-center space-x-2">
                          <Building className="w-4 h-4 text-gray-400" />
                          <div>
                            <div className="font-medium">
                              {primaryCompany.companies.company_name}
                            </div>
                            <div className="text-sm text-gray-500">
                              {primaryCompany.ownership_percentage}% ownership
                            </div>
                          </div>
                        </div>
                      ) : (
                        <span className="text-gray-400">No company</span>
                      )}
                    </TableCell>
                    
                    <TableCell>
                      <Badge className={getStatusColor(application.status)}>
                        {getStatusLabel(application.status)}
                      </Badge>
                    </TableCell>
                    
                    <TableCell>
                      <div className="text-sm text-gray-500">
                        {format(new Date(application.created_at), 'MMM dd, yyyy')}
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
                          <DropdownMenuItem onClick={() => onViewApplication?.(application)}>
                            <Eye className="mr-2 h-4 w-4" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => onEditApplication?.(application)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit Application
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleDelete(application.id)}
                            className="text-red-600"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete Application
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
} 