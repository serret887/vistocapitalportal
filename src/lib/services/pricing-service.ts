import { createServerSupabaseClient } from '@/lib/auth';
import { 
  VisioPricingMatrix, 
  LoanPricingRequest, 
  PricingResult, 
  PricingResponse 
} from '@/lib/types/pricing';
import { validateLoanEligibility, debugValidation } from '@/lib/validation/loan-validation';
import { calculatePricing } from '@/lib/calculations/pricing-calculations';

export class PricingService {
  private static async getPricingMatrix(loanProgram: string): Promise<VisioPricingMatrix> {
    const serverSupabase = createServerSupabaseClient();
    
    const { data: matrixData, error: matrixError } = await serverSupabase
      .from('pricing_matrices')
      .select('matrix')
      .eq('lender_id', 'visio')
      .eq('loan_program', loanProgram)
      .single();

    if (matrixError || !matrixData) {
      throw new Error('Pricing matrix not found');
    }

    return matrixData.matrix as VisioPricingMatrix;
  }

  private static generateLoanOptions(): Array<{ baseProduct: string; isInterestOnly: boolean }> {
    const eligibleProducts = ['30_Year_Fixed', '5_6_ARM', '7_6_ARM'];
    const options: Array<{ baseProduct: string; isInterestOnly: boolean }> = [];

    for (const baseProduct of eligibleProducts) {
      // Always add amortizing version
      options.push({ baseProduct, isInterestOnly: false });
      
      // Add interest-only option for 30-year fixed
      if (baseProduct === '30_Year_Fixed') {
        options.push({ baseProduct, isInterestOnly: true });
      }
    }

    return options;
  }

  private static formatProductName(baseProduct: string, isInterestOnly: boolean): string {
    if (isInterestOnly) {
      return `${baseProduct} - Interest Only`;
    }
    return baseProduct;
  }

  public static async calculateLoanPricing(request: LoanPricingRequest): Promise<PricingResponse> {
    try {
      const { loanProgram, input } = request;

      // Validate required fields
      if (!input.fico || !input.ltv || !input.loanAmount || !input.loanPurpose || !input.propertyType) {
        return {
          success: false,
          error: 'Missing required fields: fico, ltv, loanAmount, loanPurpose, propertyType'
        };
      }

      // Get pricing matrix
      const matrix = await this.getPricingMatrix(loanProgram);

      // Validate loan eligibility
      const validation = validateLoanEligibility(matrix, input);
      console.log('Loan validation completed:', validation);
      
      // Debug validation for troubleshooting
      debugValidation(matrix, input);

      // If validation fails, return errors
      if (!validation.isValid) {
        console.log('Loan validation failed:', {
          errors: validation.errors,
          warnings: validation.warnings,
          input: {
            fico: input.fico,
            ltv: input.ltv,
            loanAmount: input.loanAmount,
            propertyState: input.propertyState,
            propertyType: input.propertyType,
            estimatedHomeValue: input.estimatedHomeValue,
            dscr: input.dscr,
            loanPurpose: input.loanPurpose,
            prepayStructure: input.prepayStructure
          }
        });
        
        return {
          success: false,
          error: 'Loan not eligible',
          validation
        };
      }

      // Generate loan options
      const loanOptions = this.generateLoanOptions();
      const results: PricingResult[] = [];

      // Calculate pricing for each option
      for (const { baseProduct, isInterestOnly } of loanOptions) {
        try {
          const pricingResult = calculatePricing(matrix, input, baseProduct, isInterestOnly);
          
          const result: PricingResult = {
            lenderId: 'visio',
            lenderName: matrix.lender,
            product: this.formatProductName(baseProduct, isInterestOnly),
            baseRate: pricingResult.baseRate,
            finalRate: pricingResult.finalRate,
            points: pricingResult.totalPoints,
            monthlyPayment: pricingResult.monthlyPayment,
            totalFees: pricingResult.totalFees,
            termYears: 30, // Extract from matrix.loan_terms.term
            breakdown: {
              baseRate: pricingResult.baseRate,
              ficoAdjustment: 0, // Not used in current matrix
              ltvAdjustment: 0, // Not used in current matrix
              productAdjustment: pricingResult.adjustments.productAdjustment,
              dscrAdjustment: pricingResult.adjustments.dscrAdjustment,
              originationFeeAdjustment: pricingResult.adjustments.originationFeeAdjustment,
              loanSizeAdjustment: pricingResult.adjustments.loanSizeAdjustment,
              programAdjustment: pricingResult.adjustments.programAdjustment,
              interestOnlyAdjustment: pricingResult.adjustments.interestOnlyAdjustment,
              yspAdjustment: pricingResult.adjustments.yspAdjustment,
            },
            feeBreakdown: pricingResult.feeBreakdown,
            validation
          };

          results.push(result);

        } catch (error) {
          console.error(`Error calculating pricing for ${baseProduct} (IO: ${isInterestOnly}):`, error);
          // Continue with other products even if one fails
        }
      }

      if (results.length === 0) {
        return {
          success: false,
          error: 'No valid pricing options found'
        };
      }

      // Sort results by final rate
      results.sort((a, b) => a.finalRate - b.finalRate);

      return {
        success: true,
        data: results,
        validation
      };

    } catch (error) {
      console.error('Error in pricing service:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error'
      };
    }
  }
} 