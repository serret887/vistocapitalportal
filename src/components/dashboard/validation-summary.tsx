import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { CheckCircle, XCircle, AlertTriangle } from "lucide-react";
import { LoanValidationResult } from "@/lib/types/pricing";

interface ValidationSummaryProps {
  validation: LoanValidationResult;
  userInput: any;
  matrixRequirements: any;
}

export function ValidationSummary({ validation, userInput, matrixRequirements }: ValidationSummaryProps) {
  if (validation.isValid) {
    return null;
  }

  const getStatusIcon = (isValid: boolean, isWarning: boolean = false) => {
    if (isValid) return <CheckCircle className="h-3 w-3 text-green-600" />;
    if (isWarning) return <AlertTriangle className="h-3 w-3 text-yellow-600" />;
    return <XCircle className="h-3 w-3 text-red-600" />;
  };

  const formatCurrency = (value: number) => `$${value.toLocaleString()}`;
  const formatPercentage = (value: number) => `${value.toFixed(1)}%`;
  const formatNumber = (value: number) => value.toFixed(2);

  return (
    <Card className="border-gray-200 bg-gray-50">
      <CardHeader className="pb-3">
        <h3 className="text-sm font-semibold text-gray-800">Validation Summary</h3>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-1 gap-2 text-xs">
          {/* Property Value */}
          <div className="flex items-center justify-between p-2 bg-white rounded border">
            <span className="text-gray-600">Property Value:</span>
            <div className="flex items-center gap-2">
              <span className="font-medium">{formatCurrency(userInput.estimatedHomeValue)}</span>
              {getStatusIcon(userInput.estimatedHomeValue >= matrixRequirements.min_value)}
            </div>
          </div>

          {/* LTV */}
          <div className="flex items-center justify-between p-2 bg-white rounded border">
            <span className="text-gray-600">Loan-to-Value (LTV):</span>
            <div className="flex items-center gap-2">
              <span className="font-medium">{formatPercentage(userInput.ltv)}</span>
              {getStatusIcon(userInput.ltv <= matrixRequirements.max_ltv)}
            </div>
          </div>

          {/* DSCR */}
          <div className="flex items-center justify-between p-2 bg-white rounded border">
            <span className="text-gray-600">DSCR Ratio:</span>
            <div className="flex items-center gap-2">
              <span className="font-medium">{formatNumber(userInput.dscr)}</span>
              {getStatusIcon(userInput.dscr >= matrixRequirements.dscr_min)}
            </div>
          </div>

          {/* FICO Score */}
          <div className="flex items-center justify-between p-2 bg-white rounded border">
            <span className="text-gray-600">FICO Score:</span>
            <div className="flex items-center gap-2">
              <span className="font-medium">{userInput.fico}</span>
              {getStatusIcon(
                userInput.loanPurpose !== 'refinance' || userInput.fico >= matrixRequirements.refinance_min_fico
              )}
            </div>
          </div>

          {/* Property State */}
          <div className="flex items-center justify-between p-2 bg-white rounded border">
            <span className="text-gray-600">Property State:</span>
            <div className="flex items-center gap-2">
              <span className="font-medium">{userInput.propertyState}</span>
              {getStatusIcon(!matrixRequirements.not_available_in_states.includes(userInput.propertyState))}
            </div>
          </div>

          {/* Property Type */}
          <div className="flex items-center justify-between p-2 bg-white rounded border">
            <span className="text-gray-600">Property Type:</span>
            <div className="flex items-center gap-2">
              <span className="font-medium">{userInput.propertyType}</span>
              {getStatusIcon(matrixRequirements.property_types.includes(userInput.propertyType))}
            </div>
          </div>
        </div>

        {/* Requirements Summary */}
        <div className="p-2 bg-blue-50 rounded border border-blue-200">
          <p className="text-xs font-medium text-blue-700 mb-1">📋 Requirements Summary:</p>
          <ul className="text-xs text-blue-600 space-y-1">
            <li>• Property Value: Minimum {formatCurrency(matrixRequirements.min_value)}</li>
            <li>• LTV: Maximum {formatPercentage(matrixRequirements.max_ltv)}</li>
            <li>• DSCR: Minimum {formatNumber(matrixRequirements.dscr_min)}</li>
            <li>• FICO (Refinance): Minimum {matrixRequirements.refinance_min_fico}</li>
            <li>• States: Available in all states except {matrixRequirements.not_available_in_states.join(', ')}</li>
            <li>• Property Types: {matrixRequirements.property_types.join(', ')}</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
} 