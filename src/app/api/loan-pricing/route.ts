import { NextRequest, NextResponse } from 'next/server';
import { PricingService } from '@/lib/services/pricing-service';
import { LoanPricingRequest } from '@/lib/types/pricing';

export async function POST(request: NextRequest) {
  try {
    const body: LoanPricingRequest = await request.json();
    
    console.log('Received pricing request:', body);

    // Use the pricing service to handle all logic
    const result = await PricingService.calculateLoanPricing(body);
    
    if (!result.success) {
      return NextResponse.json(result, { status: 400 });
    }
    
    console.log(`Generated ${result.data?.length || 0} pricing options`);

    return NextResponse.json(result);

  } catch (error) {
    console.error('Error in loan pricing API:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    }, { status: 500 });
  }
} 