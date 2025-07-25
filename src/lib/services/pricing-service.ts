import { createServerSupabaseClient } from '@/lib/auth';
import { LoanPricingRequest, PricingResponse, PricingResult, LoanOption, FeeBreakdown, Breakdown } from '@/lib/types/pricing';
import { validateLoanEligibility } from '../validation/loan-validation';
import { calculatePricing } from '../calculations/pricing-calculations';

const LOAN_OPTIONS: LoanOption[] = [
    { name: '30_Year_Fixed', term: 30, interestOnly: false, baseProduct: '30_Year_Fixed' },
    { name: '30_Year_Fixed - Interest Only', term: 30, interestOnly: true, baseProduct: '30_Year_Fixed' },
    { name: '5_6_ARM', term: 30, interestOnly: false, baseProduct: '5_6_ARM' },
    { name: '7_6_ARM', term: 30, interestOnly: false, baseProduct: '7_6_ARM' },
];

export class PricingService {
    private static async getEligibilityAndPricingMatrices(loanProgram: string): Promise<{ eligibilityMatrix: any, pricingMatrix: any }> {
        const supabase = createServerSupabaseClient();
        const { data, error } = await supabase
            .from('eligibility_matrices')
            .select('*, lenders(*), pricing_matrices(*)')
            .eq('lenders.name', 'Rental360') // Hardcode to Rental360 for now
            .single();

        if (error) {
            console.error('Error fetching matrices:', error);
            throw new Error('Could not fetch matrices.');
        }
        
        const { pricing_matrices, ...eligibilityMatrix } = data;
        return { eligibilityMatrix, pricingMatrix: pricing_matrices[0] };
    }

    public static async calculateLoanPricing(request: LoanPricingRequest): Promise<PricingResponse> {
        try {
            const { loanProgram, input } = request;

            const { eligibilityMatrix, pricingMatrix } = await this.getEligibilityAndPricingMatrices(loanProgram);
            const validation = validateLoanEligibility(eligibilityMatrix.rules, input);

            if (!validation.isValid) {
                return { success: false, error: 'Loan not eligible', validation };
            }

            const results: PricingResult[] = LOAN_OPTIONS.map((option: LoanOption) => {
                const pricingResult = calculatePricing(pricingMatrix.pricing_data, input, option.baseProduct, option.interestOnly);
                
                const breakdown: Breakdown = {
                    baseRate: pricingResult.baseRate,
                    ficoAdjustment: 0,
                    ltvAdjustment: 0,
                    productAdjustment: pricingResult.adjustments.productAdjustment,
                    dscrAdjustment: pricingResult.adjustments.dscrAdjustment,
                    originationFeeAdjustment: pricingResult.adjustments.originationFeeAdjustment,
                    loanSizeAdjustment: pricingResult.adjustments.loanSizeAdjustment,
                    programAdjustment: pricingResult.adjustments.programAdjustment,
                    interestOnlyAdjustment: pricingResult.adjustments.interestOnlyAdjustment,
                    yspAdjustment: pricingResult.adjustments.yspAdjustment,
                };
                
                const feeBreakdown: FeeBreakdown = pricingResult.feeBreakdown;

                return {
                    lenderId: eligibilityMatrix.lender_id,
                    lenderName: eligibilityMatrix.lenders.name,
                    product: option.name,
                    baseRate: pricingResult.baseRate,
                    finalRate: pricingResult.finalRate,
                    points: pricingResult.totalPoints,
                    monthlyPayment: pricingResult.monthlyPayment,
                    totalFees: pricingResult.totalFees,
                    termYears: option.term,
                    breakdown,
                    feeBreakdown,
                    validation
                };
            });

            return { success: true, data: results, validation };
        } catch (error) {
            console.error('Error in calculateLoanPricing:', error);
            return { success: false, error: (error as Error).message, validation: { isValid: false, errors: [], warnings: [] } };
        }
    }
} 