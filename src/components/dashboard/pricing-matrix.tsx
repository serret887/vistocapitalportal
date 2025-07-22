'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  DollarSign, 
  Percent, 
  TrendingUp, 
  FileText,
  Upload,
  Download,
  Search,
  Filter
} from 'lucide-react'
import { toast } from 'sonner'

interface PricingMatrixEntry {
  id: string
  dscr: number
  loanAmount: number
  propertyType: string
  occupancy: number
  interestRate: number
  points: number
  maxLTV: number
  minCreditScore: number
  maxLoanAmount: number
  minLoanAmount: number
  term: number
  prepaymentPenalty: boolean
  reserveRequirements: number
}

// Sample pricing matrix data - this would come from your database
const samplePricingMatrix: PricingMatrixEntry[] = [
  {
    id: '1',
    dscr: 1.25,
    loanAmount: 500000,
    propertyType: 'single_family',
    occupancy: 95,
    interestRate: 7.25,
    points: 1.5,
    maxLTV: 75,
    minCreditScore: 680,
    maxLoanAmount: 2000000,
    minLoanAmount: 100000,
    term: 30,
    prepaymentPenalty: false,
    reserveRequirements: 6
  },
  {
    id: '2',
    dscr: 1.35,
    loanAmount: 750000,
    propertyType: 'multi_family',
    occupancy: 90,
    interestRate: 7.50,
    points: 1.0,
    maxLTV: 70,
    minCreditScore: 700,
    maxLoanAmount: 5000000,
    minLoanAmount: 250000,
    term: 30,
    prepaymentPenalty: true,
    reserveRequirements: 12
  },
  {
    id: '3',
    dscr: 1.45,
    loanAmount: 1000000,
    propertyType: 'commercial',
    occupancy: 85,
    interestRate: 7.75,
    points: 0.5,
    maxLTV: 65,
    minCreditScore: 720,
    maxLoanAmount: 10000000,
    minLoanAmount: 500000,
    term: 25,
    prepaymentPenalty: true,
    reserveRequirements: 18
  }
]

