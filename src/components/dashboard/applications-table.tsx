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
      const response = await fetch('/api/applications')
      if (response.ok) {
        const data = await response.json()
        setApplications(data)
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
    <Card className="border-2 border-border shadow-2xl">
      <CardHeader className="pb-6">
        <div>
          <CardTitle className="text-2xl font-bold visto-dark-blue">
            Applications & Loans
          </CardTitle>
          <CardDescription className="text-lg visto-slate">
            Manage your loan applications and their associated loans
          </CardDescription>
        </div>

        {/* Search */}
        <div className="flex flex-col sm:flex-row gap-4 mt-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search by application name, status, type..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {isLoading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading applications...</p>
          </div>
        ) : filteredApplications.length === 0 ? (
          <div className="text-center py-8">
            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No applications found</h3>
            <p className="text-gray-600 mb-4">No applications have been created yet</p>
          </div>
        ) : (
          <div className="rounded-md border max-h-96 overflow-auto">
            <Table>
              <TableHeader className="sticky top-0 bg-white z-10">
                <TableRow>
                  <TableHead>Application</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Loans</TableHead>
                  <TableHead>Total Amount</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredApplications.map((application) => (
                  <TableRow key={application.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">
                          {application.application_name || 'Unnamed Application'}
                        </div>
                        {application.notes && (
                          <div className="text-sm text-gray-500 mt-1">
                            {application.notes.length > 50 
                              ? `${application.notes.substring(0, 50)}...` 
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
                      <div className="text-sm">
                        {application.application_type?.replace('_', ' ').toUpperCase() || '-'}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {application.loans?.length || 0} loan{application.loans?.length !== 1 ? 's' : ''}
                      </div>
                      {application.loans && application.loans.length > 0 && (
                        <div className="text-xs text-gray-500 mt-1">
                          {application.loans.map(loan => loan.loan_name).join(', ')}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      {application.loans && application.loans.length > 0 
                        ? formatCurrency(getTotalLoanAmount(application.loans))
                        : '-'
                      }
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="w-3 h-3 text-gray-500" />
                        {formatDate(application.created_at)}
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
                          <DropdownMenuItem onClick={() => onViewApplication?.(application)}>
                            <Eye className="mr-2 h-4 w-4" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => onEditApplication?.(application)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            onClick={() => onDeleteApplication?.(application.id)}
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
      </CardContent>
    </Card>
  )
} 