export interface LoanPricingRequest {
  loanProgram: string;
  input: {
    fico: number;
    ltv: number;
    loanAmount: number;
    loanPurpose: 'purchase' | 'refinance' | 'cash_out';
    propertyType: string;
    occupancyType: string;
    product: string;
    interestOnly: boolean;
    prepayStructure: string;
    dscr: number;
    brokerComp: number;
    ysp: number;
  };
}

export interface LoanPricingResponse {
  success: boolean;
  data?: LoanOption[];
  error?: string;
}

export interface LoanOption {
  lenderId: string;
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
    brokerCompAdjustment: number;
    yspAdjustment: number;
  };
}

export async function getLoanPricing(request: LoanPricingRequest): Promise<LoanPricingResponse> {
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

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching loan pricing:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}

// Helper function to convert calculator form data to API request
export function convertFormDataToPricingRequest(formData: any): LoanPricingRequest {
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
  const ltv = formData.transactionType === "Purchase" 
    ? ((formData.loanAmount / formData.estimatedHomeValue) * 100)
    : ((formData.loanAmount / formData.estimatedHomeValue) * 100);

  // Convert transaction type to API format
  const loanPurpose = formData.transactionType === "Purchase" ? "purchase" : 
                     formData.transactionType === "Refinance" ? "refinance" : "cash_out";

  // Convert property type to API format
  const propertyType = formData.propertyType === "Single Family" ? "single_family" :
                      formData.propertyType === "Multi Family" ? "2-4_units" :
                      formData.propertyType === "Condo" ? "condo" : "townhouse";

  return {
    loanProgram: 'DSCR',
    input: {
      fico,
      ltv,
      loanAmount: formData.loanAmount,
      loanPurpose,
      propertyType,
      occupancyType: 'investment',
      product: '', // Will be handled by API for all products
      interestOnly: false, // Default, will be overridden for multiple options
      prepayStructure: formData.prepaymentPenalty,
      dscr: 1.25, // Default DSCR, will be calculated from form data
      brokerComp: formData.brokerPoints,
      ysp: 1.0, // Default YSP
    }
  };
}

// Generate loan options with different products (one per product type)
export async function generateLoanOptions(formData: any): Promise<LoanOption[]> {
  try {
    // Validate required form data
    if (!formData.loanAmount || !formData.estimatedHomeValue || !formData.ficoScore) {
      console.error('Missing required form data for loan calculation');
      return [];
    }

    // Calculate DSCR first
    const monthlyRentalIncome = formData.monthlyRentalIncome || 0;
    const annualPropertyInsurance = formData.annualPropertyInsurance || 0;
    const annualPropertyTaxes = formData.annualPropertyTaxes || 0;
    const monthlyHoaFee = formData.monthlyHoaFee || 0;
    
    // Calculate NOI
    const annualRentalIncome = monthlyRentalIncome * 12;
    const annualExpenses = annualPropertyInsurance + annualPropertyTaxes + (monthlyHoaFee * 12);
    const noi = annualRentalIncome - annualExpenses;
    
    // Calculate monthly debt service (will be updated with actual rates)
    const estimatedRate = 7.0; // Default estimate
    const monthlyRate = estimatedRate / 100 / 12;
    const totalPayments = 30 * 12;
    const estimatedMonthlyPayment = (formData.loanAmount * monthlyRate * Math.pow(1 + monthlyRate, totalPayments)) / 
                                   (Math.pow(1 + monthlyRate, totalPayments) - 1);
    const annualDebtService = estimatedMonthlyPayment * 12;
    
    // Calculate DSCR
    const dscr = noi / annualDebtService;

    // Validate DSCR
    if (isNaN(dscr) || dscr <= 0) {
      console.error('Invalid DSCR calculated:', dscr);
      return [];
    }

    // Create base request
    const baseRequest = convertFormDataToPricingRequest(formData);
    baseRequest.input.dscr = dscr;

    // Generate request for all products at once (API will return one per product)
    const request = {
      ...baseRequest,
      input: {
        ...baseRequest.input,
        interestOnly: false
      }
    };

    const response = await getLoanPricing(request);
    if (response.success && response.data && response.data.length > 0) {
      // Filter out any options with null or invalid values
      const validOptions = response.data.filter(option => 
        option && 
        typeof option.finalRate === 'number' && 
        !isNaN(option.finalRate) &&
        typeof option.monthlyPayment === 'number' && 
        !isNaN(option.monthlyPayment)
      );
      
      return validOptions.sort((a, b) => a.finalRate - b.finalRate);
    }

    return [];
  } catch (error) {
    console.error('Error generating loan options:', error);
    return [];
  }
} 