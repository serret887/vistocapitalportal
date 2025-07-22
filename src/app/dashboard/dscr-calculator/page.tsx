"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { 
  Calculator, 
  Info as InfoIcon,
  User,
  Key,
  User as UserIcon,
  DollarSign as DollarSignIcon,
  Calculator as CalculatorIcon,
  CreditCard as CreditCardIcon
} from "lucide-react";
import { US_STATES } from "@/types";
import { generateLoanOptions, LoanOption } from "@/lib/loan-pricing";

interface DSCRResults {
  noi: number;
  debtService: number;
  dscr: number;
  capRate: number;
  cashOnCashReturn: number;
  breakEvenRatio: number;
  cashFlow: number;
}

export default function DSCRCalculator() {
  const [formData, setFormData] = useState({
    transactionType: "Purchase",
    propertyState: "CA",
    propertyType: "Single Family",
    ficoScore: "740-759",
    estimatedHomeValue: 200000,
    loanAmount: 160000,
    downPayment: 20,
    remainingMortgage: 120000,
    acquisitionDate: "",
    prepaymentPenalty: "None",
    brokerPoints: 1.0,
    brokerAdminFee: 995,
    monthlyRentalIncome: 2500,
    annualPropertyInsurance: 1200,
    annualPropertyTaxes: 2400,
    monthlyHoaFee: 0,
  });

  const [results, setResults] = useState<DSCRResults | null>(null);
  const [loanOptions, setLoanOptions] = useState<LoanOption[]>([]);
  const [selectedLoan, setSelectedLoan] = useState<LoanOption | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handlePropertyValueChange = (value: number) => {
    setFormData(prev => ({
      ...prev,
      estimatedHomeValue: value,
      loanAmount: value * (1 - prev.downPayment / 100)
    }));
  };

  const handleDownPaymentChange = (value: number) => {
    setFormData(prev => ({
      ...prev,
      downPayment: value,
      loanAmount: prev.estimatedHomeValue * (1 - value / 100)
    }));
  };

  const calculateDSCR = () => {
    const monthlyRentalIncome = formData.monthlyRentalIncome;
    const annualPropertyInsurance = formData.annualPropertyInsurance;
    const annualPropertyTaxes = formData.annualPropertyTaxes;
    const monthlyHoaFee = formData.monthlyHoaFee;

    // Calculate NOI
    const annualRentalIncome = monthlyRentalIncome * 12;
    const annualExpenses = annualPropertyInsurance + annualPropertyTaxes + (monthlyHoaFee * 12);
    const noi = annualRentalIncome - annualExpenses;

    // Calculate debt service based on selected loan or default rate
    let monthlyRate: number;
    let totalPayments: number;
    
    if (selectedLoan && selectedLoan.finalRate) {
      monthlyRate = selectedLoan.finalRate / 100 / 12;
      totalPayments = selectedLoan.termYears * 12;
    } else {
      // Default calculation with estimated rate
      monthlyRate = 7.0 / 100 / 12;
      totalPayments = 30 * 12;
    }

    const monthlyPayment = (formData.loanAmount * monthlyRate * Math.pow(1 + monthlyRate, totalPayments)) / 
                          (Math.pow(1 + monthlyRate, totalPayments) - 1);
    const annualDebtService = monthlyPayment * 12;

    // Calculate DSCR
    const dscr = noi / annualDebtService;

    // Calculate other metrics
    const capRate = (noi / formData.estimatedHomeValue) * 100;
    const cashOnCashReturn = ((noi - annualDebtService) / (formData.loanAmount * 0.25)) * 100;
    const breakEvenRatio = (annualDebtService + annualExpenses) / annualRentalIncome;
    const cashFlow = noi - annualDebtService;

    setResults({
      noi,
      debtService: annualDebtService,
      dscr,
      capRate,
      cashOnCashReturn,
      breakEvenRatio,
      cashFlow
    });
  };

  const handleCalculate = async () => {
    setIsLoading(true);
    try {
      // Calculate initial DSCR
      calculateDSCR();
      
      // Generate loan options
      const options = await generateLoanOptions(formData);
      setLoanOptions(options);
    } catch (error) {
      console.error('Error calculating:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoanSelect = (loan: LoanOption) => {
    // Only select loans with valid data
    if (loan && loan.finalRate && loan.monthlyPayment) {
      setSelectedLoan(loan);
      // Recalculate DSCR with the new loan terms
      setTimeout(() => calculateDSCR(), 100);
    }
  };

  const resetToDefaults = () => {
    setFormData({
      transactionType: "Purchase",
      propertyState: "CA",
      propertyType: "Single Family",
      ficoScore: "740-759",
      estimatedHomeValue: 200000,
      loanAmount: 160000,
      downPayment: 20,
      remainingMortgage: 120000,
      acquisitionDate: "",
      prepaymentPenalty: "None",
      brokerPoints: 1.0,
      brokerAdminFee: 995,
      monthlyRentalIncome: 2500,
      annualPropertyInsurance: 1200,
      annualPropertyTaxes: 2400,
      monthlyHoaFee: 0,
    });
    setResults(null);
    setLoanOptions([]);
    setSelectedLoan(null);
  };

  // Dynamic product name formatting
  const formatProductName = (product: string): string => {
    // Handle common patterns
    if (product.includes('_ARM')) {
      const parts = product.split('_');
      if (parts.length >= 3) {
        return `${parts[0]}/${parts[1]} ARM`;
      }
    }
    
    if (product.includes('Year_Fixed') || product.includes('_Year_Fixed')) {
      const yearMatch = product.match(/(\d+)/);
      if (yearMatch) {
        return `${yearMatch[1]}-Year Fixed`;
      }
    }
    
    // For other products, convert underscores to spaces and capitalize
    return product.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  return (
    <div className="container mx-auto p-4 max-h-screen overflow-hidden">
      <div className="mb-4">
        <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          DSCR Loan Calculator
        </h1>
        <p className="text-sm text-gray-600 mt-1">
          Calculate your debt service coverage ratio and explore loan options
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-10 gap-4 h-[calc(100vh-120px)]">
        {/* Left Section - 30% for Borrower Cards */}
        <div className="lg:col-span-3 space-y-4 overflow-y-auto pr-2">
          {/* Borrower Information Card */}
          <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-gray-50">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <UserIcon className="h-4 w-4 text-blue-600" />
                <h3 className="text-sm font-semibold text-gray-800">Borrower Information</h3>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="transactionType" className="text-xs font-medium">Transaction Type</Label>
                  <Select value={formData.transactionType} onValueChange={(value) => setFormData({...formData, transactionType: value})}>
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
                  <Label htmlFor="propertyState" className="text-xs font-medium">Property State</Label>
                  <Select value={formData.propertyState} onValueChange={(value) => setFormData({...formData, propertyState: value})}>
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {US_STATES.map((state) => (
                        <SelectItem key={state} value={state}>{state}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="propertyType" className="text-xs font-medium">Property Type</Label>
                  <Select value={formData.propertyType} onValueChange={(value) => setFormData({...formData, propertyType: value})}>
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Single Family">Single Family</SelectItem>
                      <SelectItem value="Multi Family">Multi Family</SelectItem>
                      <SelectItem value="Condo">Condo</SelectItem>
                      <SelectItem value="Townhouse">Townhouse</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="ficoScore" className="text-xs font-medium">Est. FICO Score</Label>
                  <Select value={formData.ficoScore} onValueChange={(value) => setFormData({...formData, ficoScore: value})}>
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="600-619">600-619</SelectItem>
                      <SelectItem value="620-639">620-639</SelectItem>
                      <SelectItem value="640-659">640-659</SelectItem>
                      <SelectItem value="660-679">660-679</SelectItem>
                      <SelectItem value="680-699">680-699</SelectItem>
                      <SelectItem value="700-719">700-719</SelectItem>
                      <SelectItem value="720-739">720-739</SelectItem>
                      <SelectItem value="740-759">740-759</SelectItem>
                      <SelectItem value="760-779">760-779</SelectItem>
                      <SelectItem value="780+">780+</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="estimatedHomeValue" className="text-xs font-medium">Estimated Home Value</Label>
                  <Input
                    type="number"
                    value={formData.estimatedHomeValue}
                    onChange={(e) => handlePropertyValueChange(Number(e.target.value))}
                    placeholder="200000"
                    className="h-8 text-xs"
                  />
                </div>

                <div>
                  <Label htmlFor="loanAmount" className="text-xs font-medium">Loan Amount</Label>
                  <Input
                    type="number"
                    value={formData.loanAmount}
                    onChange={(e) => setFormData({...formData, loanAmount: Number(e.target.value)})}
                    placeholder={formData.transactionType === "Purchase" ? "160000" : "120000"}
                    className="h-8 text-xs"
                  />
                </div>

                {formData.transactionType === "Purchase" && (
                  <>
                    <div>
                      <Label htmlFor="downPayment" className="text-xs font-medium">Down Payment (%)</Label>
                      <Input
                        type="number"
                        value={formData.downPayment}
                        onChange={(e) => handleDownPaymentChange(Number(e.target.value))}
                        placeholder="20"
                        className="h-8 text-xs"
                      />
                    </div>

                    <div>
                      <Label htmlFor="prepaymentPenalty" className="text-xs font-medium">Prepayment Penalty</Label>
                      <Select value={formData.prepaymentPenalty} onValueChange={(value) => setFormData({...formData, prepaymentPenalty: value})}>
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="7-year term">7-year term</SelectItem>
                          <SelectItem value="5-year term">5-year term</SelectItem>
                          <SelectItem value="3-year term">3-year term</SelectItem>
                          <SelectItem value="None">None</SelectItem>
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
                        type="number"
                        value={formData.remainingMortgage}
                        onChange={(e) => setFormData({...formData, remainingMortgage: Number(e.target.value)})}
                        placeholder="120000"
                        className="h-8 text-xs"
                      />
                    </div>

                    <div>
                      <Label htmlFor="acquisitionDate" className="text-xs font-medium flex items-center gap-1">
                        Prop. Acquisition Date
                        <InfoIcon className="h-3 w-3 text-gray-400" />
                      </Label>
                      <Input
                        type="text"
                        value={formData.acquisitionDate}
                        onChange={(e) => setFormData({...formData, acquisitionDate: e.target.value})}
                        placeholder="04/22/2025"
                        className="h-8 text-xs"
                      />
                    </div>

                    <div>
                      <Label htmlFor="prepaymentPenalty" className="text-xs font-medium">Prepayment Penalty</Label>
                      <Select value={formData.prepaymentPenalty} onValueChange={(value) => setFormData({...formData, prepaymentPenalty: value})}>
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="7-year term">7-year term</SelectItem>
                          <SelectItem value="5-year term">5-year term</SelectItem>
                          <SelectItem value="3-year term">3-year term</SelectItem>
                          <SelectItem value="None">None</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Broker Compensation Card */}
          <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-gray-50">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <DollarSignIcon className="h-4 w-4 text-green-600" />
                <h3 className="text-sm font-semibold text-gray-800">Broker Compensation</h3>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="brokerPoints" className="text-xs font-medium">Broker Points</Label>
                  <Input
                    type="number"
                    value={formData.brokerPoints}
                    onChange={(e) => setFormData({...formData, brokerPoints: Number(e.target.value)})}
                    placeholder="1.0"
                    className="h-8 text-xs"
                  />
                </div>

                <div>
                  <Label htmlFor="brokerAdminFee" className="text-xs font-medium">Admin Fee</Label>
                  <Input
                    type="number"
                    value={formData.brokerAdminFee}
                    onChange={(e) => setFormData({...formData, brokerAdminFee: Number(e.target.value)})}
                    placeholder="995"
                    className="h-8 text-xs"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* DSCR Information Card */}
          <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-gray-50">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <CalculatorIcon className="h-4 w-4 text-purple-600" />
                <h3 className="text-sm font-semibold text-gray-800">DSCR Information</h3>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="monthlyRentalIncome" className="text-xs font-medium">Monthly Rental Income</Label>
                  <Input
                    type="number"
                    value={formData.monthlyRentalIncome}
                    onChange={(e) => setFormData({...formData, monthlyRentalIncome: Number(e.target.value)})}
                    placeholder="2500"
                    className="h-8 text-xs"
                  />
                </div>

                <div>
                  <Label htmlFor="annualPropertyInsurance" className="text-xs font-medium">Annual Property Insurance</Label>
                  <Input
                    type="number"
                    value={formData.annualPropertyInsurance}
                    onChange={(e) => setFormData({...formData, annualPropertyInsurance: Number(e.target.value)})}
                    placeholder="1200"
                    className="h-8 text-xs"
                  />
                </div>

                <div>
                  <Label htmlFor="annualPropertyTaxes" className="text-xs font-medium">Annual Property Taxes</Label>
                  <Input
                    type="number"
                    value={formData.annualPropertyTaxes}
                    onChange={(e) => setFormData({...formData, annualPropertyTaxes: Number(e.target.value)})}
                    placeholder="2400"
                    className="h-8 text-xs"
                  />
                </div>

                <div>
                  <Label htmlFor="monthlyHoaFee" className="text-xs font-medium">Monthly HOA Fee</Label>
                  <Input
                    type="number"
                    value={formData.monthlyHoaFee}
                    onChange={(e) => setFormData({...formData, monthlyHoaFee: Number(e.target.value)})}
                    placeholder="0"
                    className="h-8 text-xs"
                  />
                </div>
              </div>

              <Button 
                onClick={handleCalculate}
                disabled={isLoading}
                className="w-full h-8 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white text-xs font-medium"
              >
                {isLoading ? "Calculating..." : "Calculate DSCR"}
              </Button>

              {results && (
                <div className="mt-3 p-3 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg">
                  <div className="text-center">
                    <div className="text-lg font-bold text-blue-600">
                      {results.dscr.toFixed(2)}
                    </div>
                    <div className="text-xs text-gray-600">Estimated DSCR</div>
                    {selectedLoan && selectedLoan.finalRate && (
                      <div className="text-xs text-gray-500 mt-1">
                        Based on {selectedLoan.lenderId} {formatProductName(selectedLoan.product)} @ {selectedLoan.finalRate.toFixed(3)}%
                      </div>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Section - 70% for Loan Items */}
        <div className="lg:col-span-7 overflow-y-auto">
          <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-gray-50 h-full">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <CreditCardIcon className="h-4 w-4 text-indigo-600" />
                <h3 className="text-sm font-semibold text-gray-800">Available Loan Options</h3>
              </div>
            </CardHeader>
            <CardContent>
              {loanOptions.length > 0 ? (
                <div className="space-y-3">
                  {loanOptions.map((option, index) => (
                    <div 
                      key={index} 
                      className={`p-3 border rounded-lg transition-colors cursor-pointer ${
                        selectedLoan?.lenderId === option.lenderId && 
                        selectedLoan?.product === option.product && 
                        selectedLoan?.termYears === option.termYears
                          ? 'border-blue-500 bg-blue-50' 
                          : 'border-gray-200 hover:border-blue-300'
                      }`}
                      onClick={() => handleLoanSelect(option)}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h4 className="text-sm font-semibold text-gray-800">
                            {formatProductName(option.product)}
                          </h4>
                          <p className="text-xs text-gray-600">
                            {option.termYears}-year term
                          </p>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-bold text-gray-800">
                            {option.finalRate ? option.finalRate.toFixed(3) : 'N/A'}%
                          </div>
                          <div className="text-xs text-gray-500">
                            {option.points ? option.points.toFixed(3) : 'N/A'} pts
                          </div>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-2 text-xs">
                        <div>
                          <span className="text-gray-500">Monthly Payment:</span>
                          <div className="font-semibold">
                            ${option.monthlyPayment ? option.monthlyPayment.toLocaleString() : 'N/A'}
                          </div>
                        </div>
                        <div>
                          <span className="text-gray-500">Total Fees:</span>
                          <div className="font-semibold">
                            ${option.totalFees ? option.totalFees.toLocaleString() : 'N/A'}
                          </div>
                        </div>
                        <div>
                          <span className="text-gray-500">Lender:</span>
                          <div className="font-semibold capitalize">{option.lenderId || 'N/A'}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <CalculatorIcon className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                  <p className="text-sm">Calculate DSCR to see available loan options</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
} 