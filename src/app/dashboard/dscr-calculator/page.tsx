"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { generateLoanOptions, LoanOption, convertFormDataToPricingRequest, getLoanPricing } from "@/lib/loan-pricing";
import { PricingResponse, LoanValidationResult } from "../../../lib/types/pricing";
import { BorrowerInformation } from "@/components/dashboard/borrower-information";
import { PropertyInformation } from "@/components/dashboard/property-information";
import { BrokerCompensation } from "@/components/dashboard/broker-compensation";
import { LoanOptions } from "@/components/dashboard/loan-options";
import { DSCRResults } from "@/components/dashboard/dscr-results";
import { CashToClose } from "@/components/dashboard/cash-to-close";

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

export default function DSCRCalculator() {
  const [formData, setFormData] = useState({
    transactionType: "purchase",
    ficoScore: "740-759",
    estimatedHomeValue: 200000,
    loanAmount: 160000,
    downPayment: 20,
    prepaymentPenalty: "5/5/5/5/5",
    propertyState: "FL",
    propertyType: "Single Family",
    monthlyRentalIncome: 2500,
    annualPropertyInsurance: 1200,
    annualPropertyTaxes: 2400,
    monthlyHoaFee: 0,
    isShortTermRental: false,
    brokerPoints: 1,
    brokerAdminFee: 995,
    discountPoints: 0,
    brokerYsp: 1,
    remainingMortgage: 0,
    acquisitionDate: "",
    units: 1
  });

  const [loanOptions, setLoanOptions] = useState<LoanOption[]>([]);
  const [selectedLoan, setSelectedLoan] = useState<LoanOption | null>(null);
  const [dscrResults, setDscrResults] = useState<DSCRResults | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [needsRecalculation, setNeedsRecalculation] = useState(false);
  const [validationErrors, setValidationErrors] = useState<any[]>([]);
  const [matrixRequirements, setMatrixRequirements] = useState<any>(null);

  const handleNumberInput = (value: string, setter: (value: number) => void) => {
    const cleanValue = value.replace(/[^0-9.-]/g, '');
    
    // Handle empty field - allow clearing to set value to 0
    if (cleanValue === '') {
      setter(0);
      setNeedsRecalculation(true);
      setValidationErrors([]);
      setMatrixRequirements(null);
      return;
    }
    
    const numValue = parseFloat(cleanValue);
    if (!isNaN(numValue)) {
      setter(numValue);
      setNeedsRecalculation(true);
      setValidationErrors([]);
      setMatrixRequirements(null);
    }
  };

  const formatDisplayValue = (value: number): string => {
    if (value === 0) return '0';
    return value.toLocaleString();
  };

  const handlePropertyValueChange = (value: number) => {
    if (formData.transactionType === "purchase") {
      const downPaymentAmount = (value * formData.downPayment) / 100;
      const newLoanAmount = value - downPaymentAmount;
      setFormData(prev => ({
        ...prev, 
        estimatedHomeValue: value,
        loanAmount: Math.round(newLoanAmount)
      }));
    } else {
      setFormData(prev => ({...prev, estimatedHomeValue: value}));
    }
    setNeedsRecalculation(true);
    setValidationErrors([]);
    setMatrixRequirements(null);
  };

  const handleDownPaymentChange = (value: number) => {
    const downPaymentAmount = (formData.estimatedHomeValue * value) / 100;
    const newLoanAmount = formData.estimatedHomeValue - downPaymentAmount;
    setFormData(prev => ({
      ...prev, 
      downPayment: value,
      loanAmount: Math.round(newLoanAmount)
    }));
    setNeedsRecalculation(true);
    setValidationErrors([]);
    setMatrixRequirements(null);
  };

  const calculateDSCR = useCallback(() => {
    if (!selectedLoan) return;

    const monthlyRentalIncome = formData.monthlyRentalIncome;
    const annualRentalIncome = monthlyRentalIncome * 12;
    const annualOperatingExpenses = formData.annualPropertyInsurance + formData.annualPropertyTaxes + (formData.monthlyHoaFee * 12);
    const noi = annualRentalIncome - annualOperatingExpenses;
    const annualDebtService = selectedLoan.monthlyPayment * 12;
    const dscr = noi / annualDebtService;
    const capRate = (noi / formData.estimatedHomeValue) * 100;
    const actualDownPayment = formData.estimatedHomeValue - formData.loanAmount;
    const totalCashInvested = actualDownPayment + selectedLoan.totalFees;
    const annualCashFlow = noi - annualDebtService;
    const cashOnCashReturn = (annualCashFlow / totalCashInvested) * 100;
    const breakEvenRatio = (annualOperatingExpenses + annualDebtService) / annualRentalIncome;

    setDscrResults({
      noi,
      debtService: annualDebtService,
      dscr,
      capRate,
      cashOnCashReturn,
      breakEvenRatio,
      cashFlow: annualCashFlow
    });
  }, [selectedLoan, formData.monthlyRentalIncome, formData.annualPropertyInsurance, formData.annualPropertyTaxes, formData.monthlyHoaFee, formData.estimatedHomeValue, formData.loanAmount]);

  const handleCalculate = async () => {
    setIsLoading(true);
    setValidationErrors([]);
    setMatrixRequirements(null);

    try {
      const request = convertFormDataToPricingRequest(formData);
      const response = await getLoanPricing(request);

      if (response.validation && !response.validation.isValid) {
        setValidationErrors([response.validation]);
        setMatrixRequirements(null);
        setLoanOptions([]);
      setSelectedLoan(null);
        setDscrResults(null);
        return;
      }

      if (response.data && response.data.length > 0) {
        setLoanOptions(response.data);
        setSelectedLoan(response.data[0]);
        setNeedsRecalculation(false);
        setValidationErrors([]);
        setMatrixRequirements(null);
      } else {
        setLoanOptions([]);
        setSelectedLoan(null);
        setDscrResults(null);
      }
    } catch (error) {
      console.error('Error calculating:', error);
      
      if (error && typeof error === 'object' && 'validation' in error) {
        setValidationErrors([(error as any).validation]);
      } else {
        setValidationErrors([{
          isValid: false,
          errors: ['Unable to calculate loan options. Please check your input and try again.'],
          warnings: []
        }]);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoanSelect = (loan: LoanOption) => {
      setSelectedLoan(loan);
    setNeedsRecalculation(false);
  };

  const resetToDefaults = () => {
    setFormData({
      transactionType: "purchase",
      ficoScore: "740-759",
      estimatedHomeValue: 200000,
      loanAmount: 160000,
      downPayment: 20,
      prepaymentPenalty: "5/5/5/5/5",
      propertyState: "FL",
      propertyType: "Single Family",
      monthlyRentalIncome: 2500,
      annualPropertyInsurance: 1200,
      annualPropertyTaxes: 2400,
      monthlyHoaFee: 0,
      isShortTermRental: false,
      brokerPoints: 1,
      brokerAdminFee: 995,
      discountPoints: 0,
      brokerYsp: 1,
      remainingMortgage: 0,
      acquisitionDate: "",
      units: 1
    });
    setLoanOptions([]);
    setSelectedLoan(null);
    setDscrResults(null);
    setNeedsRecalculation(false);
    setValidationErrors([]);
    setMatrixRequirements(null);
  };

  const formatProductName = (product: string): string => {
    if (product.includes('Interest Only')) {
      return product.replace('Interest Only', ' - Interest Only');
    }
    return product;
  };

  useEffect(() => {
    if (selectedLoan) {
      calculateDSCR();
    }
  }, [selectedLoan, calculateDSCR]);

  useEffect(() => {
    console.log('[DSCRCalculator] formData changed:', JSON.stringify(formData, null, 2));
  }, [formData]);

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Three Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Column 1: Input Section */}
          <div className="space-y-4">
            <BorrowerInformation
              formData={formData}
              onFormDataChange={(updates) => {
                setFormData(prev => ({ ...prev, ...updates }));
                setNeedsRecalculation(true);
                setValidationErrors([]);
                setMatrixRequirements(null);
              }}
              onNumberInput={handleNumberInput}
              formatDisplayValue={formatDisplayValue}
              handlePropertyValueChange={handlePropertyValueChange}
              handleDownPaymentChange={handleDownPaymentChange}
              setNeedsRecalculation={setNeedsRecalculation}
              setValidationErrors={setValidationErrors}
              setMatrixRequirements={setMatrixRequirements}
            />

            <PropertyInformation
              formData={formData}
              onFormDataChange={(updates) => {
                setFormData(prev => ({ ...prev, ...updates }));
                setNeedsRecalculation(true);
                setValidationErrors([]);
                setMatrixRequirements(null);
              }}
              onNumberInput={handleNumberInput}
              formatDisplayValue={formatDisplayValue}
              setNeedsRecalculation={setNeedsRecalculation}
              setValidationErrors={setValidationErrors}
              setMatrixRequirements={setMatrixRequirements}
              STATE_MAPPING={STATE_MAPPING}
            />

            <BrokerCompensation
              formData={formData}
              onFormDataChange={(updates) => {
                setFormData(prev => ({ ...prev, ...updates }));
                setNeedsRecalculation(true);
                setValidationErrors([]);
                setMatrixRequirements(null);
              }}
              onNumberInput={handleNumberInput}
              formatDisplayValue={formatDisplayValue}
              setNeedsRecalculation={setNeedsRecalculation}
              setValidationErrors={setValidationErrors}
              setMatrixRequirements={setMatrixRequirements}
            />

              <Button 
                onClick={handleCalculate}
                disabled={isLoading}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3"
              >
                {isLoading ? "Calculating..." : "Calculate DSCR"}
              </Button>
        </div>

          {/* Column 2: Loan Options */}
                        <div>
            <LoanOptions
              loanOptions={loanOptions}
              selectedLoan={selectedLoan}
              validationErrors={validationErrors}
              matrixRequirements={matrixRequirements}
              needsRecalculation={needsRecalculation}
              formData={formData}
              onLoanSelect={handleLoanSelect}
              formatProductName={formatProductName}
            />
                      </div>
                      
          {/* Column 3: DSCR Results & Cash to Close */}
          <div className="space-y-4">
            <DSCRResults
              dscrResults={dscrResults}
              selectedLoan={selectedLoan}
              formatProductName={formatProductName}
            />

            <CashToClose
              formData={formData}
              selectedLoan={selectedLoan}
            />
                </div>
        </div>
      </div>
    </div>
  );
} 