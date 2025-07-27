import { createServerSupabaseClient } from '@/lib/auth';
import { LoanPricingRequest, PricingResponse, PricingResult, LoanOption, FeeBreakdown, Breakdown, VisioPricingMatrix } from '@/lib/types/pricing';
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
            .eq('lenders.name', 'Visio') // Hardcode to Visio for now
            .single();

        if (error) {
            console.error('Error fetching matrices:', error);
            throw new Error('Could not fetch matrices.');
        }
        
        const { pricing_matrices, ...eligibilityMatrix } = data;
        return { eligibilityMatrix, pricingMatrix: pricing_matrices[0] };
    }

    private static constructVisioPricingMatrix(eligibilityMatrix: any, pricingMatrix: any): VisioPricingMatrix {
        // Construct the VisioPricingMatrix object from database data
        return {
            lender: eligibilityMatrix.lenders.name,
            date: eligibilityMatrix.effective_date,
            meta: eligibilityMatrix.rules.meta,
            loan_terms: eligibilityMatrix.rules.loan_terms,
            borrower_requirements: eligibilityMatrix.rules.borrower_requirements,
            property_requirements: eligibilityMatrix.rules.property_requirements,
            business_rules: eligibilityMatrix.rules.business_rules,
            rate_structure: pricingMatrix.pricing_data.rate_structure,
            base_rates: pricingMatrix.pricing_data.base_rates,
            broker_payout_add_ons: pricingMatrix.pricing_data.broker_payout_add_ons
        };
    }

    public static async calculateLoanPricing(request: LoanPricingRequest): Promise<PricingResponse> {
        try {
            const { loanProgram, input } = request;

            const { eligibilityMatrix, pricingMatrix } = await this.getEligibilityAndPricingMatrices(loanProgram);
            
            // Construct the proper VisioPricingMatrix object
            const matrix = this.constructVisioPricingMatrix(eligibilityMatrix, pricingMatrix);
            
            console.log('Constructed matrix:', {
                lender: matrix.lender,
                hasBusinessRules: !!matrix.business_rules,
                ruleCategories: Object.keys(matrix.business_rules || {}),
                hasBaseRates: !!matrix.base_rates
            });

            // Process the input to ensure all required fields are properly formatted
            const processedInput = {
                // Convert FICO score range to number
                fico: (input as any).ficoScore === '780+' ? 780 : parseInt((input as any).ficoScore?.split('-')[0] || '740'),
                // Calculate LTV
                ltv: (input.loanAmount / input.estimatedHomeValue) * 100,
                // Calculate DSCR (will be recalculated in pricing)
                dscr: 1.25, // Default, will be calculated properly in pricing
                // Ensure all required fields are present
                loanPurpose: (input as any).transactionType === 'purchase' ? 'purchase' : 'refinance',
                propertyType: input.propertyType,
                isShortTermRental: (input as any).isShortTermRental || false,
                brokerComp: (input as any).brokerComp || 0,
                brokerAdminFee: (input as any).brokerAdminFee || 0,
                prepayStructure: (input as any).prepaymentPenalty || '5/5/5/5/5',
                units: (input as any).units || 1,
                // Copy all other fields from input
                loanAmount: input.loanAmount,
                propertyState: input.propertyState,
                occupancyType: input.occupancyType,
                product: input.product,
                interestOnly: input.interestOnly,
                ysp: input.ysp,
                discountPoints: input.discountPoints,
                estimatedHomeValue: input.estimatedHomeValue,
                monthlyRentalIncome: input.monthlyRentalIncome,
                annualPropertyInsurance: input.annualPropertyInsurance,
                annualPropertyTaxes: input.annualPropertyTaxes,
                monthlyHoaFee: input.monthlyHoaFee,
                remainingMortgage: input.remainingMortgage,
                acquisitionDate: input.acquisitionDate
            };

            const validation = validateLoanEligibility(matrix, processedInput);

            if (!validation.isValid) {
                return { success: false, error: 'Loan not eligible', validation };
            }

            const results: PricingResult[] = LOAN_OPTIONS.map((option: LoanOption) => {
                const pricingResult = calculatePricing(matrix, processedInput, option.baseProduct, option.interestOnly);
                
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
                    prepayAdjustment: pricingResult.adjustments.prepayAdjustment,
                    unitsAdjustment: pricingResult.adjustments.unitsAdjustment,
                    rateAdjustment: pricingResult.adjustments.rateAdjustment,
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