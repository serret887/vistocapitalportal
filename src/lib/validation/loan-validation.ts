import { VisioPricingMatrix, LoanValidationResult } from '@/lib/types/pricing';

// Validation Functions
export function validateLoanEligibility(
  matrix: VisioPricingMatrix,
  input: any
): LoanValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  console.log('Starting loan validation with input:', input);
  console.log('Matrix meta:', matrix.meta);

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

  // FICO validation for refinance
  if (input.loanPurpose === 'refinance' && input.fico < matrix.base_rates.notes.refinance_min_fico) {
    const shortfall = matrix.base_rates.notes.refinance_min_fico - input.fico;
    errors.push(`❌ FICO score ${input.fico} is too low for refinance loans. 
    🔧 SOLUTION: Improve credit score by ${shortfall} points to meet minimum requirement of ${matrix.base_rates.notes.refinance_min_fico} for refinance loans`);
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
      '1-4 Unit SFR': '1-4 Unit SFR',  // Direct mapping for matrix values
      'Condos': 'Condos',              // Direct mapping for matrix values
      'Townhomes': 'Townhomes'         // Direct mapping for matrix values
    };
    
    const mappedPropertyType = propertyTypeMap[input.propertyType];
    if (!mappedPropertyType || !validPropertyTypes.includes(mappedPropertyType)) {
      errors.push(`❌ Property type "${input.propertyType}" is not eligible for this loan program. \n🔧 SOLUTION: Choose one of these eligible property types: ${validPropertyTypes.join(', ')}`);
    }
  }

  // Prepayment penalty state restrictions
  const prepayStructures = matrix.rate_structure.prepay_penalty_structures;
  if (prepayStructures.notes?.zero_prepay_required_in?.includes(input.propertyState) && input.prepayStructure !== '0/0/0') {
    warnings.push(`⚠️ Zero prepayment penalty is required in ${input.propertyState}. 
    🔧 SOLUTION: Change prepayment penalty to "0/0/0" to comply with state requirements`);
  }

  // 3/3/3 restrictions
  if (input.prepayStructure === '3/3/3') {
    if (input.fico < 720 || input.dscr < 1.0) {
      const ficoShortfall = Math.max(0, 720 - input.fico);
      const dscrShortfall = Math.max(0, 1.0 - input.dscr);
      errors.push(`❌ 3/3/3 prepayment penalty requires higher qualifications. 
    🔧 SOLUTION: Either improve FICO score by ${ficoShortfall} points to 720+ OR increase DSCR by ${dscrShortfall.toFixed(2)} to 1.0+, OR choose a different prepayment penalty structure`);
    }
  }

  // Additional debugging information
  console.log('Validation results:', {
    isValid: errors.length === 0,
    errors,
    warnings,
    inputValidation: {
      state: input.propertyState,
      propertyValue: input.estimatedHomeValue,
      ltv: input.ltv,
      dscr: input.dscr,
      fico: input.fico,
      propertyType: input.propertyType,
      prepayStructure: input.prepayStructure
    }
  });

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
} 

// Test function to debug validation issues
export function debugValidation(matrix: VisioPricingMatrix, input: any): void {
  console.log('=== VALIDATION DEBUG ===');
  console.log('Matrix meta:', matrix.meta);
  console.log('Input data:', input);
  
  // Test each validation rule individually
  console.log('\n--- Individual Validation Tests ---');
  
  // State validation
  const stateValid = !matrix.meta.not_available_in_states.includes(input.propertyState);
  console.log(`State validation (${input.propertyState}): ${stateValid ? 'PASS' : 'FAIL'}`);
  if (!stateValid) {
    console.log(`  Not available in: ${matrix.meta.not_available_in_states.join(', ')}`);
  }
  
  // Property value validation
  const propertyValueValid = input.estimatedHomeValue >= matrix.property_requirements.min_value;
  console.log(`Property value validation ($${input.estimatedHomeValue}): ${propertyValueValid ? 'PASS' : 'FAIL'}`);
  if (!propertyValueValid) {
    console.log(`  Minimum required: $${matrix.property_requirements.min_value}`);
  }
  
  // LTV validation
  const ltvValid = input.ltv <= matrix.loan_terms.max_ltv;
  console.log(`LTV validation (${input.ltv.toFixed(1)}%): ${ltvValid ? 'PASS' : 'FAIL'}`);
  if (!ltvValid) {
    console.log(`  Maximum allowed: ${matrix.loan_terms.max_ltv}%`);
  }
  
  // DSCR validation
  const dscrValid = input.dscr >= matrix.property_requirements.dscr_min;
  console.log(`DSCR validation (${input.dscr.toFixed(2)}): ${dscrValid ? 'PASS' : 'FAIL'}`);
  if (!dscrValid) {
    console.log(`  Minimum required: ${matrix.property_requirements.dscr_min}`);
  }
  
  // FICO validation for refinance
  const ficoValid = input.loanPurpose !== 'refinance' || input.fico >= matrix.base_rates.notes.refinance_min_fico;
  console.log(`FICO validation for refinance (${input.fico}): ${ficoValid ? 'PASS' : 'FAIL'}`);
  if (!ficoValid) {
    console.log(`  Minimum required for refinance: ${matrix.base_rates.notes.refinance_min_fico}`);
  }
  
  // Property type validation
  const validPropertyTypes = matrix.property_requirements.property_types;
  const propertyTypeMap: Record<string, string> = {
    'Single Family': '1-4 Unit SFR',
    'Multi Family': '2-4_units',
    'Condo': 'Condos',
    'Townhouse': 'Townhomes'
  };
  const mappedPropertyType = propertyTypeMap[input.propertyType];
  const propertyTypeValid = validPropertyTypes.includes(mappedPropertyType);
  console.log(`Property type validation (${input.propertyType} -> ${mappedPropertyType}): ${propertyTypeValid ? 'PASS' : 'FAIL'}`);
  if (!propertyTypeValid) {
    console.log(`  Valid types: ${validPropertyTypes.join(', ')}`);
  }
  
  console.log('=== END VALIDATION DEBUG ===\n');
} 