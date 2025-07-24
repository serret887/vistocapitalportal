import { LoanPricingRequest, PricingResponse } from '@/lib/types/pricing';

export interface LoanOption {
  lenderId: string;
  lenderName: string;
  product: string;
  baseRate: number;
  finalRate: number;
  points: number;
  monthlyPayment: number;
  totalFees: number;
  termYears: number;
  breakdown: {
    baseRate: number;
    ficoAdjustment: number;
    ltvAdjustment: number;
    productAdjustment: number;
    dscrAdjustment: number;
    originationFeeAdjustment: number;
    loanSizeAdjustment: number;
    programAdjustment: number;
    interestOnlyAdjustment: number;
    yspAdjustment: number;
  };
  feeBreakdown: {
    originationFee: number;
    underwritingFee: number;
    yspFee: number;
    prepayFee: number;
    loanSizeAdjustmentFee: number;
    smallLoanFee?: number;
    adminFee: number;
  };
}

export interface FormData {
  transactionType: string;
  ficoScore: string;
  estimatedHomeValue: number;
  loanAmount: number;
  downPayment: number;
  prepaymentPenalty: string;
  propertyState: string;
  propertyType: string;
  monthlyRentalIncome: number;
  annualPropertyInsurance: number;
  annualPropertyTaxes: number;
  monthlyHoaFee: number;
  remainingMortgage?: number;
  acquisitionDate?: string;
  brokerPoints: number;
  brokerYsp: number;
  discountPoints: number;
  brokerAdminFee: number;
}

export function convertFormDataToPricingRequest(formData: FormData): LoanPricingRequest {
  // Parse FICO score range to get the minimum value
  const ficoRange = formData.ficoScore;
  let fico: number;
  
  if (ficoRange === '780+') {
    fico = 780;
  } else {
    const [min] = ficoRange.split('-').map(Number);
    fico = min;
  }

  // Calculate LTV
  const ltv = ((formData.loanAmount / formData.estimatedHomeValue) * 100);
  
  // Determine loan purpose
  const loanPurpose: 'purchase' | 'refinance' | 'cash_out' = formData.transactionType === 'purchase' ? 'purchase' : 
                     formData.transactionType === 'refinance' ? 'refinance' : 'cash_out';
  
  // Map property type
  const propertyTypeMap: Record<string, string> = {
    'Single Family': '1-4 Unit SFR',
    'Condo': 'Condos',
    'Townhouse': 'Townhomes'
    // 'Multi Family' is intentionally not mapped - not eligible for this loan program
  };
  const propertyType = propertyTypeMap[formData.propertyType] || formData.propertyType;

  const request = {
    loanProgram: 'DSCR',
    input: {
      fico,
      ltv,
      loanAmount: formData.loanAmount,
      loanPurpose,
      propertyType,
      propertyState: formData.propertyState,
      occupancyType: 'investment',
      product: '', // Will be handled by API for all products
      interestOnly: false, // Default, will be overridden for multiple options
      prepayStructure: formData.prepaymentPenalty,
      dscr: 1.25, // Default DSCR, will be calculated from form data
      brokerComp: formData.brokerPoints,
      ysp: formData.brokerYsp || 1.0, // Use form data or default to 1.0
      discountPoints: formData.discountPoints || 0, // Use form data or default to 0
      brokerAdminFee: formData.brokerAdminFee, // Add admin fee to the request
      estimatedHomeValue: formData.estimatedHomeValue,
      monthlyRentalIncome: formData.monthlyRentalIncome,
      annualPropertyInsurance: formData.annualPropertyInsurance,
      annualPropertyTaxes: formData.annualPropertyTaxes,
      monthlyHoaFee: formData.monthlyHoaFee,
      remainingMortgage: formData.remainingMortgage,
      acquisitionDate: formData.acquisitionDate,
    }
  };

  // Debug logging
  console.log('Form data conversion:', {
    originalFormData: formData,
    convertedRequest: request,
    keyValues: {
      ficoRange,
      fico,
      ltv,
      loanPurpose,
      propertyType,
      propertyState: formData.propertyState,
      estimatedHomeValue: formData.estimatedHomeValue,
      loanAmount: formData.loanAmount
    }
  });

  return request;
}

export async function getLoanPricing(request: LoanPricingRequest): Promise<PricingResponse> {
  try {
    const response = await fetch('/api/loan-pricing', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching loan pricing:', error);
    throw error;
  }
}

export function generateLoanOptions(pricingResponse: PricingResponse): LoanOption[] {
  if (!pricingResponse.success || !pricingResponse.data) {
    return [];
  }

  return pricingResponse.data.map(option => ({
    lenderId: option.lenderId,
    lenderName: option.lenderName,
    product: option.product,
    baseRate: option.baseRate,
    finalRate: option.finalRate,
    points: option.points,
    monthlyPayment: option.monthlyPayment,
    totalFees: option.totalFees,
    termYears: option.termYears,
    breakdown: option.breakdown,
    feeBreakdown: option.feeBreakdown,
  }));
} 