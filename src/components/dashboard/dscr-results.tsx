"use client";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Calculator, Info } from "lucide-react";
import { LoanOption } from "@/lib/loan-pricing";

interface DSCRResultsProps {
  dscrResults: {
    noi: number;
    debtService: number;
    dscr: number;
    capRate: number;
    cashOnCashReturn: number;
    breakEvenRatio: number;
    cashFlow: number;
  } | null;
  selectedLoan: LoanOption | null;
  formatProductName: (product: string) => string;
}

export function DSCRResults({
  dscrResults,
  selectedLoan,
  formatProductName
}: DSCRResultsProps) {
  if (!dscrResults || !selectedLoan) {
    return (
      <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-gray-50">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Calculator className="h-4 w-4 text-orange-600" />
            <h3 className="text-sm font-semibold text-gray-800">DSCR Results</h3>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <p className="text-sm">No DSCR results available</p>
            <p className="text-xs mt-1">Select a loan option to see DSCR calculations</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-gray-50">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Calculator className="h-4 w-4 text-orange-600" />
          <h3 className="text-sm font-semibold text-gray-800">DSCR Results</h3>
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-center mb-4">
          <div className="text-3xl font-bold text-blue-600 mb-1">
            {dscrResults.dscr.toFixed(2)}
          </div>
          <div className="text-xs text-gray-600">
            Based on {selectedLoan.lenderName} {formatProductName(selectedLoan.product)} @ {selectedLoan.finalRate?.toFixed(2)}%
          </div>
        </div>

        <TooltipProvider>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-1">
                <span className="text-xs text-gray-600">Net Operating Income</span>
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="h-3 w-3 text-gray-400" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-xs">Annual rental income minus operating expenses</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <span className="text-xs font-semibold">${dscrResults.noi.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>

            <div className="flex justify-between items-center">
              <div className="flex items-center gap-1">
                <span className="text-xs text-gray-600">Annual Debt Service</span>
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="h-3 w-3 text-gray-400" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-xs">Total annual mortgage payments</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <span className="text-xs font-semibold">${dscrResults.debtService.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>

            <div className="flex justify-between items-center">
              <div className="flex items-center gap-1">
                <span className="text-xs text-gray-600">Cap Rate</span>
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="h-3 w-3 text-gray-400" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-xs">Net Operating Income / Property Value</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <span className="text-xs font-semibold">{dscrResults.capRate.toFixed(2)}%</span>
            </div>

            <div className="flex justify-between items-center">
              <div className="flex items-center gap-1">
                <span className="text-xs text-gray-600">Cash on Cash Return</span>
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="h-3 w-3 text-gray-400" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-xs">Annual Cash Flow / Total Cash Invested</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <span className="text-xs font-semibold">{dscrResults.cashOnCashReturn.toFixed(2)}%</span>
            </div>

            <div className="flex justify-between items-center">
              <div className="flex items-center gap-1">
                <span className="text-xs text-gray-600">Break-Even Ratio</span>
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="h-3 w-3 text-gray-400" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-xs">(Operating Expenses + Debt Service) / Gross Income</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <span className="text-xs font-semibold">{dscrResults.breakEvenRatio.toFixed(2)}</span>
            </div>

            <div className="flex justify-between items-center">
              <div className="flex items-center gap-1">
                <span className="text-xs text-gray-600">Annual Cash Flow</span>
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="h-3 w-3 text-gray-400" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-xs">Net Operating Income - Debt Service</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <span className="text-xs font-semibold text-green-600">${dscrResults.cashFlow.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
          </div>
        </TooltipProvider>
      </CardContent>
    </Card>
  );
} 