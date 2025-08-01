'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table'
import type { LoanApplication, Loan } from '@/types'
import { Search, Plus, Edit, Trash2, FileText, Calendar, DollarSign, MoreHorizontal, Eye } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface ApplicationWithLoans extends LoanApplication {
  loans: Loan[]
}

interface ApplicationsTableProps {
  onEditApplication?: (application: ApplicationWithLoans) => void
  onDeleteApplication?: (applicationId: string) => void
  onViewApplication?: (application: ApplicationWithLoans) => void
}

export function ApplicationsTable({
  onEditApplication,
  onDeleteApplication,
  onViewApplication
}: ApplicationsTableProps) {
  const [applications, setApplications] = useState<ApplicationWithLoans[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setIsLoading(true)
    try {
      console.log('Loading applications data...')
      const response = await fetch('/api/applications')
      console.log('Applications response status:', response.status)
      
      if (response.ok) {
        const data = await response.json()
        console.log('Applications data loaded:', data)
        setApplications(data)
      } else {
        console.error('Failed to load applications:', response.status, response.statusText)
        const errorText = await response.text()
        console.error('Error details:', errorText)
      }
    } catch (error) {
      console.error('Error loading applications:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const filteredApplications = applications.filter(application =>
    application.application_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    application.status?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    application.application_type?.toLowerCase().includes(searchQuery.toLowerCase())
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800'
      case 'in_review':
        return 'bg-blue-100 text-blue-800'
      case 'denied':
        return 'bg-red-100 text-red-800'
      case 'closed':
        return 'bg-gray-100 text-gray-800'
      case 'missing_conditions':
        return 'bg-yellow-100 text-yellow-800'
      case 'pending_documents':
        return 'bg-orange-100 text-orange-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getTotalLoanAmount = (loans: Loan[]) => {
    return loans.reduce((total, loan) => total + (loan.loan_amount || 0), 0)
  }

  return (
    <Card className="border-2 border-border shadow-2xl h-full flex flex-col">
      <CardHeader className="pb-3 flex-shrink-0">
        <div>
          <CardTitle className="text-lg font-bold visto-dark-blue">
            Applications & Loans
          </CardTitle>
          <CardDescription className="text-sm visto-slate">
            Manage your loan applications and their associated loans
          </CardDescription>
        </div>

        {/* Search */}
        <div className="flex flex-col sm:flex-row gap-3 mt-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-3 h-3" />
            <Input
              placeholder="Search by application name, status, type..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 text-sm"
            />
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-1 overflow-hidden">
        {isLoading ? (
          <div className="text-center py-6">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-sm text-gray-600">Loading applications...</p>
          </div>
        ) : filteredApplications.length === 0 ? (
          <div className="text-center py-6">
            <FileText className="w-8 h-8 text-gray-400 mx-auto mb-2" />
            <h3 className="text-sm font-semibold text-gray-900 mb-1">No applications found</h3>
            <p className="text-xs text-gray-600">No applications have been created yet</p>
          </div>
        ) : (
          <div className="rounded-md border h-full overflow-auto">
            <Table>
              <TableHeader className="sticky top-0 bg-white z-10">
                <TableRow>
                  <TableHead className="text-xs">Application</TableHead>
                  <TableHead className="text-xs">Status</TableHead>
                  <TableHead className="text-xs">Type</TableHead>
                  <TableHead className="text-xs">Loans</TableHead>
                  <TableHead className="text-xs">Total Amount</TableHead>
                  <TableHead className="text-xs">Created</TableHead>
                  <TableHead className="text-right text-xs">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredApplications.map((application) => (
                  <TableRow key={application.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium text-sm">
                          {application.application_name || 'Unnamed Application'}
                        </div>
                        {application.notes && (
                          <div className="text-xs text-gray-500 mt-1">
                            {application.notes.length > 40 
                              ? `${application.notes.substring(0, 40)}...` 
                              : application.notes
                            }
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(application.status)}>
                        {application.status?.replace('_', ' ').toUpperCase() || 'UNKNOWN'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="text-xs">
                        {application.application_type?.replace('_', ' ').toUpperCase() || '-'}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-xs">
                        {application.loans?.length || 0} loan{application.loans?.length !== 1 ? 's' : ''}
                      </div>
                      {application.loans && application.loans.length > 0 && (
                        <div className="text-xs text-gray-500 mt-1">
                          {application.loans.map(loan => loan.loan_name).join(', ')}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-xs">
                      {application.loans && application.loans.length > 0 
                        ? formatCurrency(getTotalLoanAmount(application.loans))
                        : '-'
                      }
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-xs">
                        <Calendar className="w-3 h-3 text-gray-500" />
                        {formatDate(application.created_at)}
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
                          <DropdownMenuItem onClick={() => onViewApplication?.(application)}>
                            <Eye className="mr-2 h-3 w-3" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => onEditApplication?.(application)}>
                            <Edit className="mr-2 h-3 w-3" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            onClick={() => onDeleteApplication?.(application.id)}
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
      </CardContent>
    </Card>
  )
} 