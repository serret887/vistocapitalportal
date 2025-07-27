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
    prepayAdjustment: number;
    unitsAdjustment: number;
    rateAdjustment: number;
  };
  feeBreakdown: {
    originationFee: number;
    underwritingFee: number;
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
  isShortTermRental: boolean;
  units: number;
}

// Calculate DSCR from form data - this will be done iteratively in the pricing calculation
// For the initial request, we'll use a conservative estimate
function calculateInitialDSCREstimate(formData: FormData): number {
  const monthlyRentalIncome = formData.monthlyRentalIncome;
  const annualRentalIncome = monthlyRentalIncome * 12;
  
  // Calculate annual operating expenses (taxes, insurance, HOA)
  const annualOperatingExpenses = 
    formData.annualPropertyInsurance + 
    formData.annualPropertyTaxes + 
    (formData.monthlyHoaFee * 12);
  
  // Net Operating Income
  const noi = annualRentalIncome - annualOperatingExpenses;
  
  // Use a conservative base rate estimate for initial DSCR calculation
  // This will be refined iteratively in the pricing calculation
  const conservativeRate = 0.075; // 7.5% - slightly higher than typical base rates
  const monthlyRate = conservativeRate / 12;
  const termYears = 30;
  const numPayments = termYears * 12;
  
  const monthlyPayment = formData.loanAmount * 
    (monthlyRate * Math.pow(1 + monthlyRate, numPayments)) / 
    (Math.pow(1 + monthlyRate, numPayments) - 1);
  
  const annualDebtService = monthlyPayment * 12;
  
  // Calculate initial DSCR estimate
  const dscr = noi / annualDebtService;
  
  console.log('Initial DSCR Estimate:', {
    monthlyRentalIncome,
    annualRentalIncome,
    annualOperatingExpenses: {
      insurance: formData.annualPropertyInsurance,
      taxes: formData.annualPropertyTaxes,
      hoa: formData.monthlyHoaFee * 12,
      total: annualOperatingExpenses
    },
    noi,
    conservativeRate,
    estimatedMonthlyPayment: monthlyPayment,
    annualDebtService,
    initialDSCREstimate: dscr
  });
  
  return dscr;
}

export function convertFormDataToPricingRequest(formData: FormData): LoanPricingRequest {
  console.log('[convertFormDataToPricingRequest] Received formData:', JSON.stringify(formData, null, 2));
  
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
  console.log(`[convertFormDataToPricingRequest] formData.transactionType: "${formData.transactionType}"`);
  const transactionTypeLower = formData.transactionType.toLowerCase().trim();
  console.log(`[convertFormDataToPricingRequest] transactionTypeLower: "${transactionTypeLower}"`);
  
  let loanPurpose: 'purchase' | 'refinance' | 'cash_out';
  if (transactionTypeLower === 'purchase') {
    loanPurpose = 'purchase';
  } else if (transactionTypeLower === 'refinance') {
    loanPurpose = 'refinance';
  } else if (transactionTypeLower === 'cash_out') {
    loanPurpose = 'cash_out';
  } else {
    console.warn(`[convertFormDataToPricingRequest] Unknown transaction type: "${formData.transactionType}", defaulting to purchase`);
    loanPurpose = 'purchase'; // Default to purchase instead of cash_out
  }
  console.log(`[convertFormDataToPricingRequest] Determined loanPurpose: ${loanPurpose}`);
  
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
      product: 'DSCR', // Explicitly set the product to DSCR
      interestOnly: false, // Default, will be overridden for multiple options
      prepayStructure: formData.prepaymentPenalty,
      dscr: calculateInitialDSCREstimate(formData), // Initial DSCR estimate, will be refined iteratively
      brokerComp: formData.brokerPoints,
      ysp: formData.brokerYsp || 1.0, // Use form data or default to 1.0
      discountPoints: formData.discountPoints || 0, // Use form data or default to 0
      brokerAdminFee: formData.brokerAdminFee, // Add admin fee to the request
      estimatedHomeValue: formData.estimatedHomeValue,
      monthlyRentalIncome: formData.monthlyRentalIncome,
      annualPropertyInsurance: formData.annualPropertyInsurance,
      annualPropertyTaxes: formData.annualPropertyTaxes,
      monthlyHoaFee: formData.monthlyHoaFee,
      isShortTermRental: formData.isShortTermRental,
      units: formData.units || 1, // Add units field with default value
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

    const data = await response.json();
    
    // Always return the response data, even if it's an error response
    // This allows the frontend to handle validation errors properly
    return data;
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