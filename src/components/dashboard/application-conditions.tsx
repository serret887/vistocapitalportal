'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ChevronDown, ChevronUp, MessageSquare, Upload, DollarSign, CreditCard, FileText, Shield } from 'lucide-react'
import type { ApplicationCondition, ConditionStatus } from '@/types'
import { CONDITION_STATUS_LABELS, CONDITION_STATUS_COLORS } from '@/types'

interface ApplicationConditionsProps {
  conditions: (ApplicationCondition & { activities: any[] })[]
}

export function ApplicationConditions({ conditions }: ApplicationConditionsProps) {
  const [expandedConditions, setExpandedConditions] = useState<Set<string>>(new Set())

  const toggleCondition = (conditionId: string) => {
    const newExpanded = new Set(expandedConditions)
    if (newExpanded.has(conditionId)) {
      newExpanded.delete(conditionId)
    } else {
      newExpanded.add(conditionId)
    }
    setExpandedConditions(newExpanded)
  }

  const getConditionIcon = (conditionType: string) => {
    switch (conditionType) {
      case 'credit_authorization':
        return <CreditCard className="w-5 h-5" />
      case 'bank_statements':
        return <FileText className="w-5 h-5" />
      case 'insurance':
        return <Shield className="w-5 h-5" />
      case 'application_fee':
        return <DollarSign className="w-5 h-5" />
      default:
        return <FileText className="w-5 h-5" />
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    })
  }

  if (conditions.length === 0) {
    return (
      <Card className="border-2 border-border">
        <CardContent className="p-6">
          <div className="text-center text-gray-500">
            <FileText className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p className="text-lg font-medium">No conditions yet</p>
            <p className="text-sm">Conditions will appear here once they are created.</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-semibold text-gray-900">Required Prior to Closing - {conditions.length}</h3>
      </div>

      {conditions.map((condition) => (
        <Card key={condition.id} className="border-2 border-border">
          <CardHeader className="pb-4">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3 flex-1">
                <div className="mt-1">
                  {getConditionIcon(condition.condition_type)}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <CardTitle className="text-lg font-semibold text-gray-900">
                      {condition.title}
                    </CardTitle>
                    <Badge className={CONDITION_STATUS_COLORS[condition.status as ConditionStatus]}>
                      {CONDITION_STATUS_LABELS[condition.status as ConditionStatus]}
                    </Badge>
                  </div>
                  <p className="text-gray-600 text-sm leading-relaxed">
                    {condition.description}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                {condition.fee_amount && (
                  <Badge variant="outline" className="text-green-700 border-green-300">
                    ${condition.fee_amount.toLocaleString()}
                  </Badge>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => toggleCondition(condition.id)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  {expandedConditions.has(condition.id) ? (
                    <ChevronUp className="w-4 h-4" />
                  ) : (
                    <ChevronDown className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </div>
          </CardHeader>

          <CardContent className="pt-0">
            {/* Latest Comment */}
            {condition.activities.length > 0 && (
              <div className="mb-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-2">
                      <MessageSquare className="w-4 h-4 text-blue-600 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-blue-900 mb-1">Latest Comment</p>
                        <p className="text-sm text-blue-800">
                          {condition.activities[0].message}
                        </p>
                      </div>
                    </div>
                    <span className="text-xs text-blue-600">
                      {formatDate(condition.activities[0].created_at)}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Activity Toggle */}
            <div className="flex items-center justify-between mb-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => toggleCondition(condition.id)}
                className="text-blue-600 hover:text-blue-700 p-0 h-auto"
              >
                {expandedConditions.has(condition.id) ? 'Hide Activity' : 'Show All Activity'}
              </Button>
              
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="border-gray-300 text-gray-700 hover:bg-gray-50"
                >
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Vendor
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="border-gray-300 text-gray-700 hover:bg-gray-50"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Add Documents
                </Button>
              </div>
            </div>

            {/* Activity Log */}
            {expandedConditions.has(condition.id) && condition.activities.length > 0 && (
              <div className="border-t border-gray-200 pt-4">
                <div className="space-y-3">
                  {condition.activities.map((activity, index) => (
                    <div key={activity.id} className="flex items-start gap-3">
                      <div className="w-16 text-xs text-gray-500 mt-1">
                        {formatDate(activity.created_at)}
                      </div>
                      <div className="flex-1 text-sm text-gray-700">
                        {activity.message}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  )
} 