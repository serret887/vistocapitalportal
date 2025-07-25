// Business Rules Types
export interface BusinessRule {
  rule_id: string;
  condition?: {
    loan_purpose?: string;
    loan_amount?: { lt?: number; gt?: number; gte?: number; lte?: number };
    dscr?: { lt?: number; gt?: number; gte?: number; lte?: number };
    prepay_structure?: string;
    product?: string;
    fico?: { min?: number };
  };
  requirements?: {
    min_fico?: number;
    max_ltv?: number;
    zero_prepay_required?: boolean;
    product?: string;
    interest_only?: boolean;
    min_dscr?: number;
    min_rate?: number;
  };
  restrictions?: {
    prepay_structures?: string[];
    interest_only?: boolean;
  };
  error_message: string;
}

export interface StateRule extends BusinessRule {
  states: string[];
}

export interface BusinessRules {
  state_rules: StateRule[];
  loan_purpose_rules: BusinessRule[];
  prepayment_penalty_rules: BusinessRule[];
  dscr_ltv_rules: BusinessRule[];
  product_rules: BusinessRule[];
  rate_rules: BusinessRule[];
}

// Pricing Matrix Types
export interface VisioPricingMatrix {
  lender: string;
  date: string;
  meta: {
    loan_originators: string[];
    not_available_in_states: string[];
    nmls_ids: Record<string, string>;
  };
  loan_terms: {
    term: string;
    amortization: string;
    max_ltv: number;
    underwriting_fee: number;
    small_loan_fee: {
      amount: number;
      range: {
        min: number;
        max: number;
      };
    };
  };
  borrower_requirements: {
    borrower_types: string[];
    entity_types: string[];
    citizenship: string[];
    min_assets_reserves_months: number;
    credit: {
      middle_score_used: boolean;
      min_active_tradelines: boolean;
      dil_seasoning_years: number;
      late_payment_limitations: boolean;
      refinance_min_fico: number;
    };
  };
  property_requirements: {
    property_types: string[];
    min_value: number;
    condition: string[];
    dscr_min: number;
    lease_status: string[];
  };
  business_rules: BusinessRules;
  rate_structure: {
    products: Record<string, number>;
    origination_fee_adjustments: Record<string, number>;
    loan_size_adjustments: Record<string, number>;
    prepay_penalty_structures: Record<string, number>;
    program_adjustments: {
      cash_out_refinance: number;
      short_term_rental: number;
      condo: number;
      "2_4_units": number;
      units_adjustment: number;
      dscr_adjustments: {
        dscr_gt_1_20: number;
        dscr_lt_1_00_to_0_75_ltv_le_65: number;
        dscr_lt_1_00: string;
      };
    };
    minimum_rate: number;
  };
  base_rates: {
    tiers: Record<string, Record<string, number>>;
  };
  broker_payout_add_ons: Record<string, number>;
}

// Validation Types
export interface LoanValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

// Rule Validation Results
export interface RuleValidationResult {
  rule_id: string;
  category: string;
  passed: boolean;
  error_message?: string;
  warning_message?: string;
}

// Pricing Calculation Types
export interface PricingCalculationResult {
  baseRate: number;
  finalRate: number;
  totalPoints: number;
  monthlyPayment: number;
  totalFees: number;
  feeBreakdown: {
    originationFee: number;
    underwritingFee: number;
    smallLoanFee?: number;
    adminFee: number;
  };
  adjustments: {
    productAdjustment: number;
    interestOnlyAdjustment: number;
    dscrAdjustment: number;
    programAdjustment: number;
    originationFeeAdjustment: number;
    loanSizeAdjustment: number;
    yspAdjustment: number;
    prepayAdjustment: number;
    unitsAdjustment: number;
  };
}

// API Request/Response Types
export interface LoanPricingRequest {
  loanProgram: string;
  input: {
    fico: number;
    ltv: number;
    loanAmount: number;
    loanPurpose: 'purchase' | 'refinance' | 'cash_out';
    propertyType: string;
    propertyState: string;
    occupancyType: string;
    product: string;
    interestOnly: boolean;
    prepayStructure: string;
    dscr: number;
    brokerComp: number;
    ysp: number;
    discountPoints: number;
    brokerAdminFee: number;
    estimatedHomeValue: number;
    monthlyRentalIncome: number;
    annualPropertyInsurance: number;
    annualPropertyTaxes: number;
    monthlyHoaFee: number;
    isShortTermRental: boolean;
    units: number;
    remainingMortgage?: number;
    acquisitionDate?: string;
  };
}

export interface PricingResult {
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
    unitsAdjustment: number;
  };
  feeBreakdown: {
    originationFee: number;
    underwritingFee: number;
    smallLoanFee?: number;
    adminFee: number;
  };
  validation?: LoanValidationResult;
}

export interface PricingResponse {
  success: boolean;
  data?: PricingResult[];
  error?: string;
  validation?: LoanValidationResult;
}

export interface LoanOption {
    name: string;
    term: number;
    interestOnly: boolean;
    baseProduct: string;
}

export interface FeeBreakdown {
    originationFee: number;
    underwritingFee: number;
    smallLoanFee?: number;
    adminFee: number;
}

export interface Breakdown {
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
    unitsAdjustment: number;
}
 