export function PricingMatrix() {
  const [pricingData, setPricingData] = useState<PricingMatrixEntry[]>(samplePricingMatrix)
  const [filters, setFilters] = useState({
    propertyType: '',
    minDSCR: '',
    maxDSCR: '',
    minLoanAmount: '',
    maxLoanAmount: ''
  })

  const propertyTypes = [
    { value: 'single_family', label: 'Single Family' },
    { value: 'multi_family', label: 'Multi-Family' },
    { value: 'condo', label: 'Condominium' },
    { value: 'townhouse', label: 'Townhouse' },
    { value: 'commercial', label: 'Commercial' },
    { value: 'mixed_use', label: 'Mixed Use' }
  ]

  const filteredData = pricingData.filter(entry => {
    if (filters.propertyType && entry.propertyType !== filters.propertyType) return false
    if (filters.minDSCR && entry.dscr < Number(filters.minDSCR)) return false
    if (filters.maxDSCR && entry.dscr > Number(filters.maxDSCR)) return false
    if (filters.minLoanAmount && entry.loanAmount < Number(filters.minLoanAmount)) return false
    if (filters.maxLoanAmount && entry.loanAmount > Number(filters.maxLoanAmount)) return false
    return true
  })

  const handleFilterChange = (field: string, value: string) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const clearFilters = () => {
    setFilters({
      propertyType: '',
      minDSCR: '',
      maxDSCR: '',
      minLoanAmount: '',
      maxLoanAmount: ''
    })
  }

  const exportPricingMatrix = () => {
    // This would export the pricing matrix to CSV or JSON
    toast.success('Pricing matrix exported successfully!')
  }

  const importPricingMatrix = () => {
    // This would import pricing matrix from file
    toast.info('Import functionality will be available when you upload your pricing data')
  }

  const getDSCRBadgeColor = (dscr: number) => {
    if (dscr >= 1.25) return 'bg-green-100 text-green-800'
    if (dscr >= 1.15) return 'bg-blue-100 text-blue-800'
    if (dscr >= 1.05) return 'bg-yellow-100 text-yellow-800'
    return 'bg-red-100 text-red-800'
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">DSCR Pricing Matrix</h2>
          <p className="text-gray-600">Current loan pricing and terms based on DSCR and property type</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={importPricingMatrix}>
            <Upload className="h-4 w-4 mr-2" />
            Import
          </Button>
          <Button variant="outline" onClick={exportPricingMatrix}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      <Tabs defaultValue="matrix" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="matrix">Pricing Matrix</TabsTrigger>
          <TabsTrigger value="filters">Filters</TabsTrigger>
          <TabsTrigger value="summary">Summary</TabsTrigger>
        </TabsList>

        <TabsContent value="matrix" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Current Pricing Matrix
              </CardTitle>
              <CardDescription>
                Showing {filteredData.length} of {pricingData.length} pricing tiers
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>DSCR</TableHead>
                      <TableHead>Property Type</TableHead>
                      <TableHead>Loan Amount</TableHead>
                      <TableHead>Interest Rate</TableHead>
                      <TableHead>Points</TableHead>
                      <TableHead>Max LTV</TableHead>
                      <TableHead>Min Credit</TableHead>
                      <TableHead>Term</TableHead>
                      <TableHead>Prepayment</TableHead>
                      <TableHead>Reserves</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredData.map((entry) => (
                      <TableRow key={entry.id}>
                        <TableCell>
                          <Badge className={getDSCRBadgeColor(entry.dscr)}>
                            {entry.dscr}
                          </Badge>
                        </TableCell>
                        <TableCell className="capitalize">
                          {entry.propertyType.replace('_', ' ')}
                        </TableCell>
                        <TableCell>${entry.loanAmount.toLocaleString()}</TableCell>
                        <TableCell>{entry.interestRate}%</TableCell>
                        <TableCell>{entry.points}%</TableCell>
                        <TableCell>{entry.maxLTV}%</TableCell>
                        <TableCell>{entry.minCreditScore}</TableCell>
                        <TableCell>{entry.term} years</TableCell>
                        <TableCell>
                          <Badge variant={entry.prepaymentPenalty ? "destructive" : "secondary"}>
                            {entry.prepaymentPenalty ? "Yes" : "No"}
                          </Badge>
                        </TableCell>
                        <TableCell>{entry.reserveRequirements} months</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="filters" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Filter Pricing Matrix
              </CardTitle>
              <CardDescription>Narrow down pricing options based on your criteria</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="propertyType">Property Type</Label>
                  <Select value={filters.propertyType} onValueChange={(value) => handleFilterChange('propertyType', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="All property types" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All property types</SelectItem>
                      {propertyTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="minDSCR">Minimum DSCR</Label>
                  <Input
                    id="minDSCR"
                    type="number"
                    step="0.01"
                    value={filters.minDSCR}
                    onChange={(e) => handleFilterChange('minDSCR', e.target.value)}
                    placeholder="1.05"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="maxDSCR">Maximum DSCR</Label>
                  <Input
                    id="maxDSCR"
                    type="number"
                    step="0.01"
                    value={filters.maxDSCR}
                    onChange={(e) => handleFilterChange('maxDSCR', e.target.value)}
                    placeholder="1.50"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="minLoanAmount">Minimum Loan Amount</Label>
                  <Input
                    id="minLoanAmount"
                    type="number"
                    value={filters.minLoanAmount}
                    onChange={(e) => handleFilterChange('minLoanAmount', e.target.value)}
                    placeholder="100000"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="maxLoanAmount">Maximum Loan Amount</Label>
                  <Input
                    id="maxLoanAmount"
                    type="number"
                    value={filters.maxLoanAmount}
                    onChange={(e) => handleFilterChange('maxLoanAmount', e.target.value)}
                    placeholder="5000000"
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <Button onClick={clearFilters} variant="outline">
                  Clear Filters
                </Button>
                <Button onClick={() => toast.success('Filters applied!')}>
                  Apply Filters
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="summary" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Pricing Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Total Pricing Tiers</span>
                    <span className="font-medium">{pricingData.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Filtered Results</span>
                    <span className="font-medium">{filteredData.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Lowest Rate</span>
                    <span className="font-medium">
                      {Math.min(...pricingData.map(p => p.interestRate))}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Highest Rate</span>
                    <span className="font-medium">
                      {Math.max(...pricingData.map(p => p.interestRate))}%
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Percent className="h-5 w-5" />
                  DSCR Ranges
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Minimum DSCR</span>
                    <span className="font-medium">
                      {Math.min(...pricingData.map(p => p.dscr))}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Maximum DSCR</span>
                    <span className="font-medium">
                      {Math.max(...pricingData.map(p => p.dscr))}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Average DSCR</span>
                    <span className="font-medium">
                      {(pricingData.reduce((sum, p) => sum + p.dscr, 0) / pricingData.length).toFixed(2)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Property Types
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  {Array.from(new Set(pricingData.map(p => p.propertyType))).map(type => (
                    <div key={type} className="flex justify-between">
                      <span className="text-sm text-gray-600 capitalize">
                        {type.replace('_', ' ')}
                      </span>
                      <span className="font-medium">
                        {pricingData.filter(p => p.propertyType === type).length}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
} 