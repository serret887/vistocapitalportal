import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { AlertTriangle, XCircle, Info, CheckCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { LoanValidationResult } from "@/lib/types/pricing";

interface ValidationErrorCardProps {
  validation: LoanValidationResult;
}

export function ValidationErrorCard({ validation }: ValidationErrorCardProps) {
  
  
  if (validation.isValid) {
    return null;
  }

  return (
    <Card className="border-red-200 bg-red-50">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <XCircle className="h-4 w-4 text-red-600" />
          <h3 className="text-sm font-semibold text-red-800">Loan Eligibility Issues Found</h3>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Errors */}
        {validation.errors.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <XCircle className="h-3 w-3 text-red-600" />
              <span className="text-xs font-medium text-red-700">Critical Issues (Must be fixed):</span>
            </div>
            <div className="space-y-2">
              {validation.errors.map((error, index) => (
                <div key={index} className="p-3 bg-white border border-red-200 rounded-lg">
                  <div className="text-xs text-red-800 whitespace-pre-line leading-relaxed">
                    {error}
                  </div>
                  {/* Debug: Show raw error text */}
                  <div className="text-xs text-gray-500 mt-1">
                    Raw error: {JSON.stringify(error)}
                  </div>

                </div>
              ))}
            </div>
          </div>
        )}

        {/* Warnings */}
        {validation.warnings.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-3 w-3 text-yellow-600" />
              <span className="text-xs font-medium text-yellow-700">Warnings (Recommended fixes):</span>
            </div>
            <div className="space-y-2">
              {validation.warnings.map((warning, index) => (
                <div key={index} className="p-3 bg-white border border-yellow-200 rounded-lg">
                  <div className="text-xs text-yellow-800 whitespace-pre-line leading-relaxed">
                    {warning}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Quick Fix Summary */}
        <div className="flex items-start gap-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
          <Info className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
          <div className="text-xs text-blue-700">
            <p className="font-medium mb-2">💡 Quick Fix Summary:</p>
            <ul className="space-y-1 list-disc pl-3">
              {validation.errors.length > 0 && (
                <>
                  <li>Adjust property value, loan amount, or down payment to meet requirements</li>
                  <li>Check if your property state and type are eligible</li>
                  <li>Ensure your FICO score meets minimum requirements</li>
                  <li>Verify your DSCR calculation meets the minimum threshold</li>
                </>
              )}
              {validation.warnings.length > 0 && (
                <li>Review prepayment penalty requirements for your state</li>
              )}
            </ul>
          </div>
        </div>

        {/* Success Message */}
        {validation.errors.length === 0 && validation.warnings.length === 0 && (
          <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg border border-green-200">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <span className="text-xs font-medium text-green-700">All validation checks passed! Your loan should be eligible.</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
} 