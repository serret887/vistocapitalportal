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
  CreditCard as CreditCardIcon,
  Home as HomeIcon
} from "lucide-react";
import { US_STATES } from "@/types";
import { generateLoanOptions, LoanOption, convertFormDataToPricingRequest, getLoanPricing } from "@/lib/loan-pricing";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { PricingResponse, LoanValidationResult } from "../../../lib/types/pricing";
import { ValidationErrorCard } from "@/components/dashboard/validation-error-card";
import { ValidationSummary } from "@/components/dashboard/validation-summary";

interface DSCRResults {
  noi: number;
  debtService: number;
  dscr: number;
  capRate: number;
  cashOnCashReturn: number;
  breakEvenRatio: number;
  cashFlow: number;
}

// State mapping: full name for display, state symbol for value
const STATE_MAPPING = [
  { name: 'Alabama', value: 'AL' },
  { name: 'Alaska', value: 'AK' },
  { name: 'Arizona', value: 'AZ' },
  { name: 'Arkansas', value: 'AR' },
  { name: 'California', value: 'CA' },
  { name: 'Colorado', value: 'CO' },
  { name: 'Connecticut', value: 'CT' },
  { name: 'Delaware', value: 'DE' },
  { name: 'Florida', value: 'FL' },
  { name: 'Georgia', value: 'GA' },
  { name: 'Hawaii', value: 'HI' },
  { name: 'Idaho', value: 'ID' },
  { name: 'Illinois', value: 'IL' },
  { name: 'Indiana', value: 'IN' },
  { name: 'Iowa', value: 'IA' },
  { name: 'Kansas', value: 'KS' },
  { name: 'Kentucky', value: 'KY' },
  { name: 'Louisiana', value: 'LA' },
  { name: 'Maine', value: 'ME' },
  { name: 'Maryland', value: 'MD' },
  { name: 'Massachusetts', value: 'MA' },
  { name: 'Michigan', value: 'MI' },
  { name: 'Minnesota', value: 'MN' },
  { name: 'Mississippi', value: 'MS' },
  { name: 'Missouri', value: 'MO' },
  { name: 'Montana', value: 'MT' },
  { name: 'Nebraska', value: 'NE' },
  { name: 'Nevada', value: 'NV' },
  { name: 'New Hampshire', value: 'NH' },
  { name: 'New Jersey', value: 'NJ' },
  { name: 'New Mexico', value: 'NM' },
  { name: 'New York', value: 'NY' },
  { name: 'North Carolina', value: 'NC' },
  { name: 'North Dakota', value: 'ND' },
  { name: 'Ohio', value: 'OH' },
  { name: 'Oklahoma', value: 'OK' },
  { name: 'Oregon', value: 'OR' },
  { name: 'Pennsylvania', value: 'PA' },
  { name: 'Rhode Island', value: 'RI' },
  { name: 'South Carolina', value: 'SC' },
  { name: 'South Dakota', value: 'SD' },
  { name: 'Tennessee', value: 'TN' },
  { name: 'Texas', value: 'TX' },
  { name: 'Utah', value: 'UT' },
  { name: 'Vermont', value: 'VT' },
  { name: 'Virginia', value: 'VA' },
  { name: 'Washington', value: 'WA' },
  { name: 'West Virginia', value: 'WV' },
  { name: 'Wisconsin', value: 'WI' },
  { name: 'Wyoming', value: 'WY' }
];

// Helper function to get state name from state symbol
const getStateName = (stateSymbol: string): string => {
  const state = STATE_MAPPING.find(s => s.value === stateSymbol);
  return state ? state.name : stateSymbol;
};

