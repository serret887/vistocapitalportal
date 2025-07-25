"use client";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { User } from "lucide-react";

interface BorrowerInformationProps {
  formData: {
    transactionType: string;
    ficoScore: string;
    estimatedHomeValue: number;
    loanAmount: number;
    downPayment: number;
    prepaymentPenalty: string;
    remainingMortgage?: number;
    acquisitionDate?: string;
  };
  onFormDataChange: (updates: Partial<BorrowerInformationProps['formData']>) => void;
  onNumberInput: (value: string, setter: (value: number) => void) => void;
  formatDisplayValue: (value: number) => string;
  handlePropertyValueChange: (value: number) => void;
  handleDownPaymentChange: (value: number) => void;
  setNeedsRecalculation: (value: boolean) => void;
  setValidationErrors: (errors: any[]) => void;
  setMatrixRequirements: (requirements: any) => void;
}

export function BorrowerInformation({
  formData,
  onFormDataChange,
  onNumberInput,
  formatDisplayValue,
  handlePropertyValueChange,
  handleDownPaymentChange,
  setNeedsRecalculation,
  setValidationErrors,
  setMatrixRequirements
}: BorrowerInformationProps) {
  return (
    <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-gray-50">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <User className="h-4 w-4 text-blue-600" />
          <h3 className="text-sm font-semibold text-gray-800">Borrower Information</h3>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="loanPurpose" className="text-xs font-medium">Loan Purpose</Label>
            <Select 
              value={formData.transactionType} 
              onValueChange={(value) => {
                onFormDataChange({ transactionType: value });
                setNeedsRecalculation(true);
                setValidationErrors([]);
                setMatrixRequirements(null);
              }}
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Purchase">Purchase</SelectItem>
                <SelectItem value="Refinance">Refinance</SelectItem>
                <SelectItem value="Cash Out">Cash Out</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="ficoScore" className="text-xs font-medium">Est. FICO Score</Label>
            <Select 
              value={formData.ficoScore} 
              onValueChange={(value) => {
                onFormDataChange({ ficoScore: value });
                setNeedsRecalculation(true);
                setValidationErrors([]);
                setMatrixRequirements(null);
              }}
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="780+">780+</SelectItem>
                <SelectItem value="760-779">760-779</SelectItem>
                <SelectItem value="740-759">740-759</SelectItem>
                <SelectItem value="720-739">720-739</SelectItem>
                <SelectItem value="700-719">700-719</SelectItem>
                <SelectItem value="680-699">680-699</SelectItem>
                <SelectItem value="660-679">660-679</SelectItem>
                <SelectItem value="640-659">640-659</SelectItem>
                <SelectItem value="620-639">620-639</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="estimatedHomeValue" className="text-xs font-medium">Estimated Home Value</Label>
            <Input
              type="text"
              value={formatDisplayValue(formData.estimatedHomeValue)}
              onChange={(e) => onNumberInput(e.target.value, handlePropertyValueChange)}
              placeholder="200000"
              className="h-8 text-xs"
            />
          </div>

          <div>
            <Label htmlFor="loanAmount" className="text-xs font-medium">Loan Amount</Label>
            <Input
              type="text"
              value={formatDisplayValue(formData.loanAmount)}
              onChange={(e) => onNumberInput(e.target.value, (value) => onFormDataChange({ loanAmount: value }))}
              placeholder={formData.transactionType === "Purchase" ? "160000" : "120000"}
              className="h-8 text-xs"
            />
          </div>

          {formData.transactionType === "Purchase" && (
            <>
              <div>
                <Label htmlFor="downPayment" className="text-xs font-medium">Down Payment (%)</Label>
                <Input
                  type="text"
                  value={formatDisplayValue(formData.downPayment)}
                  onChange={(e) => onNumberInput(e.target.value, handleDownPaymentChange)}
                  placeholder="20"
                  className="h-8 text-xs"
                />
              </div>

              <div>
                <Label htmlFor="prepaymentPenalty" className="text-xs font-medium">Prepayment Penalty</Label>
                <Select 
                  value={formData.prepaymentPenalty} 
                  onValueChange={(value) => {
                    onFormDataChange({ prepaymentPenalty: value });
                    setNeedsRecalculation(true);
                    setValidationErrors([]);
                    setMatrixRequirements(null);
                  }}
                >
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5/5/5/5/5">5/5/5/5/5</SelectItem>
                    <SelectItem value="3/3/3">3/3/3</SelectItem>
                    <SelectItem value="5/4/3/2/1">5/4/3/2/1</SelectItem>
                    <SelectItem value="3/2/1">3/2/1</SelectItem>
                    <SelectItem value="3/0/0">3/0/0</SelectItem>
                    <SelectItem value="0/0/0">0/0/0</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </>
          )}

          {formData.transactionType === "Refinance" && (
            <>
              <div>
                <Label htmlFor="remainingMortgage" className="text-xs font-medium">Remaining Mortgage</Label>
                <Input
                  type="text"
                  value={formatDisplayValue(formData.remainingMortgage || 0)}
                  onChange={(e) => onNumberInput(e.target.value, (value) => onFormDataChange({ remainingMortgage: value }))}
                  placeholder="120000"
                  className="h-8 text-xs"
                />
              </div>

              <div>
                <Label htmlFor="acquisitionDate" className="text-xs font-medium">Prop. Acquisition Date</Label>
                <Input
                  type="text"
                  value={formData.acquisitionDate || ""}
                  onChange={(e) => onFormDataChange({ acquisitionDate: e.target.value })}
                  placeholder="04/22/2025"
                  className="h-8 text-xs"
                />
              </div>

              <div>
                <Label htmlFor="prepaymentPenalty" className="text-xs font-medium">Prepayment Penalty</Label>
                <Select 
                  value={formData.prepaymentPenalty} 
                  onValueChange={(value) => {
                    onFormDataChange({ prepaymentPenalty: value });
                    setNeedsRecalculation(true);
                    setValidationErrors([]);
                    setMatrixRequirements(null);
                  }}
                >
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5/5/5/5/5">5/5/5/5/5</SelectItem>
                    <SelectItem value="3/3/3">3/3/3</SelectItem>
                    <SelectItem value="5/4/3/2/1">5/4/3/2/1</SelectItem>
                    <SelectItem value="3/2/1">3/2/1</SelectItem>
                    <SelectItem value="3/0/0">3/0/0</SelectItem>
                    <SelectItem value="0/0/0">0/0/0</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
} 