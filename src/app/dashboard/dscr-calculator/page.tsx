"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { Button } from "@/components/ui/button";
import { generateLoanOptions, LoanOption, convertFormDataToPricingRequest, getLoanPricing } from "@/lib/loan-pricing";
import { PricingResponse, LoanValidationResult } from "../../../lib/types/pricing";
import { BorrowerInformation } from "@/components/dashboard/borrower-information";
import { PropertyInformation } from "@/components/dashboard/property-information";
import { BrokerCompensation } from "@/components/dashboard/broker-compensation";
import { LoanOptions } from "@/components/dashboard/loan-options";
import { DSCRResults } from "@/components/dashboard/dscr-results";
import { CashToClose } from "@/components/dashboard/cash-to-close";
import { useRouter, useSearchParams } from "next/navigation";
import { FileText, ArrowLeft } from "lucide-react";
import { api } from '@/lib/api-client'
import { toast } from 'sonner'
import type { PricingResult } from '@/lib/types/pricing'

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

function DSCRCalculatorContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const applicationId = searchParams.get('applicationId');
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

  const [loanOptions, setLoanOptions] = useState<PricingResult[]>([]);
  const [selectedLoan, setSelectedLoan] = useState<PricingResult | null>(null);
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

  const handleLoanSelect = (loan: PricingResult) => {
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

  const handleCreateApplication = async () => {
    // Store DSCR calculator data in localStorage to pre-populate the application form
    const dscrData = {
      // Loan Information
      loan_name: `${formData.transactionType === 'purchase' ? 'Purchase' : 'Refinance'} - ${formData.propertyType}`,
      loan_type: 'dscr',
      loan_objective: formData.transactionType === 'purchase' ? 'purchase' : 'refi',
      
      // Property Information
      property_type: formData.propertyType,
      property_address: '', // Will be filled in application form
      property_state: formData.propertyState,
      property_zip_code: '', // Will be filled in application form
      property_city: '', // Will be filled in application form
      property_occupancy: 'Investment', // Default for DSCR loans
      
      // Financial Information
      estimated_home_value: formData.estimatedHomeValue,
      purchase_price: formData.estimatedHomeValue,
      loan_amount: formData.loanAmount,
      down_payment_percentage: formData.downPayment,
      monthly_rental_income: formData.monthlyRentalIncome,
      annual_property_insurance: formData.annualPropertyInsurance,
      annual_property_taxes: formData.annualPropertyTaxes,
      monthly_hoa_fee: formData.monthlyHoaFee,
      is_short_term_rental: formData.isShortTermRental,
      
      // DSCR Results
      noi: dscrResults?.noi || 0,
      dscr_ratio: dscrResults?.dscr || 0,
      cash_flow: dscrResults?.cashFlow || 0,
      
      // Loan Terms
      interest_rate: selectedLoan?.finalRate || 0,
      loan_term_years: selectedLoan?.termYears || 30,
      monthly_mortgage_payment: selectedLoan?.monthlyPayment || 0,
      
      // Additional Fields
      prepayment_penalty: formData.prepaymentPenalty,
      discount_points: formData.discountPoints,
      fico_score_range: formData.ficoScore,
      broker_points: formData.brokerPoints,
      broker_admin_fee: formData.brokerAdminFee,
      broker_ysp: formData.brokerYsp,
      lender_name: selectedLoan?.lenderName || '',
      loan_product: selectedLoan?.product || '',
      selected_loan_product: selectedLoan,
      
      // Default values for required fields
      closing_costs: 0,
      seller_concessions: 0,
      repairs_improvements: 0,
      reserves: 0,
      down_payment_amount: 0,
      flood_insurance: 0,
      hazard_insurance: formData.annualPropertyInsurance,
      title_insurance: 0,
      survey_fees: 0,
      recording_fees: 0,
      transfer_taxes: 0,
      other_costs: 0,
      escrow_accounts: false,
      
      // Store full data in loan_data JSONB field
      loan_data: {
        formData,
        dscrResults,
        selectedLoan,
        timestamp: new Date().toISOString()
      },
      
      notes: `Created from DSCR calculator data`
    };
    
    // Store the data
    localStorage.setItem('dscrCalculatorData', JSON.stringify(dscrData));
    
    // If we have an applicationId, we're adding a loan to an existing application
    if (applicationId) {
      // Call the API to create the loan using the API client
      try {
        const response = await api.createLoan(applicationId, dscrData);
        
        if (response.error) {
          console.error('Failed to create loan:', response.error);
          toast.error('Failed to create loan');
        } else {
          console.log('Loan created successfully:', response.data);
          toast.success('Loan created successfully!');
        }
      } catch (err) {
        console.error('Failed to create loan:', err);
        toast.error('Failed to create loan');
      }
      // Store the applicationId so we can tie the loan back to it
      localStorage.setItem('targetApplicationId', applicationId);
      // Navigate back to the application with a flag to add the loan
      router.push(`/dashboard/applications/${applicationId}?addLoan=true`);
    } else {
      // Navigate to dashboard with a query parameter to trigger the application form
      router.push('/dashboard?showApplicationForm=true');
    }
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
        {/* Header for adding loan to application */}
        {applicationId && (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FileText className="h-5 w-5 text-blue-600" />
                <div>
                  <h2 className="text-lg font-semibold text-blue-800">
                    Adding New Loan to Application
                  </h2>
                  <p className="text-sm text-blue-700">
                    Use the DSCR calculator below to create a new loan for this application.
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                onClick={() => router.push(`/dashboard/applications/${applicationId}`)}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Application
              </Button>
            </div>
          </div>
        )}
        
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

            {/* Create Application/Add Loan Button - Only show when a loan is selected */}
            {selectedLoan && (
              <Button 
                onClick={handleCreateApplication}
                className="w-full bg-visto-gold hover:bg-visto-dark-gold text-white font-semibold py-3 flex items-center justify-center gap-2 transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                <FileText className="h-4 w-4" />
                {applicationId ? 'Add Loan to Application' : 'Create Application'}
              </Button>
            )}
                </div>
        </div>
      </div>
    </div>
  );
}

export default function DSCRCalculator() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <DSCRCalculatorContent />
    </Suspense>
  );
} 