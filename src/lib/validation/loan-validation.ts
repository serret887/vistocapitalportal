import { VisioPricingMatrix, LoanValidationResult, BusinessRule, StateRule, RuleValidationResult } from '@/lib/types/pricing';

// Main validation function
export function validateLoanEligibility(
  matrix: VisioPricingMatrix,
  input: any
): LoanValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const validationResults: RuleValidationResult[] = [];

  console.log('Starting comprehensive loan validation with input:', input);

  // 1. Basic eligibility validation (existing)
  const basicValidation = validateBasicEligibility(matrix, input);
  errors.push(...basicValidation.errors);
  warnings.push(...basicValidation.warnings);

  // 2. Business rules validation by category
  const businessRulesValidation = validateBusinessRules(matrix, input);
  errors.push(...businessRulesValidation.errors);
  warnings.push(...businessRulesValidation.warnings);
  validationResults.push(...businessRulesValidation.results);

  console.log('Validation complete:', {
    isValid: errors.length === 0,
    errors: errors.length,
    warnings: warnings.length,
    businessRulesChecked: validationResults.length
  });

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

// Basic eligibility validation (property value, LTV, DSCR, etc.)
function validateBasicEligibility(matrix: VisioPricingMatrix, input: any): LoanValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // State validation
  if (matrix.meta.not_available_in_states.includes(input.propertyState)) {
    errors.push(`❌ Property state "${input.propertyState}" is not eligible for this loan program. 
    🔧 SOLUTION: Choose a different state. This program is not available in: ${matrix.meta.not_available_in_states.join(', ')}`);
  }

  // Property value validation
  if (input.estimatedHomeValue < matrix.property_requirements.min_value) {
    const shortfall = matrix.property_requirements.min_value - input.estimatedHomeValue;
    errors.push(`❌ Property value $${input.estimatedHomeValue.toLocaleString()} is too low. 
    🔧 SOLUTION: Increase property value by at least $${shortfall.toLocaleString()} to meet minimum requirement of $${matrix.property_requirements.min_value.toLocaleString()}`);
  }

  // LTV validation
  if (input.ltv > matrix.loan_terms.max_ltv) {
    const excess = input.ltv - matrix.loan_terms.max_ltv;
    const requiredDownPayment = (excess / 100) * input.estimatedHomeValue;
    errors.push(`❌ Loan-to-Value (LTV) of ${input.ltv.toFixed(1)}% is too high. 
    🔧 SOLUTION: Increase down payment by $${requiredDownPayment.toLocaleString()} or reduce loan amount to achieve maximum LTV of ${matrix.loan_terms.max_ltv}%`);
  }

  // DSCR validation
  if (input.dscr < matrix.property_requirements.dscr_min) {
    const shortfall = matrix.property_requirements.dscr_min - input.dscr;
    const requiredRentIncrease = shortfall * (input.monthlyRentalIncome * 12) / 12;
    errors.push(`❌ Debt Service Coverage Ratio (DSCR) of ${input.dscr.toFixed(2)} is too low. 
    🔧 SOLUTION: Increase monthly rental income by $${requiredRentIncrease.toFixed(0)} or reduce loan amount to achieve minimum DSCR of ${matrix.property_requirements.dscr_min}`);
  }

  // Property type validation
  if (input.propertyType === 'Multi Family (5+ units)') {
    errors.push(`❌ Multi Family (5+ units) is not eligible for this loan program.\n🔧 SOLUTION: Choose one of these eligible property types: ${matrix.property_requirements.property_types.join(', ')}`);
  } else {
    const validPropertyTypes = matrix.property_requirements.property_types;
    const propertyTypeMap: Record<string, string> = {
      'Single Family': '1-4 Unit SFR',
      'Condo': 'Condos',
      'Townhouse': 'Townhomes',
      '1-4 Unit SFR': '1-4 Unit SFR',
      'Condos': 'Condos',
      'Townhomes': 'Townhomes'
    };
    
    const mappedPropertyType = propertyTypeMap[input.propertyType];
    if (!mappedPropertyType || !validPropertyTypes.includes(mappedPropertyType)) {
      errors.push(`❌ Property type "${input.propertyType}" is not eligible for this loan program. \n🔧 SOLUTION: Choose one of these eligible property types: ${validPropertyTypes.join(', ')}`);
    }
  }

  return { isValid: errors.length === 0, errors, warnings };
}

