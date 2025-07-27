'use client'

import { useState, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import type { LoanApplication, LoanApplicationStatus } from '@/types'
import { LOAN_STATUS_LABELS, LOAN_STATUS_COLORS } from '@/types'
import { CalendarIcon, Search, Filter, Download, Eye, Trash2, FileText } from 'lucide-react'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'
import type { DateRange } from 'react-day-picker'

interface ApplicationsTableProps {
  applications: LoanApplication[]
  isLoading?: boolean
  onViewApplication?: (application: LoanApplication) => void
  onDeleteApplication?: (application: LoanApplication) => void
  onExportData?: () => void
}

export function ApplicationsTable({
  applications,
  isLoading = false,
  onViewApplication,
  onDeleteApplication,
  onExportData
}: ApplicationsTableProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<LoanApplicationStatus | 'all'>('all')
  const [loanTypeFilter, setLoanTypeFilter] = useState<string>('all')
  const [sortBy, setSortBy] = useState<'created_at' | 'name' | 'status' | 'total_income'>('created_at')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [dateRange, setDateRange] = useState<DateRange | undefined>()

  // Filter and sort applications
  const filteredAndSortedApplications = useMemo(() => {
    let filtered = applications.filter(app => {
      // Search term filter (name, email, address)
      const searchText = searchTerm.toLowerCase()
      const matchesSearch = !searchTerm || 
        app.first_name.toLowerCase().includes(searchText) ||
        app.last_name.toLowerCase().includes(searchText) ||
        app.email?.toLowerCase().includes(searchText) ||
        app.property_address?.toLowerCase().includes(searchText)

      // Status filter
      const matchesStatus = statusFilter === 'all' || app.status === statusFilter

      // Loan type filter
      const matchesLoanType = loanTypeFilter === 'all' || app.loan_type === loanTypeFilter

      // Date range filter
      const appDate = new Date(app.created_at)
      const matchesDateRange = (!dateRange?.from || appDate >= dateRange.from) &&
                              (!dateRange?.to || appDate <= dateRange.to)

      return matchesSearch && matchesStatus && matchesLoanType && matchesDateRange
    })

    // Sort applications
    filtered.sort((a, b) => {
      let aValue: any
      let bValue: any

      if (sortBy === 'name') {
        aValue = `${a.first_name} ${a.last_name}`
        bValue = `${b.first_name} ${b.last_name}`
      } else if (sortBy === 'created_at') {
        aValue = new Date(a.created_at).getTime()
        bValue = new Date(b.created_at).getTime()
      } else {
        aValue = a[sortBy]
        bValue = b[sortBy]
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1
      } else {
        return aValue < bValue ? 1 : -1
      }
    })

    return filtered
  }, [applications, searchTerm, statusFilter, loanTypeFilter, dateRange, sortBy, sortOrder])

  // Get unique loan types for filter
  const uniqueLoanTypes = useMemo(() => {
    const types = [...new Set(applications.map(app => app.loan_type).filter((type): type is string => Boolean(type)))]
    return types
  }, [applications])

  const handleSort = (column: typeof sortBy) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(column)
      setSortOrder('desc')
    }
  }

  const getSortIcon = (column: typeof sortBy) => {
    if (sortBy !== column) return '↕️'
    return sortOrder === 'asc' ? '↑' : '↓'
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'MMM dd, yyyy')
  }

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardContent className="p-6">
          <div className="flex items-center justify-center h-32">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-2xl font-bold visto-dark-blue">Applications Table</CardTitle>
            <CardDescription className="text-lg visto-slate">
              View and manage all loan applications ({filteredAndSortedApplications.length} of {applications.length})
            </CardDescription>
          </div>
          {onExportData && (
            <Button onClick={onExportData} variant="outline" className="flex items-center space-x-2">
              <Download className="w-4 h-4" />
              <span>Export</span>
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="p-6">
        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {/* Search */}
          <div className="space-y-2">
            <Label htmlFor="search">Search</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                id="search"
                placeholder="Name, email, address..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Status Filter */}
          <div className="space-y-2">
            <Label htmlFor="status-filter">Status</Label>
            <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as any)}>
              <SelectTrigger>
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                {Object.entries(LOAN_STATUS_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Loan Type Filter */}
          <div className="space-y-2">
            <Label htmlFor="loan-type-filter">Loan Type</Label>
            <Select value={loanTypeFilter} onValueChange={setLoanTypeFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {uniqueLoanTypes.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Date Range Filter */}
          <div className="space-y-2">
            <Label>Date Range</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !dateRange?.from && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateRange?.from ? (
                    dateRange.to ? (
                      <>
                        {format(dateRange.from, "LLL dd, y")} -{" "}
                        {format(dateRange.to, "LLL dd, y")}
                      </>
                    ) : (
                      format(dateRange.from, "LLL dd, y")
                    )
                  ) : (
                    <span>Pick a date range</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  initialFocus
                  mode="range"
                  defaultMonth={dateRange?.from}
                  selected={dateRange}
                  onSelect={setDateRange}
                  numberOfMonths={2}
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>

        {/* Clear Filters */}
        {(searchTerm || statusFilter !== 'all' || loanTypeFilter !== 'all' || dateRange?.from) && (
          <div className="mb-4">
            <Button
              variant="ghost"
              onClick={() => {
                setSearchTerm('')
                setStatusFilter('all')
                setLoanTypeFilter('all')
                setDateRange(undefined)
              }}
              className="text-sm"
            >
              <Filter className="w-4 h-4 mr-2" />
              Clear Filters
            </Button>
          </div>
        )}

        {/* Table */}
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead 
                  className="cursor-pointer hover:bg-gray-50 font-semibold"
                  onClick={() => handleSort('name')}
                >
                  Client Name {getSortIcon('name')}
                </TableHead>
                <TableHead>Contact</TableHead>
                <TableHead 
                  className="cursor-pointer hover:bg-gray-50 font-semibold"
                  onClick={() => handleSort('status')}
                >
                  Status {getSortIcon('status')}
                </TableHead>
                <TableHead>Loan Details</TableHead>
                <TableHead 
                  className="cursor-pointer hover:bg-gray-50 font-semibold"
                  onClick={() => handleSort('total_income')}
                >
                  Income {getSortIcon('total_income')}
                </TableHead>
                <TableHead>Assets</TableHead>
                <TableHead 
                  className="cursor-pointer hover:bg-gray-50 font-semibold"
                  onClick={() => handleSort('created_at')}
                >
                  Created {getSortIcon('created_at')}
                </TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAndSortedApplications.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                    {applications.length === 0 ? 'No applications found' : 'No applications match your filters'}
                  </TableCell>
                </TableRow>
              ) : (
                filteredAndSortedApplications.map((application) => (
                  <TableRow key={application.id} className="hover:bg-gray-50">
                    <TableCell>
                      <div>
                        <div className="font-medium visto-dark-blue">
                          {application.first_name} {application.last_name}
                        </div>
                        {application.property_is_tbd ? (
                          <div className="text-sm text-amber-600 font-medium">Pre-approval (TBD)</div>
                        ) : (
                          application.property_address && (
                            <div className="text-sm visto-slate truncate max-w-32">
                              {application.property_address}
                            </div>
                          )
                        )}
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      <div className="text-sm">
                        {application.email && (
                          <div className="truncate max-w-32">{application.email}</div>
                        )}
                        {application.phone_number && (
                          <div className="text-gray-600">{application.phone_number}</div>
                        )}
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                        LOAN_STATUS_COLORS[application.status as keyof typeof LOAN_STATUS_COLORS]
                      }`}>
                        {LOAN_STATUS_LABELS[application.status as keyof typeof LOAN_STATUS_LABELS]}
                      </span>
                    </TableCell>
                    
                    <TableCell>
                      <div className="text-sm">
                        {application.loan_objective && (
                          <div className="font-medium">
                            {application.loan_objective.charAt(0).toUpperCase() + application.loan_objective.slice(1)}
                          </div>
                        )}
                        {application.loan_type && (
                          <div className="text-gray-600">
                            {application.loan_type.toUpperCase()}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      {application.total_income > 0 && (
                        <div className="text-sm font-medium">
                          {formatCurrency(application.total_income)}
                        </div>
                      )}
                    </TableCell>
                    
                    <TableCell>
                      {application.total_assets > 0 && (
                        <div className="text-sm font-medium">
                          {formatCurrency(application.total_assets)}
                        </div>
                      )}
                    </TableCell>
                    
                    <TableCell>
                      <div className="text-sm visto-slate">
                        {formatDate(application.created_at)}
                      </div>
                    </TableCell>
                    
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end space-x-2">
                        {onViewApplication && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onViewApplication(application)}
                            className="h-8 w-8 p-0"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        )}

                        {onDeleteApplication && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onDeleteApplication(application)}
                            className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination could be added here for large datasets */}
        {filteredAndSortedApplications.length > 0 && (
          <div className="mt-4 flex items-center justify-between text-sm text-gray-600">
            <div>
              Showing {filteredAndSortedApplications.length} of {applications.length} applications
            </div>
            <div className="flex items-center space-x-4">
              <span>Sort by: </span>
              <Select value={sortBy} onValueChange={(value) => setSortBy(value as any)}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="created_at">Date</SelectItem>
                  <SelectItem value="name">Name</SelectItem>
                  <SelectItem value="status">Status</SelectItem>
                  <SelectItem value="total_income">Income</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
} 