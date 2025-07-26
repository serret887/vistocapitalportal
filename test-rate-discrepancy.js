const testRateDiscrepancy = async () => {
  // Test case 1: Exact parameters from lender's image (30 Year Fixed)
  const testCase1 = {
    loanProgram: 'DSCR',
    input: {
      fico: 745,
      ltv: 80,
      loanAmount: 160000,
      loanPurpose: 'purchase',
      propertyType: '1-4 Unit SFR',
      propertyState: 'FL',
      occupancyType: 'investment',
      product: '30_Year_Fixed', // Changed from 'DSCR' to '30_Year_Fixed'
      interestOnly: false,
      prepayStructure: '5/4/3/2/1',
      dscr: 1.25,
      brokerComp: 1,
      ysp: 1,
      discountPoints: 0,
      brokerAdminFee: 995,
      estimatedHomeValue: 200000,
      monthlyRentalIncome: 5000, // From image: $5,000
      annualPropertyInsurance: 1200, // From image: $1,200
      annualPropertyTaxes: 3600, // From image: $3,600
      monthlyHoaFee: 600, // From image: $600
      isShortTermRental: false,
      units: 1
    }
  };

  // Test case 2: Same parameters but with different DSCR calculation approach
  const testCase2 = {
    ...testCase1,
    input: {
      ...testCase1.input,
      // Try with different DSCR inputs to see if we can match the lender's rate
      monthlyRentalIncome: 4000, // Reduced to see if this affects DSCR
      annualPropertyInsurance: 1200,
      annualPropertyTaxes: 3600,
      monthlyHoaFee: 600
    }
  };

  // Test case 3: Test with no DSCR bonus (DSCR = 1.0)
  const testCase3 = {
    ...testCase1,
    input: {
      ...testCase1.input,
      // Adjust rental income to get DSCR closer to 1.0
      monthlyRentalIncome: 2500, // This should give us DSCR around 1.0
      annualPropertyInsurance: 1200,
      annualPropertyTaxes: 3600,
      monthlyHoaFee: 600
    }
  };

  const testCases = [
    { name: 'Original Parameters (Expected 7.4%)', data: testCase1 },
    { name: 'Reduced Rental Income', data: testCase2 },
    { name: 'DSCR = 1.0 Test', data: testCase3 }
  ];

  console.log('🧪 Testing Rate Discrepancy Hypothesis\n');

  for (const testCase of testCases) {
    console.log(`\n📋 Test Case: ${testCase.name}`);
    console.log('Input Parameters:');
    console.log(`  FICO: ${testCase.data.input.fico}`);
    console.log(`  LTV: ${testCase.data.input.ltv}%`);
    console.log(`  Loan Amount: $${testCase.data.input.loanAmount.toLocaleString()}`);
    console.log(`  Product: ${testCase.data.input.product}`);
    console.log(`  Monthly Rental: $${testCase.data.input.monthlyRentalIncome}`);
    console.log(`  Annual Insurance: $${testCase.data.input.annualPropertyInsurance}`);
    console.log(`  Annual Taxes: $${testCase.data.input.annualPropertyTaxes}`);
    console.log(`  Monthly HOA: $${testCase.data.input.monthlyHoaFee}`);
    console.log(`  Broker Comp: ${testCase.data.input.brokerComp}%`);
    console.log(`  YSP: ${testCase.data.input.ysp}%`);
    console.log(`  Prepay: ${testCase.data.input.prepayStructure}`);

    try {
      const response = await fetch('http://localhost:3000/api/loan-pricing', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testCase.data),
      });

      const result = await response.json();
      
      if (result.success && result.data && result.data.length > 0) {
        const option = result.data[0]; // Get the first option (30 Year Fixed)
        console.log('\n📊 Results:');
        console.log(`  Base Rate: ${option.baseRate}%`);
        console.log(`  Final Rate: ${option.finalRate}%`);
        console.log(`  Expected Rate: 7.4%`);
        console.log(`  Difference: ${(option.finalRate - 7.4).toFixed(3)}%`);
        
        console.log('\n🔍 Rate Breakdown:');
        console.log(`  Base Rate: ${option.breakdown.baseRate}%`);
        console.log(`  Product Adjustment: ${option.breakdown.productAdjustment}%`);
        console.log(`  DSCR Adjustment: ${option.breakdown.dscrAdjustment}%`);
        console.log(`  Origination Fee Adjustment: ${option.breakdown.originationFeeAdjustment}%`);
        console.log(`  Loan Size Adjustment: ${option.breakdown.loanSizeAdjustment}%`);
        console.log(`  YSP Adjustment: ${option.breakdown.yspAdjustment}%`);
        console.log(`  Prepay Adjustment: ${option.breakdown.prepayAdjustment}%`);
        console.log(`  Program Adjustment: ${option.breakdown.programAdjustment}%`);
        
        // Calculate what we expect based on the matrix
        const expectedBreakdown = {
          baseRate: 6.825, // FICO 745, LTV 80%
          productAdjustment: 0.200, // 30 Year Fixed
          originationFeeAdjustment: -0.300, // 1% broker comp
          loanSizeAdjustment: 0.250, // $160k in 125k-249k range
          yspAdjustment: 0.250, // 1% YSP
          prepayAdjustment: 0.000, // 5/4/3/2/1
          programAdjustment: 0.000, // No special program adjustments
          dscrAdjustment: 0.000 // This is what we need to figure out
        };
        
        const expectedRate = expectedBreakdown.baseRate + 
                           expectedBreakdown.productAdjustment + 
                           expectedBreakdown.originationFeeAdjustment + 
                           expectedBreakdown.loanSizeAdjustment + 
                           expectedBreakdown.yspAdjustment + 
                           expectedBreakdown.prepayAdjustment + 
                           expectedBreakdown.programAdjustment + 
                           expectedBreakdown.dscrAdjustment;
        
        console.log('\n🧮 Expected Breakdown (without DSCR):');
        console.log(`  Expected Rate: ${expectedRate}%`);
        console.log(`  Missing Adjustment: ${(7.4 - expectedRate).toFixed(3)}%`);
        
        if (Math.abs(option.finalRate - 7.4) < 0.1) {
          console.log('✅ SUCCESS: Rate matches expected 7.4%!');
        } else {
          console.log('❌ FAILED: Rate does not match expected 7.4%');
        }
      } else {
        console.log('❌ API Error:', result.error || 'Unknown error');
      }
    } catch (error) {
      console.log('❌ Request failed:', error.message);
    }
    
    console.log('\n' + '='.repeat(80));
  }
};

// Run the test
testRateDiscrepancy().catch(console.error); 