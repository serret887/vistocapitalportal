import { VisioPricingMatrix, PricingCalculationResult } from '@/lib/types/pricing';

// Pricing Calculation Functions
export function findFicoTier(ficoRanges: Record<string, Record<string, number>>, fico: number): string | null {
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

export function findLTVRange(ltvRanges: Record<string, number>, ltv: number): string | null {
  const ranges = Object.keys(ltvRanges);
  for (const range of ranges) {
    if (range.startsWith('>=')) {
      const min = Number(range.replace('>=', ''));
      if (ltv >= min) return range;
    } else if (range.includes('-')) {
      const [min, max] = range.split('-').map(Number);
      if (ltv >= min && ltv <= max) return range;
    } else if (range.startsWith('<')) {
      const max = Number(range.replace('<', ''));
      if (ltv < max) return range;
    }
  }
  return null;
}

export function calculateBaseRate(matrix: VisioPricingMatrix, fico: number, ltv: number): number {
  const ficoTier = findFicoTier(matrix.base_rates.tiers, fico);
  if (!ficoTier) {
    throw new Error(`FICO score ${fico} not in valid range`);
  }

  const ltvRanges = matrix.base_rates.tiers[ficoTier];
  const ltvRange = findLTVRange(ltvRanges, ltv);
  if (!ltvRange) {
    throw new Error(`LTV ${ltv}% not in valid range for FICO tier ${ficoTier}`);
  }

  return ltvRanges[ltvRange];
}

export function calculateProductAdjustment(matrix: VisioPricingMatrix, product: string): number {
  return matrix.rate_structure.products[product] || 0;
}

export function calculateInterestOnlyAdjustment(matrix: VisioPricingMatrix, isInterestOnly: boolean): number {
  if (!isInterestOnly) return 0;
  return matrix.rate_structure.products['Interest_Only'] || 0;
}

export function calculateDSCRAdjustment(matrix: VisioPricingMatrix, dscr: number, ltv: number): number {
  const dscrAdjustments = matrix.rate_structure.program_adjustments.dscr_adjustments;
  
  if (dscr > 1.20) {
    return dscrAdjustments.dscr_gt_1_20;
  } else if (dscr < 1.00 && ltv <= 65) {
    return dscrAdjustments.dscr_lt_1_00_to_0_75_ltv_le_65;
  } else if (dscr < 1.00) {
    // This would need special handling for case-by-case
    return 0;
  }
  
  return 0;
}

export function calculateProgramAdjustment(
  matrix: VisioPricingMatrix,
  loanPurpose: string,
  propertyType: string
): number {
  let adjustment = 0;
  
  if (loanPurpose === 'cash_out') {
    adjustment += matrix.rate_structure.program_adjustments.cash_out_refinance;
  }
  
  if (propertyType === 'condo') {
    adjustment += matrix.rate_structure.program_adjustments.condo;
  } else if (propertyType === '2-4_units') {
    adjustment += matrix.rate_structure.program_adjustments['2_4_units'];
  }
  
  return adjustment;
}

export function calculateOriginationFeeAdjustment(
  matrix: VisioPricingMatrix,
  brokerComp: number
): number {
  const adjustments = matrix.rate_structure.origination_fee_adjustments;
  const key = `${brokerComp}%`;
  return adjustments[key] || 0;
}

export function calculateLoanSizeAdjustment(
  matrix: VisioPricingMatrix,
  loanAmount: number
): number {
  const adjustments = matrix.rate_structure.loan_size_adjustments;
  const range = findLTVRange(adjustments, loanAmount);
  
  // Debug logging for loan size adjustment
  console.log('Loan Size Adjustment Debug:', {
    loanAmount,
    availableRanges: Object.keys(adjustments),
    foundRange: range,
    adjustment: range ? adjustments[range] : 0
  });
  
  return range ? adjustments[range] : 0;
}

export function calculateYSPAdjustment(
  matrix: VisioPricingMatrix,
  ysp: number
): number {
  // YSP should be a direct percentage of the loan amount, not a matrix lookup
  // The matrix lookup is for rate adjustments, not fee calculations
  return ysp; // Return the YSP percentage directly
}

export function calculatePrepayAdjustment(matrix: VisioPricingMatrix, prepayStructure: string): number {
  const prepayStructures = matrix.rate_structure.prepay_penalty_structures;
  
  // If prepayStructure is "None", return 0 (no adjustment)
  if (prepayStructure === "None") {
    return 0;
  }
  
  // Look up the rate adjustment for the selected prepayment penalty structure
  const adjustment = prepayStructures[prepayStructure as keyof typeof prepayStructures];
  
  // If adjustment is a number, return it; otherwise return 0
  if (typeof adjustment === 'number') {
    console.log(`Prepay Adjustment Debug: ${prepayStructure} = ${adjustment} points`);
    return adjustment;
  }
  
  console.log(`Prepay Adjustment Debug: ${prepayStructure} not found in matrix, returning 0`);
  return 0;
}

export function calculateSmallLoanFee(
  matrix: VisioPricingMatrix,
  loanAmount: number
): number {
  const smallLoanFee = matrix.loan_terms.small_loan_fee;
  if (loanAmount >= smallLoanFee.range.min && loanAmount <= smallLoanFee.range.max) {
    return smallLoanFee.amount;
  }
  return 0;
}

export function calculateMonthlyPayment(
  loanAmount: number,
  rate: number,
  termYears: number,
  isInterestOnly: boolean
): number {
  const monthlyRate = rate / 100 / 12;
  const totalPayments = termYears * 12;
  
  if (isInterestOnly) {
    return loanAmount * monthlyRate;
  } else {
    return (loanAmount * monthlyRate * Math.pow(1 + monthlyRate, totalPayments)) / 
           (Math.pow(1 + monthlyRate, totalPayments) - 1);
  }
}

export function calculatePricing(
  matrix: VisioPricingMatrix,
  input: any,
  product: string,
  isInterestOnly: boolean
): PricingCalculationResult {
  // Calculate base rate
  const baseRate = calculateBaseRate(matrix, input.fico, input.ltv);
  
  // Calculate all adjustments
  const productAdjustment = calculateProductAdjustment(matrix, product);
  const interestOnlyAdjustment = calculateInterestOnlyAdjustment(matrix, isInterestOnly);
  const dscrAdjustment = calculateDSCRAdjustment(matrix, input.dscr, input.ltv);
  const programAdjustment = calculateProgramAdjustment(matrix, input.loanPurpose, input.propertyType);
  const originationFeeAdjustment = calculateOriginationFeeAdjustment(matrix, input.brokerComp);
  const loanSizeAdjustment = calculateLoanSizeAdjustment(matrix, input.loanAmount);
  
  // Calculate final rate
  let finalRate = baseRate + productAdjustment + interestOnlyAdjustment + dscrAdjustment + 
                  programAdjustment + originationFeeAdjustment + loanSizeAdjustment;
  
  // Apply minimum rate constraint
  finalRate = Math.max(finalRate, matrix.rate_structure.minimum_rate);
  
  // Calculate total rate adjustments (points added to base rate)
  const totalRateAdjustments = productAdjustment + interestOnlyAdjustment + dscrAdjustment + 
                               programAdjustment + originationFeeAdjustment + loanSizeAdjustment;
  
  // Calculate YSP and prepay adjustments (these are separate from rate adjustments)
  const yspAdjustment = calculateYSPAdjustment(matrix, input.ysp);
  const prepayAdjustment = calculatePrepayAdjustment(matrix, input.prepayStructure);
  const discountPoints = input.discountPoints || 0;
  
  // Calculate monthly payment
  const termMatch = matrix.loan_terms.term.match(/(\d+)/);
  const termYears = termMatch ? parseInt(termMatch[1]) : 30;
  const monthlyPayment = calculateMonthlyPayment(input.loanAmount, finalRate, termYears, isInterestOnly);
  
  // Calculate fees
  const smallLoanFee = calculateSmallLoanFee(matrix, input.loanAmount);
  
  // Calculate all fee components
  const brokerOriginationFee = input.brokerComp * input.loanAmount / 100;
  const underwritingFee = matrix.loan_terms.underwriting_fee;
  const adminFee = input.brokerAdminFee || 0; // Admin fee from form input
  
  // Total fees should include ALL components EXCEPT YSP (since YSP is paid by lender) and prepay (since it's only charged on early payoff)
  // Note: loanSizeAdjustment is a RATE adjustment, not a fee, so it's not included here
  const totalFees = brokerOriginationFee + underwritingFee + smallLoanFee + adminFee;
  
  // Debug logging for fee calculation
  console.log('Fee Calculation Debug:', {
    brokerOriginationFee,
    underwritingFee,
    smallLoanFee,
    adminFee,
    totalFees
  });

  return {
    baseRate,
    finalRate,
    totalPoints: totalRateAdjustments, // Changed from totalPoints to totalRateAdjustments
    monthlyPayment,
    totalFees,
    feeBreakdown: {
      originationFee: brokerOriginationFee,
      underwritingFee,
      smallLoanFee,
      adminFee
    },
    adjustments: {
      productAdjustment,
      interestOnlyAdjustment,
      dscrAdjustment,
      programAdjustment,
      originationFeeAdjustment,
      loanSizeAdjustment,
      yspAdjustment,
      prepayAdjustment
    }
  };
} 