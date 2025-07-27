const testRateAdjustment = async () => {
  console.log('🧪 Testing Rate Adjustment (-3%)\n');

  const request = {
    loanProgram: 'DSCR',
    input: {
      fico: 745,
      ltv: 80,
      loanAmount: 160000,
      loanPurpose: 'purchase',
      propertyType: '1-4 Unit SFR',
      propertyState: 'FL',
      occupancyType: 'investment',
      product: '30_Year_Fixed',
      interestOnly: false,
      prepayStructure: '5/4/3/2/1',
      dscr: 1.25,
      brokerComp: 1,
      ysp: 1,
      discountPoints: 0,
      brokerAdminFee: 995,
      estimatedHomeValue: 200000,
      monthlyRentalIncome: 5000,
      annualPropertyInsurance: 1200,
      annualPropertyTaxes: 3600,
      monthlyHoaFee: 600,
      isShortTermRental: false,
      units: 1
    }
  };

  try {
    const response = await fetch('http://localhost:3000/api/loan-pricing', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    const result = await response.json();
    
    if (result.success && result.data && result.data.length > 0) {
      const option = result.data[0];
      
      console.log('📊 Results:');
      console.log(`  Base Rate: ${option.breakdown.baseRate}%`);
      console.log(`  Final Rate: ${option.finalRate}%`);
      console.log(`  Rate Adjustment: ${option.breakdown.rateAdjustment}%`);
      
      console.log('\n🔍 Rate Breakdown:');
      console.log(`  Base Rate: ${option.breakdown.baseRate}%`);
      console.log(`  Product Adjustment: ${option.breakdown.productAdjustment}%`);
      console.log(`  DSCR Adjustment: ${option.breakdown.dscrAdjustment}%`);
      console.log(`  Origination Fee Adjustment: ${option.breakdown.originationFeeAdjustment}%`);
      console.log(`  Loan Size Adjustment: ${option.breakdown.loanSizeAdjustment}%`);
      console.log(`  YSP Adjustment: ${option.breakdown.yspAdjustment}%`);
      console.log(`  Prepay Adjustment: ${option.breakdown.prepayAdjustment}%`);
      console.log(`  Program Adjustment: ${option.breakdown.programAdjustment}%`);
      console.log(`  Rate Adjustment: ${option.breakdown.rateAdjustment}%`);
      
      // Calculate expected rate with -3% adjustment
      const expectedRate = option.breakdown.baseRate + 
                          option.breakdown.productAdjustment + 
                          option.breakdown.dscrAdjustment + 
                          option.breakdown.originationFeeAdjustment + 
                          option.breakdown.loanSizeAdjustment + 
                          option.breakdown.yspAdjustment + 
                          option.breakdown.prepayAdjustment + 
                          option.breakdown.programAdjustment + 
                          option.breakdown.rateAdjustment;
      
      console.log('\n🧮 Verification:');
      console.log(`  Expected Rate: ${expectedRate}%`);
      console.log(`  Actual Rate: ${option.finalRate}%`);
      console.log(`  Difference: ${(option.finalRate - expectedRate).toFixed(3)}%`);
      
      if (Math.abs(option.finalRate - expectedRate) < 0.01) {
        console.log('✅ SUCCESS: Rate adjustment is working correctly!');
      } else {
        console.log('❌ FAILED: Rate adjustment is not working correctly');
      }
      
      // Check if the -3% adjustment is applied
      if (option.breakdown.rateAdjustment === -3.0) {
        console.log('✅ SUCCESS: -3% rate adjustment is applied correctly!');
      } else {
        console.log(`❌ FAILED: Expected -3% rate adjustment, got ${option.breakdown.rateAdjustment}%`);
      }
      
    } else {
      console.log('❌ API Error:', result.error || 'Unknown error');
    }
  } catch (error) {
    console.log('❌ Request failed:', error.message);
  }
};

testRateAdjustment().catch(console.error); 