"use client";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { CreditCard } from "lucide-react";
import { LoanOption } from "@/lib/loan-pricing";
import { ValidationErrorCard } from "./validation-error-card";
import { ValidationSummary } from "./validation-summary";

interface LoanOptionsProps {
  loanOptions: LoanOption[];
  selectedLoan: LoanOption | null;
  validationErrors: any[];
  matrixRequirements: any;
  needsRecalculation: boolean;
  formData: any;
  onLoanSelect: (loan: LoanOption) => void;
  formatProductName: (product: string) => string;
}

export function LoanOptions({
  loanOptions,
  selectedLoan,
  validationErrors,
  matrixRequirements,
  needsRecalculation,
  formData,
  onLoanSelect,
  formatProductName
}: LoanOptionsProps) {
  return (
    <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-gray-50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CreditCard className="h-4 w-4 text-indigo-600" />
            <h3 className="text-sm font-semibold text-gray-800">Available Loan Options</h3>
          </div>
          {needsRecalculation && (
            <Badge variant="destructive" className="text-xs">
              Price Invalid - Recalculate
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {/* Show validation errors if any */}
        {validationErrors.length > 0 && validationErrors.some(v => !v.isValid) ? (
          <div className="space-y-4">
            {validationErrors.map((validation, index) => (
              <ValidationErrorCard key={index} validation={validation} />
            ))}
            
            {/* Show validation summary if we have matrix requirements */}
            {matrixRequirements && (
              <ValidationSummary 
                validation={validationErrors[0]} 
                userInput={{
                  estimatedHomeValue: formData.estimatedHomeValue,
                  ltv: (formData.loanAmount / formData.estimatedHomeValue) * 100,
                  dscr: 1.25, // Default DSCR
                  fico: formData.ficoScore === '780+' ? 780 : parseInt(formData.ficoScore.split('-')[0]),
                  propertyState: formData.propertyState,
                  propertyType: formData.propertyType,
                  loanPurpose: formData.transactionType === 'purchase' ? 'purchase' : 'refinance'
                }}
                matrixRequirements={matrixRequirements}
              />
            )}
          </div>
        ) : loanOptions.length > 0 ? (
          <div className="space-y-3">
            {loanOptions.map((option, index) => (
              <div 
                key={index} 
                className={`p-4 border rounded-lg transition-colors cursor-pointer ${
                  selectedLoan?.lenderId === option.lenderId && 
                  selectedLoan?.product === option.product && 
                  selectedLoan?.termYears === option.termYears
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-200 hover:border-blue-300'
                }`}
                onClick={() => onLoanSelect(option)}
              >
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h4 className="text-sm font-semibold text-gray-800">
                      {formatProductName(option.product)}
                    </h4>
                    <p className="text-xs text-gray-600">
                      {option.lenderName || option.lenderId} • {option.termYears}-year term
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-gray-800">
                      {option.finalRate ? option.finalRate.toFixed(2) : 'N/A'}%
                    </div>
                    <div className="text-xs text-gray-500">
                      {option.points ? option.points.toFixed(2) : 'N/A'} pts
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-3 gap-4 text-xs">
                  <div>
                    <span className="text-gray-500">Monthly Payment:</span>
                    <div className="font-semibold text-sm">
                      ${option.monthlyPayment ? option.monthlyPayment.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : 'N/A'}
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-500">Total Fees:</span>
                    <div className="font-semibold text-sm">
                      ${option.totalFees ? option.totalFees.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : 'N/A'}
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-500">Broker Comp:</span>
                    <div className="font-semibold text-sm text-green-600">
                      ${((formData.brokerPoints + formData.brokerYsp) * formData.loanAmount / 100 + formData.brokerAdminFee).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                  </div>
                </div>
                
                {/* Fee Breakdown Accordion */}
                <Accordion type="single" collapsible className="mt-3">
                  <AccordionItem value="fee-breakdown" className="border-none">
                    <AccordionTrigger className="text-xs text-blue-600 hover:text-blue-700 py-1">
                      View Fee Breakdown
                    </AccordionTrigger>
                    <AccordionContent className="pt-2">
                      <div className="space-y-2 text-xs bg-gray-50 p-3 rounded">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Broker Origination Fee:</span>
                          <span className="font-medium">${option.feeBreakdown?.originationFee?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Underwriting Fee:</span>
                          <span className="font-medium">${option.feeBreakdown?.underwritingFee?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Admin Fee:</span>
                          <span className="font-medium">${option.feeBreakdown?.adminFee?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}</span>
                        </div>
                                                  {option.feeBreakdown?.smallLoanFee && option.feeBreakdown.smallLoanFee > 0 && (
                            <div className="flex justify-between">
                              <span className="text-gray-600">Small Loan Fee:</span>
                              <span className="font-medium">${option.feeBreakdown.smallLoanFee.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                            </div>
                          )}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <p className="text-sm">No loan options available</p>
            <p className="text-xs mt-1">Click "Calculate DSCR" to see available options</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
} 