// Business rules validation by category
function validateBusinessRules(matrix: VisioPricingMatrix, input: any): {
  errors: string[];
  warnings: string[];
  results: RuleValidationResult[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];
  const results: RuleValidationResult[] = [];

  console.log('Validating business rules...');

  // 1. State Rules
  const stateResults = validateStateRules(matrix.business_rules.state_rules, input);
  errors.push(...stateResults.errors);
  warnings.push(...stateResults.warnings);
  results.push(...stateResults.results);

  // 2. Loan Purpose Rules
  const loanPurposeResults = validateLoanPurposeRules(matrix.business_rules.loan_purpose_rules, input);
  errors.push(...loanPurposeResults.errors);
  warnings.push(...loanPurposeResults.warnings);
  results.push(...loanPurposeResults.results);

  // 3. Prepayment Penalty Rules
  const prepayResults = validatePrepaymentPenaltyRules(matrix.business_rules.prepayment_penalty_rules, input);
  errors.push(...prepayResults.errors);
  warnings.push(...prepayResults.warnings);
  results.push(...prepayResults.results);

  // 4. DSCR/LTV Rules
  const dscrLtvResults = validateDscrLtvRules(matrix.business_rules.dscr_ltv_rules, input);
  errors.push(...dscrLtvResults.errors);
  warnings.push(...dscrLtvResults.warnings);
  results.push(...dscrLtvResults.results);

  // 5. Product Rules
  const productResults = validateProductRules(matrix.business_rules.product_rules, input);
  errors.push(...productResults.errors);
  warnings.push(...productResults.warnings);
  results.push(...productResults.results);

  // 6. Rate Rules
  const rateResults = validateRateRules(matrix.business_rules.rate_rules, input);
  errors.push(...rateResults.errors);
  warnings.push(...rateResults.warnings);
  results.push(...rateResults.results);

  return { errors, warnings, results };
}

// State-specific rules validation
function validateStateRules(stateRules: StateRule[], input: any): {
  errors: string[];
  warnings: string[];
  results: RuleValidationResult[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];
  const results: RuleValidationResult[] = [];

  for (const rule of stateRules) {
    const result: RuleValidationResult = {
      rule_id: rule.rule_id,
      category: 'state_rules',
      passed: true
    };

    // Check if rule applies to this state
    if (!rule.states.includes(input.propertyState)) {
      result.passed = true;
      results.push(result);
      continue;
    }

    // Check if additional conditions apply
    if (rule.condition) {
      if (!evaluateCondition(rule.condition, input)) {
        result.passed = true;
        results.push(result);
        continue;
      }
    }

    // Validate requirements
    if (rule.requirements?.zero_prepay_required && input.prepayStructure !== '0/0/0') {
      result.passed = false;
      result.error_message = `❌ ${rule.error_message}. 🔧 SOLUTION: Change prepayment penalty to "0/0/0"`;
      warnings.push(result.error_message);
    }

    // Validate restrictions
    if (rule.restrictions?.prepay_structures?.includes(input.prepayStructure)) {
      result.passed = false;
      result.error_message = `❌ ${rule.error_message}. 🔧 SOLUTION: Choose a different prepayment penalty structure`;
      errors.push(result.error_message);
    }

    results.push(result);
  }

  return { errors, warnings, results };
}

// Loan purpose rules validation
function validateLoanPurposeRules(loanPurposeRules: BusinessRule[], input: any): {
  errors: string[];
  warnings: string[];
  results: RuleValidationResult[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];
  const results: RuleValidationResult[] = [];

  for (const rule of loanPurposeRules) {
    const result: RuleValidationResult = {
      rule_id: rule.rule_id,
      category: 'loan_purpose_rules',
      passed: true
    };

    if (rule.condition && evaluateCondition(rule.condition, input)) {
      if (rule.requirements?.min_fico && input.fico < rule.requirements.min_fico) {
        const shortfall = rule.requirements.min_fico - input.fico;
        result.passed = false;
        result.error_message = `❌ ${rule.error_message}. 🔧 SOLUTION: Improve credit score by ${shortfall} points`;
        errors.push(result.error_message);
      }
    }

    results.push(result);
  }

  return { errors, warnings, results };
}

// Prepayment penalty rules validation
function validatePrepaymentPenaltyRules(prepayRules: BusinessRule[], input: any): {
  errors: string[];
  warnings: string[];
  results: RuleValidationResult[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];
  const results: RuleValidationResult[] = [];

  for (const rule of prepayRules) {
    const result: RuleValidationResult = {
      rule_id: rule.rule_id,
      category: 'prepayment_penalty_rules',
      passed: true
    };

    if (rule.condition && evaluateCondition(rule.condition, input)) {
      let failedRequirements: string[] = [];

      if (rule.requirements?.product && input.product !== rule.requirements.product) {
        failedRequirements.push(`product must be ${rule.requirements.product}`);
      }
      if (rule.requirements?.min_fico && input.fico < rule.requirements.min_fico) {
        failedRequirements.push(`FICO must be ${rule.requirements.min_fico}+`);
      }
      if (rule.requirements?.interest_only === false && input.interestOnly === true) {
        failedRequirements.push('Interest Only not allowed');
      }
      if (rule.requirements?.min_dscr && input.dscr < rule.requirements.min_dscr) {
        failedRequirements.push(`DSCR must be ${rule.requirements.min_dscr}+`);
      }

      if (failedRequirements.length > 0) {
        result.passed = false;
        result.error_message = `❌ ${rule.error_message}. 🔧 SOLUTION: ${failedRequirements.join(', ')} OR choose a different prepayment penalty`;
        errors.push(result.error_message);
      }
    }

    results.push(result);
  }

  return { errors, warnings, results };
}

