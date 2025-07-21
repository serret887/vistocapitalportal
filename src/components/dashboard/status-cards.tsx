'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { DashboardStats, LoanApplicationStatus } from '@/types'
import { LOAN_STATUS_LABELS } from '@/types'
import { CheckCircle, Clock, XCircle, Archive, AlertTriangle, FileText } from 'lucide-react'

interface StatusCardsProps {
  stats: DashboardStats
  onStatusClick?: (status: LoanApplicationStatus) => void
}

const statusIcons: Record<LoanApplicationStatus, React.ComponentType<{ className?: string }>> = {
  'in_review': Clock,
  'approved': CheckCircle,
  'ineligible': XCircle,
  'denied': XCircle,
  'closed': Archive,
  'missing_conditions': AlertTriangle,
  'pending_documents': FileText
}

const statusColors: Record<LoanApplicationStatus, { bg: string; icon: string; border: string }> = {
  'in_review': { 
    bg: 'bg-blue-50 hover:bg-blue-100', 
    icon: 'text-blue-600', 
    border: 'border-blue-200 hover:border-blue-300' 
  },
  'approved': { 
    bg: 'bg-green-50 hover:bg-green-100', 
    icon: 'text-green-600', 
    border: 'border-green-200 hover:border-green-300' 
  },
  'ineligible': { 
    bg: 'bg-gray-50 hover:bg-gray-100', 
    icon: 'text-gray-600', 
    border: 'border-gray-200 hover:border-gray-300' 
  },
  'denied': { 
    bg: 'bg-red-50 hover:bg-red-100', 
    icon: 'text-red-600', 
    border: 'border-red-200 hover:border-red-300' 
  },
  'closed': { 
    bg: 'bg-purple-50 hover:bg-purple-100', 
    icon: 'text-purple-600', 
    border: 'border-purple-200 hover:border-purple-300' 
  },
  'missing_conditions': { 
    bg: 'bg-yellow-50 hover:bg-yellow-100', 
    icon: 'text-yellow-600', 
    border: 'border-yellow-200 hover:border-yellow-300' 
  },
  'pending_documents': { 
    bg: 'bg-orange-50 hover:bg-orange-100', 
    icon: 'text-orange-600', 
    border: 'border-orange-200 hover:border-orange-300' 
  }
}

export function StatusCards({ stats, onStatusClick }: StatusCardsProps) {
  const statusCards = [
    { key: 'in_review' as LoanApplicationStatus, count: stats.in_review },
    { key: 'approved' as LoanApplicationStatus, count: stats.approved },
    { key: 'pending_documents' as LoanApplicationStatus, count: stats.pending_documents },
    { key: 'missing_conditions' as LoanApplicationStatus, count: stats.missing_conditions },
    { key: 'denied' as LoanApplicationStatus, count: stats.denied },
    { key: 'ineligible' as LoanApplicationStatus, count: stats.ineligible },
    { key: 'closed' as LoanApplicationStatus, count: stats.closed }
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {statusCards.map(({ key, count }) => {
        const Icon = statusIcons[key]
        const colors = statusColors[key]
        
        return (
          <Card
            key={key}
            className={`cursor-pointer transition-all duration-200 border-2 ${colors.border} ${colors.bg} hover:shadow-lg transform hover:scale-105`}
            onClick={() => onStatusClick?.(key)}
          >
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-semibold visto-dark-blue">
                  {LOAN_STATUS_LABELS[key]}
                </CardTitle>
                <Icon className={`h-6 w-6 ${colors.icon}`} />
              </div>
            </CardHeader>
            
            <CardContent>
              <div className={`text-3xl font-bold ${colors.icon}`}>
                {count}
              </div>
              <p className="text-sm visto-slate mt-1">
                {count === 1 ? 'Application' : 'Applications'}
              </p>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}

// Summary component for a condensed view
export function StatusSummary({ stats }: { stats: DashboardStats }) {
  const activeCount = stats.in_review + stats.pending_documents + stats.missing_conditions
  const completedCount = stats.approved + stats.closed
  const rejectedCount = stats.denied + stats.ineligible

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      <Card className="border-2 border-primary/20 bg-gradient-visto-subtle">
        <CardContent className="p-4">
          <div className="flex items-center space-x-3">
            <Clock className="h-8 w-8 text-primary" />
            <div>
              <div className="text-sm font-medium visto-slate">Active</div>
              <div className="text-2xl font-bold visto-dark-blue">{activeCount}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-2 border-green-200 bg-green-50">
        <CardContent className="p-4">
          <div className="flex items-center space-x-3">
            <CheckCircle className="h-8 w-8 text-green-600" />
            <div>
              <div className="text-sm font-medium visto-slate">Completed</div>
              <div className="text-2xl font-bold text-green-700">{completedCount}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-2 border-red-200 bg-red-50">
        <CardContent className="p-4">
          <div className="flex items-center space-x-3">
            <XCircle className="h-8 w-8 text-red-600" />
            <div>
              <div className="text-sm font-medium visto-slate">Rejected</div>
              <div className="text-2xl font-bold text-red-700">{rejectedCount}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-2 border-primary/20 bg-gradient-visto-subtle">
        <CardContent className="p-4">
          <div className="flex items-center space-x-3">
            <Archive className="h-8 w-8 text-primary" />
            <div>
              <div className="text-sm font-medium visto-slate">Total</div>
              <div className="text-2xl font-bold visto-dark-blue">{stats.total}</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 