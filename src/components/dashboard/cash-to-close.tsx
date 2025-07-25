"use client";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Wallet } from "lucide-react";
import { LoanOption } from "@/lib/loan-pricing";

interface CashToCloseProps {
  formData: {
    estimatedHomeValue: number;
    loanAmount: number;
    brokerPoints: number;
    brokerAdminFee: number;
    brokerYsp: number;
  };
  selectedLoan: LoanOption | null;
}

export function CashToClose({
  formData,
  selectedLoan
}: CashToCloseProps) {
  if (!selectedLoan) {
    return (
      <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-gray-50">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Wallet className="h-4 w-4 text-red-600" />
            <h3 className="text-sm font-semibold text-gray-800">Cash to Close</h3>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <p className="text-sm">No cash to close calculation</p>
            <p className="text-xs mt-1">Select a loan option to see cash to close breakdown</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const downPayment = formData.estimatedHomeValue - formData.loanAmount;
  const totalBrokerComp = (formData.brokerPoints + formData.brokerYsp) * formData.loanAmount / 100 + formData.brokerAdminFee;
  const estimatedThirdPartyFees = formData.loanAmount * 0.015; // 1.5% of loan amount
  const totalCashToClose = downPayment + selectedLoan.totalFees + estimatedThirdPartyFees;

  return (
    <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-gray-50">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Wallet className="h-4 w-4 text-red-600" />
          <h3 className="text-sm font-semibold text-gray-800">Cash to Close</h3>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Down Payment */}
          <div className="flex justify-between items-center">
            <span className="text-xs text-gray-600">Down Payment</span>
            <span className="text-xs font-semibold">${downPayment.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </div>

          {/* Loan Fees Breakdown */}
          <Accordion type="single" collapsible>
            <AccordionItem value="loan-fees" className="border-none">
              <AccordionTrigger className="text-xs text-blue-600 hover:text-blue-700 py-1">
                Loan Fees Breakdown
              </AccordionTrigger>
              <AccordionContent className="pt-2">
                <div className="space-y-2 text-xs bg-gray-50 p-3 rounded">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Origination Fee ({formData.brokerPoints}%):</span>
                    <span className="font-medium">${selectedLoan.feeBreakdown?.originationFee?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Underwriting Fee:</span>
                    <span className="font-medium">${selectedLoan.feeBreakdown?.underwritingFee?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Admin Fee:</span>
                    <span className="font-medium">${selectedLoan.feeBreakdown?.adminFee?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}</span>
                  </div>
                  {selectedLoan.feeBreakdown?.smallLoanFee && selectedLoan.feeBreakdown.smallLoanFee > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Small Loan Fee:</span>
                      <span className="font-medium">${selectedLoan.feeBreakdown.smallLoanFee.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                  )}
                  <div className="border-t pt-2 mt-2">
                    <div className="flex justify-between font-semibold">
                      <span>Total Fees:</span>
                      <span>${selectedLoan.totalFees.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>

          {/* Broker Compensation */}
          <Accordion type="single" collapsible>
            <AccordionItem value="broker-comp" className="border-none">
              <AccordionTrigger className="text-xs text-green-600 hover:text-green-700 py-1">
                Broker Compensation (Included in Loan Fees)
              </AccordionTrigger>
              <AccordionContent className="pt-2">
                <div className="space-y-2 text-xs bg-green-50 p-3 rounded">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Broker Points ({formData.brokerPoints}%):</span>
                    <span className="font-medium">${(formData.brokerPoints * formData.loanAmount / 100).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Admin Fee:</span>
                    <span className="font-medium">${formData.brokerAdminFee.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">YSP ({formData.brokerYsp}%):</span>
                    <span className="font-medium">${(formData.brokerYsp * formData.loanAmount / 100).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </div>
                  <div className="border-t pt-2 mt-2">
                    <div className="flex justify-between font-semibold text-green-700">
                      <span>Total Broker Compensation:</span>
                      <span>${totalBrokerComp.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>

          {/* Estimated Third-Party Fees */}
          <div className="flex justify-between items-center">
            <span className="text-xs text-gray-600">Estimated Third-Party Fees</span>
            <span className="text-xs font-semibold">${estimatedThirdPartyFees.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </div>

          {/* Total Cash to Close */}
          <div className="border-t pt-3">
            <div className="flex justify-between items-center">
              <span className="text-sm font-semibold text-gray-800">Total Cash to Close</span>
              <span className="text-lg font-bold text-gray-800">${totalCashToClose.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 