export default function DSCRCalculator() {
  const [formData, setFormData] = useState({
    transactionType: "Purchase",
    propertyState: "FL",
    propertyType: "Single Family",
    ficoScore: "740-759",
    estimatedHomeValue: 200000,
    loanAmount: 160000,
    downPayment: 20,
    remainingMortgage: 120000,
    acquisitionDate: "",
    prepaymentPenalty: "5/4/3/2/1",
    brokerPoints: 1.0,
    brokerAdminFee: 995,
    monthlyRentalIncome: 2500,
    annualPropertyInsurance: 1200,
    annualPropertyTaxes: 2400,
    monthlyHoaFee: 0,
    discountPoints: 0,
    brokerYsp: 1.0, // Changed from 0 to 1.0 to match matrix values
  });

  const [results, setResults] = useState<DSCRResults | null>(null);
  const [loanOptions, setLoanOptions] = useState<LoanOption[]>([]);
  const [selectedLoan, setSelectedLoan] = useState<LoanOption | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [needsRecalculation, setNeedsRecalculation] = useState(false);
  const [validationErrors, setValidationErrors] = useState<LoanValidationResult[]>([]);
  const [matrixRequirements, setMatrixRequirements] = useState<any>(null);

  // Utility function to handle number input formatting
  const handleNumberInput = (value: string, setter: (value: number) => void) => {
    // Remove all non-numeric characters except decimal point
    const cleanValue = value.replace(/[^\d.]/g, '');
    
    // Remove leading zeros (but keep single zero)
    const noLeadingZeros = cleanValue.replace(/^0+/, '') || '0';
    
    // Ensure only one decimal point
    const parts = noLeadingZeros.split('.');
    const formattedValue = parts.length > 2 ? parts[0] + '.' + parts.slice(1).join('') : noLeadingZeros;
    
    // Convert to number and update
    const numValue = Number(formattedValue);
    if (!isNaN(numValue)) {
      setter(numValue);
      setNeedsRecalculation(true);
      setValidationErrors([]); // Clear validation errors when user makes changes
      setMatrixRequirements(null); // Clear matrix requirements when user makes changes
    }
  };

  // Utility function to format display value (remove trailing .0)
  const formatDisplayValue = (value: number): string => {
    return value === 0 ? '0' : value.toString().replace(/\.0$/, '');
  };

  const handlePropertyValueChange = (value: number) => {
    setFormData({...formData, estimatedHomeValue: value});
    if (formData.transactionType === "Purchase") {
      const downPaymentAmount = (value * formData.downPayment) / 100;
      const newLoanAmount = value - downPaymentAmount;
      setFormData(prev => ({...prev, loanAmount: Math.round(newLoanAmount)}));
    }
  };

  const handleDownPaymentChange = (value: number) => {
    setFormData({...formData, downPayment: value});
    const downPaymentAmount = (formData.estimatedHomeValue * value) / 100;
    const newLoanAmount = formData.estimatedHomeValue - downPaymentAmount;
    setFormData(prev => ({...prev, loanAmount: Math.round(newLoanAmount)}));
  };

  const calculateDSCR = () => {
    const monthlyRentalIncome = formData.monthlyRentalIncome;
    const annualPropertyInsurance = formData.annualPropertyInsurance;
    const annualPropertyTaxes = formData.annualPropertyTaxes;
    const monthlyHoaFee = formData.monthlyHoaFee;

    // Calculate monthly expenses
    const monthlyInsurance = annualPropertyInsurance / 12;
    const monthlyTaxes = annualPropertyTaxes / 12;

    // Calculate debt service based on selected loan or default rate
    let monthlyRate: number;
    let totalPayments: number;
    let monthlyPayment: number;
    let monthlyDebtService: number;
    
    if (selectedLoan && selectedLoan.finalRate && selectedLoan.monthlyPayment) {
      // Use the selected loan's actual monthly payment
      monthlyPayment = selectedLoan.monthlyPayment;
      monthlyDebtService = monthlyPayment;
      console.log('Using selected loan for DSCR calculation:', {
        selectedLoan,
        monthlyPayment,
        monthlyDebtService
      });
    } else {
      // Default calculation with estimated rate
      monthlyRate = 7.0 / 100 / 12;
      totalPayments = 30 * 12;
      monthlyPayment = (formData.loanAmount * monthlyRate * Math.pow(1 + monthlyRate, totalPayments)) / 
                      (Math.pow(1 + monthlyRate, totalPayments) - 1);
      monthlyDebtService = monthlyPayment;
      console.log('Using default rate for DSCR calculation:', {
        defaultRate: 7.0,
        monthlyPayment,
        monthlyDebtService
      });
    }

    // Calculate DSCR using the correct formula
    const monthlyTotalExpenses = monthlyTaxes + monthlyDebtService + monthlyInsurance + monthlyHoaFee;
    const dscr = monthlyRentalIncome / monthlyTotalExpenses;

    // Calculate other metrics
    const annualRentalIncome = monthlyRentalIncome * 12;
    const annualExpenses = annualPropertyInsurance + annualPropertyTaxes + (monthlyHoaFee * 12);
    const noi = annualRentalIncome - annualExpenses;
    const capRate = (noi / formData.estimatedHomeValue) * 100;
    
    // Calculate actual down payment amount
    const actualDownPayment = formData.estimatedHomeValue - formData.loanAmount;
    const annualDebtService = monthlyDebtService * 12;
    const cashOnCashReturn = ((noi - annualDebtService) / actualDownPayment) * 100;
    
    const breakEvenRatio = (annualDebtService + annualExpenses) / annualRentalIncome;
    const cashFlow = noi - annualDebtService;

    // Debug logging
    console.log('DSCR Calculation Debug:', {
      monthlyRentalIncome,
      monthlyTaxes,
      monthlyInsurance,
      monthlyHoaFee,
      monthlyDebtService,
      monthlyTotalExpenses,
      dscr,
      loanAmount: formData.loanAmount,
      monthlyRate: selectedLoan ? selectedLoan.finalRate / 100 / 12 : 7.0 / 100 / 12,
      totalPayments: selectedLoan ? selectedLoan.termYears * 12 : 30 * 12,
      monthlyPayment,
      annualRentalIncome,
      annualExpenses,
      noi,
      capRate,
      actualDownPayment,
      cashOnCashReturn,
      breakEvenRatio,
      cashFlow,
      selectedLoan: selectedLoan ? selectedLoan.product : 'None'
    });

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
    setValidationErrors([]); // Clear previous errors
    setMatrixRequirements(null); // Clear previous matrix requirements
    
    try {
      // Clear any previously selected loan
      setSelectedLoan(null);
      
      // Calculate initial DSCR with default rate
      calculateDSCR();
      
      // Convert form data to API request
      const request = convertFormDataToPricingRequest(formData);
      
      // Debug: Log the request being sent
      console.log('Sending pricing request:', {
        formData,
        convertedRequest: request
      });
      
      // Get loan pricing from API
      const pricingResponse = await getLoanPricing(request);
      
      // Debug: Log the response
      console.log('Received pricing response:', pricingResponse);
      
      // Check for validation errors
      if (!pricingResponse.success) {
        if (pricingResponse.validation) {
          setValidationErrors([pricingResponse.validation]);
          console.log('Validation errors set:', pricingResponse.validation);
          
          // Store matrix requirements for display
          setMatrixRequirements({
            min_value: 125000, // From the matrix
            max_ltv: 80,
            dscr_min: 1.00,
            refinance_min_fico: 720,
            not_available_in_states: ["AK", "MN", "NE", "NV", "ND", "OR", "SD", "UT", "VT"],
            property_types: ["1-4 Unit SFR", "Townhomes", "Condos"]
          });
        }
        console.error('Loan pricing failed:', pricingResponse.error);
        return;
      }
      
      // Generate loan options from the response
      const options = generateLoanOptions(pricingResponse);
      setLoanOptions(options);
      
      // Reset recalculation flag
      setNeedsRecalculation(false);
      
      console.log('Calculation completed:', {
        loanOptionsCount: options.length,
        options: options.map(opt => ({
          product: opt.product,
          finalRate: opt.finalRate,
          monthlyPayment: opt.monthlyPayment
        }))
      });
    } catch (error) {
      console.error('Error calculating:', error);
      // Set a generic error if the API call fails
      setValidationErrors([{
        isValid: false,
        errors: ['Unable to calculate loan options. Please check your input and try again.'],
        warnings: []
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoanSelect = (loan: LoanOption) => {
    // Only select loans with valid data
    if (loan && loan.finalRate && loan.monthlyPayment) {
      setSelectedLoan(loan);
      
      // Recalculate DSCR using the selected loan's actual monthly payment
      const monthlyRentalIncome = formData.monthlyRentalIncome;
      const annualPropertyInsurance = formData.annualPropertyInsurance;
      const annualPropertyTaxes = formData.annualPropertyTaxes;
      const monthlyHoaFee = formData.monthlyHoaFee;

      // Calculate monthly expenses
      const monthlyInsurance = annualPropertyInsurance / 12;
      const monthlyTaxes = annualPropertyTaxes / 12;

      // Use the selected loan's actual monthly payment
      const monthlyDebtService = loan.monthlyPayment;

      // Calculate DSCR using the correct formula
      const monthlyTotalExpenses = monthlyTaxes + monthlyDebtService + monthlyInsurance + monthlyHoaFee;
      const dscr = monthlyRentalIncome / monthlyTotalExpenses;

      // Calculate other metrics
      const annualRentalIncome = monthlyRentalIncome * 12;
      const annualExpenses = annualPropertyInsurance + annualPropertyTaxes + (monthlyHoaFee * 12);
      const noi = annualRentalIncome - annualExpenses;
      const capRate = (noi / formData.estimatedHomeValue) * 100;
      const actualDownPayment = formData.estimatedHomeValue - formData.loanAmount;
      const cashOnCashReturn = ((noi - monthlyDebtService * 12) / actualDownPayment) * 100;
      const breakEvenRatio = (monthlyDebtService * 12 + annualExpenses) / annualRentalIncome;
      const cashFlow = noi - monthlyDebtService * 12;

      console.log('DSCR Recalculation with selected loan:', {
        selectedLoan: loan,
        monthlyPayment: loan.monthlyPayment,
        monthlyDebtService,
        monthlyTaxes,
        monthlyInsurance,
        monthlyHoaFee,
        monthlyTotalExpenses,
        dscr
      });

      setResults({
        noi,
        debtService: monthlyDebtService * 12,
        dscr,
        capRate,
        cashOnCashReturn,
        breakEvenRatio,
        cashFlow
      });
    }
  };

  const resetToDefaults = () => {
    setFormData({
      transactionType: "Purchase",
      propertyState: "FL",
      propertyType: "Single Family",
      ficoScore: "740-759",
      estimatedHomeValue: 200000,
      loanAmount: 160000,
      downPayment: 20,
      remainingMortgage: 120000,
      acquisitionDate: "",
      prepaymentPenalty: "5/4/3/2/1",
      brokerPoints: 1.0,
      brokerAdminFee: 995,
      monthlyRentalIncome: 2500,
      annualPropertyInsurance: 1200,
      annualPropertyTaxes: 2400,
      monthlyHoaFee: 0,
      discountPoints: 0,
      brokerYsp: 1.0, // Changed from 0 to 1.0 to match matrix values
    });
    setResults(null);
    setLoanOptions([]);
    setSelectedLoan(null);
    setNeedsRecalculation(false);
    setValidationErrors([]); // Clear validation errors
    setMatrixRequirements(null); // Clear matrix requirements
  };

  // Dynamic product name formatting
  const formatProductName = (product: string): string => {
    // Handle interest-only products (API now returns "30-Year Fixed - Interest Only")
    if (product.includes('- Interest Only')) {
      return product; // Already properly formatted from API
    }
    
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
    
    // For all products, convert underscores to spaces and capitalize
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-120px)]">
        {/* Column 1: Borrower & Property Information */}
        <div className="space-y-4 overflow-y-auto pr-2">
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
                  <Select value={formData.transactionType} onValueChange={(value) => {
                    setFormData({...formData, transactionType: value});
                    setNeedsRecalculation(true);
                    setValidationErrors([]);
                    setMatrixRequirements(null);
                  }}>
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
                  <Select value={formData.ficoScore} onValueChange={(value) => {
                    setFormData({...formData, ficoScore: value});
                    setNeedsRecalculation(true);
                    setValidationErrors([]);
                    setMatrixRequirements(null);
                  }}>
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
                    type="text"
                    value={formatDisplayValue(formData.estimatedHomeValue)}
                    onChange={(e) => handleNumberInput(e.target.value, (value) => setFormData({...formData, estimatedHomeValue: value}))}
                    placeholder="200000"
                    className="h-8 text-xs"
                  />
                </div>

                <div>
                  <Label htmlFor="loanAmount" className="text-xs font-medium">Loan Amount</Label>
                  <Input
                    type="text"
                    value={formatDisplayValue(formData.loanAmount)}
                    onChange={(e) => handleNumberInput(e.target.value, (value) => setFormData({...formData, loanAmount: value}))}
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
                        onChange={(e) => handleNumberInput(e.target.value, (value) => setFormData({...formData, downPayment: value}))}
                        placeholder="20"
                        className="h-8 text-xs"
                      />
                    </div>

                    <div>
                      <Label htmlFor="prepaymentPenalty" className="text-xs font-medium">Prepayment Penalty</Label>
                  <Select value={formData.prepaymentPenalty} onValueChange={(value) => {
                    setFormData({...formData, prepaymentPenalty: value});
                    setNeedsRecalculation(true);
                    setValidationErrors([]);
                    setMatrixRequirements(null);
                  }}>
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
                        value={formatDisplayValue(formData.remainingMortgage)}
                        onChange={(e) => handleNumberInput(e.target.value, (value) => setFormData({...formData, remainingMortgage: value}))}
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
                  <Select value={formData.prepaymentPenalty} onValueChange={(value) => {
                    setFormData({...formData, prepaymentPenalty: value});
                    setNeedsRecalculation(true);
                    setValidationErrors([]);
                    setMatrixRequirements(null);
                  }}>
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

          {/* Property Information Card */}
          <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-gray-50">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <HomeIcon className="h-4 w-4 text-green-600" />
                <h3 className="text-sm font-semibold text-gray-800">Property Information</h3>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="propertyState" className="text-xs font-medium">Property State</Label>
                  <Select value={formData.propertyState} onValueChange={(value) => {
                    setFormData({...formData, propertyState: value});
                    setNeedsRecalculation(true);
                    setValidationErrors([]);
                    setMatrixRequirements(null);
                  }}>
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue placeholder="Select state">
                        {formData.propertyState ? getStateName(formData.propertyState) : "Select state"}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {STATE_MAPPING.map((state) => (
                        <SelectItem key={state.value} value={state.value}>{state.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="propertyType" className="text-xs font-medium">Property Type</Label>
                  <Select value={formData.propertyType} onValueChange={(value) => {
                    setFormData({...formData, propertyType: value});
                    setNeedsRecalculation(true);
                    setValidationErrors([]);
                    setMatrixRequirements(null);
                  }}>
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Single Family">Single Family</SelectItem>
                      <SelectItem value="Multi Family">Multi Family (5+ units)</SelectItem>
                      <SelectItem value="Condo">Condo</SelectItem>
                      <SelectItem value="Townhouse">Townhouse</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="monthlyRentalIncome" className="text-xs font-medium">Monthly Rental Income</Label>
                  <Input
                    type="text"
                    value={formatDisplayValue(formData.monthlyRentalIncome)}
                    onChange={(e) => handleNumberInput(e.target.value, (value) => setFormData({...formData, monthlyRentalIncome: value}))}
                    placeholder="2500"
                    className="h-8 text-xs"
                  />
                </div>

                <div>
                  <Label htmlFor="annualPropertyInsurance" className="text-xs font-medium">Annual Property Insurance</Label>
                  <Input
                    type="text"
                    value={formatDisplayValue(formData.annualPropertyInsurance)}
                    onChange={(e) => handleNumberInput(e.target.value, (value) => setFormData({...formData, annualPropertyInsurance: value}))}
                    placeholder="1200"
                    className="h-8 text-xs"
                  />
                </div>

                <div>
                  <Label htmlFor="annualPropertyTaxes" className="text-xs font-medium">Annual Property Taxes</Label>
                  <Input
                    type="text"
                    value={formatDisplayValue(formData.annualPropertyTaxes)}
                    onChange={(e) => handleNumberInput(e.target.value, (value) => setFormData({...formData, annualPropertyTaxes: value}))}
                    placeholder="2400"
                    className="h-8 text-xs"
                  />
                </div>

                <div>
                  <Label htmlFor="monthlyHoaFee" className="text-xs font-medium">Monthly HOA Fee</Label>
                  <Input
                    type="text"
                    value={formatDisplayValue(formData.monthlyHoaFee)}
                    onChange={(e) => handleNumberInput(e.target.value, (value) => setFormData({...formData, monthlyHoaFee: value}))}
                    placeholder="0"
                    className="h-8 text-xs"
                  />
                </div>
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
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="brokerPoints" className="text-xs font-medium">Broker Points</Label>
                  <Input
                    type="text"
                    value={formatDisplayValue(formData.brokerPoints)}
                    onChange={(e) => handleNumberInput(e.target.value, (value) => setFormData({...formData, brokerPoints: value}))}
                    placeholder="1.0"
                    className="h-8 text-xs"
                  />
                </div>

                <div>
                  <Label htmlFor="brokerAdminFee" className="text-xs font-medium">Admin Fee</Label>
                  <Input
                    type="text"
                    value={formatDisplayValue(formData.brokerAdminFee)}
                    onChange={(e) => handleNumberInput(e.target.value, (value) => setFormData({...formData, brokerAdminFee: value}))}
                    placeholder="995"
                    className="h-8 text-xs"
                  />
                </div>
              </div>

              {/* Discount Points and Broker YSP in 2 columns */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="discountPoints" className="text-xs font-medium">Discount Points</Label>
                  <Select value={formData.discountPoints.toString()} onValueChange={(value) => {
                    setFormData({...formData, discountPoints: Number(value)});
                    setNeedsRecalculation(true);
                    setValidationErrors([]);
                    setMatrixRequirements(null);
                  }}>
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">0</SelectItem>
                      <SelectItem value="0.5">0.5</SelectItem>
                      <SelectItem value="1">1</SelectItem>
                      <SelectItem value="1.5">1.5</SelectItem>
                      <SelectItem value="2">2</SelectItem>
                      <SelectItem value="2.5">2.5</SelectItem>
                      <SelectItem value="3">3</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="brokerYsp" className="text-xs font-medium">Broker YSP</Label>
                  <Select value={formData.brokerYsp.toString()} onValueChange={(value) => {
                    setFormData({...formData, brokerYsp: Number(value)});
                    setNeedsRecalculation(true);
                    setValidationErrors([]);
                    setMatrixRequirements(null);
                  }}>
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">0</SelectItem>
                      <SelectItem value="0.25">0.25</SelectItem>
                      <SelectItem value="0.5">0.5</SelectItem>
                      <SelectItem value="0.75">0.75</SelectItem>
                      <SelectItem value="1">1</SelectItem>
                      <SelectItem value="1.25">1.25</SelectItem>
                      <SelectItem value="1.5">1.5</SelectItem>
                      <SelectItem value="1.75">1.75</SelectItem>
                      <SelectItem value="2">2</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button 
                onClick={handleCalculate}
                disabled={isLoading}
                className="w-full h-8 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white text-xs font-medium"
              >
                {isLoading ? "Calculating..." : "Calculate DSCR"}
              </Button>
              
              {needsRecalculation && (
                <div className="mt-2 text-center">
                  <Badge variant="destructive" className="text-xs">
                    Price Invalid - Recalculate
                  </Badge>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Column 2: Loan Options */}
        <div className="overflow-y-auto">
          <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-gray-50 h-full">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CreditCardIcon className="h-4 w-4 text-indigo-600" />
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
                      onClick={() => handleLoanSelect(option)}
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
                            {option.finalRate ? option.finalRate.toFixed(3) : 'N/A'}%
                          </div>
                          <div className="text-xs text-gray-500">
                            {option.points ? option.points.toFixed(3) : 'N/A'} pts
                          </div>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-4 text-xs">
                        <div>
                          <span className="text-gray-500">Monthly Payment:</span>
                          <div className="font-semibold text-sm">
                            ${option.monthlyPayment ? option.monthlyPayment.toLocaleString() : 'N/A'}
                          </div>
                        </div>
                        <div>
                          <span className="text-gray-500">Total Fees:</span>
                          <div className="font-semibold text-sm">
                            ${option.totalFees ? option.totalFees.toLocaleString() : 'N/A'}
                          </div>
                        </div>
                        <div>
                          <span className="text-gray-500">Broker Comp:</span>
                          <div className="font-semibold text-sm text-green-600">
                            ${((formData.brokerPoints + formData.brokerYsp) * formData.loanAmount / 100 + formData.brokerAdminFee).toLocaleString()}
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
                                <span className="font-medium">${option.feeBreakdown?.originationFee?.toLocaleString() || '0'}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600">Underwriting Fee:</span>
                                <span className="font-medium">${option.feeBreakdown?.underwritingFee?.toLocaleString() || '0'}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600">Admin Fee:</span>
                                <span className="font-medium">${option.feeBreakdown?.adminFee?.toLocaleString() || '0'}</span>
                              </div>
                              {option.feeBreakdown?.smallLoanFee && option.feeBreakdown.smallLoanFee > 0 && (
                                <div className="flex justify-between">
                                  <span className="text-gray-600">Small Loan Fee:</span>
                                  <span className="font-medium">${option.feeBreakdown.smallLoanFee.toLocaleString()}</span>
                                </div>
                              )}
                              <div className="border-t pt-2 flex justify-between font-semibold">
                                <span>Total Fees:</span>
                                <span>${option.totalFees?.toLocaleString() || '0'}</span>
                              </div>
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      </Accordion>
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

        {/* Column 3: DSCR & Calculations */}
        <div className="space-y-4 overflow-y-auto pl-2">
          {/* DSCR Results Card */}
          <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-gray-50">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <CalculatorIcon className="h-4 w-4 text-purple-600" />
                <h3 className="text-sm font-semibold text-gray-800">DSCR Results</h3>
              </div>
            </CardHeader>
            <CardContent>
              {results ? (
                <TooltipProvider>
                  <div className="space-y-4">
                    <div className="text-center p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">
                        {results.dscr.toFixed(2)}
                      </div>
                      <div className="text-sm text-gray-600">DSCR Ratio</div>
                      {selectedLoan && selectedLoan.finalRate && (
                        <div className="text-xs text-gray-500 mt-1">
                          Based on {selectedLoan.lenderName} {formatProductName(selectedLoan.product)} @ {selectedLoan.finalRate.toFixed(2)}%
                        </div>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="text-gray-500 cursor-help flex items-center gap-1">
                              Net Operating Income
                              <InfoIcon className="h-3 w-3" />
                            </span>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Annual rental income minus operating expenses (insurance, taxes, HOA fees). Does not include mortgage payments.</p>
                          </TooltipContent>
                        </Tooltip>
                        <div className="font-semibold">${results.noi.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                      </div>
                      <div>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="text-gray-500 cursor-help flex items-center gap-1">
                              Annual Debt Service
                              <InfoIcon className="h-3 w-3" />
                            </span>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Total annual mortgage payments (principal + interest) for the selected loan.</p>
                          </TooltipContent>
                        </Tooltip>
                        <div className="font-semibold">${results.debtService.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                      </div>
                      <div>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="text-gray-500 cursor-help flex items-center gap-1">
                              Cap Rate
                              <InfoIcon className="h-3 w-3" />
                            </span>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Net Operating Income divided by property value, expressed as a percentage. Measures property's return on investment.</p>
                          </TooltipContent>
                        </Tooltip>
                        <div className="font-semibold">{results.capRate.toFixed(2)}%</div>
                      </div>
                      <div>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="text-gray-500 cursor-help flex items-center gap-1">
                              Cash on Cash Return
                              <InfoIcon className="h-3 w-3" />
                            </span>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Annual cash flow divided by total cash invested (down payment), expressed as a percentage.</p>
                          </TooltipContent>
                        </Tooltip>
                        <div className="font-semibold">{results.cashOnCashReturn.toFixed(2)}%</div>
                      </div>
                      <div>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="text-gray-500 cursor-help flex items-center gap-1">
                              Break-Even Ratio
                              <InfoIcon className="h-3 w-3" />
                            </span>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Total expenses (debt service + operating costs) divided by gross rental income. Below 1.0 means positive cash flow.</p>
                          </TooltipContent>
                        </Tooltip>
                        <div className="font-semibold">{results.breakEvenRatio.toFixed(2)}</div>
                      </div>
                      <div>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="text-gray-500 cursor-help flex items-center gap-1">
                              Annual Cash Flow
                              <InfoIcon className="h-3 w-3" />
                            </span>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Net Operating Income minus Annual Debt Service. This is your annual profit after all expenses.</p>
                          </TooltipContent>
                        </Tooltip>
                        <div className="font-semibold">${results.cashFlow.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                      </div>
                    </div>
                  </div>
                </TooltipProvider>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <CalculatorIcon className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                  <p className="text-sm">Calculate DSCR to see results</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Cash to Close Card */}
          <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-gray-50">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <DollarSignIcon className="h-4 w-4 text-green-600" />
                <h3 className="text-sm font-semibold text-gray-800">Cash to Close</h3>
              </div>
            </CardHeader>
            <CardContent>
              {results && selectedLoan ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-1 gap-2 text-xs">
                    <div className="flex justify-between">
                      <span>Down Payment:</span>
                      <span className="font-semibold">${(formData.estimatedHomeValue - formData.loanAmount).toLocaleString()}</span>
                    </div>
                    
                    {/* Detailed Fee Breakdown */}
                    <div className="border-t pt-2">
                      <div className="text-xs font-medium text-gray-700 mb-2">Loan Fees Breakdown:</div>
                      <div className="space-y-1 pl-2">
                        <div className="flex justify-between">
                          <span className="text-gray-600">• Origination Fee ({formData.brokerPoints}%):</span>
                          <span>${selectedLoan.feeBreakdown?.originationFee?.toLocaleString() || '0'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">• Underwriting Fee:</span>
                          <span>${selectedLoan.feeBreakdown?.underwritingFee?.toLocaleString() || '0'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">• Admin Fee:</span>
                          <span>${selectedLoan.feeBreakdown?.adminFee?.toLocaleString() || '0'}</span>
                        </div>
                        {selectedLoan.feeBreakdown?.smallLoanFee && selectedLoan.feeBreakdown.smallLoanFee > 0 && (
                          <div className="flex justify-between">
                            <span className="text-gray-600">• Small Loan Fee:</span>
                            <span>${selectedLoan.feeBreakdown.smallLoanFee.toLocaleString()}</span>
                          </div>
                        )}
                      </div>
                      <div className="border-t mt-2 pt-2 flex justify-between font-semibold">
                        <span>Total Fees:</span>
                        <span>${selectedLoan.totalFees.toLocaleString()}</span>
                      </div>
                    </div>
                    
                    {/* Broker Compensation Section */}
                    <div className="border-t pt-2">
                      <div className="text-xs font-medium text-gray-700 mb-2">Broker Compensation (Included in Loan Fees):</div>
                      <div className="space-y-1 pl-2">
                        <div className="flex justify-between">
                          <span className="text-gray-600">• Broker Points ({formData.brokerPoints}%):</span>
                          <span>${(formData.brokerPoints * formData.loanAmount / 100).toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">• Admin Fee:</span>
                          <span>${formData.brokerAdminFee.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">• YSP ({formData.brokerYsp}%):</span>
                          <span>${(formData.brokerYsp * formData.loanAmount / 100).toLocaleString()}</span>
                        </div>
                      </div>
                      <div className="border-t mt-2 pt-2 flex justify-between font-semibold">
                        <span>Total Broker Compensation:</span>
                        <span>${((formData.brokerPoints + formData.brokerYsp) * formData.loanAmount / 100 + formData.brokerAdminFee).toLocaleString()}</span>
                      </div>
                    </div>
                    
                    <div className="flex justify-between">
                      <span>Estimated Third-Party Fees:</span>
                      <span className="font-semibold">${(formData.loanAmount * 0.015).toLocaleString()}</span>
                    </div>
                    <div className="border-t pt-2 flex justify-between font-bold">
                      <span>Total Cash to Close:</span>
                      <span>${((formData.estimatedHomeValue - formData.loanAmount) + selectedLoan.totalFees + (formData.loanAmount * 0.015)).toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-4 text-gray-500">
                  <p className="text-sm">Select a loan option to see cash to close</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
} 