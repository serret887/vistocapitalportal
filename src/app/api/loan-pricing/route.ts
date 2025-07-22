import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface PricingRequest {
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

interface VisioPricingMatrix {
  lender: string;
  date: string;
  loan_terms: {
    term: string;
    amortization: string;
    max_ltv: number;
    underwriting_fee: number;
  };
  rate_structure: {
    products: {
      [key: string]: number;
    };
    origination_fee_adjustments: {
      [key: string]: number;
    };
    loan_size_adjustments: {
      [key: string]: number;
    };
    prepay_penalty_structures: {
      [key: string]: number;
    };
    program_adjustments: {
      cash_out_refinance: number;
      short_term_rental: number;
      condo: number;
      "2_4_units": number;
      dscr_adjustments: {
        dscr_gt_1_20: number;
        dscr_lt_1_00_to_0_75_ltv_le_65: number;
      };
    };
    minimum_rate: number;
  };
  base_rates: {
    tiers: {
      [key: string]: {
        [key: string]: number;
      };
    };
  };
  broker_payout_add_ons: {
    [key: string]: number;
  };
}

interface PricingResult {
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

interface PricingResponse {
  success: boolean;
  data?: PricingResult[];
  error?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: PricingRequest = await request.json();
    const { loanProgram, input } = body;

    if (!loanProgram || !input) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Get Visio pricing matrix
    const { data: pricingData, error: pricingError } = await supabase
      .from('pricing_matrices')
      .select('lender_id, matrix')
      .eq('lender_id', 'visio')
      .eq('loan_program', loanProgram)
      .single();

    if (pricingError || !pricingData) {
      return NextResponse.json(
        { success: false, error: 'Pricing matrix not found' },
        { status: 404 }
      );
    }

    const matrix: VisioPricingMatrix = pricingData.matrix;
    
    // Dynamically extract product types from the pricing matrix
    const products = Object.keys(matrix.rate_structure.products).filter(product => 
      // Filter out special adjustments that aren't actual loan products
      product !== 'Interest_Only' && 
      product !== 'Prepayment_Penalty' &&
      product !== 'Cash_Out' &&
      product !== 'Condo' &&
      product !== '2_4_Units'
    );
    
    if (products.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No valid products found in pricing matrix' },
        { status: 400 }
      );
    }
    
    const results: PricingResult[] = [];
    
    for (const product of products) {
      const result = calculateVisioPricing(matrix, input, product, pricingData.lender_id);
      if (result) {
        results.push(result);
      }
    }

    // If no valid results, return error
    if (results.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No valid loan options found for the given parameters' },
        { status: 400 }
      );
    }

    // Sort results by final rate (lowest first)
    results.sort((a, b) => a.finalRate - b.finalRate);

    return NextResponse.json({
      success: true,
      data: results
    });

  } catch (error) {
    console.error('Loan pricing error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

function calculateVisioPricing(matrix: VisioPricingMatrix, input: any, product: string, lenderId: string): PricingResult | null {
  try {
    // Validate input parameters
    if (!input.fico || !input.ltv || !input.loanAmount || !input.dscr) {
      console.error('Missing required input parameters');
      return null;
    }

    // Find FICO tier
    const ficoTier = findFicoTier(matrix.base_rates.tiers, input.fico);
    if (!ficoTier) {
      console.error(`No FICO tier found for score: ${input.fico}`);
      return null;
    }

    // Find LTV range
    const ltvRange = findLTVRange(matrix.base_rates.tiers[ficoTier], input.ltv);
    if (!ltvRange) {
      console.error(`No LTV range found for LTV: ${input.ltv}`);
      return null;
    }

    // Get base rate
    const baseRate = matrix.base_rates.tiers[ficoTier][ltvRange];
    if (typeof baseRate !== 'number') {
      console.error(`Invalid base rate for FICO: ${ficoTier}, LTV: ${ltvRange}`);
      return null;
    }
    
    // Apply product adjustment
    const productAdjustment = matrix.rate_structure.products[product] || 0;
    
    // Apply interest-only adjustment if applicable
    const interestOnlyAdjustment = input.interestOnly ? matrix.rate_structure.products['Interest_Only'] : 0;
    
    // Apply DSCR adjustments
    let dscrAdjustment = 0;
    if (input.dscr > 1.20) {
      dscrAdjustment = matrix.rate_structure.program_adjustments.dscr_adjustments.dscr_gt_1_20;
    } else if (input.dscr < 1.00 && input.ltv <= 65) {
      dscrAdjustment = matrix.rate_structure.program_adjustments.dscr_adjustments.dscr_lt_1_00_to_0_75_ltv_le_65;
    }
    
    // Apply program adjustments
    let programAdjustment = 0;
    if (input.loanPurpose === 'cash_out') {
      programAdjustment += matrix.rate_structure.program_adjustments.cash_out_refinance;
    }
    if (input.propertyType === 'condo') {
      programAdjustment += matrix.rate_structure.program_adjustments.condo;
    }
    if (input.propertyType === '2-4_units' || input.propertyType === '2_4_units') {
      programAdjustment += matrix.rate_structure.program_adjustments["2_4_units"];
    }
    
    // Calculate final rate
    let finalRate = baseRate + productAdjustment + interestOnlyAdjustment + dscrAdjustment + programAdjustment;
    
    // Apply minimum rate constraint
    finalRate = Math.max(finalRate, matrix.rate_structure.minimum_rate);
    
    // Validate final rate
    if (typeof finalRate !== 'number' || isNaN(finalRate)) {
      console.error('Invalid final rate calculated');
      return null;
    }
    
    // Calculate points based on broker compensation
    const brokerCompKey = input.brokerComp.toString();
    const brokerCompAdjustment = matrix.broker_payout_add_ons[brokerCompKey] || 0;
    
    // Calculate origination fee adjustment
    const originationFeeAdjustment = calculateOriginationFeeAdjustment(matrix.rate_structure.origination_fee_adjustments, input.brokerComp);
    
    // Calculate loan size adjustment
    const loanSizeAdjustment = calculateLoanSizeAdjustment(matrix.rate_structure.loan_size_adjustments, input.loanAmount);
    
    // Calculate prepay penalty adjustment
    const prepayAdjustment = matrix.rate_structure.prepay_penalty_structures[input.prepayStructure] || 0;
    
    const totalPoints = brokerCompAdjustment + originationFeeAdjustment + loanSizeAdjustment + prepayAdjustment;
    
    // Calculate monthly payment
    const monthlyRate = finalRate / 100 / 12;
    
    // Extract term years from matrix (e.g., "30" from "30 Year Fixed")
    const termMatch = matrix.loan_terms.term.match(/(\d+)/);
    const termYears = termMatch ? parseInt(termMatch[1]) : 30; // Default to 30 if not found
    const totalPayments = termYears * 12;
    
    let monthlyPayment;
    
    if (input.interestOnly) {
      monthlyPayment = (input.loanAmount * monthlyRate);
    } else {
      monthlyPayment = (input.loanAmount * monthlyRate * Math.pow(1 + monthlyRate, totalPayments)) / 
                      (Math.pow(1 + monthlyRate, totalPayments) - 1);
    }

    // Validate monthly payment
    if (typeof monthlyPayment !== 'number' || isNaN(monthlyPayment)) {
      console.error('Invalid monthly payment calculated');
      return null;
    }

    // Calculate total fees
    const totalFees = (totalPoints / 100) * input.loanAmount + matrix.loan_terms.underwriting_fee;

    return {
      lenderId: lenderId, // Use actual lender ID from database
      product,
      baseRate,
      finalRate,
      points: totalPoints,
      monthlyPayment,
      totalFees,
      termYears,
      breakdown: {
        baseRate,
        ficoAdjustment: 0, // Already included in base rate
        ltvAdjustment: 0, // Already included in base rate
        productAdjustment,
        dscrAdjustment,
        brokerCompAdjustment,
        yspAdjustment: 0, // Not applicable in Visio structure
      }
    };
  } catch (error) {
    console.error(`Error calculating Visio pricing for product ${product}:`, error);
    return null;
  }
}

function findFicoTier(ficoRanges: any, fico: number): string | null {
  const ranges = Object.keys(ficoRanges);
  for (const range of ranges) {
    if (range === '760+') {
      if (fico >= 760) return range;
    } else {
      const [min, max] = range.split('-').map(Number);
      if (fico >= min && fico <= max) return range;
    }
  }
  return null;
}

function findLTVRange(ltvRanges: any, ltv: number): string | null {
  const ranges = Object.keys(ltvRanges);
  for (const range of ranges) {
    if (range === '<55') {
      if (ltv < 55) return range;
    } else {
      const [min, max] = range.split('-').map(Number);
      if (ltv >= min && ltv <= max) return range;
    }
  }
  return null;
}

function calculateOriginationFeeAdjustment(adjustments: any, brokerComp: number): number {
  const keys = Object.keys(adjustments).sort((a, b) => {
    const aVal = parseFloat(a.replace('%', ''));
    const bVal = parseFloat(b.replace('%', ''));
    return aVal - bVal;
  });
  
  for (const key of keys) {
    const threshold = parseFloat(key.replace('%', ''));
    if (brokerComp <= threshold) {
      return adjustments[key];
    }
  }
  return adjustments[keys[keys.length - 1]] || 0;
}

function calculateLoanSizeAdjustment(adjustments: any, loanAmount: number): number {
  const keys = Object.keys(adjustments);
  for (const key of keys) {
    if (key === '>=2000000') {
      if (loanAmount >= 2000000) return adjustments[key];
    } else if (key.includes('-')) {
      const [min, max] = key.split('-').map(Number);
      if (loanAmount >= min && loanAmount <= max) return adjustments[key];
    } else if (key.includes('<')) {
      const max = parseFloat(key.replace('<', ''));
      if (loanAmount < max) return adjustments[key];
    }
  }
  return 0;
} 