// DSCR/LTV rules validation
function validateDscrLtvRules(dscrLtvRules: BusinessRule[], input: any): {
  errors: string[];
  warnings: string[];
  results: RuleValidationResult[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];
  const results: RuleValidationResult[] = [];

  for (const rule of dscrLtvRules) {
    const result: RuleValidationResult = {
      rule_id: rule.rule_id,
      category: 'dscr_ltv_rules',
      passed: true
    };

    if (rule.condition && evaluateCondition(rule.condition, input)) {
      if (rule.requirements?.max_ltv && input.ltv > rule.requirements.max_ltv) {
        const excess = input.ltv - rule.requirements.max_ltv;
        const requiredDownPayment = (excess / 100) * input.estimatedHomeValue;
        result.passed = false;
        result.error_message = `❌ ${rule.error_message}. 🔧 SOLUTION: Increase down payment by $${requiredDownPayment.toLocaleString()} to achieve ${rule.requirements.max_ltv}% LTV`;
        errors.push(result.error_message);
      }
    }

    results.push(result);
  }

  return { errors, warnings, results };
}

// Product rules validation
function validateProductRules(productRules: BusinessRule[], input: any): {
  errors: string[];
  warnings: string[];
  results: RuleValidationResult[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];
  const results: RuleValidationResult[] = [];

  for (const rule of productRules) {
    const result: RuleValidationResult = {
      rule_id: rule.rule_id,
      category: 'product_rules',
      passed: true
    };

    if (rule.condition && evaluateCondition(rule.condition, input)) {
      if (rule.restrictions?.interest_only === false && input.interestOnly === true) {
        result.passed = false;
        result.error_message = `❌ ${rule.error_message}. 🔧 SOLUTION: Change to Principal & Interest payment`;
        errors.push(result.error_message);
      }
    }

    results.push(result);
  }

  return { errors, warnings, results };
}

// Rate rules validation
function validateRateRules(rateRules: BusinessRule[], input: any): {
  errors: string[];
  warnings: string[];
  results: RuleValidationResult[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];
  const results: RuleValidationResult[] = [];

  for (const rule of rateRules) {
    const result: RuleValidationResult = {
      rule_id: rule.rule_id,
      category: 'rate_rules',
      passed: true
    };

    if (rule.condition && evaluateCondition(rule.condition, input)) {
      // Rate rules typically just provide information, not validation failures
      result.warning_message = `⚠️ ${rule.error_message}`;
      warnings.push(result.warning_message);
    }

    results.push(result);
  }

  return { errors, warnings, results };
}

// Helper function to evaluate conditions
function evaluateCondition(condition: any, input: any): boolean {
  for (const [key, value] of Object.entries(condition)) {
    switch (key) {
      case 'loan_purpose':
        if (input.loanPurpose !== value) return false;
        break;
      case 'loan_amount':
        if (typeof value === 'object' && value !== null) {
          const amount = input.loanAmount;
          const numericCondition = value as { lt?: number; gt?: number; gte?: number; lte?: number };
          if (numericCondition.lt && amount >= numericCondition.lt) return false;
          if (numericCondition.gt && amount <= numericCondition.gt) return false;
          if (numericCondition.gte && amount < numericCondition.gte) return false;
          if (numericCondition.lte && amount > numericCondition.lte) return false;
        }
        break;
      case 'dscr':
        if (typeof value === 'object' && value !== null) {
          const dscr = input.dscr;
          const numericCondition = value as { lt?: number; gt?: number; gte?: number; lte?: number };
          if (numericCondition.lt && dscr >= numericCondition.lt) return false;
          if (numericCondition.gt && dscr <= numericCondition.gt) return false;
          if (numericCondition.gte && dscr < numericCondition.gte) return false;
          if (numericCondition.lte && dscr > numericCondition.lte) return false;
        }
        break;
      case 'prepay_structure':
        if (input.prepayStructure !== value) return false;
        break;
      case 'product':
        if (input.product !== value) return false;
        break;
      default:
        console.warn(`Unknown condition key: ${key}`);
    }
  }
  return true;
}

// Legacy debug function (kept for compatibility)
export function debugValidation(matrix: VisioPricingMatrix, input: any): void {
  console.log('=== VALIDATION DEBUG ===');
  console.log('Matrix business rules:', matrix.business_rules);
  console.log('Input data:', input);
  
  const validation = validateLoanEligibility(matrix, input);
  console.log('Validation result:', validation);
  
  console.log('=== END VALIDATION DEBUG ===\n');
} 